/**
 * CheckoutScreen — Stripe checkout, kept inside the app.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY ONLY STRIPE
 *
 * Products link out to several places: Amazon, performbetter.com,
 * bodybellmethod.com, and Stripe payment links. Only the Stripe ones open
 * here. The rest keep opening in the system browser, deliberately:
 *
 *   - Amazon detects a WebView and either degrades the page or pushes an
 *     app-install interstitial, so an embedded Amazon page is worse than the
 *     browser, not better.
 *   - A shopper's saved cards, addresses and logins live in their browser.
 *     Dragging a third-party shop into a blank WebView throws all of that away.
 *
 * Stripe payment links are the exception: they are a single self-contained
 * page that finishes in one step, and keeping that step in the app is the
 * whole point of the request.
 *
 * PADDING
 *
 * The client's note was that nothing must be cut off. Two things could cut it:
 * the notch at the top and the home indicator at the bottom. The header is
 * inside a top-edge SafeAreaView, and the WebView sits above an explicit
 * bottom inset — Stripe's own pay button ends up right on that edge, so
 * without it the button is under the home bar and unpressable.
 * ─────────────────────────────────────────────────────────────────────────
 */

import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView, { WebViewNavigation } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { ErrorState } from '../components/ui/StateView';
import { Lock } from '../components/ui/icons';

/**
 * Hosts whose checkout is safe and worthwhile to embed.
 *
 * A whitelist rather than a blacklist: an unrecognised host opens in the
 * browser, which is the conservative outcome. `buy.stripe.com` covers the
 * payment links in the catalogue; `checkout.stripe.com` is where Stripe
 * redirects them, so both must be here or the redirect would bounce straight
 * back out to the browser mid-payment.
 */
const EMBEDDABLE_HOSTS = ['buy.stripe.com', 'checkout.stripe.com', 'pay.stripe.com'];

const hostOf = (url: string): string => {
  const m = /^https?:\/\/([^/?#]+)/i.exec(String(url ?? ''));
  return m ? m[1].toLowerCase() : '';
};

/** True when this URL should open in CheckoutScreen rather than the browser. */
export const isEmbeddableCheckout = (url: unknown): boolean =>
  EMBEDDABLE_HOSTS.includes(hostOf(String(url ?? '')));

const CheckoutScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { url, title } = route.params || {};

  const webRef = useRef<WebView | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentHost, setCurrentHost] = useState(hostOf(url));

  /**
   * Hardware back steps through the checkout's own history first. Stripe's
   * flow has real intermediate steps; closing the whole screen on the first
   * back press would throw away a part-filled card form.
   */
  useFocusEffect(
    React.useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack) {
          webRef.current?.goBack();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [canGoBack]),
  );

  const onNavStateChange = (nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
    setCurrentHost(hostOf(nav.url));
  };

  /**
   * Stripe's page links out to its own terms, to Link, and — after a
   * successful payment — to whatever return URL the seller configured. None of
   * those belong in a checkout WebView, so anything that leaves the payment
   * hosts is handed to the browser and the WebView stays where it was.
   */
  const onShouldStartLoad = (req: any): boolean => {
    const next = String(req?.url ?? '');

    if (next.startsWith('about:') || next.startsWith('data:')) return true;
    if (isEmbeddableCheckout(next)) return true;

    // Apple Pay / Google Pay and bank-app handoffs use non-http schemes.
    if (!/^https?:/i.test(next)) {
      Linking.openURL(next).catch(() => {});
      return false;
    }

    Linking.openURL(next).catch(() =>
      Alert.alert('Unavailable', 'We could not open that link.'),
    );
    return false;
  };

  if (!url) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Checkout" onBack={() => navigation.goBack()} />
        <ErrorState message="There is nothing to check out." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title={title || 'Checkout'}
        onBack={() => navigation.goBack()}
        right={
          <TouchableOpacity
            style={styles.openOut}
            onPress={() => Linking.openURL(url).catch(() => {})}
            hitSlop={theme.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Open in browser"
          >
            <Text style={styles.openOutText}>Browser</Text>
          </TouchableOpacity>
        }
      />

      {/* Shoppers are right to be wary of typing a card into an app. Naming the
          host they are actually on is the honest way to earn that. */}
      <View style={styles.secureBar}>
        <Lock size={12} color={theme.color.text.muted} />
        <Text style={styles.secureText} numberOfLines={1}>
          Secure checkout · {currentHost || 'stripe.com'}
        </Text>
      </View>

      <View style={[styles.webWrap, { paddingBottom: insets.bottom }]}>
        {failed ? (
          <ErrorState
            message="We could not load the checkout."
            onRetry={() => {
              setFailed(false);
              setLoading(true);
              webRef.current?.reload();
            }}
          />
        ) : (
          <>
            <WebView
              // Cast: react-native-webview's class component resolves its
              // props to `never` under React 19's typings, so a correctly
              // typed ref is still rejected. The runtime type is right.
              ref={webRef as any}
              source={{ uri: url }}
              style={styles.web}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              onHttpError={({ nativeEvent }: any) => {
                if (nativeEvent.statusCode >= 400) {
                  setLoading(false);
                  setFailed(true);
                }
              }}
              onNavigationStateChange={onNavStateChange}
              onShouldStartLoadWithRequest={onShouldStartLoad}
              // Stripe needs both to run its card fields and 3-D Secure step.
              javaScriptEnabled
              domStorageEnabled
              // 3-D Secure opens in a new window; without this it silently
              // never appears and the payment cannot complete.
              setSupportMultipleWindows={false}
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              startInLoadingState={false}
              allowsBackForwardNavigationGestures
            />

            {loading && (
              <View style={styles.loading} pointerEvents="none">
                <ActivityIndicator color={theme.color.brand.base} size="large" />
                <Text style={styles.loadingText}>Loading secure checkout…</Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },

  openOut: {
    paddingHorizontal: theme.space.md,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.card,
  },
  openOutText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.secondary,
    includeFontPadding: false,
  },

  secureBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingBottom: theme.space.md,
    paddingHorizontal: theme.space.screen,
  },
  secureText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.muted,
    includeFontPadding: false,
  },

  webWrap: { flex: 1, backgroundColor: theme.color.neutral[0] },
  web: { flex: 1, backgroundColor: theme.color.neutral[0] },

  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.neutral[0],
  },
  loadingText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
});

export default CheckoutScreen;
