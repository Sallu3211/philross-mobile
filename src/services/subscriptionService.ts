import Purchases, { CustomerInfo } from 'react-native-purchases';
import Superwall, {
  PaywallPresentationHandler,
  PaywallInfo,
  SubscriptionStatus,
} from '@superwall/react-native-superwall';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Platform } from 'react-native';

export type PaywallResult =
  | { type: 'purchased'; productId: string }
  | { type: 'restored' }
  | { type: 'declined' };

export type AnonymousPurchaseData = {
  anonymousUserId: string;
  productId: string;
  purchaseDate: string;
  customerInfo: any; // Store the full customer info from RevenueCat
};

const ANONYMOUS_PURCHASE_KEY = 'anonymous_purchase_data';

export async function hasActiveSubscription() {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlementIds = Object.keys(customerInfo.entitlements.active);
    return entitlementIds;
  } catch (e) {
    console.log('Error checking subscription:', e);
    return false;
  }
}

export function setupRevenueCatListener() {
  Purchases.addCustomerInfoUpdateListener(
    async (customerInfo: CustomerInfo) => {
      console.log('🔔 RevenueCat customer info updated:', customerInfo);
      const entitlementIds = Object.keys(customerInfo.entitlements.active);
      const isSubscribed = entitlementIds.length !== 0;
      Superwall.shared.setSubscriptionStatus(
        isSubscribed
          ? SubscriptionStatus.Active(entitlementIds)
          : SubscriptionStatus.Inactive(),
      );
      if (isSubscribed) {
        console.log('✅ User subscribed (listener)');
        Superwall.shared.dismiss();
      } else {
        console.log('❌ User unsubscribed (listener)');
      }
    },
  );
}

export async function checkSubscriptionAndProceed(
  onSuccess: () => void,
  onCancel?: () => void,
) {
  console.log('checkSubscriptionAndProceed >>>> 1 ');
  const entitlementIds = await hasActiveSubscription();
  const isSubscribed =
    Array.isArray(entitlementIds) && entitlementIds.length > 0;
  Superwall.shared.setSubscriptionStatus(
    isSubscribed
      ? SubscriptionStatus.Active(entitlementIds)
      : SubscriptionStatus.Inactive(),
  );
  if (isSubscribed) {
    onSuccess();
  }

  console.log('checkSubscriptionAndProceed >>>> 2 ');

  const checkAndUpdatePaywall = async () => {
    await Purchases.syncPurchases();
    const entitlementIds = await hasActiveSubscription();
    const isSubscribed =
      Array.isArray(entitlementIds) && entitlementIds.length > 0;
    Superwall.shared.setSubscriptionStatus(
      isSubscribed
        ? SubscriptionStatus.Active(entitlementIds)
        : SubscriptionStatus.Inactive(),
    );
    if (isSubscribed) {
      onSuccess();
    } else {
      onCancel?.();
    }
  };

  const handler = new PaywallPresentationHandler();

  handler.onPresent((info: PaywallInfo) => {
    console.log('Paywall presented', info);
  });

  handler.onDismiss(async (info: PaywallInfo, result: PaywallResult) => {
    console.log('Paywall dismissed with result:', result);
    // Use a switch statement to check the 'type' property.
    switch (result.type) {
      case 'purchased':
      case 'restored':
        onSuccess();
        break;
      case 'declined':
        break;
      default:
        onCancel?.();
        break;
    }
  });

  handler.onSkip(async reason => {
    console.log('Paywall skipped:', reason);
    await checkAndUpdatePaywall();
  });

  handler.onError(error => {
    console.log('Paywall error:', error);
    onCancel?.();
  });

  console.log('checkSubscriptionAndProceed >>>> 3 ');

  Superwall.shared.register({
    placement: 'premium_click',
    handler: handler,
    feature: () => {
      console.log('Feature logic executed.');
      const callSubscriptionCheck = async () => {
        await checkAndUpdatePaywall();
      };
      callSubscriptionCheck();
    },
  });

  console.log('checkSubscriptionAndProceed >>>> end ');
}

