import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, Platform, LogBox, PermissionsAndroid } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import Orientation from 'react-native-orientation-locker';
import RNBootSplash from 'react-native-bootsplash';
import { UserProvider, useUser } from './src/context/UserContext';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import Superwall, { LogLevel } from '@superwall/react-native-superwall';
import CleverTap from 'clevertap-react-native';
import DeviceInfo from 'react-native-device-info';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { RCPurchaseController } from './RCPurchaseController';
import { MySuperwallDelegate } from './MySuperwallDelegate';
import { requestNotifications } from 'react-native-permissions';
import messaging from '@react-native-firebase/messaging';
import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import PushNotification from "react-native-push-notification";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import Utils from './app/helpers/Utilities';
import EncryptedStorage from 'react-native-encrypted-storage';
import Toast from 'react-native-toast-message';
import { NetworkProvider } from './src/context/NetworkProvider';
import { handleAnonymousPaywall } from './src/services/subscriptionService';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef?.isReady()) {
    (navigationRef as any).navigate(name, params);
  }
}

let queuedNavigation: null | (() => void) = null;

const navigateWhenReady = (callback: () => void) => {
  if (navigationRef.isReady()) {
    callback();
  } else {
    queuedNavigation = callback;
  }
};

const maybeFlushNavigation = () => {
  if (navigationRef.isReady() && queuedNavigation) {
    queuedNavigation();
    queuedNavigation = null;
  }
};

LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs();//Ignore all log notifications

if (__DEV__) {
  console.info = () => { };
  console.warn = () => { };
  console.debug = () => { };
  console.trace = () => { };
}

if (!__DEV__) {
  console.log = () => { };
  console.info = () => { };
  console.warn = () => { };
  console.error = () => { };
  console.debug = () => { };
  console.trace = () => { };
}

PushNotification.createChannel(
  {
    channelId: "default", // (required)
    channelName: "default", // (required)
    channelDescription: "A channel to categorise your notifications", // (optional) default: undefined.
    playSound: false, // (optional) default: true
    soundName: "default", // (optional) See `soundName` parameter of `localNotification` function
    importance: 4, // (optional) default: 4. Int value of the Android notification importance
    vibrate: true // (optional) default: true. Creates the default vibration patten if true.
  }, (created) => console.log(`Channel created: ${created}`) // Callback to know if channel is created
);

export enum NetworkEnvironment {
  Release = 'release',
  ReleaseCandidate = 'releaseCandidate',
  Developer = 'developer',
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const PERMISSION_KEY = 'notification_permission_requested';

  useEffect(() => {
    const init = async () => {
      Orientation.lockToPortrait();
      const meta = await getDeviceMeta();
      CleverTap.recordEvent('App Launched', meta);
      CleverTap.profileSet(meta);

      // Request push notification permissions
      await notificationService();
      pushNotification();

      await RNBootSplash.hide({ fade: true });
    };
    init();
  }, []);

