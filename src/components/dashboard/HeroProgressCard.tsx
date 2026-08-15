/**
 * HeroProgressCard — the one figure the dashboard leads with.
 *
 * A dark card carrying the overall programme-completion meter. Dark surface is
 * deliberate: it lets the amber meter and brand red read as accents instead of
 * shouting, and it separates "your status" from the lighter sections below.
 *
 * The meter fills amber rather than brand red — red beside a completion number
 * reads as an error state, when the number is meant to feel like an achievement.
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';
import { exactPercent } from '../../utils/percent';
import ProgressRing from '../ui/ProgressRing';
import StatusChip, { StatusTone } from '../ui/StatusChip';
import { IconProps } from '../ui/icons';

/**
 * Ring size, taken from the real screen rather than a fixed 96.
 *
 * A ring is only worth the room it leaves the text beside it. At 24% of the
 * screen it stays the same proportion of the card on an SE and on a Pro Max,
 * and the bounds stop it collapsing on the narrowest phone or eating the
 * card on the widest.
 */
const RING = Math.round(
  Math.min(Math.max(Dimensions.get('window').width * 0.24, 76), 92),
);


export interface HeroProgressCardProps {
  /** 0–100 overall completion. */
  progress: number;
  /** e.g. "Free week · 5 days left" or "Premium member". */
  planLabel: string;
  planTone?: StatusTone;
  planIcon?: React.FC<IconProps>;
  completedCount: number;
  totalCount: number;
  subtitle?: string;
  loading?: boolean;
}

export const HeroProgressCard: React.FC<HeroProgressCardProps> = ({
  progress,
  planLabel,
  planTone = 'brand',
  planIcon,
  completedCount,
  totalCount,
  subtitle,
  loading = false,
}) => (
  <LinearGradient
    colors={[theme.color.surface.heroRaised, theme.color.surface.hero]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.card}
  >
    <View style={styles.left}>
      <StatusChip label={planLabel} tone={planTone} icon={planIcon} onDark />

      <Text style={styles.title} numberOfLines={1}>
        Your progress
      </Text>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      )}

      <View style={styles.figures}>
        <View style={styles.fig}>
          <Text style={styles.figValue} allowFontScaling={false}>
            {loading ? '—' : completedCount}
          </Text>
          <Text style={styles.figLabel} numberOfLines={1}>
            Done
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.fig}>
          <Text style={styles.figValue} allowFontScaling={false}>
            {loading ? '—' : Math.max(totalCount - completedCount, 0)}
          </Text>
          <Text style={styles.figLabel} numberOfLines={1}>
            Left
          </Text>
        </View>
      </View>
    </View>

    {/* Fixed column that never shrinks. The ring is drawn at an exact pixel
        size, so if the row runs out of room it is the text that must give,
        not the ring — the alternative is the half-circle the card was
        showing on wider iPhones. */}
    <View style={styles.ringSlot}>
      <ProgressRing
        progress={loading ? 0 : progress}
        size={RING}
        strokeWidth={8}
        color={theme.color.progress.fillOnDark}
        trackColor={theme.color.progress.trackOnDark}
        label={loading ? '—' : `${exactPercent(progress)}%`}
        labelColor={theme.color.text.inverse}
        labelSize={theme.scale.font(21)}
        caption="complete"
        captionColor={theme.color.text.inverseMuted}
      />
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  /**
   * No `overflow: hidden`.
   *
   * It used to be here to stop the text column pushing the ring past the card
   * edge — but clipping is not a fix, it is a way of not seeing the problem.
   * On wider iPhones, where the type scale is larger, it cut the ring in half
   * and swallowed the figure labels entirely.
   *
   * The layout now guarantees the fit instead: the ring sits in a column that
   * cannot shrink, the text column takes whatever is left and truncates, and
   * every label is single-line. Nothing needs to be hidden because nothing
   * overflows.
   */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.space.lg,
    paddingLeft: theme.space.xl,
    borderRadius: theme.radius['2xl'],
    gap: theme.space.md,
    ...theme.shadow.lg,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  ringSlot: { width: RING, flexShrink: 0, flexGrow: 0 },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.inverse,
    marginTop: theme.space.md,
  },
  subtitle: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.color.text.inverseSecondary,
    marginTop: 2,
  },
  figures: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.space.lg,
  },
  fig: {
    // Was a 62pt minimum, which forced the row wider than the column on small
    // screens and pushed the labels out of the card.
    flexShrink: 1,
    paddingRight: theme.space.md,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.color.border.onDark,
    marginRight: theme.space.md,
  },
  figValue: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    lineHeight: theme.type.h2.lineHeight,
    color: theme.color.text.inverse,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
  figLabel: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.inverseMuted,
    marginTop: 1,
    includeFontPadding: false,
  },
});

export default HeroProgressCard;
