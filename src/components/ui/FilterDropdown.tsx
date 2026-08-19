/**
 * FilterDropdown — a single-choice filter that opens a sheet instead of taking
 * a row of the screen.
 *
 * The chip row it replaces had two problems on the Products screen. It scrolled
 * horizontally, so with five categories the last two were simply invisible
 * unless you thought to swipe; and it sat on its own band above the list, which
 * left the search field and the filter on different lines and at different
 * widths — the misalignment the client reported.
 *
 * As a dropdown the control is one fixed-width button that can sit beside the
 * search field, and every option is visible at once when it opens.
 */

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Check, ChevronDown, Close } from './icons';

export interface DropdownOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterDropdownProps {
  options: DropdownOption[];
  /** Id of the selected option, or `allId` for "no filter". */
  selected: string;
  onSelect: (id: string) => void;
  /** The id that means "everything". Rendered first, always. */
  allId?: string;
  allLabel?: string;
  /** Shown on the closed button when nothing is filtered. */
  placeholder?: string;
  /** Title of the open sheet. */
  title?: string;
  style?: ViewStyle;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selected,
  onSelect,
  allId = 'all',
  allLabel = 'All',
  placeholder = 'Filter',
  title = 'Filter',
  style,
}) => {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const active = selected !== allId;
  const current = options.find(o => o.id === selected);
  const buttonLabel = active ? current?.label ?? placeholder : placeholder;

  const choose = (id: string) => {
    setOpen(false);
    onSelect(id);
  };

  const rows: DropdownOption[] = [{ id: allId, label: allLabel }, ...options];

  return (
    <>
      <TouchableOpacity
        style={[styles.button, active && styles.buttonOn, style]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${buttonLabel}`}
      >
        <Text
          style={[styles.buttonText, active && styles.buttonTextOn]}
          numberOfLines={1}
        >
          {buttonLabel}
        </Text>
        <ChevronDown
          size={14}
          color={active ? theme.color.text.inverse : theme.color.text.muted}
        />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, theme.space.xl) },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.grabber} />

            <View style={styles.head}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={theme.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Close size={17} color={theme.color.text.muted} />
              </TouchableOpacity>
            </View>

            {/* Bounded rather than free-growing: a long category list must not
                push its own sheet past the top of the screen. */}
            <ScrollView
              style={styles.list}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {rows.map(o => {
                const on = o.id === selected;
                return (
                  <TouchableOpacity
                    key={o.id}
                    style={styles.row}
                    onPress={() => choose(o.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text
                      style={[styles.rowLabel, on && styles.rowLabelOn]}
                      numberOfLines={1}
                    >
                      {o.label}
                    </Text>

                    {typeof o.count === 'number' && (
                      <Text style={styles.rowCount}>{o.count}</Text>
                    )}

                    {/* Fixed slot, so the labels of ticked and unticked rows
                        start and end at the same place. */}
                    <View style={styles.tickSlot}>
                      {on && <Check size={15} color={theme.color.text.primary} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    // Matches SearchBar's minHeight exactly so the two sit level in a row.
    minHeight: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
  },
  buttonOn: { backgroundColor: theme.color.surface.hero },
  buttonText: {
    flexShrink: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
    includeFontPadding: false,
  },
  buttonTextOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.inverse,
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface.app,
    borderTopLeftRadius: theme.radius['2xl'],
    borderTopRightRadius: theme.radius['2xl'],
    paddingHorizontal: theme.space.screen,
    paddingTop: theme.space.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.border.strong,
    marginBottom: theme.space.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space.sm,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.primary,
  },
  list: { maxHeight: 360 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingVertical: theme.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border.subtle,
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.secondary,
  },
  rowLabelOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.primary,
  },
  rowCount: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
  tickSlot: { width: 18, alignItems: 'flex-end' },
});

export default FilterDropdown;
