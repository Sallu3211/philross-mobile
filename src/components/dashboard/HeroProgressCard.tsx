/**
 * HeroProgressCard — the one figure the dashboard leads with.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY THIS IS BUILT THE WAY IT IS
 *
 * This card kept clipping its own progress ring on iPhone, through several
 * attempts. The cause was structural, not a matter of tuning numbers.
 *
 * The whole card used to BE a <LinearGradient>. Every bit of layout — the
 * padding, the flex row, the fixed ring column — hung off a third-party
 * native component, and native components do not honour layout props
 * identically on both platforms. On Android it looked right; on iOS the ring
 * ended up outside the painted area.
 *
 * So the gradient is now decoration and nothing else: an absolutely
 * positioned fill behind the content. The card itself is a plain <View>, and
 * every child lays out inside a plain <View> with ordinary padding. React
 * Native's own layout engine decides everything, which it does identically on
 * both platforms.
 *
 * The second rule: the ring can never be pushed out, because it is not in a
 * flexible row at all. It sits in a fixed-width column and the text column
 * takes what is left. If space runs short the text wraps or truncates — the
 * ring's size is not negotiable.
 *
 * The third: the figures own a full-width band of their own below a hairline.
 * They used to share a column with the title and the ring, so they were the
 * first thing squeezed and their labels went missing.
 * ─────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../../theme';
import { exactPercent } from '../../utils/percent';
import ProgressRing from '../ui/ProgressRing';
import StatusChip, { StatusTone } from '../ui/StatusChip';
import { IconProps } from '../ui/icons';

const SCREEN_W = Dimensions.get('window').width;

/**
 * Every width this card has to survive, computed once and openly.
 *
 * Written out rather than left implicit so the ring can be sized from what is
 * actually available instead of a guess. `available` is the room the ring and
 * the text share; the ring takes a fifth of it and the text keeps the rest.
 */
const CARD_PAD = theme.space.xl; //          16 each side
const GAP = theme.space.lg; //               12 between text and ring
const CARD_W = SCREEN_W - theme.space.screen * 2;
const CONTENT_W = CARD_W - CARD_PAD * 2;
const AVAILABLE = CONTENT_W - GAP;

/**
 * A quarter of the row, floored at 68 and capped at 88, and never more than
 * 40% of what is available. The last clause is the one that matters: it makes
 * the ring a function of the actual space rather than of the screen, so there
 * is no width at which it can crowd the text out or spill past the padding.
 */
const RING = Math.floor(
  Math.max(68, Math.min(88, AVAILABLE * 0.25, AVAILABLE * 0.4)),
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
  <View style={styles.card}>
    {/* Background only. It paints; it does not lay anything out. */}
    <LinearGradient
      colors={[theme.color.surface.heroRaised, theme.color.surface.hero]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />

    <View style={styles.inner}>
      <View style={styles.chipRow}>
        <StatusChip label={planLabel} tone={planTone} icon={planIcon} onDark />
      </View>

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
            strokeWidth={7}
            color={theme.color.progress.fillOnDark}
            trackColor={theme.color.progress.trackOnDark}
            label={loading ? '—' : `${exactPercent(progress)}%`}
            labelColor={theme.color.text.inverse}
            labelSize={theme.scale.font(19)}
            caption="complete"
            captionColor={theme.color.text.inverseMuted}
          />
        </View>
      </View>

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
    </View>
  </View>
);

const styles = StyleSheet.create({
  /**
   * A plain View. `overflow: hidden` here clips only the gradient to the
   * rounded corners — the content cannot reach it, because the inner View
   * holds the padding and every child is laid out inside that.
   */
  card: {
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
    backgroundColor: theme.color.surface.hero,
    ...theme.shadow.lg,
  },
  inner: { padding: CARD_PAD },

  chipRow: { flexDirection: 'row', marginBottom: theme.space.lg },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  /** Takes whatever the ring leaves. minWidth:0 lets it actually truncate. */
  headText: { flex: 1, minWidth: 0 },
  /** Fixed, unshrinkable, ungrowable. The ring's size is not negotiable. */
  ringSlot: { width: RING, height: RING, flexShrink: 0, flexGrow: 0 },

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

  /** Their own band, full width, below a hairline. Nothing can crowd them. */
  figures: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.space.lg,
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
    marginTop: 2,
    includeFontPadding: false,
  },
});

export default HeroProgressCard;
