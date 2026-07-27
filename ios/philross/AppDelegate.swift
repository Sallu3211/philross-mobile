import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Security // ✅ Added for Keychain access
import RNBootSplash // ✅ Added for BootSplash
import GoogleSignIn // ✅ Added for Google Sign-In
import CleverTapSDK // ✅ Added for CleverTap
import UserNotifications // ✅ Added for push notifications
import Firebase // ✅ Added for Firebase
import AuthenticationServices // ✅ Added for Apple Sign-In
import GoogleMaps // Added for google map

@main
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // ✅ Provide Google Maps API Key
    GMSServices.provideAPIKey("AIzaSyBY2EUiYpSxkKFhaJGAKewgN11PWyrACts")

    // ✅ Call the method before initializing React Native
    clearKeychainIfNeeded()
    
    // ✅ Firebase Initialization
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
    
    // ✅ Configure Google Sign-In
    GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
      if let error = error {
        print("Google Sign-In restore error: \(error)")
      }
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "philross",
      in: window,
      launchOptions: launchOptions
    )

    // CleverTap setup
    CleverTap.setDebugLevel(CleverTapLogLevel.debug.rawValue)
    CleverTap.autoIntegrate()
    CleverTap.sharedInstance()?.notifyApplicationLaunched(withOptions: launchOptions)
    // CleverTap.sharedInstance()?.recordEvent("App Launched")
    
    // ✅ Register for notifications
    UNUserNotificationCenter.current().delegate = self
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(
      options: authOptions,
      completionHandler: { _, _ in })
    application.registerForRemoteNotifications()
    
    // ✅ Observe Apple ID credential revoked notification
    NotificationCenter.default.addObserver(
        self,
        selector: #selector(handleAppleIDRevoked),
        name: ASAuthorizationAppleIDProvider.credentialRevokedNotification,
        object: nil
    )

    return true
  }

  // ✅ Your keychain-clearing method
  private func clearKeychainIfNeeded() {
    let hasRunBeforeKey = "HAS_RUN_BEFORE"
    let userDefaults = UserDefaults.standard

    if !userDefaults.bool(forKey: hasRunBeforeKey) {
      userDefaults.set(true, forKey: hasRunBeforeKey)
      userDefaults.synchronize()

      let secItemClasses = [
        kSecClassGenericPassword,
        kSecClassInternetPassword,
        kSecClassCertificate,
        kSecClassKey,
        kSecClassIdentity,
      ]

      for itemClass in secItemClasses {
        let query: [CFString: Any] = [kSecClass: itemClass]
        SecItemDelete(query as CFDictionary)
      }

      print("✅ Keychain cleared on first app launch.")
    }
  }

  // ✅ Forward supported orientations to Orientation module
  func application(
    _ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    return Orientation.getOrientation()
  }
  
  // ✅ Handle Google Sign-In URL schemes
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return GIDSignIn.sharedInstance.handle(url)
  }
  
  // MARK: - Push Notification Methods
  
  // Handle successful registration for remote notifications
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    CleverTap.sharedInstance()?.setPushToken(deviceToken)
  }
  
  // Handle failed registration for remote notifications
  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    print("Failed to register for remote notifications: \(error)")
  }
  
  // Handle push notification when app is in foreground
  func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
    let userInfo = notification.request.content.userInfo
    CleverTap.sharedInstance()?.handleNotification(withData: userInfo)
    completionHandler([.banner, .list, .sound, .badge])
  }
  
  // Handle push notification tap
  func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
    let userInfo = response.notification.request.content.userInfo
    CleverTap.sharedInstance()?.handleNotification(withData: userInfo)
    completionHandler()
  }
  
  // MARK: - Apple Sign-In Credential Revocation Handler
  
  @objc private func handleAppleIDRevoked() {
    print("Apple ID credential was revoked")
    // Handle Apple ID credential revocation
    // You can add custom logic here such as:
    // - Log out the user
    // - Clear stored credentials
    // - Show a message to the user
    // - Navigate to login screen
    
    // Example: Post a notification to React Native
    NotificationCenter.default.post(
      name: NSNotification.Name("AppleIDCredentialRevoked"),
      object: nil
    )
  }
  
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
