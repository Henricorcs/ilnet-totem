package br.com.ilnet.totem;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.admin.DevicePolicyManager;
import android.content.ComponentName;
import android.content.Context;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String TOTEM_URL = "https://totem.ilnet.com.br/";
    private static final String TOTEM_HOST = "totem.ilnet.com.br";
    private static final int EXIT_TAP_TARGET = 7;
    private static final long EXIT_TAP_WINDOW_MS = 5000L;

    private WebView webView;
    private DevicePolicyManager policyManager;
    private ComponentName adminComponent;
    private int exitTapCount = 0;
    private long firstExitTapAt = 0L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        policyManager = (DevicePolicyManager) getSystemService(Context.DEVICE_POLICY_SERVICE);
        adminComponent = new ComponentName(this, KioskDeviceAdminReceiver.class);

        configureDeviceOwnerKiosk();
        setupWebView();
        hideSystemUi();
        enterLockTask();
    }

    @SuppressLint({ "SetJavaScriptEnabled", "ClickableViewAccessibility" })
    private void setupWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(5, 10, 24));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && TOTEM_HOST.equals(uri.getHost())) {
                    return false;
                }
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOfflineScreen();
            }
        });

        webView.setOnTouchListener((view, event) -> {
            if (event.getAction() == MotionEvent.ACTION_UP) trackHiddenExitTap(event);
            return false;
        });

        setContentView(webView);
        if (hasNetwork()) {
            webView.loadUrl(TOTEM_URL);
        } else {
            showOfflineScreen();
        }
    }

    private void configureDeviceOwnerKiosk() {
        if (policyManager == null) return;
        if (!policyManager.isDeviceOwnerApp(getPackageName())) return;

        policyManager.setLockTaskPackages(adminComponent, new String[] { getPackageName() });
    }

    private void enterLockTask() {
        try {
            startLockTask();
        } catch (IllegalStateException ignored) {
            // Sem device owner, Android usa fixacao de tela quando habilitada nas configuracoes.
        }
    }

    private void trackHiddenExitTap(MotionEvent event) {
        if (event.getX() > 120 || event.getY() > 120) return;

        long now = SystemClock.elapsedRealtime();
        if (firstExitTapAt == 0L || now - firstExitTapAt > EXIT_TAP_WINDOW_MS) {
            firstExitTapAt = now;
            exitTapCount = 0;
        }

        exitTapCount++;
        if (exitTapCount >= EXIT_TAP_TARGET) {
            exitTapCount = 0;
            firstExitTapAt = 0L;
            exitKioskForMaintenance();
        }
    }

    private void exitKioskForMaintenance() {
        try {
            stopLockTask();
            Toast.makeText(this, "Modo kiosk pausado para manutenção.", Toast.LENGTH_LONG).show();
        } catch (IllegalStateException e) {
            Toast.makeText(this, "Use o PIN do Android para sair da fixação.", Toast.LENGTH_LONG).show();
        }
    }

    private void showOfflineScreen() {
        String html = "<!doctype html><html><head><meta charset='utf-8'>"
            + "<meta name='viewport' content='width=device-width,initial-scale=1'>"
            + "<meta http-equiv='refresh' content='10'>"
            + "<style>html,body{height:100%;margin:0;background:#050a18;color:#fff;font-family:system-ui,sans-serif}"
            + "body{display:flex;align-items:center;justify-content:center;text-align:center;padding:32px}"
            + ".box{max-width:520px}.logo{font-size:42px;font-weight:900;color:#28aaff;margin-bottom:16px}"
            + "p{color:rgba(181,212,244,.75);line-height:1.5}</style></head><body>"
            + "<div class='box'><div class='logo'>ilnet</div>"
            + "<h1>Totem sem conexão</h1>"
            + "<p>Verifique a internet do tablet. O app vai tentar reconectar automaticamente.</p>"
            + "</div></body></html>";
        webView.loadDataWithBaseURL(TOTEM_URL, html, "text/html", "UTF-8", null);
    }

    private boolean hasNetwork() {
        ConnectivityManager manager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (manager == null || manager.getActiveNetwork() == null) return false;

        NetworkCapabilities capabilities = manager.getNetworkCapabilities(manager.getActiveNetwork());
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void hideSystemUi() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
        );
    }

    @Override
    protected void onResume() {
        super.onResume();
        hideSystemUi();
        enterLockTask();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemUi();
    }

    @Override
    public void onBackPressed() {
        webView.loadUrl(TOTEM_URL);
    }
}
