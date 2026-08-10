/**
 * PaywallScreen — our own subscription screen.
 *
 * Replaces the Superwall-hosted paywall for the trial flow. Superwall renders a
 * remote template that can't follow the app's design system and doesn't
 * advertise the Play Console free-trial offer, so members never saw that their
 * first week was free.
 *
 * This screen talks to RevenueCat directly:
 *   getOfferings()  →  products + their pricing phases
 *   purchaseSubscriptionOption()  →  buys the *offer* that carries the free
 *                                    trial, not just the base plan
 *
 * That last point matters on Android. A Play subscription has a base plan and
 * separate offers; buying the base plan alone silently skips the free week.
 * We look for the option whose `freePhase` is set and buy that one.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Purchases, {
  PRODUCT_CATEGORY,
  PURCHASES_ERROR_CODE,
  type PurchasesStoreProduct,
  type SubscriptionOption,
} from 'react-native-purchases';
import Superwall, {
  SubscriptionStatus,
} from '@superwall/react-native-superwall';

import { theme } from '../theme';
import { Check, ChevronRight, Lock } from '../components/ui/icons';

/** Product IDs as configured in Play Console / App Store Connect. */
const PRODUCT_IDS = ['monthly_099', 'annual'];

const BENEFITS = [
  'Every structured training programme',
  'Self-defence tutorials, start to finish',
  'Kettlebell flows & combos',
  'Exclusive video workouts',
  'New sessions from Phil every week',
];

interface Plan {
  product: PurchasesStoreProduct;
  /** The option we will actually purchase (trial offer where one exists). */
  option: SubscriptionOption | null;
  title: string;
  priceLabel: string;
  periodLabel: string;
  trialDays: number | null;
  /** e.g. "Save 17%" — only set on the yearly plan when we can compute it. */
  badge?: string;
}

/** Turn a Period into whole days. Good enough for trial copy. */
function periodToDays(unit: string | undefined, value: number | undefined): number | null {
  if (!unit || !value) return null;
  const u = String(unit).toUpperCase();
  if (u.includes('DAY')) return value;
  if (u.includes('WEEK')) return value * 7;
  if (u.includes('MONTH')) return value * 30;
  if (u.includes('YEAR')) return value * 365;
  return null;
}

/**
 * Finds the purchasable option that includes a free trial. Android exposes
 * these as subscriptionOptions; iOS carries a single introPrice on the product.
 */
function resolveTrial(product: PurchasesStoreProduct): {
  option: SubscriptionOption | null;
  trialDays: number | null;
} {
  if (Platform.OS === 'ios') {
    const intro: any = (product as any).introPrice;
    const days =
      intro && intro.price === 0
        ? periodToDays(intro.periodUnit, intro.periodNumberOfUnits)
        : null;
    return { option: null, trialDays: days };
  }

  const options = product.subscriptionOptions ?? [];
  const withFree = options.find(o => !!o.freePhase);

  if (withFree?.freePhase) {
    const bp: any = withFree.freePhase.billingPeriod;
    return { option: withFree, trialDays: periodToDays(bp?.unit, bp?.value) };
  }

  return { option: product.defaultOption ?? null, trialDays: null };
}

