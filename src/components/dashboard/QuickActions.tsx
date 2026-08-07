/**
 * QuickActions — the dashboard's navigation grid.
 *
 * Replaces the old "everything lives in the burger menu" pattern: the six things
 * a member actually does are one tap from the home screen.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

export interface QuickAction {
  key: string;
  label: string;
  glyph: string;
  tint: string;
  tintBg: string;
  /** Small count/state badge, e.g. "3 new". */
  badge?: string;
  onPress: () => void;
}

export interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => (
  <View style={styles.grid}>
    {actions.map(action => (
      <TouchableOpacity
        key={action.key}
        style={styles.tile}
        activeOpacity={0.85}
        onPress={action.onPress}
        accessibilityRole="button"
        accessibilityLabel={action.label}
      >
        <View style={[styles.badge, { backgroundColor: action.tintBg }]}>
          <Text style={[styles.glyph, { color: action.tint }]} allowFontScaling={false}>
            {action.glyph}
          </Text>
        </View>

        <Text style={styles.label} numberOfLines={1}>
          {action.label}
        </Text>

        {!!action.badge && (
          <Text style={styles.count} numberOfLines={1}>
            {action.badge}
          </Text>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.md,
  },
  tile: {
    // Three per row, accounting for the two 12pt gaps between them.
    width: '31.2%',
    minWidth: 96,
    flexGrow: 1,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.md,
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: 104,
    ...theme.shadow.sm,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    fontSize: 18,
    includeFontPadding: false,
  },
  label: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.primary,
    textAlign: 'center',
  },
  count: {
    fontFamily: theme.font.body,
    fontSize: 11,
    color: theme.color.text.muted,
    textAlign: 'center',
  },
});

export default QuickActions;
