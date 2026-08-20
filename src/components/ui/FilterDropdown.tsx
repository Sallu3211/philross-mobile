/**
 * FilterDropdown — a filter that opens a sheet instead of taking a row of the
 * screen.
 *
 * The chip rows this replaces had two problems. They scrolled horizontally, so
 * with five or more options the last ones were simply invisible unless you
 * thought to swipe; and they sat on their own band above the list, which left
 * the search field and the filter on different lines and at different widths.
 *
 * As a dropdown the control is one fixed-width button that sits beside the
 * search field, and every option is visible at once when it opens.
 *
 * Two modes, one appearance:
 *
 *   single — picking a row applies it and closes. Products uses this: a
 *            product belongs to one category, so there is nothing to combine.
 *
 *   multi  — rows toggle, and an Apply button commits. Tutorials and Workouts
 *            use this. Their filters are meant to *narrow*: ticking Kettlebell
 *            and then Beginner should leave the items that are both, and that
 *            is the whole point of the change the client asked for. Applying on
 *            each tap would fire a request per tick and make an intermediate,
 *            half-chosen filter look like the answer.
 */

import React, { useEffect, useState } from 'react';
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

/** A labelled set of options, e.g. "Category" and "Workout type". */
export interface DropdownGroup {
  key: string;
  label: string;
  options: DropdownOption[];
}

interface BaseProps {
  /** Shown on the closed button when nothing is filtered. */
  placeholder?: string;
  /** Title of the open sheet. */
  title?: string;
  style?: ViewStyle;
}

interface SingleProps extends BaseProps {
  mode?: 'single';
  options: DropdownOption[];
  /** Id of the selected option, or `allId` for "no filter". */
  selected: string;
  onSelect: (id: string) => void;
  /** The id that means "everything". Rendered first, always. */
  allId?: string;
  allLabel?: string;
}

interface MultiProps extends BaseProps {
  mode: 'multi';
  /** One or more labelled sets. A single unlabelled set is fine too. */
  groups: DropdownGroup[];
  /** Selected ids per group key. */
  selected: Record<string, string[]>;
  /** Fired once, on Apply. */
  onApply: (next: Record<string, string[]>) => void;
  applyLabel?: string;
}

export type FilterDropdownProps = SingleProps | MultiProps;

const Row: React.FC<{
  label: string;
  count?: number;
  on: boolean;
  onPress: () => void;
}> = ({ label, count, on, onPress }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="button"
    accessibilityState={{ selected: on }}
  >
    <Text style={[styles.rowLabel, on && styles.rowLabelOn]} numberOfLines={1}>
      {label}
    </Text>

    {typeof count === 'number' && <Text style={styles.rowCount}>{count}</Text>}

    {/* Fixed slot, so ticked and unticked labels start and end alike. */}
    <View style={styles.tickSlot}>
      {on && <Check size={15} color={theme.color.text.primary} />}
    </View>
  </TouchableOpacity>
);

export const FilterDropdown: React.FC<FilterDropdownProps> = props => {
  const { placeholder = 'Filter', title = 'Filter', style } = props;
  const multi = props.mode === 'multi';

  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  /**
   * Multi-select edits a copy and commits on Apply, so closing the sheet
   * without applying leaves the list exactly as it was. Re-seeded whenever the
   * sheet opens, or the draft would go stale after a Clear elsewhere.
   */
  const [draft, setDraft] = useState<Record<string, string[]>>(
    multi ? (props as MultiProps).selected : {},
  );
  useEffect(() => {
    if (open && multi) setDraft({ ...(props as MultiProps).selected });
    // Re-seeding is what this effect is for; the props object identity is not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedCount = multi
    ? Object.values((props as MultiProps).selected).reduce(
        (n, ids) => n + ids.length,
        0,
      )
    : 0;

  const singleActive =
    !multi &&
    (props as SingleProps).selected !== ((props as SingleProps).allId ?? 'all');

  const active = multi ? selectedCount > 0 : singleActive;

  const buttonLabel = multi
    ? selectedCount > 0
      ? `${selectedCount} selected`
      : placeholder
    : singleActive
      ? ((props as SingleProps).options.find(
          o => o.id === (props as SingleProps).selected,
        )?.label ?? placeholder)
      : placeholder;

  const toggle = (groupKey: string, id: string) =>
    setDraft(prev => {
      const current = prev[groupKey] ?? [];
      return {
        ...prev,
        [groupKey]: current.includes(id)
          ? current.filter(x => x !== id)
          : [...current, id],
      };
    });

  const groups: DropdownGroup[] = multi
    ? (props as MultiProps).groups
    : [
        {
          key: '_single',
          label: '',
          options: [
            {
              id: (props as SingleProps).allId ?? 'all',
              label: (props as SingleProps).allLabel ?? 'All',
            },
            ...(props as SingleProps).options,
          ],
        },
      ];

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

            {/* Bounded rather than free-growing: a long list must not push its
                own sheet past the top of the screen. */}
            <ScrollView
              style={styles.list}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {groups.map(g => (
                <View key={g.key}>
                  {!!g.label && <Text style={styles.groupLabel}>{g.label}</Text>}

                  {g.options.map(o => (
                    <Row
                      key={`${g.key}:${o.id}`}
                      label={o.label}
                      count={o.count}
                      on={
                        multi
                          ? (draft[g.key] ?? []).includes(o.id)
                          : o.id === (props as SingleProps).selected
                      }
                      onPress={() => {
                        if (multi) {
                          toggle(g.key, o.id);
                        } else {
                          setOpen(false);
                          (props as SingleProps).onSelect(o.id);
                        }
                      }}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>

            {multi && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => setDraft({})}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => {
                    setOpen(false);
                    (props as MultiProps).onApply(draft);
                  }}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                >
                  <Text style={styles.applyText}>
                    {(props as MultiProps).applyLabel ?? 'Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
  list: { maxHeight: 380 },

  groupLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    marginTop: theme.space.lg,
    marginBottom: 2,
  },

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

  actions: {
    flexDirection: 'row',
    gap: theme.space.md,
    paddingTop: theme.space.lg,
  },
  clearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.xl,
    minHeight: 48,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border.strong,
  },
  clearText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.secondary,
    includeFontPadding: false,
  },
  applyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.hero,
  },
  applyText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },
});

export default FilterDropdown;
