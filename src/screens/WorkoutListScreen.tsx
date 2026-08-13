/**
 * WorkoutListScreen — the workouts inside one category.
 *
 * THE FILTERS NARROW.
 *
 * You arrive already inside a category, and every control here cuts further
 * into that: a level, a time limit, a search term. There is no control that
 * can add a workout back into the list. That is the whole point — the client
 * asked for "selections narrowed, not widened", and the honest way to deliver
 * it is a funnel that only ever goes further down.
 *
 * The count line says what survived, so the effect of each tap is visible
 * rather than something you have to infer by scrolling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import SearchBar from '../components/ui/SearchBar';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, ChevronRight, Clock, Info, Lock } from '../components/ui/icons';
import { getWorkouts } from '../../app/helpers/ApiHelper';

interface Workout {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  level?: string;
  duration_minutes?: number | null;
  equipment?: string;
  step_count: number;
  locked: boolean;
}

const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];

const TIMES = [
  { id: 10, label: 'Under 10 min' },
  { id: 20, label: 'Under 20 min' },
  { id: 30, label: 'Under 30 min' },
];

const WorkoutListScreen = ({ route, navigation }: any) => {
  const { categorySlug, categoryName } = route.params || {};

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<string | null>(null);
  const [maxMinutes, setMaxMinutes] = useState<number | null>(null);

  const fetchWorkouts = useCallback(
    async (isRefresh = false) => {
      try {
        isRefresh ? setRefreshing(true) : setIsLoading(true);
        setError(null);

        // Every argument sent is another cut. The server ANDs them.
        const res: any = await getWorkouts(navigation, {
          category: categorySlug,
          level: level ?? undefined,
          max_minutes: maxMinutes ?? undefined,
          search: search.trim() || undefined,
        });

        const rows = res?.data?.results ?? res?.results ?? res?.data;
        if (Array.isArray(rows)) {
          setWorkouts(rows);
        } else {
          setError('We could not load these workouts.');
        }
      } catch (e) {
        setError('We could not load these workouts.');
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [navigation, categorySlug, level, maxMinutes, search],
  );

  useEffect(() => {
    // Debounced so typing does not fire a request per keystroke.
    const t = setTimeout(() => fetchWorkouts(), 300);
    return () => clearTimeout(t);
  }, [fetchWorkouts]);

  const activeFilters = (level ? 1 : 0) + (maxMinutes ? 1 : 0);
  const clearAll = () => {
    setLevel(null);
    setMaxMinutes(null);
    setSearch('');
  };

  /** Filled + tick when on, so the state is not carried by colour alone. */
  const chip = (
    key: string,
    label: string,
    on: boolean,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={key}
      style={[styles.chip, on && styles.chipOn]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      {on && <Check size={11} color={theme.color.text.onBrand} />}
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title={categoryName || 'Workouts'}
        subtitle={
          isLoading
            ? undefined
            : `${workouts.length} workout${workouts.length === 1 ? '' : 's'}${
                activeFilters || search.trim() ? ' after filters' : ''
              }`
        }
        onBack={() => navigation.goBack()}
      />

      <View style={styles.controls}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={`Search in ${categoryName ?? 'this category'}`}
        />

        <View style={styles.chipRow}>
          {LEVELS.map(l =>
            chip(l.id, l.label, level === l.id, () =>
              setLevel(level === l.id ? null : l.id),
            ),
          )}
        </View>

        <View style={styles.chipRow}>
          {TIMES.map(t =>
            chip(String(t.id), t.label, maxMinutes === t.id, () =>
              setMaxMinutes(maxMinutes === t.id ? null : t.id),
            ),
          )}
        </View>

        {(activeFilters > 0 || !!search.trim()) && (
          <TouchableOpacity
            onPress={clearAll}
            style={styles.clearRow}
            hitSlop={theme.hitSlop}
            accessibilityRole="button"
          >
            <Text style={styles.clearText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchWorkouts()} />
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchWorkouts(true)}
              tintColor={theme.color.brand.base}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Info}
              title={
                activeFilters || search.trim()
                  ? 'Nothing matches all of those'
                  : 'No workouts here yet'
              }
              body={
                activeFilters || search.trim()
                  ? 'These filters narrow the list, so combining them can leave nothing. Remove one to widen it again.'
                  : 'Workouts for this category will appear here.'
              }
              actionLabel={
                activeFilters || search.trim() ? 'Clear filters' : undefined
              }
              onAction={activeFilters || search.trim() ? clearAll : undefined}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('WorkoutDetail', {
                  slug: item.slug,
                  title: item.title,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.title}${item.locked ? '. Locked.' : ''}`}
            >
              <View style={styles.cardText}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.summary && (
                  <Text style={styles.cardSummary} numberOfLines={2}>
                    {item.summary}
                  </Text>
                )}

                <View style={styles.metaRow}>
                  {!!item.duration_minutes && (
                    <View style={styles.meta}>
                      <Clock size={11} color={theme.color.text.muted} />
                      <Text style={styles.metaText}>
                        {item.duration_minutes} min
                      </Text>
                    </View>
                  )}
                  {!!item.step_count && (
                    <View style={styles.meta}>
                      <Check size={11} color={theme.color.text.muted} />
                      <Text style={styles.metaText}>
                        {item.step_count} exercises
                      </Text>
                    </View>
                  )}
                  {!!item.level && (
                    <View style={styles.meta}>
                      <Text style={styles.metaText}>
                        {item.level.charAt(0).toUpperCase() + item.level.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {item.locked ? (
                <View style={styles.lockPill}>
                  <Lock size={11} color={theme.color.text.inverse} />
                </View>
              ) : (
                <ChevronRight size={15} color={theme.color.text.disabled} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },

  controls: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.md,
    gap: theme.space.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.space.md,
    minHeight: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  chipOn: {
    backgroundColor: theme.color.brand.base,
    borderColor: theme.color.brand.base,
  },
  chipText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },
  chipTextOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.onBrand,
  },
  clearRow: { alignSelf: 'flex-start', paddingVertical: 2 },
  clearText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.brand.base,
  },

  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.sm,
  },
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
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.primary,
  },
  cardSummary: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 17,
    color: theme.color.text.muted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.md,
    marginTop: theme.space.sm,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.muted,
    includeFontPadding: false,
  },
  lockPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.status.locked,
  },
});

export default WorkoutListScreen;