  const notificationService = useCallback(async () => {
    const isAndroid13OrAbove = Platform.OS === 'android' && Platform.Version >= 33;
    const isIOS = Platform.OS === 'ios';
    const alreadyAsked = await EncryptedStorage.getItem(PERMISSION_KEY);
    if (alreadyAsked === 'true') {
      console.log('Permission already requested, skipping prompt');
      await setupFCMTokenHandling();
    } else if (isAndroid13OrAbove) {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (granted) {
        console.log('Android notification permission already granted');
        await setupFCMTokenHandling();
      } else {
        await requestUserPermission();
      }
    } else if (isIOS) {
      const authStatus = await messaging().requestPermission({ provisional: true });
      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED || authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        console.log('iOS notification permission already granted');
        await setupFCMTokenHandling();
      } else {
        await requestUserPermission();
      }
    } else {
      await setupFCMTokenHandling();
    }
  }, []);

  const requestUserPermission = async () => {
    const isAndroid13OrAbove = Platform.OS === 'android' && Platform.Version >= 33;
    const isIOS = Platform.OS === 'ios';
    await EncryptedStorage.setItem(PERMISSION_KEY, 'true');
    if (isAndroid13OrAbove) {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (result === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Android permission granted after request');
        await setupFCMTokenHandling();
      } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log("User selected 'Don't ask again' on Android");
        // Optionally guide user to settings
      } else {
        console.log('Android permission denied');
      }
    } else if (isIOS) {
      const authStatus = await messaging().requestPermission({ provisional: true });
      if (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      ) {
        console.log('iOS permission granted after request');
        await setupFCMTokenHandling();
      } else {
        console.log('iOS permission denied');
      }
    }
  };

  const pushNotification = useCallback(() => {
    PushNotification.configure({
      onRegister: (token: any) => {
        console.log('onRegister >>>> ', token)
      },
      onNotification: (remoteMessage: any) => {
        console.log('onNotification >>>> ', remoteMessage)
        if (Platform.OS === "ios" && remoteMessage) {
          remoteMessage.finish(PushNotificationIOS.FetchResult.NoData);
        }
        if (remoteMessage.userInteraction) {
          onRemoteNotification(remoteMessage);
        }
      },
      onAction: (action: any) => {
        console.log('onAction >>>> ', action)
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    if (Platform.OS === 'ios') {
      PushNotificationIOS.addEventListener('notification', (notification) => {
        console.log("Tapped notification on iOS:", notification);
      });

      PushNotificationIOS.getDeliveredNotifications((notifications) => {
        console.log("Delivered Notifications >>>", notifications);
      });
    }

    messaging().onMessage(async remoteMessage => {
      console.log('onMessage >>> ', JSON.stringify(remoteMessage));
      if (remoteMessage?.notification && Platform.OS === 'ios') {
        PushNotificationIOS.addNotificationRequest({
          id: remoteMessage?.messageId + "",
          title: remoteMessage?.notification?.title ?? '',
          body: remoteMessage?.notification.body ?? '',
          userInfo: remoteMessage?.data ?? {},
          isCritical: true,
          isSilent: false,
          sound: 'default'
        });
      }
      else if (remoteMessage?.notification && Platform.OS === 'android') {
        displayNotification(remoteMessage)
      }
    });

    messaging().getInitialNotification().then(remoteMessage => {
      console.log('getInitialNotification >>>> ', remoteMessage)
      remoteMessage && onRemoteNotification(remoteMessage);
    }).catch(_e => { });

    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('onNotificationOpenedApp >>>> ', remoteMessage)
      remoteMessage && Platform.OS === 'ios' && onRemoteNotification(remoteMessage);
    });

    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('setBackgroundMessageHandler >>>> ', remoteMessage)
      if (remoteMessage?.userInteraction) {
        onRemoteNotification(remoteMessage)
      }
    });

    CleverTap.addListener('CleverTapPushNotificationClicked', (payload: any) => {
      console.log('CleverTap push notification clicked:', payload);
      // Navigate to a specific screen if needed
      const screenData = Utils.jsonParse(payload?.data?.screenData || '{}');
      navigateWhenReady(() => {
        
      });
    });
  }, []);

  const onRemoteNotification = async (remoteMessage: any) => {
    const screenData = Utils.jsonParse(remoteMessage?.data?.screenData || '{}');
    navigateWhenReady(() => {

    });
  };

  const displayNotification = async (message: any) => {
    PushNotification.localNotification({
      channelId: "default", // must match your created channel
      title: message?.notification?.title ?? '',
      message: message?.notification?.body ?? '',
      bigText: message?.notification?.body ?? '',
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      invokeApp: true,
    });
  };

  return (
    <NetworkProvider showBanner={true}>
      <UserProvider>
        <GestureHandlerRootView style={styles.container}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <NavigationContainer ref={navigationRef} onReady={maybeFlushNavigation}>
          <AppInitializer />
          {Platform.OS === 'android' ? (
            <SafeAreaProvider>
              <SafeAreaView style={styles.safeArea} edges={['bottom']}>
                <AppNavigator />
              </SafeAreaView>
            </SafeAreaProvider>
          ) : (
            <AppNavigator />
          )}
          </NavigationContainer>
          <Toast />
        </GestureHandlerRootView>
      </UserProvider>
    </NetworkProvider>
  );
}

