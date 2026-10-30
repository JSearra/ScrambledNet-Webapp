package com.jsearra.scramblednet;

import android.content.res.Configuration;
import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        followSystemDarkMode();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        followSystemDarkMode();
    }

    // Newer WebViews pass the system dark mode on to the game's
    // prefers-color-scheme by themselves (the app theme is DayNight). Older ones,
    // like the WebView that shipped with Android 10 to 12, need it set here.
    // "Web theme darkening only": the game uses its own dark colours and Android
    // never recolours the page.
    @SuppressWarnings("deprecation")
    private void followSystemDarkMode() {
        if (getBridge() == null) return;
        WebSettings settings = getBridge().getWebView().getSettings();
        int nightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK_STRATEGY)) {
            WebSettingsCompat.setForceDarkStrategy(settings, WebSettingsCompat.DARK_STRATEGY_WEB_THEME_DARKENING_ONLY);
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
            WebSettingsCompat.setForceDark(settings,
                nightMode == Configuration.UI_MODE_NIGHT_YES ? WebSettingsCompat.FORCE_DARK_ON : WebSettingsCompat.FORCE_DARK_OFF);
        }
    }
}