/**
 * Creates RevenueCat webhook-style payload from CustomerInfo
 * Formats differently for iOS (APP_STORE) and Android (PLAY_STORE)
 */
function createRevenueCatPayload(
  customerInfo: CustomerInfo,
  anonymousUserId: string,
  productId: string,
): any {
  try {
    const entitlements = customerInfo.entitlements.active;
    const firstEntitlement = Object.values(entitlements)[0];
    
    if (!firstEntitlement) {
      return null;
    }

    const store = Platform.OS === 'ios' ? 'APP_STORE' : 'PLAY_STORE';
    const isIOS = Platform.OS === 'ios';
    
    // Get dates in milliseconds
    const purchasedAtMs = firstEntitlement.latestPurchaseDate 
      ? new Date(firstEntitlement.latestPurchaseDate).getTime() 
      : Date.now();
    const expirationAtMs = firstEntitlement.expirationDate 
      ? new Date(firstEntitlement.expirationDate).getTime() 
      : null;

    const payload = {
      api_version: '1.0',
      event: {
        aliases: [anonymousUserId],
        app_id: isIOS ? 'app2cf2350ca9' : 'appc63eb6bedc',
        app_user_id: anonymousUserId,
        commission_percentage: isIOS ? 0.2542 : 0.1271,
        country_code: 'IN', // You can make this dynamic if available
        currency: 'INR',
        entitlement_id: null,
        entitlement_ids: Object.keys(entitlements),
        environment: firstEntitlement.isSandbox ? 'SANDBOX' : 'PRODUCTION',
        event_timestamp_ms: Date.now(),
        expiration_at_ms: expirationAtMs,
        id: generateUUID(),
        is_family_share: false,
        is_trial_conversion: false,
        metadata: null,
        offer_code: null,
        original_app_user_id: anonymousUserId,
        original_transaction_id: customerInfo.originalPurchaseDate || '',
        period_type: firstEntitlement.periodType || 'NORMAL',
        presented_offering_id: null,
        price: 0, // Will be populated by backend based on product_id
        price_in_purchased_currency: 0,
        product_id: productId,
        purchased_at_ms: purchasedAtMs,
        renewal_number: 1,
        store: store,
        subscriber_attributes: customerInfo.subscriberAttributes || {},
        takehome_percentage: isIOS ? 0.7 : 0.85,
        tax_percentage: 0.1525,
        transaction_id: '',
        type: 'INITIAL_PURCHASE',
      },
    };

    return payload;
  } catch (error) {
    console.error('❌ Error creating RevenueCat payload:', error);
    return null;
  }
}

/**
 * Generates a UUID for the event ID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16).toUpperCase();
  });
}

/**
 * Stores anonymous purchase data locally for later syncing with backend
 * Exported for use in global purchase tracking
 */
export async function storeAnonymousPurchaseData(
  anonymousUserId: string,
  productId: string,
  customerInfo: CustomerInfo,
) {
  try {
    const purchaseData: AnonymousPurchaseData = {
      anonymousUserId,
      productId,
      purchaseDate: new Date().toISOString(),
      customerInfo: JSON.parse(JSON.stringify(customerInfo)), // Serialize customerInfo
    };

    await EncryptedStorage.setItem(
      ANONYMOUS_PURCHASE_KEY,
      JSON.stringify(purchaseData),
    );
    console.log('✅ Anonymous purchase data stored:', purchaseData);
  } catch (error) {
    console.error('❌ Error storing anonymous purchase data:', error);
  }
}

/**
 * Retrieves stored anonymous purchase data
 */
