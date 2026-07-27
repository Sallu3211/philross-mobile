package com.philross

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.clevertap.android.sdk.CleverTapAPI
import com.clevertap.android.sdk.ActivityLifecycleCallback
import org.wonday.orientation.OrientationActivityLifecycle
import android.content.Context
import android.content.res.Configuration
import android.util.DisplayMetrics
import android.view.WindowManager

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
      object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> =
            PackageList(this).packages.apply {
              // Packages that cannot be autolinked yet can be added manually here, for example:
              // add(MyReactNativePackage())
            }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
        override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
      }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
    registerActivityLifecycleCallbacks(OrientationActivityLifecycle.getInstance())
    adjustFontScale(applicationContext, resources.configuration)
    // ✅ CleverTap initialization
    CleverTapAPI.setDebugLevel(CleverTapAPI.LogLevel.DEBUG) // enable logs
    CleverTapAPI.getDefaultInstance(applicationContext)     // initialize instance
    ActivityLifecycleCallback.register(this)                // register lifecycle
  }

  private fun adjustFontScale(context: Context, configuration: Configuration) {
    if (configuration.fontScale != 1.0f) {
      configuration.fontScale = 1.0f
      val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
      val metrics = DisplayMetrics()
      @Suppress("DEPRECATION")
      wm.defaultDisplay.getMetrics(metrics)
      metrics.scaledDensity = configuration.fontScale * metrics.density
      context.resources.updateConfiguration(configuration, metrics)
    }
  }
}
