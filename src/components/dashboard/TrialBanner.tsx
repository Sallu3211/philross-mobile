/**
 * TrialBanner — free-week status and conversion prompt.
 *
 * Three distinct states, because they are three different sales moments:
 *   'available' — never trialled. Invite them to start the free week.
 *   'active'    — inside the free week. Count it down; the urgency is the point.
 *   'expired'   — trialled and did not convert. Ask for the subscription.
 *
 * Getting this wrong is user-visible: telling a brand-new member their free
 * week "has ended" when they never started one reads as a bug and kills trust.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';
import LinearMeter from '../ui/LinearMeter';
import { Clock, Gift, Lock, IconProps } from '../ui/icons';

export type TrialMode = 'available' | 'active' | 'expired';

export interface TrialBannerProps {
  mode: TrialMode;
  /** Whole days still remaining. Only meaningful when mode is 'active'. */
  daysLeft?: number;
  /** Total length of the trial in days (7 for the free week). */
  trialLengthDays?: number;
  onPressCta: () => void;
}

const COPY: Record<
  TrialMode,
  {
    icon: React.FC<IconProps>;
    tint: string;
    title: (d: number) => string;
    body: string;
    cta: string;
  }
> = {
  available: {
    icon: Gift,
    tint: theme.color.status.success,
    title: () => 'Your first week is on us',
    body: 'Unlock every tutorial, course and live event free for 7 days.',
    cta: 'Start my free week',
  },
  active: {
    icon: Clock,
    tint: theme.color.accent.base,
    title: d =>
      d <= 0
        ? 'Last day of your free week'
        : `${d} ${d === 1 ? 'day' : 'days'} left in your free week`,
    body: 'Full access to every tutorial, course and live event until then.',
    cta: 'See membership options',
  },
  expired: {
    icon: Lock,
    tint: theme.color.brand.base,
    title: () => 'Your free week has ended',
    body: 'Subscribe to get your training, courses and certificates back.',
    cta: 'Reactivate access',
  },
};

export const TrialBanner: React.FC<TrialBannerProps> = ({
  mode,
  daysLeft = 0,
  trialLengthDays = 7,
  onPressCta,
}) => {
  const copy = COPY[mode];
  const IconCmp = copy.icon;

  const elapsed = Math.min(
    Math.max(trialLengthDays - daysLeft, 0),
    trialLengthDays,
  );
  const elapsedPct = (elapsed / trialLengthDays) * 100;

  return (
    <View
      style={[
        styles.card,
        mode === 'expired' && styles.cardExpired,
        mode === 'available' && styles.cardAvailable,
      ]}
    >
      <View style={styles.headRow}>
        <View style={styles.iconWrap}>
          <IconCmp size={17} color={copy.tint} weight={1.9} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title} numberOfLines={2}>
            {copy.title(daysLeft)}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {copy.body}
          </Text>
        </View>
      </View>

      {/* The countdown meter only means anything while the clock is running. */}
      {mode === 'active' && (
        <LinearMeter
          progress={elapsedPct}
          height={5}
          color={theme.color.accent.base}
          trackColor="rgba(255,255,255,0.65)"
        />
      )}

      <TouchableOpacity
        style={styles.cta}
        onPress={onPressCta}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>{copy.cta}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.accent.subtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.color.accent.border,
    padding: theme.space.lg,
    gap: theme.space.lg,
  },
  cardAvailable: {
    backgroundColor: theme.color.status.successSubtle,
    borderColor: 'rgba(13,148,136,0.26)',
  },
  cardExpired: {
    backgroundColor: theme.color.brand.subtle,
    borderColor: theme.color.brand.border,
  },
  headRow: {
    flexDirection: 'row',
    gap: theme.space.lg,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Translucent white lifts the icon off whichever tint the card is wearing.
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    lineHeight: theme.type.body.lineHeight,
    letterSpacing: theme.type.body.letterSpacing,
    color: theme.color.text.primary,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight,
    color: theme.color.text.secondary,
  },
  cta: {
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.minTouch,
  },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    letterSpacing: 0.1,
    color: theme.color.text.onBrand,
  },
});

export default TrialBanner;
