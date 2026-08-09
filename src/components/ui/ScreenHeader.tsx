/**
 * ScreenHeader — one header for every list screen.
 *
 * Screens previously each drew their own bar, so the hamburger, title size and
 * spacing drifted from page to page. This is the single implementation.
 *
 * Pass `onMenu` for a drawer screen, `onBack` for a pushed one. Passing both
 * is a mistake; menu wins.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { ChevronRight, Menu } from './icons';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onMenu?: () => void;
  onBack?: () => void;
  /** Rendered on the right — a filter button, an avatar, anything. */
  right?: React.ReactNode;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onMenu,
  onBack,
  right,
  style,
}) => (
  <View style={[styles.header, style]}>
    {onMenu ? (
      <TouchableOpacity
        onPress={onMenu}
        style={styles.iconBtn}
        hitSlop={theme.hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Open menu"
      >
        <Menu size={20} color={theme.color.text.primary} />
      </TouchableOpacity>
    ) : onBack ? (
      <TouchableOpacity
        onPress={onBack}
        style={styles.iconBtn}
        hitSlop={theme.hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <View style={styles.backGlyph}>
          <ChevronRight size={18} color={theme.color.text.primary} />
        </View>
      </TouchableOpacity>
    ) : (
      <View style={styles.iconBtn} />
    )}

    <View style={styles.titleCol}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>

    <View style={styles.rightSlot}>{right}</View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingHorizontal: theme.space.screen,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.lg,
    backgroundColor: theme.color.surface.app,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  /** The chevron glyph points right; flip it for "back". */
  backGlyph: { transform: [{ scaleX: -1 }] },
  titleCol: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    lineHeight: theme.type.h2.lineHeight,
    letterSpacing: theme.type.h2.letterSpacing,
    color: theme.color.text.primary,
  },
  subtitle: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    marginTop: 1,
  },
  rightSlot: { minWidth: 40, alignItems: 'flex-end' },
});

export default ScreenHeader;
