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
}

export const ContinueCard: React.FC<ContinueCardProps> = ({
  item,
  onPress,
  fallbackImage,
  width = 208,
  showMeter = true,
}) => {
  const source: ImageSourcePropType | undefined = item.imageUrl
    ? { uri: item.imageUrl }
    : fallbackImage;

  const withMeter = showMeter && !item.locked;

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
      <View style={styles.thumbWrap}>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    overflow: 'hidden',
    ...theme.shadow.sm,
  },
  thumbWrap: {
    height: 104,
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