async function getAnonymousPurchaseData(): Promise<AnonymousPurchaseData | null> {
  try {
    const data = await EncryptedStorage.getItem(ANONYMOUS_PURCHASE_KEY);
    if (data) {
      return JSON.parse(data) as AnonymousPurchaseData;
    }
    return null;
  } catch (error) {
    console.error('❌ Error retrieving anonymous purchase data:', error);
    return null;
  }
}

/**
 * Clears stored anonymous purchase data
 */
async function clearAnonymousPurchaseData() {
  try {
    await EncryptedStorage.removeItem(ANONYMOUS_PURCHASE_KEY);
    console.log('✅ Anonymous purchase data cleared');
  } catch (error) {
    console.error('❌ Error clearing anonymous purchase data:', error);
  }
}

/**
 * Handles paywall for anonymous users (app_install and app_launched placements)
 * Call this method when you want to show paywall for non-logged-in users
 * 
 * This implementation uses multiple tracking mechanisms to ensure purchases are captured:
 * 1. RevenueCat customer info listener (primary)
 * 2. Superwall handler callbacks (secondary)
 * 3. Direct RevenueCat polling (fallback)
 */
export async function handleAnonymousPaywall(
  placement: 'app_install' | 'app_launch',
  onPurchaseSuccess?: (productId: string) => void,
  onCancel?: () => void,
) {
  console.log(`🚀 handleAnonymousPaywall >>>> placement: ${placement}`);

  // Get or create anonymous user ID for RevenueCat
  const anonymousUserId = await Purchases.getAppUserID();
  console.log('👤 Anonymous User ID:', anonymousUserId);

  // Track if purchase was already processed to prevent duplicates
  let purchaseProcessed = false;

  // Helper function to store purchase data (called from multiple sources)
  const processPurchase = async (productId: string, source: string) => {
    if (purchaseProcessed) {
      console.log(`⚠️ Purchase already processed, skipping duplicate from ${source}`);
      return;
    }

    console.log(`💰 Processing purchase from ${source}:`, productId);
    purchaseProcessed = true;

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      await storeAnonymousPurchaseData(
        anonymousUserId,
        productId,
        customerInfo,
      );
      console.log(`✅ Anonymous purchase stored successfully: ${productId}`);
      onPurchaseSuccess?.(productId);
    } catch (error) {
      console.error('❌ Error storing anonymous purchase:', error);
      purchaseProcessed = false; // Reset on error to allow retry
    }
  };

  // 🎯 METHOD 1: Setup RevenueCat listener to catch purchases immediately
  // This is the most reliable method for app_launch/app_install placements
  const rcListener = async (customerInfo: CustomerInfo) => {
    console.log('🔔 RevenueCat customer info updated during paywall flow');
    
    const entitlementIds = Object.keys(customerInfo.entitlements.active);
    const hasActiveEntitlement = entitlementIds.length > 0;
    
    if (hasActiveEntitlement && !purchaseProcessed) {
      console.log('✅ Active entitlement detected in listener!');
      
      // Get the product ID from the latest transaction
      const firstEntitlement = Object.values(customerInfo.entitlements.active)[0];
      const productId = firstEntitlement?.productIdentifier || 'unknown_product';
      
      await processPurchase(productId, 'RevenueCat Listener');
      
      // Update Superwall subscription status
      await Superwall.shared.setSubscriptionStatus(
        SubscriptionStatus.Active(entitlementIds)
      );
    }
  };

  // Add the listener
  Purchases.addCustomerInfoUpdateListener(rcListener);

  // 🎯 METHOD 2: Setup Superwall handler callbacks
  const handler = new PaywallPresentationHandler();

  handler.onPresent((info: PaywallInfo) => {
    console.log(`📱 Paywall presented for ${placement}:`, info);
  });

  handler.onDismiss(async (info: PaywallInfo, result: PaywallResult) => {
    console.log(`🚪 Paywall dismissed for ${placement} with result:`, result);

    switch (result.type) {
      case 'purchased':
        // Store the anonymous purchase data
        await processPurchase(result.productId, 'Superwall Handler');
        break;
      case 'restored':
        console.log('🔄 Purchase restored for anonymous user');
        if (!purchaseProcessed) {
          // Try to get the product ID from customer info
          try {
            const customerInfo = await Purchases.getCustomerInfo();
            const entitlements = Object.values(customerInfo.entitlements.active);
            if (entitlements.length > 0) {
              const productId = entitlements[0]?.productIdentifier || 'restored';
              await processPurchase(productId, 'Superwall Restore');
            } else {
              onPurchaseSuccess?.('restored');
            }
          } catch (error) {
            console.error('❌ Error handling restore:', error);
            onPurchaseSuccess?.('restored');
          }
        }
        break;
      case 'declined':
        console.log('⚠️ User declined the paywall');
        onCancel?.();
        break;
      default:
        onCancel?.();
        break;
    }

    // Clean up the RevenueCat listener when paywall is dismissed
    // @ts-ignore - removeCustomerInfoUpdateListener may not be in types
    if (typeof Purchases.removeCustomerInfoUpdateListener === 'function') {
      try {
        // @ts-ignore
        Purchases.removeCustomerInfoUpdateListener(rcListener);
        console.log('🧹 RevenueCat listener removed');
      } catch (error) {
        console.log('ℹ️ Could not remove listener (may not be supported)', error);
      }
    }
  });

  handler.onSkip(async reason => {
    console.log(`⏭️ Paywall skipped for ${placement}:`, reason);
    onCancel?.();
  });

  handler.onError(error => {
    console.error(`❌ Paywall error for ${placement}:`, error);
    onCancel?.();
  });

  // 🎯 METHOD 3: Register the placement with Superwall
  // For app_launch/app_install, registration triggers automatic presentation
  await Superwall.shared.register({
    placement: placement,
    handler: handler,
  });

  console.log(`✅ handleAnonymousPaywall >>>> ${placement} registered successfully`);
}

