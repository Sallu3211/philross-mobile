/**
 * MediaListCard — the row used by Courses, Products and Events.
 *
 * One card shape across all three list screens: artwork on the left, then a
 * title, a supporting line, and up to two meta chips. Optional price, progress
 * meter and lock scrim cover what each screen needs without three near-copies
 * of the same component.
 *
 * Locked items keep a lock glyph and the word "Locked" over the artwork, so
 * state never rests on dimming alone.
 */

import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';
import LinearMeter from './LinearMeter';
import { Lock, IconProps } from './icons';

export interface MediaMeta {
  icon?: React.FC<IconProps>;
  label: string;
}

export interface MediaListCardProps {
  title: string;
  /** Supporting line under the title — description, headline, instructor. */
  body?: string;
  imageUrl?: string | null;
  fallbackImage?: ImageSourcePropType;
  meta?: MediaMeta[];
  /** Formatted for display, e.g. "$399". */
  price?: string | null;
  /** 0–100. Omit to hide the meter. */
  progress?: number | null;
  locked?: boolean;
  /** Small pill over the artwork, e.g. "Premium". */
  badge?: string;
  /**
   * 'cover' crops to fill — right for wide editorial thumbnails.
   * 'contain' fits the whole image — right for product shots and book covers,
   * which are portrait and lose their tops when cropped.
   */
  imageFit?: 'cover' | 'contain';
  onPress: () => void;
  style?: ViewStyle;
}

export const MediaListCard: React.FC<MediaListCardProps> = ({
  title,
  body,
  imageUrl,
  fallbackImage,
  meta = [],
  price,
  progress,
  locked,
  badge,
  imageFit = 'cover',
  onPress,
  style,
}) => {
  const source: ImageSourcePropType | undefined = imageUrl
    ? { uri: imageUrl }
    : fallbackImage;

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${title}${locked ? '. Locked.' : ''}`}
    >
      <View
        style={[styles.thumbWrap, imageFit === 'contain' && styles.thumbWrapContain]}
      >
        {source ? (
          <Image source={source} style={styles.thumb} resizeMode={imageFit} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]} />
        )}

        {locked && (
          <View style={styles.scrim}>
            <View style={styles.lockPill}>
              <Lock size={11} color={theme.color.text.inverse} />
              <Text style={styles.lockText}>Locked</Text>
            </View>
          </View>
        )}

        {!locked && !!badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {!!body && (
          <Text style={styles.sub} numberOfLines={2}>
            {body}
          </Text>
        )}

        {meta.length > 0 && (
          <View style={styles.metaRow}>
            {meta.slice(0, 2).map(m => {
              const MetaIcon = m.icon;
              return (
                <View key={m.label} style={styles.meta}>
                  {!!MetaIcon && (
                    <MetaIcon size={11} color={theme.color.text.muted} />
                  )}
                  <Text style={styles.metaText} numberOfLines={1}>
                    {m.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {typeof progress === 'number' && progress > 0 && (
          <LinearMeter progress={progress} height={4} showValue style={styles.meter} />
        )}

        {!!price && (
          <Text style={styles.price} numberOfLines={1}>
            {price}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    overflow: 'hidden',
    // Flat, like the rest of the app — a border plus a shadow double-outlines.
  },
  thumbWrap: {
    width: 108,
    backgroundColor: theme.color.neutral[200],
  },
  /** White ground and padding so a contained image reads as product photography. */
  thumbWrapContain: {
    backgroundColor: theme.color.neutral[0],
    padding: theme.space.sm,
  },
  thumb: { width: '100%', height: '100%' },
  thumbEmpty: { backgroundColor: theme.color.neutral[200] },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.color.surface.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  lockText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },
  badge: {
    position: 'absolute',
    left: theme.space.sm,
    top: theme.space.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.brand.base,
  },
  badgeText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },

  body: {
    flex: 1,
    minWidth: 0,
    padding: theme.space.lg,
    gap: 3,
  },
  title: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    lineHeight: theme.type.body.lineHeight,
    letterSpacing: theme.type.body.letterSpacing,
    color: theme.color.text.primary,
  },
  sub: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 16,
    color: theme.color.text.muted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.md,
    marginTop: 2,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.muted,
    includeFontPadding: false,
  },
  meter: { marginTop: theme.space.sm },
  price: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
    marginTop: theme.space.xs,
  },
});

export default MediaListCard;
