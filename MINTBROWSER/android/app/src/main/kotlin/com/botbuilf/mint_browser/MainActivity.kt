package com.botbuilf.mint_browser

import android.Manifest
import android.app.role.RoleManager
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.MimeTypeMap
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

/**
 * Hosts Flutter and exposes the native pieces the browser needs:
 * `mint/app` (intents, runtime permissions, file picker, external links),
 * `mint/web` (WebView hooks, see [WebHooks]), `mint/downloads` ([Downloads])
 * and `mint/floating` ([FloatingWindowService]).
 */
class MainActivity : FlutterActivity() {
    private var appChannel: MethodChannel? = null
    private var initialUrl: String? = null
    private var pendingPermissions: Pair<List<String>, MethodChannel.Result>? = null
    private var pendingFiles: MethodChannel.Result? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        if (savedInstanceState == null) initialUrl = extractUrl(intent)
        super.onCreate(savedInstanceState)
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        val messenger = flutterEngine.dartExecutor.binaryMessenger

        appChannel = MethodChannel(messenger, "mint/app").also {
            it.setMethodCallHandler { call, result -> onAppCall(call, result) }
        }
        val webChannel = MethodChannel(messenger, "mint/web")
        webChannel.setMethodCallHandler(WebHooks(this, flutterEngine, webChannel))
        MethodChannel(messenger, "mint/downloads").setMethodCallHandler(Downloads(applicationContext))
        MethodChannel(messenger, "mint/floating").setMethodCallHandler { call, result ->
            onFloatingCall(call, result)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        extractUrl(intent)?.let { appChannel?.invokeMethod("openUrl", it) }
    }

    override fun onPause() {
        super.onPause()
        android.webkit.CookieManager.getInstance().flush()
    }

    private fun extractUrl(intent: Intent?): String? {
        intent ?: return null
        intent.getStringExtra(FloatingWindowService.EXTRA_OPEN_URL)?.let { return it }
        return when (intent.action) {
            Intent.ACTION_VIEW -> intent.dataString?.takeIf {
                it.startsWith("http://") || it.startsWith("https://")
            }
            Intent.ACTION_SEND -> intent.getStringExtra(Intent.EXTRA_TEXT)?.let {
                Regex("https?://\\S+").find(it)?.value
            }
            else -> null
        }
    }

    // ── mint/app ────────────────────────────────────────────────────────────