/**
 * Syncs anonymous purchase with backend after user login
 * Call this method immediately after successful login
 * 
 * @param userId - The logged-in user's ID
 * @param backendSyncFunction - Your backend API function to sync the purchase
 * @returns boolean - true if sync was successful or not needed, false if failed
 */
export async function syncAnonymousPurchaseWithBackend(
  userId: string,
  backendSyncFunction: (params: {
    userId: string;
    anonymousUserId: string;
    productId: string;
    purchaseDate: string;
    customerInfo: any;
    isSubscribedUser: boolean;
    revenueCatPayload: any;
  }) => Promise<boolean>,
): Promise<boolean> {
  try {
    console.log('🔄 Syncing anonymous purchase with backend for user:', userId);

    // Check if there's any anonymous purchase data
    const anonymousPurchase = await getAnonymousPurchaseData();

    if (!anonymousPurchase) {
      console.log('ℹ️ No anonymous purchase data to sync');
      return true; // No data to sync is not an error
    }

    console.log('📦 Found anonymous purchase data:', anonymousPurchase);

    // Check if user is subscribed (this will be true since they made a purchase)
    const isSubscribedUser = true; // User was subscribed before login

    // First, transfer the purchase to the logged-in user in RevenueCat
    try {
      // Login to RevenueCat with the user's ID
      // This will transfer any purchases from anonymous user to this user
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('✅ RevenueCat login successful for user:', userId);
      console.log('Customer Info after login:', customerInfo);

      // Create RevenueCat webhook-style payload
      const revenueCatPayload = createRevenueCatPayload(
        customerInfo,
        anonymousPurchase.anonymousUserId,
        anonymousPurchase.productId,
      );

      console.log('📋 Created RevenueCat payload:', revenueCatPayload);

      // Update Superwall subscription status
      const entitlementIds = Object.keys(customerInfo.entitlements.active);
      const isSubscribed = entitlementIds.length > 0;
      await Superwall.shared.setSubscriptionStatus(
        isSubscribed
          ? SubscriptionStatus.Active(entitlementIds)
          : SubscriptionStatus.Inactive(),
      );

      // Now sync with your backend
      const syncSuccess = await backendSyncFunction({
        userId,
        anonymousUserId: anonymousPurchase.anonymousUserId,
        productId: anonymousPurchase.productId,
        purchaseDate: anonymousPurchase.purchaseDate,
        customerInfo: anonymousPurchase.customerInfo,
        isSubscribedUser: isSubscribedUser,
        revenueCatPayload: revenueCatPayload,
      });

      if (syncSuccess) {
        console.log('✅ Backend sync successful');
        // Clear the anonymous purchase data after successful sync
        await clearAnonymousPurchaseData();
        return true;
      } else {
        console.error('❌ Backend sync failed');
        // Don't clear the data so we can retry later
        return false;
      }
    } catch (rcError) {
      console.error('❌ RevenueCat login error:', rcError);
      return false;
    }
  } catch (error) {
    console.error('❌ Error syncing anonymous purchase:', error);
    return false;
  }
}

