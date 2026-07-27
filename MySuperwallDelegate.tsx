import { PaywallInfo, SubscriptionStatus, SuperwallDelegate, SuperwallEventInfo, EventType, } from '@superwall/react-native-superwall';
import type { RedemptionResult } from './RedemptionResults';
import Purchases from 'react-native-purchases';

export class MySuperwallDelegate extends SuperwallDelegate {
  subscriptionStatusDidChange(
    from: SubscriptionStatus,
    to: SubscriptionStatus
  ): void {
    console.log('🔄 Subscription status changed from', from, 'to', to);
  }

  handleSuperwallEvent(eventInfo: SuperwallEventInfo) {
    console.log('📡 Superwall event:', eventInfo.event.type);
    
    switch (eventInfo.event.type) {
      case EventType.appOpen:
        console.log('🚀 appOpen event');
        break;
        
      case EventType.deviceAttributes:
        console.log('📱 deviceAttributes:', eventInfo.event.deviceAttributes);
        break;
        
      case EventType.paywallOpen: {
        const paywallInfo = eventInfo.event.paywallInfo;
        console.log('🎨 paywallOpen event:', paywallInfo);
        if (paywallInfo && paywallInfo !== null) {
          console.log(`  Identifier: ${paywallInfo.identifier}`);
          console.log(`  Products: ${paywallInfo.productIds}`);
        }
        break;
      }
      
      case EventType.paywallClose: {
        console.log('🚪 paywallClose event');
        break;
      }
      
      case EventType.transactionStart: {
        const event = eventInfo.event as any;
        console.log('💳 transactionStart:', event.product);
        break;
      }
      
      case EventType.transactionComplete: {
        const event = eventInfo.event as any;
        console.log('✅ transactionComplete:', event.transaction);
        console.log('🎉 PURCHASE COMPLETED - Product:', event.product?.productIdentifier);
        
        // Immediately check and log purchase details
        this.logPurchaseDetails();
        break;
      }
      
      case EventType.transactionFail: {
        const event = eventInfo.event as any;
        console.log('❌ transactionFail:', event.error);
        break;
      }
      
      case EventType.transactionRestore: {
        const event = eventInfo.event as any;
        console.log('🔄 transactionRestore:', event);
        this.logPurchaseDetails();
        break;
      }
      
      case EventType.subscriptionStart: {
        const event = eventInfo.event as any;
        console.log('🎊 subscriptionStart:', event.product);
        this.logPurchaseDetails();
        break;
      }
      
      default:
        console.log('ℹ️ Unhandled event type:', eventInfo.event.type);
        break;
    }
  }

  // Helper method to log purchase details from RevenueCat
  private async logPurchaseDetails() {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = Object.keys(customerInfo.entitlements.active);
      
      if (activeEntitlements.length > 0) {
        console.log('📋 Active entitlements:', activeEntitlements);
        
        // Log details of each active entitlement
        Object.entries(customerInfo.entitlements.active).forEach(([key, entitlement]) => {
          console.log(`  ${key}:`, {
            productIdentifier: entitlement.productIdentifier,
            purchaseDate: entitlement.latestPurchaseDate,
            expirationDate: entitlement.expirationDate,
            isSandbox: entitlement.isSandbox,
          });
        });
      } else {
        console.log('ℹ️ No active entitlements found');
      }
    } catch (error) {
      console.error('❌ Error fetching purchase details:', error);
    }
  }

  handleCustomPaywallAction(name: string): void {
    console.log('Handling custom paywall action:', name);
  }

  willDismissPaywall(paywallInfo: PaywallInfo): void {
    console.log('Paywall will dismiss:', paywallInfo);
  }

  willPresentPaywall(paywallInfo: PaywallInfo): void {
    console.log('Paywall will present:', paywallInfo);
  }

  didDismissPaywall(paywallInfo: PaywallInfo): void {
    console.log('Paywall did dismiss:', paywallInfo);
  }

  didPresentPaywall(paywallInfo: PaywallInfo): void {
    console.log('Paywall did present:', paywallInfo);
  }

  paywallWillOpenURL(url: URL): void {
    console.log('Paywall will open URL:', url);
  }

  paywallWillOpenDeepLink(url: URL): void {
    console.log('Paywall will open Deep Link:', url);
  }

  handleLog(
    level: string,
    scope: string,
    message?: string,
    info?: Map<string, any>,
    error?: string
  ): void {
    console.log(`[${level}] ${scope}: ${message}`, info, error);
  }

  willRedeemLink(): void {
    console.log('Will redeem link');
  }

  didRedeemLink(result: RedemptionResult): void {
    console.log('Did redeem link:', result);
  }
}