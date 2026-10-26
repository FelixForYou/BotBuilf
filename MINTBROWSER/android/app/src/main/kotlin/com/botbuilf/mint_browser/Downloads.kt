package com.botbuilf.mint_browser

import android.app.DownloadManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.webkit.CookieManager
import android.webkit.MimeTypeMap
import android.webkit.URLUtil
import androidx.webkit.ProfileStore
import androidx.webkit.WebViewFeature
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

/** Downloads through Android's DownloadManager, with the page's cookies. */
class Downloads(private val context: Context) : MethodChannel.MethodCallHandler {
    private val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        try {
            when (call.method) {
                "enqueue" -> result.success(
                    enqueue(
                        call.argument<String>("url") ?: "",
                        call.argument<String>("userAgent") ?: "",
                        call.argument<String>("contentDisposition") ?: "",
                        call.argument<String>("mimeType") ?: "",
                        call.argument<String>("profile") ?: "",
                    )
                )
                "query" -> result.success(
                    query((call.arguments<List<Number>>() ?: emptyList()).map { it.toLong() })
                )
                "open" -> result.success(open((call.arguments<Number>() ?: -1).toLong()))
                "remove" -> {
                    val id = (call.argument<Number>("id") ?: -1).toLong()
                    if (call.argument<Boolean>("deleteFile") == true) dm.remove(id)
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        } catch (e: Exception) {
            result.error("download_failed", e.message, null)
        }
    }

    private fun enqueue(
        url: String,
        userAgent: String,
        contentDisposition: String,
        mimeType: String,
        profile: String,
    ): Map<String, Any> {
        val uri = Uri.parse(url)
        val mime = mimeType.ifBlank {
            MimeTypeMap.getSingleton()
                .getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(url)) ?: ""
        }
        val fileName = URLUtil.guessFileName(url, contentDisposition, mime.ifBlank { null })
        val cookies = cookieManagerFor(profile).getCookie(url)

        val request = DownloadManager.Request(uri).apply {
            if (!cookies.isNullOrEmpty()) addRequestHeader("Cookie", cookies)
            if (userAgent.isNotBlank()) addRequestHeader("User-Agent", userAgent)
            if (mime.isNotBlank()) setMimeType(mime)
            setTitle(fileName)
            setDescription(uri.host ?: "")
            setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            } else {
                // No storage permission needed for the app's own folder.
                setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, fileName)
            }
        }
        val id = dm.enqueue(request)
        return mapOf("id" to id, "fileName" to fileName)
    }

    private fun cookieManagerFor(profile: String): CookieManager {
        if (profile.isNotEmpty() && WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE)) {
            ProfileStore.getInstance().getProfile(profile)?.let { return it.cookieManager }
        }
        return CookieManager.getInstance()
    }

    private fun query(ids: List<Long>): List<Map<String, Any>> {
        if (ids.isEmpty()) return emptyList()
        val out = mutableListOf<Map<String, Any>>()
        dm.query(DownloadManager.Query().setFilterById(*ids.toLongArray()))?.use { c ->
            val idCol = c.getColumnIndexOrThrow(DownloadManager.COLUMN_ID)
            val statusCol = c.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS)
            val soFarCol = c.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
            val totalCol = c.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
            val titleCol = c.getColumnIndexOrThrow(DownloadManager.COLUMN_TITLE)
            val mimeCol = c.getColumnIndexOrThrow(DownloadManager.COLUMN_MEDIA_TYPE)
            while (c.moveToNext()) {
                val status = when (c.getInt(statusCol)) {
                    DownloadManager.STATUS_PENDING -> "pending"
                    DownloadManager.STATUS_RUNNING -> "running"
                    DownloadManager.STATUS_PAUSED -> "paused"
                    DownloadManager.STATUS_SUCCESSFUL -> "success"
                    else -> "failed"
                }
                out.add(
                    mapOf(
                        "id" to c.getLong(idCol),
                        "status" to status,
                        "downloaded" to c.getLong(soFarCol),
                        "total" to c.getLong(totalCol),
                        "fileName" to (c.getString(titleCol) ?: ""),
                        "mimeType" to (c.getString(mimeCol) ?: ""),
                    )
                )
            }
        }
        return out
    }

    private fun open(id: Long): Boolean {
        val uri = dm.getUriForDownloadedFile(id) ?: return false
        val mime = dm.getMimeTypeForDownloadedFile(id) ?: "*/*"
        val intent = Intent(Intent.ACTION_VIEW)
            .setDataAndType(uri, mime)
            .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            context.startActivity(intent)
            true
        } catch (e: ActivityNotFoundException) {
            false
        }
    }
}
