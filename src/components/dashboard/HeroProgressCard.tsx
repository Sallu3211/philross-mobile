/**
 * HeroProgressCard — the one figure the dashboard leads with.
 *
 * A dark card carrying the overall programme-completion meter. Dark surface is
 * deliberate: it lets the brand red read as an accent instead of shouting, and
 * it visually separates "your status" from the lighter content sections below.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';
import ProgressRing from '../ui/ProgressRing';
import StatusChip, { StatusTone } from '../ui/StatusChip';

export interface HeroProgressCardProps {
  /** 0–100 overall completion. */
  progress: number;
  /** e.g. "Trial · 5 days left" or "Premium member". */
  planLabel: string;
  planTone?: StatusTone;
  /** Left-hand supporting figures. */
  completedCount: number;
  totalCount: number;
  /** Short encouragement line under the title. */
  subtitle?: string;
  loading?: boolean;
}

export const HeroProgressCard: React.FC<HeroProgressCardProps> = ({
  progress,
  planLabel,
  planTone = 'brand',
  completedCount,
  totalCount,
  subtitle,
  loading = false,
}) => {
  return (
    <LinearGradient
      colors={[theme.color.surface.heroRaised, theme.color.surface.hero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.left}>
        <StatusChip label={planLabel} tone={planTone} onDark />

        <Text style={styles.title}>Your progress</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

        <View style={styles.figures}>
          <View>
            <Text style={styles.figureValue} allowFontScaling={false}>
              {loading ? '—' : completedCount}
            </Text>
            <Text style={styles.figureLabel}>Completed</Text>
          </View>
          <View style={styles.divider} />
          <View>
            <Text style={styles.figureValue} allowFontScaling={false}>
              {loading ? '—' : Math.max(totalCount - completedCount, 0)}
            </Text>
            <Text style={styles.figureLabel}>Remaining</Text>
          </View>
        </View>
      </View>

      <ProgressRing
        progress={loading ? 0 : progress}
        size={116}
        strokeWidth={11}
        color="#DC5A5A"
        trackColor="rgba(255,255,255,0.13)"
        label={loading ? '—' : `${Math.round(progress)}%`}
        labelColor={theme.color.text.inverse}
        labelSize={26}
        caption="complete"
        captionColor={theme.color.text.inverseMuted}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.space.xl,
    borderRadius: theme.radius['2xl'],
    gap: theme.space.lg,
    ...theme.shadow.lg,
  },
  left: {
    flex: 1,
    gap: theme.space.sm,
  },
  title: {
    fontFamily: theme.font.heading,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.inverse,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: theme.font.body,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight,
    color: theme.color.text.inverseSecondary,
  },
  figures: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    marginTop: theme.space.md,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: theme.color.border.onDark,
  },
  figureValue: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },
  figureLabel: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.inverseMuted,
    marginTop: 1,
  },
});

export default HeroProgressCard;
