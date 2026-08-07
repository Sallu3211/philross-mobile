/**
 * ContinueCard — a resumable tutorial/course tile with its own progress meter.
 *
 * Locked items keep their thumbnail but gain a scrim, a lock icon and the word
 * "Locked": the state is never carried by colour or dimming alone.
 *
 * The body is a fixed height so cards in a horizontal rail line up along their
 * meters even when one title wraps to two lines and another does not.
 */

import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';
import LinearMeter from '../ui/LinearMeter';
import { Lock, Play } from '../ui/icons';

export interface ContinueItem {
  id: string | number;
  /** Required by both CourseDetails and FeedDetails, which route by slug. */
  slug?: string;
  title: string;
  /** e.g. "Course · Strength" */
  meta?: string;
  /** 0–100 */
  progress: number;
  imageUrl?: string | null;
  locked?: boolean;
}

export interface ContinueCardProps {
  item: ContinueItem;
  onPress: (item: ContinueItem) => void;
  fallbackImage?: ImageSourcePropType;
  width?: number;
  /** Hide the meter for discovery rails where nothing has been started. */
  showMeter?: boolean;
  /**
   * Artwork only — no title, meta or meter. Used by the "Fresh from Phil" rail,
   * where the thumbnails are the content and stacked text made each tile tall
   * and busy. Lock and play affordances still render over the image.
   */
  mediaOnly?: boolean;
  height?: number;
}

export const ContinueCard: React.FC<ContinueCardProps> = ({
  item,
  onPress,
  fallbackImage,
  width = 208,
  showMeter = true,
  mediaOnly = false,
  height,
}) => {
  const source: ImageSourcePropType | undefined = item.imageUrl
    ? { uri: item.imageUrl }
    : fallbackImage;

  const withMeter = showMeter && !mediaOnly && !item.locked;
  const thumbHeight = height ?? (mediaOnly ? 116 : 104);

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      activeOpacity={0.88}
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${
        item.locked ? 'Locked.' : `${Math.round(item.progress)} percent complete.`
      }`}
    >
      <View style={[styles.thumbWrap, { height: thumbHeight }]}>
        {source ? (
          <Image source={source} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]} />
        )}

        {item.locked ? (
          <View style={styles.scrim}>
            <View style={styles.lockPill}>
              <Lock size={12} color={theme.color.text.inverse} weight={2.1} />
              <Text style={styles.lockText}>Locked</Text>
            </View>
          </View>
        ) : (
          <View style={styles.playPill}>
            <Play size={12} color={theme.color.text.inverse} />
          </View>
        )}
      </View>

      {!mediaOnly && (
        <View style={[styles.body, withMeter && styles.bodyWithMeter]}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          {!!item.meta && (
            <Text style={styles.meta} numberOfLines={1}>
              {item.meta}
            </Text>
          )}

          {withMeter && (
            <LinearMeter progress={item.progress} height={4} showValue style={styles.meter} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    overflow: 'hidden',
    // Flat, like the Explore grid: no border and no elevation. Android's
    // elevation shadow tracks the rounded corner so closely that it reads as a
    // second outline just inside the real one.
  },
  thumbWrap: {
    backgroundColor: theme.color.neutral[200],
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbEmpty: {
    backgroundColor: theme.color.neutral[200],
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.color.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  lockText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },
  playPill: {
    position: 'absolute',
    right: theme.space.md,
    bottom: theme.space.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  body: {
    padding: theme.space.lg,
    // Fixed heights keep titles, metas and meters aligned across the rail.
    height: 76,
  },
  bodyWithMeter: {
    height: 96,
  },
  title: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight,
    letterSpacing: theme.type.bodySm.letterSpacing,
    color: theme.color.text.primary,
  },
  meta: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    marginTop: 1,
  },
  meter: {
    marginTop: 'auto',
  },
});

export default ContinueCard;
