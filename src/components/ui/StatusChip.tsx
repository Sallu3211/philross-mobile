/**
 * StatusChip — a small state pill.
 *
 * Status is NEVER communicated by colour alone: every chip renders a glyph and
 * a text label alongside the colour, so it survives colour-vision deficiency,
 * greyscale printing and forced-colors mode.
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

export type StatusTone = 'brand' | 'success' | 'warning' | 'info' | 'locked' | 'neutral';

const TONES: Record<StatusTone, { fg: string; bg: string; glyph: string }> = {
  brand: {
    fg: theme.color.brand.base,
    bg: theme.color.brand.subtle,
    glyph: '●',
  },
  success: {
    fg: theme.color.status.success,
    bg: theme.color.status.successSubtle,
    glyph: '✓',
  },
  warning: {
    fg: theme.color.status.warning,
    bg: theme.color.status.warningSubtle,
    glyph: '!',
  },
  info: {
    fg: theme.color.status.info,
    bg: theme.color.status.infoSubtle,
    glyph: 'i',
  },
  locked: {
    fg: theme.color.neutral[600],
    bg: theme.color.status.lockedSubtle,
    glyph: '🔒',
  },
  neutral: {
    fg: theme.color.text.secondary,
    bg: theme.color.neutral[100],
    glyph: '',
  },
};

export interface StatusChipProps {
  label: string;
  tone?: StatusTone;
  /** Override the default glyph (e.g. pass an emoji or a short symbol). */
  glyph?: string | null;
  /** Render for placement on the dark hero surface. */
  onDark?: boolean;
  style?: ViewStyle;
}

export const StatusChip: React.FC<StatusChipProps> = ({
  label,
  tone = 'neutral',
  glyph,
  onDark = false,
  style,
}) => {
  const t = TONES[tone];

  const fg = onDark ? onDarkFg(tone) : t.fg;
  const bg = onDark ? 'rgba(255,255,255,0.10)' : t.bg;
  const resolvedGlyph = glyph === null ? '' : glyph ?? t.glyph;

  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {!!resolvedGlyph && (
        <Text style={[styles.glyph, { color: fg }]} allowFontScaling={false}>
          {resolvedGlyph}
        </Text>
      )}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
};

/** Lighter steps validated against the #1A1A19 hero surface. */
function onDarkFg(tone: StatusTone): string {
  switch (tone) {
    case 'brand':
      return '#DC5A5A';
    case 'success':
      return theme.color.status.successOnDark;
    case 'warning':
      return theme.color.status.warningOnDark;
    case 'info':
      return theme.color.status.infoOnDark;
    default:
      return theme.color.text.inverseSecondary;
  }
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  glyph: {
    fontSize: 11,
    fontFamily: theme.font.bold,
    includeFontPadding: false,
  },
  label: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
});

export default StatusChip;