    private fun onAppCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "getInitialUrl" -> {
                result.success(initialUrl)
                initialUrl = null
            }
            "requestPermissions" -> requestRuntimePermissions(
                call.arguments<List<String>>() ?: emptyList(), result
            )
            "pickFiles" -> pickFiles(
                call.argument<Boolean>("multiple") ?: false,
                call.argument<List<String>>("accept") ?: emptyList(),
                result,
            )
            "openExternal" -> result.success(openExternal(call.arguments<String>() ?: ""))
            "openDefaultAppsSettings" -> {
                openDefaultBrowserSettings()
                result.success(null)
            }
            else -> result.notImplemented()
        }
    }

    private fun manifestPermissions(kind: String): List<String> = when (kind) {
        "camera" -> listOf(Manifest.permission.CAMERA)
        "microphone" -> listOf(Manifest.permission.RECORD_AUDIO)
        "location" -> listOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        )
        else -> emptyList()
    }

    private fun isGranted(kind: String): Boolean {
        val perms = manifestPermissions(kind)
        if (perms.isEmpty()) return false
        // Approximate location is enough for sites.
        return perms.any { checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }
    }

    private fun requestRuntimePermissions(kinds: List<String>, result: MethodChannel.Result) {
        val missing = kinds.filter { !isGranted(it) }
        if (missing.isEmpty()) {
            result.success(true)
            return
        }
        if (pendingPermissions != null) {
            result.error("busy", "A permission request is already showing", null)
            return
        }
        pendingPermissions = kinds to result
        requestPermissions(missing.flatMap { manifestPermissions(it) }.toTypedArray(), REQ_PERMISSIONS)
    }

    @Deprecated("Deprecated in Java")
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != REQ_PERMISSIONS) return
        val (kinds, result) = pendingPermissions ?: return
        pendingPermissions = null
        result.success(kinds.all { isGranted(it) })
    }

    private fun pickFiles(multiple: Boolean, accept: List<String>, result: MethodChannel.Result) {
        pendingFiles?.success(emptyList<String>())
        val mimes = accept
            .flatMap { it.split(",") }
            .map { it.trim().lowercase() }
            .filter { it.isNotEmpty() }
            .mapNotNull { a ->
                if (a.startsWith(".")) MimeTypeMap.getSingleton().getMimeTypeFromExtension(a.substring(1)) else a
            }
            .distinct()
        val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = if (mimes.size == 1) mimes[0] else "*/*"
            if (mimes.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, mimes.toTypedArray())
            putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple)
        }
        try {
            pendingFiles = result
            @Suppress("DEPRECATION")
            startActivityForResult(Intent.createChooser(intent, null), REQ_FILES)
        } catch (e: ActivityNotFoundException) {
            pendingFiles = null
            result.success(emptyList<String>())
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        @Suppress("DEPRECATION")
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != REQ_FILES) return
        val result = pendingFiles ?: return
        pendingFiles = null
        if (resultCode != RESULT_OK || data == null) {
            result.success(emptyList<String>())
            return
        }
        val uris = mutableListOf<String>()
        val clip = data.clipData
        if (clip != null) {
            for (i in 0 until clip.itemCount) uris.add(clip.getItemAt(i).uri.toString())
        } else {
            data.data?.let { uris.add(it.toString()) }
        }
        result.success(uris)
    }

    /** Hands tel:, mailto:, market:, intent: … links to the app that owns them. */
    private fun openExternal(url: String): Map<String, Any?> {
        if (url.startsWith("intent:")) {
            val parsed = try {
                Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
            } catch (e: Exception) {
                return mapOf("handled" to false, "fallback" to null)
            }
            // Never let a page target a specific component of another app.
            parsed.addCategory(Intent.CATEGORY_BROWSABLE)
            parsed.component = null
            parsed.selector = null
            val fallback = parsed.getStringExtra("browser_fallback_url")
            return try {
                startActivity(parsed)
                mapOf("handled" to true)
            } catch (e: ActivityNotFoundException) {
                val pkg = parsed.`package`
                if (fallback == null && pkg != null && tryStart(
                        Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg"))
                    )
                ) {
                    mapOf("handled" to true)
                } else {
                    mapOf("handled" to false, "fallback" to fallback)
                }
            }
        }
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).addCategory(Intent.CATEGORY_BROWSABLE)
        return mapOf("handled" to tryStart(intent))
    }

    private fun tryStart(intent: Intent): Boolean = try {
        startActivity(intent)
        true
    } catch (e: ActivityNotFoundException) {
        false
    } catch (e: SecurityException) {
        false
    }

    private fun openDefaultBrowserSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val roles = getSystemService(RoleManager::class.java)
            if (roles != null && roles.isRoleAvailable(RoleManager.ROLE_BROWSER) &&
                !roles.isRoleHeld(RoleManager.ROLE_BROWSER)
            ) {
                @Suppress("DEPRECATION")
                startActivityForResult(roles.createRequestRoleIntent(RoleManager.ROLE_BROWSER), REQ_ROLE)
                return
            }
        }
        tryStart(Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS))
    }

    // ── mint/floating ──────────────────────────────────────────────────────

    private fun onFloatingCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "canDrawOverlays" -> result.success(Settings.canDrawOverlays(this))
            "requestPermission" -> {
                tryStart(
                    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
                )
                result.success(null)
            }
            "open" -> {
                val url = call.argument<String>("url")
                if (url.isNullOrEmpty() || !Settings.canDrawOverlays(this)) {
                    result.success(false)
                    return
                }
                val intent = Intent(this, FloatingWindowService::class.java)
                    .putExtra(FloatingWindowService.EXTRA_URL, url)
                    .putExtra(FloatingWindowService.EXTRA_TITLE, call.argument<String>("title") ?: "")
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent)
                    } else {
                        startService(intent)
                    }
                    result.success(true)
                } catch (e: Exception) {
                    result.success(false)
                }
            }
            "close" -> {
                stopService(Intent(this, FloatingWindowService::class.java))
                result.success(null)
            }
            else -> result.notImplemented()
        }
    }

    companion object {
        private const val REQ_PERMISSIONS = 7101
        private const val REQ_FILES = 7102
        private const val REQ_ROLE = 7103
    }
}