const PaywallScreen = ({ navigation, route }: any) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Deliberately NOT using getOfferings(). The RevenueCat Offering is still
      // pointed at the legacy `low` product (base plans com-weekly/monthly/
      // yearly-low), which carries no free trial and the wrong prices. Asking
      // for our two product IDs by name guarantees we show the subscriptions
      // that actually have the 7-day trial configured in Play Console.
      //
      // Once the Offering is repointed at these IDs, this can go back to
      // getOfferings() so plans can be reordered without an app release.
      const products: PurchasesStoreProduct[] = await Purchases.getProducts(
        PRODUCT_IDS,
        PRODUCT_CATEGORY.SUBSCRIPTION,
      );

      if (products.length === 0) {
        setError(
          'We could not load the plans right now. Check your connection and try again.',
        );
        setPlans([]);
        return;
      }

      const built: Plan[] = products.map(product => {
        const { option, trialDays } = resolveTrial(product);

        // Read the billing period from the product itself rather than guessing
        // from its identifier — two of the legacy plans were both labelled
        // "Monthly" because one was really a weekly base plan.
        const phase = option?.fullPricePhase ?? product.defaultOption?.fullPricePhase;
        const unit = String((phase?.billingPeriod as any)?.unit ?? '').toUpperCase();
        const isYearly = unit.includes('YEAR') || /annual|year/i.test(product.identifier);
        const isWeekly = unit.includes('WEEK');

        return {
          product,
          option,
          title: isYearly ? 'Yearly' : isWeekly ? 'Weekly' : 'Monthly',
          priceLabel: product.priceString,
          periodLabel: isYearly ? 'per year' : isWeekly ? 'per week' : 'per month',
          trialDays,
        };
      });

      // Monthly first, yearly last so the saving badge lands on the anchor.
      built.sort(a => (a.title === 'Monthly' ? -1 : 1));

      const monthly = built.find(p => p.title === 'Monthly');
      const yearly = built.find(p => p.title === 'Yearly');
      if (monthly && yearly && monthly.product.price > 0) {
        const saving = 1 - yearly.product.price / (monthly.product.price * 12);
        if (saving > 0.01) {
          yearly.badge = `Save ${Math.round(saving * 100)}%`;
        }
      }

      setPlans(built);
      setSelected(yearly?.product.identifier ?? built[0]?.product.identifier ?? null);
    } catch (e: any) {
      console.log('Paywall load failed:', e);
      setError('Something went wrong loading the plans. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const current = useMemo(
    () => plans.find(p => p.product.identifier === selected) ?? null,
    [plans, selected],
  );

  const finish = useCallback(() => {
    route?.params?.onSuccess?.();
    navigation.goBack();
  }, [navigation, route]);

  const onPurchase = useCallback(async () => {
    if (!current || purchasing) return;
    setPurchasing(true);
    try {
      // Buy the trial-bearing option where one exists, else the plain product.
      const result = current.option
        ? await Purchases.purchaseSubscriptionOption(current.option)
        : await Purchases.purchaseStoreProduct(current.product);

      const active = Object.keys(result?.customerInfo?.entitlements?.active ?? {});
      if (active.length > 0) {
        Superwall.shared.setSubscriptionStatus(SubscriptionStatus.Active(active));
        finish();
      } else {
        Alert.alert(
          'Purchase incomplete',
          'The purchase went through but we could not confirm access. Try Restore purchases.',
        );
      }
    } catch (e: any) {
      // A user tapping "cancel" is not an error worth alerting about.
      if (e?.userCancelled || e?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return;
      }
      Alert.alert('Purchase failed', e?.message ?? 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [current, purchasing, finish]);

  const onRestore = useCallback(async () => {
    setPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      const active = Object.keys(info?.entitlements?.active ?? {});
      if (active.length > 0) {
        Superwall.shared.setSubscriptionStatus(SubscriptionStatus.Active(active));
        Alert.alert('Restored', 'Your subscription is active again.');
        finish();
      } else {
        Alert.alert('Nothing to restore', 'We could not find a previous subscription.');
      }
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'Please try again.');
    } finally {
      setPurchasing(false);
    }
  }, [finish]);

  const trialDays = current?.trialDays ?? null;

  const ctaLabel = purchasing
    ? ''
    : trialDays
    ? `Start my ${trialDays}-day free trial`
    : 'Subscribe';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.color.surface.hero} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Philross Premium</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={theme.hitSlop}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hero}>Train Hard.{'\n'}Live Fearless.</Text>
        {!!trialDays && (
          <View style={styles.trialPill}>
            <Check size={13} color={theme.color.progress.fillOnDark} />
            <Text style={styles.trialPillText}>
              {`First ${trialDays} days free — cancel anytime`}
            </Text>
          </View>
        )}

        <View style={styles.benefits}>
          {BENEFITS.map(b => (
            <View key={b} style={styles.benefitRow}>
              <View style={styles.benefitTick}>
                <Check size={12} color={theme.color.text.inverse} />
              </View>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator
            color={theme.color.progress.fillOnDark}
            size="large"
            style={styles.loader}
          />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={load} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plans}>
            {plans.map(plan => {
              const isSel = plan.product.identifier === selected;
              return (
                <TouchableOpacity
                  key={plan.product.identifier}
                  style={[styles.plan, isSel && styles.planSelected]}
                  onPress={() => setSelected(plan.product.identifier)}
                  activeOpacity={0.85}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSel }}
                >
                  <View style={[styles.radio, isSel && styles.radioOn]}>
                    {isSel && <View style={styles.radioDot} />}
                  </View>

                  <View style={styles.planText}>
                    <View style={styles.planTitleRow}>
                      <Text style={styles.planTitle}>{plan.title}</Text>
                      {!!plan.badge && (
                        <View style={styles.saveBadge}>
                          <Text style={styles.saveBadgeText}>{plan.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planMeta}>
                      {plan.trialDays
                        ? `${plan.trialDays} days free, then ${plan.priceLabel} ${plan.periodLabel}`
                        : `${plan.priceLabel} ${plan.periodLabel}`}
                    </Text>
                  </View>

                  <Text style={styles.planPrice}>{plan.priceLabel}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={[styles.cta, (!current || purchasing) && styles.ctaDisabled]}
          onPress={onPurchase}
          disabled={!current || purchasing}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          {purchasing ? (
            <ActivityIndicator color={theme.color.text.onBrand} />
          ) : (
            <>
              <Text style={styles.ctaText}>{ctaLabel}</Text>
              <ChevronRight size={16} color={theme.color.text.onBrand} />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.fine}>
          {trialDays
            ? `You won't be charged until your ${trialDays}-day trial ends. Subscriptions auto-renew unless cancelled at least 24 hours before the period ends. Manage or cancel anytime in ${
                Platform.OS === 'ios' ? 'the App Store' : 'Google Play'
              }.`
            : 'Subscriptions auto-renew unless cancelled at least 24 hours before the period ends.'}
        </Text>

        <View style={styles.links}>
          <TouchableOpacity onPress={onRestore} hitSlop={theme.hitSlop}>
            <Text style={styles.link}>Restore purchases</Text>
          </TouchableOpacity>
          <Text style={styles.linkSep}>·</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Legal', { doc: 'terms' })}
            hitSlop={theme.hitSlop}
          >
            <Text style={styles.link}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.linkSep}>·</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}
            hitSlop={theme.hitSlop}
          >
            <Text style={styles.link}>Privacy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.secureRow}>
          <Lock size={12} color={theme.color.text.inverseMuted} />
          <Text style={styles.secureText}>
            {Platform.OS === 'ios'
              ? 'Billed securely by Apple'
              : 'Billed securely by Google Play'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const GUTTER = theme.space.xl;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.hero },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.md,
  },
  headerTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.inverse,
  },
  close: {
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  closeText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverse,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingBottom: theme.space['4xl'],
    gap: theme.space.xl,
  },
  hero: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.display.fontSize,
    lineHeight: theme.type.display.lineHeight,
    letterSpacing: theme.type.display.letterSpacing,
    color: theme.color.text.inverse,
    marginTop: theme.space.md,
  },
  trialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(224,172,51,0.16)',
  },
  trialPillText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.progress.fillOnDark,
  },
  benefits: { gap: theme.space.md },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.lg },
  benefitTick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.color.status.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: theme.type.body.lineHeight,
    color: theme.color.text.inverseSecondary,
  },
  loader: { marginVertical: theme.space['3xl'] },
  errorBox: { gap: theme.space.md, alignItems: 'flex-start' },
  errorText: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverseSecondary,
  },
  retry: {
    paddingHorizontal: theme.space.xl,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  retryText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverse,
  },
  plans: { gap: theme.space.md },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    padding: theme.space.xl,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  planSelected: {
    backgroundColor: 'rgba(224,172,51,0.12)',
    borderColor: theme.color.progress.fillOnDark,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: theme.color.progress.fillOnDark },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.color.progress.fillOnDark,
  },
  planText: { flex: 1, minWidth: 0 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  planTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.inverse,
  },
  saveBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.status.success,
  },
  saveBadgeText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.inverse,
  },
  planMeta: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.inverseMuted,
    marginTop: 1,
  },
  planPrice: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.inverse,
    fontVariant: ['tabular-nums'],
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    minHeight: 54,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },
  fine: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    lineHeight: 15,
    color: theme.color.text.inverseMuted,
    textAlign: 'center',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  link: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.inverseSecondary,
    textDecorationLine: 'underline',
  },
  linkSep: { color: theme.color.text.inverseMuted },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
  },
  secureText: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.inverseMuted,
  },
});

export default PaywallScreen;
