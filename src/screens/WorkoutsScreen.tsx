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
import { ChevronRight, Coach, Flame, Info } from '../components/ui/icons';
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

  const query = search.trim().toLowerCase();
  const visible = query
    ? categories.filter(c => c.name.toLowerCase().includes(query))
    : categories;

  const totalWorkouts = categories.reduce(
    (sum, c) => sum + (c.workout_count || 0),
    0,
  );

  const openCategory = (category: Category) =>
    navigation.navigate('WorkoutList', {
      categorySlug: category.slug,
      categoryName: category.name,
    });

  const renderCard = (category: Category) => {
    const empty = !category.workout_count;
    return (
      <TouchableOpacity
        key={category.id}
        style={styles.card}
        onPress={() => openCategory(category)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${category.name}, ${category.workout_count} workouts`}
      >
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {category.name}
          </Text>
          {!!category.description && (
            <Text style={styles.cardDesc} numberOfLines={1}>
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
        <ChevronRight size={16} color={theme.color.text.disabled} />
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

          {visible.length === 0 ? (
            <EmptyState
              icon={Info}
              title="No category matches that"
              body="Try a different word, or clear the search."
              actionLabel="Clear search"
              onAction={() => setSearch('')}
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
                      <Coach size={14} color={theme.color.status.info} />
                    )}
                    <Text style={styles.groupLabel}>{group.label}</Text>
                    <Text style={styles.groupCount}>{rows.length}</Text>
                  </View>
                  <View style={styles.groupCards}>{rows.map(renderCard)}</View>
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
  search: { marginBottom: theme.space.lg },

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
    gap: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderRadius: 14,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.lg,
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
