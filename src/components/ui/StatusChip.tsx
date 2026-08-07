/**
 * StatusChip — a small state pill.
 *
 * Status is NEVER communicated by colour alone: every chip renders an icon and
 * a text label alongside the colour, so it survives colour-vision deficiency,
 * greyscale printing and forced-colors mode.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { IconProps } from './icons';

export type StatusTone = 'brand' | 'success' | 'warning' | 'info' | 'locked' | 'neutral';

const TONES: Record<StatusTone, { fg: string; bg: string; onDarkFg: string }> = {
  brand: {
    fg: theme.color.brand.base,
    bg: theme.color.brand.subtle,
    onDarkFg: '#DC5A5A',
  },
  success: {
    fg: theme.color.status.success,
    bg: theme.color.status.successSubtle,
    onDarkFg: theme.color.status.successOnDark,
  },
  warning: {
    fg: theme.color.status.warning,
    bg: theme.color.status.warningSubtle,
    onDarkFg: '#E0AC33',
  },
  info: {
    fg: theme.color.status.info,
    bg: theme.color.status.infoSubtle,
    onDarkFg: theme.color.status.infoOnDark,
  },
  locked: {
    fg: theme.color.neutral[600],
    bg: theme.color.status.lockedSubtle,
    onDarkFg: theme.color.text.inverseSecondary,
  },
  neutral: {
    fg: theme.color.text.secondary,
    bg: theme.color.neutral[100],
    onDarkFg: theme.color.text.inverseSecondary,
  },
};

export interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  /** Icon component from `./icons`. Rendered at 13px in the chip's colour. */
  icon?: React.FC<IconProps>;
  /** Render for placement on the dark hero surface. */
  onDark?: boolean;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  tone = 'neutral',
  icon: IconCmp,
  onDark = false,
  style,
}) => {
  const t = TONES[tone];
  const fg = onDark ? t.onDarkFg : t.fg;
  const bg = onDark ? 'rgba(255,255,255,0.10)' : t.bg;

  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {!!IconCmp && <IconCmp size={13} color={fg} weight={2} />}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  label: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
});

export default StatusChip;
