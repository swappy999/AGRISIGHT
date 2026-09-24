package com.agrisight.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupWebView();
    }

    @Override
    public void onResume() {
        super.onResume();
        setupWebView();
    }

    private void setupWebView() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);
            settings.setJavaScriptEnabled(true);

            // Remove '; wv' and 'Version/4.0' from User-Agent string so Google OAuth does not block with 403 disallowed_useragent
            String userAgent = settings.getUserAgentString();
            if (userAgent != null && (userAgent.contains("; wv") || userAgent.contains("Version/4.0"))) {
                String cleanAgent = userAgent.replace("; wv", "").replace("Version/4.0 ", "");
                settings.setUserAgentString(cleanAgent);
            }
        }
    }
}
