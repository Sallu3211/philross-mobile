/**
 * StatTile — a single headline number.
 *
 * A stat tile, not a one-bar bar chart: when the data is one current value the
 * right form is the number itself, set large, with a quiet label under it.
 * Three of these form the dashboard's KPI row.
 *
 * Fixed internal geometry (icon badge, then value, then label) so three tiles
 * side by side align on every row regardless of label length.
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
import { IconProps } from '../ui/icons';

export interface StatTileProps {
  value: string | number;
  label: string;
  icon?: React.FC<IconProps>;
  /** Solid fill for the icon badge. Text always stays in text tokens. */
  tint?: string;
  onPress?: () => void;
  loading?: boolean;
  style?: ViewStyle;
}

export const StatTile: React.FC<StatTileProps> = ({
  value,
  label,
  icon: IconCmp,
  tint = theme.color.brand.base,
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
      {!!IconCmp && (
        <View style={[styles.badge, { backgroundColor: tint }]}>
          <IconCmp size={16} color={theme.color.text.inverse} />
        </View>
      )}
      <Text style={styles.value} allowFontScaling={false} numberOfLines={1}>
        {loading ? '—' : value}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  /** Centred stack: icon, then the number, then the label. */
  tile: {
    flex: 1,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    paddingVertical: theme.space.xl,
    paddingHorizontal: theme.space.sm,
    alignItems: 'center',
    ...theme.shadow.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.md,
    ...theme.shadow.sm,
  },
  value: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.display.fontSize,
    lineHeight: theme.type.display.lineHeight,
    letterSpacing: theme.type.display.letterSpacing,
    color: theme.color.text.primary,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textAlign: 'center',
  },
  label: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.color.text.muted,
    marginTop: 2,
    textAlign: 'center',
  },
});

export default StatTile;
