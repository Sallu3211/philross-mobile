/**
 * StatTile — one segment of the KPI group.
 *
 * Deliberately borderless and transparent: the three tiles sit inside a single
 * card in DashboardScreen, separated by hairline dividers. Three separate
 * bordered boxes read as three competing objects; one card with dividers reads
 * as one figure broken into parts, which is what these counts actually are.
 *
 * Within a segment the icon sits on the same line as the count, the pair
 * centred together, with the label centred underneath.
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
  /** Icon colour. The count and label always wear text tokens. */
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
      style={[styles.segment, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.valueRow}>
        {!!IconCmp && <IconCmp size={17} color={tint} />}
        <Text style={styles.value} allowFontScaling={false} numberOfLines={1}>
          {loading ? '—' : value}
        </Text>
      </View>

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </Container>
  );
};

const styles = StyleSheet.create({
  segment: {
    flex: 1,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.sm,
  },
  /** Icon and count sit on one baseline, centred together as a unit. */
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
  },
  value: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
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
