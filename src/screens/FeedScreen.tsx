import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SideMenu from '../components/SideMenu';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import SearchBar from '../components/ui/SearchBar';
import FilterDropdown from '../components/ui/FilterDropdown';
import MediaListCard from '../components/ui/MediaListCard';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, Info, Play } from '../components/ui/icons';
import { getWorkoutTypes, getFeedList } from '../../app/helpers/ApiHelper';
import EncryptedStorage from 'react-native-encrypted-storage';
import { checkSubscriptionAndProceed, hasActiveSubscription } from '../services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadAll as loadTutorialProgress,
  TutorialProgressMap,
} from '../services/tutorialProgress';

const FeedScreen = ({ navigation }: any) => {
  const [search, setSearch] = useState('');
  const [showSideMenu, setShowSideMenu] = useState(false);
  
  // New state for workout types and feed data
  const [workoutTypes, setWorkoutTypes] = useState<any[]>([]);
  const [selectedWorkoutTypes, setSelectedWorkoutTypes] = useState<string[]>([]);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [tutorialProgress, setTutorialProgress] = useState<TutorialProgressMap>({});
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [, setIsLoadingWorkoutTypes] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Fetch workout types when component mounts
  useEffect(() => {
    // Add delay to ensure tokens are properly stored
    const delayFetch = async () => {
      // Check if token is available
      try {
        const token = await EncryptedStorage.getItem('authToken');
        
        if (token) {
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
  // Apply filters and fetch filtered data
  /**
   * Takes the selections as arguments rather than reading state.
   *
   * The filter sheet hands over what was ticked at the moment Apply is
   * pressed. Reading state here instead would fetch with the *previous*
   * selection, because the setState calls beside this one have not landed yet.
   * State is still the default, for any caller that has already updated it.
   */
  const applyFilters = async (types: string[] = selectedWorkoutTypes) => {
    // Convert workout type names to IDs for the API
    const workoutTypeIds = types.map(typeName => {
      const workoutType = workoutTypes.find(wt => wt.name === typeName);
      return workoutType ? workoutType.id : null;
    }).filter(id => id !== null);

    setFeedError(null); // Clear any previous errors
    // `category` is still sent, always empty. The endpoint treats a missing
    // key and an empty one the same, and sending it keeps the shape of the
    // request stable for anything reading these calls.
    await fetchFeedData({
      workout_type: workoutTypeIds,
      category: '',
    });
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

  const workoutOptions = workoutTypes.map((w: any) => ({
    id: String(w?.name ?? w),
    label: String(w?.name ?? w),
  }));

  const filterCount = selectedWorkoutTypes.length;

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
      />

      {/* Search and filter share one row and one baseline — the same control
          as Books & Gear and Workouts. The filter opens a sheet holding both
          groups, so nothing is pushed off the top of the list and no chip row
          scrolls its own options out of sight.

          Multi-select with an Apply, deliberately: these filters are meant to
          narrow. Ticking Kettlebell and then Beginner should leave what is
          both, and applying on every tap would fire a request per tick. */}
      <View style={styles.controls}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search tutorials"
          style={styles.search}
        />

        {workoutOptions.length > 0 && (
          <FilterDropdown
            mode="multi"
            title="Workout type"
            placeholder="Filter"
            applyLabel="Apply filters"
            style={styles.filterBtn}
            // Workout type only. The other group held the audience tags —
            // Athlete, Coach, Homepage, Fitness Enthusiast — which describe
            // who a tutorial is aimed at, not what the session is. Nobody
            // browsing tutorials narrows by those, and two groups made the
            // sheet look like more of a decision than it is.
            groups={[
              { key: 'workout', label: '', options: workoutOptions },
            ]}
            selected={{ workout: selectedWorkoutTypes }}
            onApply={next => {
              const types = next.workout ?? [];
              setSelectedWorkoutTypes(types);
              // Passed through rather than read back from state, which has
              // not updated yet at this point.
              applyFilters(types);
            }}
          />
        )}
      </View>

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

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.lg,
  },
  /** Takes the row; minWidth:0 lets it shrink beside the filter. */
  search: { flex: 1, minWidth: 0 },
  filterBtn: { width: 132 },

  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.md,
  },
});

export default FeedScreen;
