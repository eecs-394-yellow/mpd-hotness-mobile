package com.phonegap.mpdhotness;

import android.app.Activity;
import android.os.Bundle;
import com.phonegap.*;
import edu.northwestern.whereur.R;

public class WhereUR extends DroidGap
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        super.loadUrl("file:///android_asset/www/index.html");
    }
}