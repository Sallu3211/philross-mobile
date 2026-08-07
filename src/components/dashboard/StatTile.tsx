/**
 * StatTile — a single headline number.
 *
 * A stat tile, not a one-bar bar chart: when the data is one current value the
 * right form is the number itself, set large, with a quiet label under it.
 * Three of these form the dashboard's KPI row.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';

export interface StatTileProps {
  value: string | number;
  label: string;
  /** Optional small glyph shown above the value. */
  glyph?: string;
  /** Tint for the glyph badge. Text always stays in text tokens. */
  tint?: string;
  tintBg?: string;
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  glyph,
  tint = theme.color.brand.base,
  tintBg = theme.color.brand.subtle,
  onPress,
  loading = false,
  style,
}) => {
  const Container: any = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.tile, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      {!!glyph && (
        <View style={[styles.badge, { backgroundColor: tintBg }]}>
          <Text style={[styles.glyph, { color: tint }]} allowFontScaling={false}>
            {glyph}
          </Text>
        </View>
      )}
      <Text style={styles.value} allowFontScaling={false} numberOfLines={1}>
        {loading ? '—' : value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.md,
    gap: 2,
    ...theme.shadow.sm,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.sm,
  },
  glyph: {
    fontSize: 14,
    includeFontPadding: false,
  },
  value: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    includeFontPadding: false,
  },
  label: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.color.text.muted,
  },
});

export default StatTile;
