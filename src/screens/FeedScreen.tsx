import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
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
import FilterChips from '../components/ui/FilterChips';
import MediaListCard from '../components/ui/MediaListCard';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, Filter, Info, Play } from '../components/ui/icons';
import { getFeedCategories, getWorkoutTypes, getFeedList } from '../../app/helpers/ApiHelper';
import EncryptedStorage from 'react-native-encrypted-storage';
import { pushCleverTapEvent } from '../../App';
import { checkSubscriptionAndProceed, hasActiveSubscription } from '../services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadAll as loadTutorialProgress,
  TutorialProgressMap,
} from '../services/tutorialProgress';

const FeedScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [, setIsLoadingCategories] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  
  // New state for workout types and feed data
  const [workoutTypes, setWorkoutTypes] = useState<any[]>([]);
  const [selectedWorkoutTypes, setSelectedWorkoutTypes] = useState<string[]>([]);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgressMap>({});
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [, setIsLoadingWorkoutTypes] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Fetch categories when component mounts
  useEffect(() => {
    // Add delay to ensure tokens are properly stored
    const delayFetch = async () => {
      // Check if token is available
      try {
        const token = await EncryptedStorage.getItem('authToken');
        
        if (token) {
          fetchCategories();
          fetchWorkoutTypes();
        } else {
          navigation.replace('Login');
        }
      } catch (error) {
        navigation.replace('Login');
      }
    };

    const timeout = setTimeout(delayFetch, 800); // 800ms delay
    return () => clearTimeout(timeout);
    // Mount-only token check; the fetchers are stable in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeedData();
      // Re-read on focus so a tutorial just marked done shows its tick.
      loadTutorialProgress(navigation).then(setTutorialProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation])
  );

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await getFeedCategories(navigation);
      
      // Check if the response indicates an error
      if (response?.success === false) {
        console.error('Categories API returned error:', response.message);
        setCategories([]);
        return;
      }
      
      // Handle different response structures from apiCall
      if (response?.success && response?.data?.results && Array.isArray(response.data.results)) {
        setCategories(response.data.results);
      } else if (response?.success && response?.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        setCategories(response.data.results);
      } else if (response?.data && Array.isArray(response.data)) {
        setCategories(response.data);
      } else if (response && Array.isArray(response)) {
        setCategories(response);
      } else {
        console.warn('Failed to fetch categories - no data found:', response);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fetch workout types from API
  const fetchWorkoutTypes = async () => {
    try {
      setIsLoadingWorkoutTypes(true);
      const response = await getWorkoutTypes(navigation);
      
      // Check if the response indicates an error
      if (response?.success === false) {
        console.log('Workout Types API returned error:', response.message);
        setWorkoutTypes([]);
        return;
      }
      
      // Handle different response structures from apiCall
      if (response?.success && response?.data?.results && Array.isArray(response.data.results)) {
        setWorkoutTypes(response.data.results);
      } else if (response?.success && response?.data && Array.isArray(response.data)) {
        setWorkoutTypes(response.data);
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        setWorkoutTypes(response.data.results);
      } else if (response?.data && Array.isArray(response.data)) {
        setWorkoutTypes(response.data);
      } else if (response && Array.isArray(response)) {
        setWorkoutTypes(response);
      } else {
        console.warn('Failed to fetch workout types - no data found:', response);
        setWorkoutTypes([]);
      }
    } catch (error) {
      console.error('Error fetching workout types:', error);
      setWorkoutTypes([]);
    } finally {
      setIsLoadingWorkoutTypes(false);
    }
  };

  // Fetch feed data with filters
  const fetchFeedData = async (filters?: { workout_type?: (string | number)[], category?: string }) => {
    try {
      setIsLoadingFeed(true);
      
      // Convert array of workout types to comma-separated string if needed
      let workoutTypeParam = '';
      if (filters?.workout_type && filters.workout_type.length > 0) {
        workoutTypeParam = filters.workout_type.join(',');
      }
      
      const response = await getFeedList(navigation, {
        workout_type: workoutTypeParam || undefined,
        category: filters?.category || undefined
      });
      
      console.log('Feed data response:', response);
      
      // Check if the response indicates an error
      if (response?.success === false) {
        setFeedError(response.message || 'Failed to load feed data');
        setFeedData([]);
        return;
      }
      

      
      // Handle different response structures from apiCall
      if (response?.success && response?.data?.results && Array.isArray(response.data.results)) {
        setFeedData(response.data.results);
        setFeedError(null); // Clear any previous errors
      } else if (response?.success && response?.data && Array.isArray(response.data)) {
        setFeedData(response.data);
        setFeedError(null); // Clear any previous errors
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        setFeedData(response.data.results);
        setFeedError(null); // Clear any previous errors
      } else if (response?.data && Array.isArray(response.data)) {
        setFeedData(response.data);
        setFeedError(null); // Clear any previous errors
      } else if (response && Array.isArray(response)) {
        setFeedData(response);
        setFeedError(null); // Clear any previous errors
      } else {
        setFeedData([]);
      }
    } catch (error) {
      setFeedData([]);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Handle category selection (multiple selection)
  const handleCategorySelect = (category: any) => {
    const categoryName = category.name || category;

    if (categoryName === 'Athlete') {
      pushCleverTapEvent('athlete_selected', {});
    }
    if (categoryName === 'Coach') {
      pushCleverTapEvent('coach_selected', {});
    }
    
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(cat => cat !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  // Handle workout type selection
  const handleWorkoutTypeSelect = (workoutType: string) => {
    setSelectedWorkoutTypes(prev => {
      if (prev.includes(workoutType)) {
        return prev.filter(type => type !== workoutType);
      } else {
        return [...prev, workoutType];
      }
    });
  };

  // Apply filters and fetch filtered data
  const applyFilters = async () => {
    // Convert workout type names to IDs for the API
    const workoutTypeIds = selectedWorkoutTypes.map(typeName => {
      const workoutType = workoutTypes.find(wt => wt.name === typeName);
      return workoutType ? workoutType.id : null;
    }).filter(id => id !== null);
    
    // Convert category names to IDs for the API
    const categoryIds = selectedCategories.map(categoryName => {
      const category = categories.find(cat => (cat.name || cat) === categoryName);
      return category ? category.id : null;
    }).filter(id => id !== null);
    
    setFeedError(null); // Clear any previous errors
    await fetchFeedData({ 
      workout_type: workoutTypeIds,
      category: categoryIds.length > 0 ? categoryIds.join(',') : ''
    });
    setShowFilter(false);
  };

  const onItemPress = async (item: any) => {
    const navigateToFeed = () => {
      if (item.feed_type === 'video') {
        navigation.navigate('Video', { videoData: item, feedData });
      } else {
        navigation.navigate('FeedDetails', { feedSlug: item.slug, feedData });
      }
    };
    const entitlementIds = await hasActiveSubscription();
    const isSubscribed = Array.isArray(entitlementIds) && entitlementIds.length > 0;
    if (item.locked && !isSubscribed) {
      checkSubscriptionAndProceed(navigateToFeed);
    } 
    else if (item.locked && isSubscribed) {
      Alert.alert(
        "Already Subscribed",
        "You've already subscribed using a different account. Please log in with that account to access this content.",
        [{ text: "OK" }]
      );
    } 
    else {
      navigateToFeed();
    }
  };


  const query = search.trim().toLowerCase();
  const matching = query
    ? feedData.filter((f: any) =>
        `${f?.name ?? ''} ${f?.headline ?? ''}`.toLowerCase().includes(query),
      )
    : feedData;

  /**
   * Free tutorials first, locked ones after — someone who cannot watch a
   * thing should not have to scroll past it to reach what they can. The sort
   * is stable, so the API's own ordering survives inside each group.
   */
  const visible = [...matching].sort(
    (a: any, b: any) => Number(!!a?.locked) - Number(!!b?.locked),
  );

  const categoryOptions = categories.map((c: any) => ({
    id: String(c?.name ?? c),
    label: String(c?.name ?? c),
  }));

  const workoutOptions = workoutTypes.map((w: any) => ({
    id: String(w?.name ?? w),
    label: String(w?.name ?? w),
  }));

  const filterCount = selectedCategories.length + selectedWorkoutTypes.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Tutorials"
        subtitle={
          feedData.length > 0
            ? `${feedData.length} ${feedData.length === 1 ? 'video' : 'videos'}`
            : undefined
        }
        onMenu={() => setShowSideMenu(true)}
        right={
          (categoryOptions.length > 0 || workoutOptions.length > 0) && (
            <TouchableOpacity
              style={[styles.filterBtn, filterCount > 0 && styles.filterBtnOn]}
              onPress={() => setShowFilter(v => !v)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Filters"
            >
              <Filter
                size={17}
                color={
                  filterCount > 0
                    ? theme.color.text.inverse
                    : theme.color.text.primary
                }
              />
              {filterCount > 0 && (
                <View style={styles.filterCount}>
                  <Text style={styles.filterCountText}>{filterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        }
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search tutorials"
        />
      </View>

      {/* Filters stay collapsed until asked for — two chip rows above every
          list pushed the content itself off the first screen. */}
      {showFilter && (
        <View style={styles.filters}>
          {categoryOptions.length > 0 && (
            <>
              <Text style={styles.filterLabel}>Category</Text>
              <FilterChips
                options={categoryOptions}
                selected={selectedCategories}
                onToggle={id => handleCategorySelect({ name: id })}
                onClear={() => setSelectedCategories([])}
              />
            </>
          )}

          {workoutOptions.length > 0 && (
            <>
              <Text style={styles.filterLabel}>Workout type</Text>
              <FilterChips
                options={workoutOptions}
                selected={selectedWorkoutTypes}
                onToggle={handleWorkoutTypeSelect}
                onClear={() => setSelectedWorkoutTypes([])}
              />
            </>
          )}

          <View style={styles.filterActions}>
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => {
                applyFilters();
                setShowFilter(false);
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
            >
              <Text style={styles.applyText}>Apply filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoadingFeed && feedData.length === 0 ? (
        <LoadingState label="Loading tutorials" />
      ) : feedError ? (
        <ErrorState message={feedError} onRetry={() => fetchFeedData()} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item: any, i) => String(item?.id ?? item?.slug ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingFeed}
              onRefresh={() => fetchFeedData()}
              tintColor={theme.color.brand.base}
              colors={[theme.color.brand.base]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Play}
              title={
                query
                  ? 'No matching tutorials'
                  : filterCount > 0
                  ? 'Nothing matches those filters'
                  : 'No tutorials yet'
              }
              body={
                query
                  ? `Nothing matches "${search.trim()}".`
                  : filterCount > 0
                  ? 'Try removing a filter to see more.'
                  : 'New sessions from Phil will appear here.'
              }
              actionLabel={
                query ? 'Clear search' : filterCount > 0 ? 'Clear filters' : undefined
              }
              onAction={
                query
                  ? () => setSearch('')
                  : filterCount > 0
                  ? () => {
                      setSelectedCategories([]);
                      setSelectedWorkoutTypes([]);
                      fetchFeedData();
                    }
                  : undefined
              }
            />
          }
          renderItem={({ item }: any) => {
            const isDone = !!tutorialProgress[item?.slug]?.done;
            return (
              <MediaListCard
                title={item?.name ?? item?.headline ?? 'Untitled'}
                body={
                  typeof item?.description === 'string'
                    ? item.description
                    : Array.isArray(item?.description)
                    ? item.description.join(' ')
                    : undefined
                }
                imageUrl={item?.cropped_thumbnail_url ?? item?.cropped_image_url}
                meta={[
                  ...(item?.feed_type
                    ? [
                        {
                          icon: item.feed_type === 'video' ? Play : Info,
                          label: item.feed_type,
                        },
                      ]
                    : []),
                  // Word and tick, not a colour — the row already carries type.
                  ...(isDone ? [{ icon: Check, label: 'Completed' }] : []),
                ]}
                locked={!!item?.locked}
                badge={item?.is_paid_feed && !item?.locked ? 'Premium' : undefined}
                onPress={() => onItemPress(item)}
              />
            );
          }}
        />
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

  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  filterBtnOn: {
    backgroundColor: theme.color.brand.base,
    borderColor: theme.color.brand.base,
  },
  filterCount: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: theme.color.accent.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountText: {
    fontFamily: theme.font.bold,
    fontSize: 10,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },

  searchWrap: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.md,
  },
  filters: {
    backgroundColor: theme.color.surface.card,
    marginHorizontal: theme.space.screen,
    marginBottom: theme.space.lg,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.space.lg,
    gap: theme.space.sm,
  },
  filterLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    paddingHorizontal: theme.space.screen,
  },
  filterActions: {
    paddingHorizontal: theme.space.screen,
    marginTop: theme.space.sm,
  },
  applyBtn: {
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.onBrand,
  },

  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.md,
  },
});

export default FeedScreen;
