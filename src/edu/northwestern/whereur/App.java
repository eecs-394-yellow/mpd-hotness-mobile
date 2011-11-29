package edu.northwestern.whereur;

import android.app.Activity;
import android.os.Bundle;
import com.phonegap.*;

public class App extends DroidGap
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        super.setIntegerProperty("splashscreen", R.drawable.splash);
        super.init();
        super.loadUrl("file:///android_asset/www/index.html", 1000);
    }
}