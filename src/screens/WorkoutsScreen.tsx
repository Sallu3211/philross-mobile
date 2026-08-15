/**
 * WorkoutsScreen — browse the twelve categories.
 *
 * This is the screen the whole section exists for. The client's brief was
 * "12 categories, selections narrowed, not widened", so the entry point is
 * the categories themselves, grouped exactly as they wrote them:
 *
 *   Kettlebell  Beginner, Intermediate, Advanced, Specialty, HIIT,
 *               PowerDure, Strength and Power, Simple Yet Sinister
 *   Other       Self-Defense, Bodyweight, Warm-ups, 5-Minute Workouts
 *
 * Each card shows how many workouts are actually in it. A category that says
 * "8 workouts" and opens onto three is worse than no number at all, so the
 * count comes from the server and only counts published ones.
 *
 * Search here filters the *categories*, not the workouts — you are choosing
 * where to look. Searching workouts happens one level down, inside the
 * category you picked, which is what keeps the funnel narrowing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SideMenu from '../components/SideMenu';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import SearchBar from '../components/ui/SearchBar';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, ChevronRight, Coach, Flame, Info } from '../components/ui/icons';
import { getWorkoutCategories } from '../../app/helpers/ApiHelper';

interface Category {
  id: number;
  name: string;
  slug: string;
  group: 'kettlebell' | 'other';
  group_label: string;
  description?: string;
  workout_count: number;
}

/** Group headings, in the client's order. */
const GROUPS: { key: Category['group']; label: string }[] = [
  { key: 'kettlebell', label: 'Kettlebell' },
  { key: 'other', label: 'Other' },
];