function AppInitializer() {
  const { setIsSubscribed, isLoggedIn } = useUser();
  const apiKey = Platform.OS === 'ios' ? 'pk_YCLi5PYWHkiRnHGj_e-f9' : 'pk_Ax-FuapKW-XxnHDuoTLoi';
  const delegate = useMemo(() => new MySuperwallDelegate(), []);
  const purchaseController = useMemo(() => new RCPurchaseController(), []);
  const [paywallChecked, setPaywallChecked] = useState(false);
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  const hasActiveSubscription = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasAnyEntitlement = Object.keys(customerInfo.entitlements.active ?? {}).length > 0;
      setIsSubscribed(hasAnyEntitlement);
      return hasAnyEntitlement;
    } catch (error) {
      console.log('Error checking subscription:', error);
      setIsSubscribed(false);
      return false;
    }
  }, [setIsSubscribed]);

  // Global purchase tracking function
  const trackPurchaseIfNeeded = useCallback(async (customerInfo: CustomerInfo) => {
    try {
      const entitlementIds = Object.keys(customerInfo.entitlements.active);
      const hasActiveEntitlement = entitlementIds.length > 0;
      
      // Only track if user is not logged in and has made a purchase
      if (hasActiveEntitlement && !isLoggedIn && !purchaseTracked) {
        console.log('🎯 Global purchase tracker: New purchase detected!');
        
        // Get the product ID from the latest transaction
        const firstEntitlement = Object.values(customerInfo.entitlements.active)[0];
        const productId = firstEntitlement?.productIdentifier || 'unknown_product';
        
        console.log('💾 Storing anonymous purchase data globally:', {
          productId,
          purchaseDate: firstEntitlement?.latestPurchaseDate,
          expirationDate: firstEntitlement?.expirationDate,
        });
        
        // Get anonymous user ID
        const anonymousUserId = await Purchases.getAppUserID();
        
        // Store the purchase data (importing the function from subscriptionService)
        const { storeAnonymousPurchaseData } = await import('./src/services/subscriptionService');
        await storeAnonymousPurchaseData(anonymousUserId, productId, customerInfo);
        
        setPurchaseTracked(true);
        console.log('✅ Global tracker: Purchase data stored successfully');
      }
    } catch (error) {
      console.error('❌ Error in global purchase tracker:', error);
    }
  }, [isLoggedIn, purchaseTracked]);

  const checkAndShowPaywall = useCallback(async () => {
    try {
      // Only check paywall once and if user is not logged in
      if (paywallChecked || isLoggedIn) {
        console.log('Paywall already checked or user logged in, skipping');
        return;
      }

      console.log('🔍 Checking subscription status...');
      const isSubscribed = await hasActiveSubscription();
      
      if (isSubscribed) {
        console.log('✅ User already subscribed, skipping paywall');
        setPaywallChecked(true);
        return;
      }

      console.log('❌ User NOT subscribed - showing paywall');
      
      // Show paywall for non-subscribed users
      await handleAnonymousPaywall(
        'app_launch',
        async (productId) => {
          // ✅ Purchase successful
          console.log('✅ Anonymous purchase successful:', productId);
          // Update subscription status
          await hasActiveSubscription();
        },
        () => {
          // User skipped or cancelled paywall
          console.log('⚠️ User skipped paywall');
        }
      );
      
      setPaywallChecked(true);
    } catch (error) {
      console.error('Error checking/showing paywall:', error);
      setPaywallChecked(true);
    }
  }, [paywallChecked, isLoggedIn, hasActiveSubscription]);

  useEffect(() => {
    const setupSuperwall = async () => {
      // Ensure configuration completes before proceeding
      await Superwall.configure({
        apiKey,
        purchaseController,
        completion: () => {
          console.log('✅ Superwall initialized successfully');
        },
      });

      await Superwall.shared.setDelegate(delegate);
      await Superwall.shared.setLogLevel(LogLevel.Debug);

      // Start RC -> Superwall subscription bridge
      purchaseController.syncSubscriptionStatus();

      // Initial entitlement check
      await hasActiveSubscription();

      // Check and show paywall if needed (after Superwall is initialized)
      // await checkAndShowPaywall();

      // Keep context in sync with RC updates
      const listener = (customerInfo: CustomerInfo) => {
        const hasAnyEntitlement = Object.keys(customerInfo.entitlements.active ?? {}).length > 0;
        setIsSubscribed(hasAnyEntitlement);

        // Track the purchase if it's anonymous and hasn't been tracked yet
        // trackPurchaseIfNeeded(customerInfo);
      };
      Purchases.addCustomerInfoUpdateListener(listener);

      return () => {
        // Attempt to remove the RC listener if supported
        // @ts-ignore - API may vary by version, safely no-op if not present
        if (typeof Purchases.removeCustomerInfoUpdateListener === 'function') {
          // @ts-ignore
          Purchases.removeCustomerInfoUpdateListener(listener);
        }
      };
    };

    let cleanup: (() => void) | undefined;
    setupSuperwall().then((c) => {
      // If setupSuperwall returns a cleanup function, capture it
      if (typeof c === 'function') cleanup = c;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [apiKey, delegate, purchaseController, setIsSubscribed, hasActiveSubscription]);

  return null;
}

export async function getDeviceMeta() {
  const deviceId = await DeviceInfo.getUniqueId();
  const manufacturer = await DeviceInfo.getManufacturer();
  const brand = DeviceInfo.getBrand();
  const model = DeviceInfo.getModel();
  const systemVersion = DeviceInfo.getSystemVersion();
  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();
  const os = DeviceInfo.getSystemName(); // iOS / Android
  const sdkVersion = (await (DeviceInfo as any).getApiLevel?.()) ?? null; // Android only

  return {
    DeviceId: deviceId,
    OS: os,
    Manufacturer: manufacturer || 'unknown',
    Brand: brand || 'unknown',
    Model: model || 'unknown',
    OsVersion: systemVersion || 'unknown',
    SdkVersion: sdkVersion || 'unknown',
    AppVersionName: appVersion || 'unknown',
    AppVersionCode: buildNumber || 'unknown',
  };
}

export async function onUserLoginCleverTap(user: { id: string; name: string; email: string }) {
  const meta = await getDeviceMeta();
  CleverTap.profileSet({
    Name: user.name,
    Email: user.email,
    Identity: user.id,
    ...meta,
  });
}

export async function onUserLogOutCleverTap() {
  const meta = await getDeviceMeta();
  // If available in your CleverTap RN SDK version, prefer CleverTap.logout()
  // CleverTap.logout?.();
  CleverTap.onUserLogin({});
  CleverTap.profileSet(meta);
}

export async function pushCleverTapEvent(eventName: string, eventDetails: any) {
  CleverTap.recordEvent(eventName, eventDetails);
}

// Push Notification Helper Functions
export async function requestPushNotificationPermissions() {
  try {
    if (Platform.OS === 'ios') {
      const { status } = await requestNotifications(['alert', 'sound', 'badge',]);
      console.log('Push notification permission status:', status);
    } else {
      const { status } = await requestNotifications();
      console.log('Push notification permission status:', status);
    }
  } catch (error) {
    console.error('Error requesting push notification permissions:', error);
  }
}

// FCM Token Handling for CleverTap
export async function setupFCMTokenHandling() {
  try {
    // Create notification channel for Android 8.0+
    if (Platform.OS === 'android') {
      CleverTap.createNotificationChannel(
        'default',
        'Default Notifications',
        'Default notification channel',
        4, // IMPORTANCE_HIGH
        true // Show badge
      );
    }

    if (Platform.OS === 'ios') {
      const apnsToken = await messaging().getAPNSToken();
      if (apnsToken) {
        console.log('APNS Token:', apnsToken);
        messaging().setAPNSToken(apnsToken);
      } else {
        console.log('No APNS Token available');
      }
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);

    // Set FCM token for CleverTap
    if (fcmToken) {
      CleverTap.setFCMPushToken(fcmToken);
      console.log('FCM token set for CleverTap');
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      CleverTap.setFCMPushToken(token);
    });

  } catch (error) {
    console.error('Error setting up FCM token handling:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});

export default App;