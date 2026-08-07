/**
 * QuickActions — the dashboard's navigation grid.
 *
 * Replaces the old "everything lives in the burger menu" pattern: the six things
 * a member actually does are one tap from the home screen.
 *
 * Widths are computed from the container rather than set as percentages, so the
 * three columns land on exact pixels and the grid stays aligned on any screen
 * size. Percentage widths plus a gap leave a ragged right edge.
 */

import React from 'react';
import {
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';
import { IconProps } from '../ui/icons';

export interface QuickAction {
  key: string;
  label: string;
  icon: React.FC<IconProps>;
  tint: string;
  tintBg: string;
  /** Small count/state badge, e.g. "2 active". */
  badge?: string;
  onPress: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  columns?: number;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  columns = 3,
}) => {
  const [tileWidth, setTileWidth] = React.useState<number | null>(null);
  const gap = theme.space.md;

  const onLayout = (e: LayoutChangeEvent) => {
    const total = e.nativeEvent.layout.width;
    // Exact pixel width per column, so the last column ends flush with the edge.
    setTileWidth((total - gap * (columns - 1)) / columns);
  };

  return (
    <View style={[styles.grid, { gap }]} onLayout={onLayout}>
      {actions.map(action => {
        const IconCmp = action.icon;
        return (
          <TouchableOpacity
            key={action.key}
            style={[styles.tile, tileWidth ? { width: tileWidth } : styles.tileFallback]}
            activeOpacity={0.85}
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            {/* Solid badge with a white knockout glyph — a filled shape holds
                its weight at 19px far better than a tinted outline. */}
            <View style={[styles.badge, { backgroundColor: action.tint }]}>
              <IconCmp size={19} color={theme.color.text.inverse} />
            </View>

            <Text style={styles.label} numberOfLines={1}>
              {action.label}
            </Text>

            <Text style={styles.count} numberOfLines={1}>
              {action.badge ?? ' '}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.sm,
    alignItems: 'center',
    // Flat: no border AND no elevation. Android's elevation shadow hugs the
    // rounded edge so tightly that against the off-white page it reads as a
    // second outline just inside the first — the "double border" effect. A
    // plain white fill on the off-white page separates the tile on its own.
  },
  tileFallback: {
    flexGrow: 1,
    flexBasis: '30%',
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.md,
    // No elevation here either — a shadow on a small solid disc inside an
    // already-elevated tile was the second source of doubled edges.
  },
  label: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.primary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  count: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    lineHeight: theme.type.overline.lineHeight,
    color: theme.color.text.muted,
    textAlign: 'center',
    marginTop: 2,
    includeFontPadding: false,
  },
});

export default QuickActions;