/**
 * Check if there's a pending anonymous purchase that needs to be synced
 * Useful for showing UI indicators or reminders
 */
export async function hasPendingAnonymousPurchase(): Promise<boolean> {
  const data = await getAnonymousPurchaseData();
  return data !== null;
}

/**
 * Get subscription data for login/signup
 * Returns is_subscribed_user and revenue_cat_payload if user has pending purchase
 * Use this to send subscription data with login/signup requests
 * 
 * @returns Object with subscription data or null if no pending purchase
 */
export async function getSubscriptionDataForLogin(): Promise<{
  is_subscribed_user: boolean;
  revenue_cat_payload: any;
} | null> {
  try {
    // Check for pending anonymous purchase
    const anonymousPurchase = await getAnonymousPurchaseData();
    
    if (!anonymousPurchase) {
      // No pending purchase
      return null;
    }

    // Get current customer info from RevenueCat
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check if user has active subscription
    const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
    
    if (!hasActiveSubscription) {
      // No active subscription, clear old data
      await clearAnonymousPurchaseData();
      return null;
    }

    // Create RevenueCat payload
    const revenueCatPayload = createRevenueCatPayload(
      customerInfo,
      anonymousPurchase.anonymousUserId,
      anonymousPurchase.productId,
    );

    return {
      is_subscribed_user: true,
      revenue_cat_payload: revenueCatPayload,
    };
  } catch (error) {
    console.error('❌ Error getting subscription data for login:', error);
    return null;
  }
}

/**
 * Get subscription parameters to include in login/signup request
 * Returns an object that can be spread into your login/signup payload
 * Always returns the parameters (with null values if not subscribed)
 * 
 * @example
 * const loginData = {
 *   email: 'user@example.com',
 *   password: 'password',
 *   ...await getLoginSubscriptionParams()
 * };
 */
export async function getLoginSubscriptionParams(): Promise<{
  is_subscribed_user: boolean;
  revenue_cat_payload: any;
  revenue_cat_app_user_id: string | null;
}> {
  const subscriptionData = await getSubscriptionDataForLogin();
  
  if (!subscriptionData) {
    // User is NOT subscribed - send null/false
    return {
      is_subscribed_user: false,
      revenue_cat_payload: null,
      revenue_cat_app_user_id: null,
    };
  }

  const anonymousPurchase = await getAnonymousPurchaseData();
  
  // Get app_user_id from revenue_cat_payload
  const revenueCatAppUserId = subscriptionData.revenue_cat_payload?.event?.app_user_id || null;
  
  // User IS subscribed - send data
  return {
    is_subscribed_user: subscriptionData.is_subscribed_user,
    revenue_cat_payload: subscriptionData.revenue_cat_payload,
    revenue_cat_app_user_id: revenueCatAppUserId,
  };
}
