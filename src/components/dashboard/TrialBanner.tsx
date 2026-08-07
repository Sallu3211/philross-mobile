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
  { glyph: string; title: (d: number) => string; body: string; cta: string }
> = {
  available: {
    glyph: '🎁',
    title: () => 'Your first week is on us',
    body: 'Unlock every tutorial, course and live event free for 7 days.',
    cta: 'Start my free week',
  },
  active: {
    glyph: '⏳',
    title: d =>
      d <= 0
        ? 'Last day of your free week'
        : `${d} ${d === 1 ? 'day' : 'days'} left in your free week`,
    body: 'Full access to every tutorial, course and live event until then.',
    cta: 'See membership options',
  },
  expired: {
    glyph: '🔒',
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

  const elapsed = Math.min(
    Math.max(trialLengthDays - daysLeft, 0),
    trialLengthDays,
  );
  const elapsedPct = (elapsed / trialLengthDays) * 100;

  const expired = mode === 'expired';

  return (
    <View
      style={[
        styles.card,
        expired && styles.cardExpired,
        mode === 'available' && styles.cardAvailable,
      ]}
    >
      <View style={styles.headRow}>
        <Text style={styles.glyph} allowFontScaling={false}>
          {copy.glyph}
        </Text>
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
          height={6}
          color={theme.color.status.warning}
          trackColor={theme.color.status.warningSubtle}
          style={styles.meter}
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
    backgroundColor: theme.color.status.warningSubtle,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(194,133,26,0.28)',
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  cardAvailable: {
    backgroundColor: theme.color.status.successSubtle,
    borderColor: 'rgba(13,148,136,0.28)',
  },
  cardExpired: {
    backgroundColor: theme.color.brand.subtle,
    borderColor: theme.color.brand.border,
  },
  headRow: {
    flexDirection: 'row',
    gap: theme.space.md,
  },
  glyph: {
    fontSize: 20,
    marginTop: 1,
  },
  headText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.body.fontSize,
    lineHeight: theme.type.body.lineHeight,
    color: theme.color.text.primary,
  },
  body: {
    fontFamily: theme.font.body,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight,
    color: theme.color.text.secondary,
  },
  meter: {
    marginTop: 2,
  },
  cta: {
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    paddingVertical: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.minTouch,
  },
  ctaText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.onBrand,
  },
});

export default TrialBanner;
