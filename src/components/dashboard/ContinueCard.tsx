/**
 * ContinueCard — a resumable tutorial/course tile with its own progress meter.
 *
 * Locked items keep their thumbnail but gain a scrim, a lock glyph and the word
 * "Locked": the state is never carried by colour or dimming alone.
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

export interface ContinueItem {
  id: string | number;
  title: string;
  /** e.g. "Course · Lesson 3 of 12" */
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
}

export const ContinueCard: React.FC<ContinueCardProps> = ({
  item,
  onPress,
  fallbackImage,
  width = 232,
}) => {
  const source: ImageSourcePropType | undefined = item.imageUrl
    ? { uri: item.imageUrl }
    : fallbackImage;

  const started = item.progress > 0;

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

        {item.locked && (
          <View style={styles.scrim}>
            <View style={styles.lockPill}>
              <Text style={styles.lockGlyph} allowFontScaling={false}>
                🔒
              </Text>
              <Text style={styles.lockText}>Locked</Text>
            </View>
          </View>
        )}

        {!item.locked && started && (
          <View style={styles.playPill}>
            <Text style={styles.playGlyph} allowFontScaling={false}>
              ▶
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {!!item.meta && (
          <Text style={styles.meta} numberOfLines={1}>
            {item.meta}
          </Text>
        )}

        {!item.locked && (
          <LinearMeter
            progress={item.progress}
            height={5}
            showValue
            style={styles.meter}
          />
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
    height: 118,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  lockGlyph: {
    fontSize: 11,
  },
  lockText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.inverse,
  },
  playPill: {
    position: 'absolute',
    right: theme.space.sm,
    bottom: theme.space.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    fontSize: 11,
    color: theme.color.text.inverse,
    marginLeft: 2,
  },
  body: {
    padding: theme.space.md,
    gap: 3,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight,
    color: theme.color.text.primary,
  },
  meta: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
  meter: {
    marginTop: theme.space.sm,
  },
});

export default ContinueCard;