const WorkoutsScreen = ({ navigation }: any) => {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<Category['group'] | null>(null);

  const fetchCategories = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setIsLoading(true);
        setError(null);

        const res: any = await getWorkoutCategories(navigation);
        const rows = res?.data ?? res?.results ?? res;

        if (Array.isArray(rows)) {
          setCategories(rows);
        } else {
          setError('We could not load the workout categories.');
        }
      } catch (e) {
        setError('We could not load the workout categories.');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [navigation],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Group is a filter, not just a heading.
   *
   * The client asked for the categories to be selectable rather than only
   * searchable — typing is a poor way to choose from a list of twelve you can
   * already see. Picking a group narrows to eight or four; search narrows
   * further inside that. Both cut, neither adds.
   */
  const query = search.trim().toLowerCase();
  const visible = categories.filter(c => {
    if (group && c.group !== group) return false;
    if (query && !c.name.toLowerCase().includes(query)) return false;
    return true;
  });

  const totalWorkouts = categories.reduce(
    (sum, c) => sum + (c.workout_count || 0),
    0,
  );

  const openCategory = (category: Category) =>
    navigation.navigate('WorkoutList', {
      categorySlug: category.slug,
      categoryName: category.name,
    });

  const renderCard = (category: Category, index: number) => {
    const empty = !category.workout_count;
    const kettlebell = category.group === 'kettlebell';
    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.card, empty && styles.cardEmpty]}
        onPress={() => openCategory(category)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${category.name}, ${category.workout_count} workouts`}
      >
        {/* A numbered plate rather than a repeated icon. Twelve rows of the
            same glyph is noise; a number tells you where you are in the set
            and gives each row something of its own. */}
        <View
          style={[
            styles.plate,
            kettlebell ? styles.plateKettlebell : styles.plateOther,
            empty && styles.plateEmpty,
          ]}
        >
          <Text style={styles.plateNum} allowFontScaling={false}>
            {index + 1}
          </Text>
        </View>

        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {category.name}
          </Text>
          {!!category.description && (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {category.description}
            </Text>
          )}
          {/* The real number, not a promise. Zero says so plainly. */}
          <Text style={[styles.cardCount, empty && styles.cardCountEmpty]}>
            {empty
              ? 'Nothing here yet'
              : `${category.workout_count} workout${category.workout_count === 1 ? '' : 's'}`}
          </Text>
        </View>

        <ChevronRight size={15} color={theme.color.text.disabled} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Workouts"
        subtitle={
          totalWorkouts > 0 ? `${totalWorkouts} across 12 categories` : undefined
        }
        onMenu={() => setShowSideMenu(true)}
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchCategories()} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchCategories(true)}
              tintColor={theme.color.brand.base}
            />
          }
        >
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder="Find a category"
            style={styles.search}
          />

          {/* Selectable, not only searchable. Twelve is a list you choose from,
              not one you type into. */}
          <View style={styles.filterRow}>
            {[
              { id: null, label: 'All', count: categories.length },
              ...GROUPS.map(g => ({
                id: g.key,
                label: g.label,
                count: categories.filter(c => c.group === g.key).length,
              })),
            ].map(f => {
              const on = group === f.id;
              return (
                <TouchableOpacity
                  key={String(f.id)}
                  style={[styles.filter, on && styles.filterOn]}
                  onPress={() => setGroup(f.id as Category['group'] | null)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  {on && <Check size={11} color={theme.color.text.onBrand} />}
                  <Text style={[styles.filterText, on && styles.filterTextOn]}>
                    {f.label}
                  </Text>
                  <Text style={[styles.filterCount, on && styles.filterCountOn]}>
                    {f.count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {visible.length === 0 ? (
            <EmptyState
              icon={Info}
              title="Nothing matches that"
              body="These filters narrow the list. Remove one to widen it again."
              actionLabel="Clear filters"
              onAction={() => {
                setSearch('');
                setGroup(null);
              }}
            />
          ) : (
            GROUPS.map(group => {
              const rows = visible.filter(c => c.group === group.key);
              if (rows.length === 0) return null;
              return (
                <View key={group.key} style={styles.group}>
                  <View style={styles.groupHead}>
                    {group.key === 'kettlebell' ? (
                      <Flame size={14} color={theme.color.brand.base} />
                    ) : (
                      <Coach size={14} color={theme.color.status.success} />
                    )}
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    <Text style={styles.groupCount}>{rows.length}</Text>
                  </View>
                  <View style={styles.groupCards}>
                    {rows.map((c, i) => renderCard(c, i))}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <SideMenu
        isVisible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
  },
  search: { marginBottom: theme.space.md },

  filterRow: {
    flexDirection: 'row',
    gap: theme.space.sm,
    marginBottom: theme.space.xl,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.space.md,
    minHeight: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  /** Dark, matching the numbered discs. A selected filter is a state, not an
      action — the brand red is reserved for things you press to commit. */
  filterOn: {
    backgroundColor: theme.color.surface.hero,
    borderColor: theme.color.surface.hero,
  },
  filterText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },
  filterTextOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.onBrand,
  },
  /** The count is the point of the chip — it says how much this cut leaves. */
  filterCount: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.disabled,
    includeFontPadding: false,
  },
  filterCountOn: { color: 'rgba(255,255,255,0.7)' },

  group: { marginBottom: theme.space.xl },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginBottom: theme.space.md,
    paddingHorizontal: theme.space.xs,
  },
  groupLabel: {
    flex: 1,
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },
  groupCount: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.disabled,
  },
  /** One card per row. These are destinations, not thumbnails to scan. */
  groupCards: { gap: theme.space.sm },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.lg,
  },
  /** Empty categories stay tappable but stop competing for attention. */
  cardEmpty: { backgroundColor: theme.color.surface.raised },

  /** Circular. A number in a disc reads as a step in a sequence; the same
      number in a rounded square read as an app icon. */
  plate: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * Both groups take the dark surface, not a colour each.
   *
   * The number says which step you are on; the group is already stated by the
   * heading above the run of cards. Colouring the discs made the list argue
   * with itself — twelve saturated plates competing with the one red thing on
   * the screen that is actually a control.
   *
   * `surface.hero`, the same near-black as the drawer masthead, so it reads
   * as the app's own ink rather than a new colour.
   */
  plateKettlebell: { backgroundColor: theme.color.surface.hero },
  plateOther: { backgroundColor: theme.color.surface.hero },
  plateEmpty: { backgroundColor: theme.color.neutral[300] },
  plateNum: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },

  cardText: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },
  cardDesc: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 17,
    color: theme.color.text.muted,
    marginTop: 2,
  },
  cardCount: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.brand.base,
    marginTop: 5,
  },
  cardCountEmpty: { color: theme.color.text.disabled },
});

export default WorkoutsScreen;
