import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
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
import MediaListCard from '../components/ui/MediaListCard';
import { EmptyState, LoadingState } from '../components/ui/StateView';
import { Calendar, ChevronRight, Clock, MapPin } from '../components/ui/icons';
import { getEventList } from '../../app/helpers/ApiHelper';
import { pushCleverTapEvent } from '../../App';

const EventsScreen = ({ navigation }: any) => {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch events on component mount and when month changes
  useEffect(() => {
    fetchEvents();
    pushCleverTapEvent('event_page_viewed', {});
    // Mount-only; the month effect below handles refetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchEvents();
    // fetchEvents is recreated whenever currentMonth changes, so listing it
    // here would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  // Initialize with current month on component mount
  useEffect(() => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  }, []);

  // Fetch events from API
  const fetchEvents = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      
      const params: any = {
        page: page,
        limit: 20
      };

      // Fix month filtering - use proper date range
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Create proper start and end dates for the month
      const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      params.start_date = startOfMonth.toISOString().split('T')[0];
      params.end_date = endOfMonth.toISOString().split('T')[0];

      console.log('📅 Fetching events for month:', formatMonthDisplay(currentMonth));
      console.log('📅 Date range:', params.start_date, 'to', params.end_date);
      console.log('📅 Page:', page, 'Append:', append);

      const response = await getEventList(navigation, params);
      
      if (response?.status || response?.success) {
        const newEvents = response.data?.results || response.data || [];
        
        console.log('📅 Received events:', newEvents.length);
        
        // Additional client-side filtering to ensure events are in the correct month
        const filteredEvents = newEvents.filter((event: any) => {
          if (!event.start_datetime) return false;
          
          const eventDate = new Date(event.start_datetime);
          const eventMonth = eventDate.getMonth();
          const eventYear = eventDate.getFullYear();
          
          return eventMonth === month && eventYear === year;
        });
        
        console.log('📅 Filtered events:', filteredEvents.length);
        
        if (append) {
          setEvents(prev => [...prev, ...filteredEvents]);
        } else {
          setEvents(filteredEvents);
        }
        
        // Check if there are more events to load
        setHasMoreEvents(filteredEvents.length === 20);
        setCurrentPage(page);
      } else {
        if (!append) {
          setEvents([]);
        }
        setHasMoreEvents(false);
        console.error('Failed to fetch events:', response?.message);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      if (!append) {
        setEvents([]);
      }
      setHasMoreEvents(false);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [currentMonth, navigation]);


  // Load more events
  const loadMoreEvents = useCallback(() => {
    if (!isLoadingMore && !isLoading && hasMoreEvents) {
      console.log('📅 Loading more events, page:', currentPage + 1);
      fetchEvents(currentPage + 1, true);
    }
  }, [isLoadingMore, isLoading, hasMoreEvents, currentPage, fetchEvents]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setEvents([]);
    setCurrentPage(1);
    setHasMoreEvents(true);
    fetchEvents(1, false).finally(() => {
      setIsRefreshing(false);
    });
  }, [fetchEvents]);

  // Handle month navigation
  const handlePreviousMonth = useCallback(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prevMonth);
    setEvents([]); // Clear current events
    setCurrentPage(1); // Reset to first page
    setHasMoreEvents(true); // Reset pagination
    setIsLoadingMore(false); // Reset loading more state
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(nextMonth);
    setEvents([]); // Clear current events
    setCurrentPage(1); // Reset to first page
    setHasMoreEvents(true); // Reset pagination
    setIsLoadingMore(false); // Reset loading more state
  }, [currentMonth]);


  // Format month for display
  const formatMonthDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };


  // Handle event click
  const handleEventClick = (event: any) => {
    navigation.navigate('EventDetails', { eventSlug: event.slug || event.id, sourceScreen: 'Events' });
  };

  // Format date for display
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date TBD';
      }
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return 'Date TBD';
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Events"
        subtitle={
          events.length > 0
            ? `${events.length} this month`
            : undefined
        }
        onMenu={() => setShowSideMenu(true)}
      />

      {/* Month stepper. Arrows are the shared chevron, flipped for "previous",
          so the control matches every other back/forward affordance. */}
      <View style={styles.monthBar}>
        <TouchableOpacity
          style={styles.monthBtn}
          onPress={handlePreviousMonth}
          hitSlop={theme.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <View style={styles.flip}>
            <ChevronRight size={16} color={theme.color.text.primary} />
          </View>
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{formatMonthDisplay(currentMonth)}</Text>

        <TouchableOpacity
          style={styles.monthBtn}
          onPress={handleNextMonth}
          hitSlop={theme.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <ChevronRight size={16} color={theme.color.text.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && events.length === 0 ? (
        <LoadingState label="Loading events" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item: any, i) => String(item?.id ?? item?.slug ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            loadMoreEvents();
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.color.brand.base}
              colors={[theme.color.brand.base]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Calendar}
              title="Nothing this month"
              body={`No events scheduled for ${formatMonthDisplay(currentMonth)}. Try another month.`}
              actionLabel="Next month"
              onAction={handleNextMonth}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoad}>
                <ActivityIndicator color={theme.color.brand.base} />
              </View>
            ) : null
          }
          renderItem={({ item }: any) => (
            <MediaListCard
              title={item?.name ?? item?.title ?? 'Untitled event'}
              body={
                typeof item?.description === 'string'
                  ? item.description
                  : Array.isArray(item?.description)
                  ? item.description.join(' ')
                  : undefined
              }
              imageUrl={item?.cropped_image_url}
              meta={[
                {
                  icon: Clock,
                  label: item?.start_datetime
                    ? formatEventDate(item.start_datetime)
                    : 'Date to be confirmed',
                },
                ...(item?.location ? [{ icon: MapPin, label: item.location }] : []),
              ]}
              onPress={() => handleEventClick(item)}
            />
          )}
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

  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.space.screen,
    marginBottom: theme.space.lg,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: { transform: [{ scaleX: -1 }] },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },

  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.md,
  },
  footerLoad: { paddingVertical: theme.space.xl },
});

export default EventsScreen;
