/**
 * FilterChips — a horizontal, scrollable row of selectable chips.
 *
 * Selection is always visible as shape as well as colour: the active chip gets
 * a filled brand background and a tick, so it reads without relying on hue.
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';
import { Check } from './icons';

export interface ChipOption {
  id: string;
  label: string;
  /** Optional count shown after the label, e.g. "Strength 12". */
  count?: number;
}

export interface FilterChipsProps {
  options: ChipOption[];
  /** Ids currently selected. */
  selected: string[];
  onToggle: (id: string) => void;
  /** Shows a leading "All" chip that clears the selection. */
  allLabel?: string;
  onClear?: () => void;
  style?: ViewStyle;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selected,
  onToggle,
  allLabel = 'All',
  onClear,
  style,
}) => {
  if (options.length === 0) return null;

  const noneSelected = selected.length === 0;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.scroll, style]}
      contentContainerStyle={styles.row}
    >
      {!!onClear && (
        <TouchableOpacity
          style={[styles.chip, noneSelected && styles.chipOn]}
          onPress={onClear}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityState={{ selected: noneSelected }}
        >
          {noneSelected && <Check size={12} color={theme.color.text.inverse} />}
          <Text style={[styles.label, noneSelected && styles.labelOn]}>{allLabel}</Text>
        </TouchableOpacity>
      )}

      {options.map(o => {
        const on = selected.includes(o.id);
        return (
          <TouchableOpacity
            key={o.id}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => onToggle(o.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            {on && <Check size={12} color={theme.color.text.inverse} />}
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {o.label}
            </Text>
            {typeof o.count === 'number' && (
              <View style={[styles.countPill, on && styles.countPillOn]}>
                <Text style={[styles.count, on && styles.countOn]}>{o.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    gap: theme.space.sm,
    paddingHorizontal: theme.space.screen,
    paddingVertical: theme.space.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.card,
    minHeight: 34,
  },
  chipOn: { backgroundColor: theme.color.brand.base },
  label: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
    includeFontPadding: false,
  },
  labelOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.inverse,
  },
  countPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.neutral[100],
  },
  countPillOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  count: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.muted,
    includeFontPadding: false,
  },
  countOn: { color: theme.color.text.inverse },
});

export default FilterChips;
