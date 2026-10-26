package com.botbuilf.mint_browser

import android.app.Activity
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.util.Log
import android.webkit.CookieManager
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import androidx.webkit.ProfileStore
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import io.flutter.plugins.webviewflutter.WebViewFlutterAndroidExternalApi
import java.io.ByteArrayOutputStream

/**
 * Native tweaks on WebViews created by webview_flutter: private profiles,
 * third-party cookies, page darkening, downloads and thumbnails.
 */
class WebHooks(
    private val activity: Activity,
    private val engine: FlutterEngine,
    private val channel: MethodChannel,
) : MethodChannel.MethodCallHandler {

    private val profiles = mutableMapOf<Long, String>()

    @Suppress("DEPRECATION")
    private fun webView(call: MethodCall): WebView? {
        val id = call.argument<Number>("id")?.toLong() ?: return null
        return WebViewFlutterAndroidExternalApi.getWebView(engine, id)
    }

    private val multiProfile: Boolean
        get() = WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        try {
            when (call.method) {
                "attach" -> result.success(attach(call))
                "update" -> {
                    webView(call)?.let { wv ->
                        val id = call.argument<Number>("id")!!.toLong()
                        applyCookies(wv, call.argument<Boolean>("blockThirdPartyCookies") == true, profiles[id])
                        applyDarken(wv, call.argument<Boolean>("darken") == true)
                    }
                    result.success(null)
                }
                "capture" -> result.success(webView(call)?.let { capture(it, call.argument<Number>("width")?.toInt() ?: 360) })
                "isMultiProfileSupported" -> result.success(multiProfile)
                "clearData" -> clearData(
                    call.argument<Boolean>("cookies") == true,
                    call.argument<Boolean>("cache") == true,
                    call.argument<Boolean>("storage") == true,
                    result,
                )
                "wipePrivateProfiles" -> {
                    wipePrivateProfiles(call.argument<String>("keep"))
                    result.success(null)
                }
                "flushCookies" -> {
                    CookieManager.getInstance().flush()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        } catch (e: Exception) {
            Log.w(TAG, "${call.method} failed", e)
            result.error("web_hook_failed", e.message, null)
        }
    }

    private fun attach(call: MethodCall): Map<String, Any> {
        val wv = webView(call) ?: return mapOf("attached" to false, "isolated" to false)
        val id = call.argument<Number>("id")!!.toLong()
        val tabId = call.argument<String>("tabId") ?: ""
        val private = call.argument<Boolean>("private") == true
        val profile = call.argument<String>("profile") ?: ""

        var isolated = false
        if (private && multiProfile && profile.isNotEmpty()) {
            try {
                ProfileStore.getInstance().getOrCreateProfile(profile)
                WebViewCompat.setProfile(wv, profile)
                profiles[id] = profile
                isolated = true
            } catch (e: Exception) {
                Log.w(TAG, "Could not isolate private tab", e)
            }
        }
        if (private) {
            @Suppress("DEPRECATION")
            wv.settings.saveFormData = false
            // Without an own profile, at least keep the HTTP cache out of it.
            if (!isolated) wv.settings.cacheMode = WebSettings.LOAD_NO_CACHE
        }

        applyCookies(wv, call.argument<Boolean>("blockThirdPartyCookies") == true, profiles[id])
        applyDarken(wv, call.argument<Boolean>("darken") == true)

        wv.setDownloadListener { url, userAgent, contentDisposition, mimeType, contentLength ->
            channel.invokeMethod(
                "onDownload",
                mapOf(
                    "tabId" to tabId,
                    "url" to url,
                    "userAgent" to userAgent,
                    "contentDisposition" to contentDisposition,
                    "mimeType" to mimeType,
                    "contentLength" to contentLength,
                ),
            )
        }
        return mapOf("attached" to true, "isolated" to isolated)
    }

    private fun applyCookies(wv: WebView, blockThirdParty: Boolean, profile: String?) {
        val manager = profile?.let { ProfileStore.getInstance().getProfile(it)?.cookieManager }
            ?: CookieManager.getInstance()
        manager.setAcceptCookie(true)
        manager.setAcceptThirdPartyCookies(wv, !blockThirdParty)
    }

    private fun applyDarken(wv: WebView, darken: Boolean) {
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(wv.settings, darken)
        } else if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            @Suppress("DEPRECATION")
            WebSettingsCompat.setForceDark(
                wv.settings,
                if (darken) WebSettingsCompat.FORCE_DARK_ON else WebSettingsCompat.FORCE_DARK_OFF,
            )
        }
    }

    /** Downscaled JPEG of what the WebView currently shows. */
    private fun capture(wv: WebView, targetWidth: Int): ByteArray? {
        val w = wv.width
        val h = wv.height
        if (w <= 0 || h <= 0) return null
        val scale = targetWidth.toFloat() / w
        val bitmap = Bitmap.createBitmap(targetWidth, (h * scale).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.scale(scale, scale)
        canvas.translate(-wv.scrollX.toFloat(), -wv.scrollY.toFloat())
        wv.draw(canvas)
        val out = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 72, out)
        bitmap.recycle()
        return out.toByteArray()
    }

    private fun clearData(cookies: Boolean, cache: Boolean, storage: Boolean, result: MethodChannel.Result) {
        if (storage) WebStorage.getInstance().deleteAllData()
        if (cache) {
            // Any WebView clears the shared HTTP cache.
            WebView(activity).apply {
                clearCache(true)
                destroy()
            }
        }
        if (cookies) {
            CookieManager.getInstance().removeAllCookies {
                CookieManager.getInstance().flush()
                result.success(null)
            }
        } else {
            result.success(null)
        }
    }

    private fun wipePrivateProfiles(keep: String?) {
        if (!multiProfile) return
        val store = ProfileStore.getInstance()
        for (name in store.allProfileNames.filter { it.startsWith(PRIVATE_PREFIX) && it != keep }) {
            store.getProfile(name)?.let {
                it.cookieManager.removeAllCookies(null)
                it.webStorage.deleteAllData()
            }
            try {
                store.deleteProfile(name)
            } catch (e: Exception) {
                // Still referenced by a WebView awaiting GC; retried next launch.
            }
        }
        profiles.entries.removeAll { it.value != keep }
    }

    companion object {
        private const val TAG = "MintWebHooks"
        private const val PRIVATE_PREFIX = "mint_private_"
    }
}
