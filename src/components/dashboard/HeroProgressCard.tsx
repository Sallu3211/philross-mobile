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
    <StatusChip label={planLabel} tone={planTone} icon={planIcon} onDark />

    {/* Row one: the words, and the ring beside them. Only these two compete
        for width, and the text is free to wrap into the height it needs. */}
    <View style={styles.headRow}>
      <View style={styles.headText}>
        <Text style={styles.title} numberOfLines={2}>
          Your progress
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.ringSlot}>
        <ProgressRing
          progress={loading ? 0 : progress}
          size={RING}
          strokeWidth={8}
          color={theme.color.progress.fillOnDark}
          trackColor={theme.color.progress.trackOnDark}
          label={loading ? '—' : `${exactPercent(progress)}%`}
          labelColor={theme.color.text.inverse}
          labelSize={theme.scale.font(20)}
          caption="complete"
          captionColor={theme.color.text.inverseMuted}
        />
      </View>
    </View>

    {/* Row two: the figures get the full card width to themselves.
        They used to share a column with the title and the ring, so on a
        narrower phone they were the first thing squeezed — which is how the
        labels went missing. Nothing can crowd them here. */}
    <View style={styles.figures}>
      <View style={styles.fig}>
        <Text style={styles.figValue} allowFontScaling={false}>
          {loading ? '—' : completedCount}
        </Text>
        <Text style={styles.figLabel} numberOfLines={1}>
          Tutorials done
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.fig}>
        <Text style={styles.figValue} allowFontScaling={false}>
          {loading ? '—' : Math.max(totalCount - completedCount, 0)}
        </Text>
        <Text style={styles.figLabel} numberOfLines={1}>
          Remaining
        </Text>
      </View>
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
  /**
   * A column, not a row.
   *
   * Everything used to sit in one horizontal line: chip, title, subtitle and
   * both figures crammed into a flexible column, with a fixed-width ring beside
   * them. On a narrower phone with larger type the figures were the first thing
   * squeezed, and their labels were pushed out of the card entirely.
   *
   * Stacking removes the competition. Only the title and the ring share a row
   * now, and the figures get the full card width to themselves, so there is no
   * width at which the labels can be crowded out.
   *
   * Padding is even on all four sides so the content sits inside a clear
   * margin rather than against the card edge.
   */
  card: {
    padding: theme.space.xl,
    borderRadius: theme.radius['2xl'],
    gap: theme.space.lg,
    ...theme.shadow.lg,
  },

  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
  },
  headText: { flex: 1, minWidth: 0 },
  /** Fixed and unshrinkable — if the row runs short it is the text that gives. */
  ringSlot: { width: RING, flexShrink: 0, flexGrow: 0 },

  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.inverse,
  },
  subtitle: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight + 3,
    color: theme.color.text.inverseSecondary,
    marginTop: theme.space.xs,
  },

  /** Its own band, separated by a hairline, sharing the full card width. */
  figures: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.space.lg,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.onDark,
  },
  fig: { flex: 1, minWidth: 0 },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: theme.color.border.onDark,
    marginHorizontal: theme.space.lg,
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
