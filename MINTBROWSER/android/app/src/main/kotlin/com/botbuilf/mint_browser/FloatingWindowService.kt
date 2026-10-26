package com.botbuilf.mint_browser

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * A small browser window drawn over other apps (needs "Display over other
 * apps"). Drag the header to move, the corner grip to resize; minimise to a
 * bubble, maximise, hand the page back to the app, or close.
 */
class FloatingWindowService : Service() {

    companion object {
        const val EXTRA_URL = "url"
        const val EXTRA_TITLE = "title"
        const val EXTRA_OPEN_URL = "mint_open_url"
        private const val ACTION_CLOSE = "com.botbuilf.mint_browser.CLOSE_FLOATING"
        private const val CHANNEL_ID = "floating_window"
        private const val NOTIFICATION_ID = 4201

        private const val BG = 0xFF1D1D1F.toInt()
        private const val ELEVATED = 0xFF262628.toInt()
        private const val DIVIDER = 0xFF303033.toInt()
        private const val ACCENT = 0xFF55DDC0.toInt()
        private const val TEXT = 0xFFF5F5F7.toInt()
        private const val TEXT_2 = 0xFF96969B.toInt()
    }

    private lateinit var wm: WindowManager
    private var window: FrameLayout? = null
    private var bubble: View? = null
    private var webView: WebView? = null
    private lateinit var titleView: TextView
    private lateinit var progress: View
    private lateinit var maximizeIcon: ImageView
    private lateinit var params: WindowManager.LayoutParams
    private lateinit var bubbleParams: WindowManager.LayoutParams
    private var restoreBounds: Rect? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_CLOSE) {
            stopSelf()
            return START_NOT_STICKY
        }
        startInForeground()
        val url = intent?.getStringExtra(EXTRA_URL)
        if (url.isNullOrEmpty()) {
            if (window == null) stopSelf()
            return START_NOT_STICKY
        }
        if (window == null) createWindow()
        titleView.text = intent.getStringExtra(EXTRA_TITLE)?.ifBlank { null } ?: Uri.parse(url).host ?: url
        webView?.loadUrl(url)
        if (bubble != null) restoreFromBubble() else animateIn(window!!)
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        bubble?.let { safeRemove(it) }
        window?.let { safeRemove(it) }
        webView?.apply {
            stopLoading()
            destroy()
        }
        webView = null
        window = null
        bubble = null
        super.onDestroy()
    }

    // ── Notification ──────────────────────────────────────────────────────

    private fun startInForeground() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nm.createNotificationChannel(
                NotificationChannel(CHANNEL_ID, "Floating window", NotificationManager.IMPORTANCE_LOW).apply {
                    description = "Shown while a floating browser window is open"
                    setShowBadge(false)
                }
            )
        }
        val close = PendingIntent.getService(
            this, 1,
            Intent(this, FloatingWindowService::class.java).setAction(ACTION_CLOSE),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val open = PendingIntent.getActivity(
            this, 2,
            Intent(this, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }
        val notification = builder
            .setSmallIcon(R.drawable.ic_stat_mint)
            .setContentTitle("Floating window is open")
            .setContentText("Tap to return to Mint Browser")
            .setContentIntent(open)
            .setOngoing(true)
            .setColor(ACCENT)
            .addAction(Notification.Action.Builder(null, "Close", close).build())
            .build()
        if (Build.VERSION.SDK_INT >= 34) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    // ── Window ────────────────────────────────────────────────────────────

    private fun dp(v: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    private fun screen(): Rect {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            wm.currentWindowMetrics.bounds
        } else {
            val m = resources.displayMetrics
            Rect(0, 0, m.widthPixels, m.heightPixels)
        }
    }

    private fun overlayType(): Int = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
        @Suppress("DEPRECATION")
        WindowManager.LayoutParams.TYPE_PHONE
    }

    private fun rounded(color: Int, radius: Int, stroke: Int? = null) = GradientDrawable().apply {
        setColor(color)
        cornerRadius = radius.toFloat()
        stroke?.let { setStroke(dp(1), it) }
    }

    private fun iconButton(icon: Int, label: String, onClick: () -> Unit): ImageView =
        ImageView(this).apply {
            setImageResource(icon)
            setColorFilter(TEXT)
            contentDescription = label
            scaleType = ImageView.ScaleType.CENTER
            layoutParams = LinearLayout.LayoutParams(dp(34), dp(34)).apply { marginStart = dp(2) }
            background = rounded(Color.TRANSPARENT, dp(17))
            setOnTouchListener { v, e ->
                when (e.actionMasked) {
                    MotionEvent.ACTION_DOWN -> {
                        v.animate().scaleX(0.86f).scaleY(0.86f).setDuration(100).start()
                        (v.background as GradientDrawable).setColor(ELEVATED)
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        v.animate().scaleX(1f).scaleY(1f).setDuration(160)
                            .setInterpolator(OvershootInterpolator()).start()
                        (v.background as GradientDrawable).setColor(Color.TRANSPARENT)
                        if (e.actionMasked == MotionEvent.ACTION_UP) v.performClick()
                    }
                }
                true
            }
            setOnClickListener { onClick() }
        }

    @SuppressLint("ClickableViewAccessibility", "SetJavaScriptEnabled")
    private fun createWindow() {
        val s = screen()
        val width = min(dp(320), s.width() - dp(32))
        val height = min(dp(440), (s.height() * 0.6).toInt())

        params = WindowManager.LayoutParams(
            width, height, overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = s.width() - width - dp(16)
            y = dp(96)
        }

        val root = object : FrameLayout(this) {
            override fun dispatchKeyEvent(event: KeyEvent): Boolean {
                if (event.keyCode == KeyEvent.KEYCODE_BACK) {
                    if (event.action == KeyEvent.ACTION_UP) {
                        val wv = webView
                        if (wv != null && wv.canGoBack()) wv.goBack() else setFocusable(false)
                    }
                    return true
                }
                return super.dispatchKeyEvent(event)
            }
        }
        root.background = rounded(BG, dp(20), DIVIDER)
        root.clipToOutline = true
        root.elevation = dp(12).toFloat()
        root.setOnTouchListener { _, e ->
            if (e.actionMasked == MotionEvent.ACTION_OUTSIDE) setFocusable(false)
            false
        }

        val column = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }

        // Header: drag handle + title + actions.
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(4), dp(6), dp(4))
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48))
        }
        val dot = View(this).apply {
            background = rounded(ACCENT, dp(4))
            layoutParams = LinearLayout.LayoutParams(dp(8), dp(8)).apply { marginEnd = dp(10) }
        }
        titleView = TextView(this).apply {
            setTextColor(TEXT)
            textSize = 14f
            typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
            maxLines = 1
            ellipsize = TextUtils.TruncateAt.END
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        }
        maximizeIcon = iconButton(R.drawable.ic_float_maximize, "Maximise") { toggleMaximize() }
        header.addView(dot)
        header.addView(titleView)
        header.addView(iconButton(R.drawable.ic_float_open, "Open in app") { openInApp() })
        header.addView(iconButton(R.drawable.ic_float_minimize, "Minimise") { minimizeToBubble() })
        header.addView(maximizeIcon)
        header.addView(iconButton(R.drawable.ic_float_close, "Close") { stopSelf() })
        header.setOnTouchListener(DragListener { dx, dy, done -> moveBy(dx, dy, done) })

        progress = View(this).apply {
            setBackgroundColor(ACCENT)
            pivotX = 0f
            scaleX = 0f
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(2))
        }
        val divider = View(this).apply {
            setBackgroundColor(DIVIDER)
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 1)
        }

        val wv = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.loadWithOverviewMode = true
            settings.useWideViewPort = true
            settings.builtInZoomControls = true
            settings.displayZoomControls = false
            settings.mediaPlaybackRequiresUserGesture = true
            setBackgroundColor(Color.WHITE)
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val scheme = request.url.scheme ?: return false
                    if (scheme == "http" || scheme == "https") return false
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, request.url).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    } catch (_: ActivityNotFoundException) {
                    }
                    return true
                }
            }
            webChromeClient = object : WebChromeClient() {
                override fun onProgressChanged(view: WebView, newProgress: Int) {
                    progress.animate().cancel()
                    if (newProgress >= 100) {
                        progress.animate().scaleX(1f).alpha(0f).setDuration(260).start()
                    } else {
                        progress.alpha = 1f
                        progress.animate().scaleX(newProgress / 100f).setDuration(160).start()
                    }
                }

                override fun onReceivedTitle(view: WebView, title: String?) {
                    if (!title.isNullOrBlank()) titleView.text = title
                }
            }
            setOnTouchListener { _, e ->
                if (e.actionMasked == MotionEvent.ACTION_DOWN) setFocusable(true)
                false
            }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
        }
        webView = wv

        column.addView(header)
        column.addView(progress)
        column.addView(divider)
        column.addView(wv)
        root.addView(column, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        // Resize grip in the bottom-right corner.
        val grip = ImageView(this).apply {
            setImageResource(R.drawable.ic_float_grip)
            setColorFilter(TEXT_2)
            contentDescription = "Resize"
            scaleType = ImageView.ScaleType.CENTER
            setOnTouchListener(DragListener { dx, dy, done -> resizeBy(dx, dy, done) })
        }
        root.addView(grip, FrameLayout.LayoutParams(dp(32), dp(32), Gravity.BOTTOM or Gravity.END))

        window = root
        wm.addView(root, params)
    }

    private fun setFocusable(focusable: Boolean) {
        val w = window ?: return
        val f = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
        val next = if (focusable) params.flags and f.inv() else params.flags or f
        if (next != params.flags) {
            params.flags = next
            wm.updateViewLayout(w, params)
        }
    }

    private fun animateIn(v: View) {
        v.alpha = 0f
        v.scaleX = 0.9f
        v.scaleY = 0.9f
        v.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(240)
            .setInterpolator(DecelerateInterpolator(2f)).start()
    }

    private fun moveBy(dx: Int, dy: Int, done: Boolean) {
        val w = window ?: return
        val s = screen()
        params.x = (params.x + dx).coerceIn(-params.width / 2, s.width() - params.width / 2)
        params.y = (params.y + dy).coerceIn(0, s.height() - dp(64))
        wm.updateViewLayout(w, params)
        if (done) settleInside(w, params)
    }

    private fun resizeBy(dx: Int, dy: Int, done: Boolean) {
        val w = window ?: return
        val s = screen()
        restoreBounds = null
        maximizeIcon.setImageResource(R.drawable.ic_float_maximize)
        params.width = (params.width + dx).coerceIn(dp(220), s.width() - params.x)
        params.height = (params.height + dy).coerceIn(dp(260), s.height() - params.y)
        wm.updateViewLayout(w, params)
        if (done) settleInside(w, params)
    }

    /** Eases the window fully back on screen after a drag. */
    private fun settleInside(view: View, p: WindowManager.LayoutParams) {
        val s = screen()
        val margin = dp(8)
        val targetX = p.x.coerceIn(margin, max(margin, s.width() - p.width - margin))
        val targetY = p.y.coerceIn(margin, max(margin, s.height() - p.height - margin))
        if (targetX == p.x && targetY == p.y) return
        val startX = p.x
        val startY = p.y
        android.animation.ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 260
            interpolator = DecelerateInterpolator(2f)
            addUpdateListener {
                val t = it.animatedValue as Float
                p.x = (startX + (targetX - startX) * t).toInt()
                p.y = (startY + (targetY - startY) * t).toInt()
                if (view.isAttachedToWindow) wm.updateViewLayout(view, p)
            }
            start()
        }
    }

    private fun toggleMaximize() {
        val w = window ?: return
        val saved = restoreBounds
        if (saved != null) {
            params.x = saved.left
            params.y = saved.top
            params.width = saved.width()
            params.height = saved.height()
            restoreBounds = null
            maximizeIcon.setImageResource(R.drawable.ic_float_maximize)
        } else {
            restoreBounds = Rect(params.x, params.y, params.x + params.width, params.y + params.height)
            val s = screen()
            params.x = dp(8)
            params.y = dp(40)
            params.width = s.width() - dp(16)
            params.height = s.height() - dp(120)
            maximizeIcon.setImageResource(R.drawable.ic_float_restore)
        }
        wm.updateViewLayout(w, params)
    }

    @SuppressLint("ClickableViewAccessibility")
    private fun minimizeToBubble() {
        val w = window ?: return
        setFocusable(false)
        w.animate().alpha(0f).scaleX(0.6f).scaleY(0.6f).setDuration(180).withEndAction {
            w.visibility = View.GONE
        }.start()

        val size = dp(56)
        val b = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(0xFF173B33.toInt())
                setStroke(dp(2), ACCENT)
            }
            elevation = dp(8).toFloat()
            contentDescription = "Restore floating window"
            addView(
                ImageView(this@FloatingWindowService).apply {
                    setImageResource(R.drawable.ic_stat_mint)
                    setColorFilter(ACCENT)
                    scaleType = ImageView.ScaleType.CENTER
                },
                FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT),
            )
        }
        bubbleParams = WindowManager.LayoutParams(
            size, size, overlayType(),
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = screen().width() - size - dp(12)
            y = params.y
        }
        b.setOnTouchListener(DragListener(onTap = { restoreFromBubble() }) { dx, dy, done ->
            val s = screen()
            bubbleParams.x = (bubbleParams.x + dx).coerceIn(0, s.width() - size)
            bubbleParams.y = (bubbleParams.y + dy).coerceIn(0, s.height() - size)
            wm.updateViewLayout(b, bubbleParams)
            if (done) {
                // Snap to the nearest edge.
                val target = if (bubbleParams.x + size / 2 < s.width() / 2) dp(12) else s.width() - size - dp(12)
                val start = bubbleParams.x
                android.animation.ValueAnimator.ofFloat(0f, 1f).apply {
                    duration = 280
                    interpolator = OvershootInterpolator(1.2f)
                    addUpdateListener {
                        bubbleParams.x = (start + (target - start) * (it.animatedValue as Float)).toInt()
                        if (b.isAttachedToWindow) wm.updateViewLayout(b, bubbleParams)
                    }
                    start()
                }
            }
        })
        bubble = b
        wm.addView(b, bubbleParams)
        animateIn(b)
    }

    private fun restoreFromBubble() {
        bubble?.let { safeRemove(it) }
        bubble = null
        window?.let {
            it.visibility = View.VISIBLE
            animateIn(it)
        }
    }

    private fun openInApp() {
        val url = webView?.url
        val intent = Intent(this, MainActivity::class.java)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        if (!url.isNullOrEmpty()) intent.putExtra(EXTRA_OPEN_URL, url)
        startActivity(intent)
        stopSelf()
    }

    private fun safeRemove(v: View) {
        try {
            wm.removeView(v)
        } catch (_: IllegalArgumentException) {
        }
    }

    /** Reports raw finger deltas; a short touch without movement is a tap. */
    private inner class DragListener(
        private val onTap: (() -> Unit)? = null,
        private val onDrag: (dx: Int, dy: Int, done: Boolean) -> Unit,
    ) : View.OnTouchListener {
        private var lastX = 0f
        private var lastY = 0f
        private var moved = false

        @SuppressLint("ClickableViewAccessibility")
        override fun onTouch(v: View, e: MotionEvent): Boolean {
            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    lastX = e.rawX
                    lastY = e.rawY
                    moved = false
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = e.rawX - lastX
                    val dy = e.rawY - lastY
                    if (moved || abs(dx) > dp(4) || abs(dy) > dp(4)) {
                        moved = true
                        onDrag(dx.toInt(), dy.toInt(), false)
                        lastX = e.rawX
                        lastY = e.rawY
                    }
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                    if (moved) onDrag(0, 0, true) else if (e.actionMasked == MotionEvent.ACTION_UP) onTap?.invoke()
                }
            }
            return true
        }
    }
}
