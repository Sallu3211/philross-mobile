import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontFamily, getResponsiveStyles } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ArrowRightIcon from '../../assets/icons/arrow-right.svg';
import FeedIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar_red.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import LocationIcon from '../../assets/icons/location.svg';
import CalendarIcon from '../../assets/icons/calendar.svg';
import { getEventList } from '../../app/helpers/ApiHelper';
import { Loader } from '../components/Loader';
import { pushCleverTapEvent } from '../../App';

const { width, height } = Dimensions.get('window');

const EventsScreen = ({ navigation }: any) => {
  const responsiveStyles = getResponsiveStyles();
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
  }, []);

  useEffect(() => {
    fetchEvents();
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

  // Render event item for FlatList
  const renderEventItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.eventCard}
      onPress={() => handleEventClick(item)}
    >
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleSection}>
            <Text 
              style={[styles.eventTitle, { fontFamily: getFontFamily('bold') }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name || item.title || 'Event Title'}
            </Text>
            
            <Text 
              style={[styles.eventDescription, { fontFamily: getFontFamily('body') }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description || 'No description available'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.viewDetailsButton} 
            onPress={() => handleEventClick(item)}
          >
            <Text style={[styles.viewDetailsText, { fontFamily: getFontFamily('bold') }]}>
              View Details {'>'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.eventDetails}>
        <View style={styles.locationContainer}>
          <LocationIcon width={16} height={16} />
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.detailText, { fontFamily: getFontFamily('body') }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.location}
            </Text>
          </View>
        </View>
        <View style={styles.timeContainer}>
          <CalendarIcon width={16} height={16} />
          <Text
            style={[styles.detailText, { fontFamily: getFontFamily('body') }]}
            numberOfLines={1}
          >
            {item.start_datetime ? formatEventDate(item.start_datetime) : 'Date TBD'}
          </Text>
        </View>
      </View>
      
      {item.cropped_image_url ? (
        <Image
          source={{ uri: item.cropped_image_url }}
          style={styles.eventImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.eventImagePlaceholder}>
          <Icon name="calendar-outline" size={40} color="#CCCCCC" />
        </View>
      )}
    </TouchableOpacity>
  ), [handleEventClick, formatEventDate]);

  // Render footer for loading more
  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#B62020" />
        <Text style={[styles.loadingMoreText, { fontFamily: getFontFamily('body') }]}>
          Loading more events...
        </Text>
      </View>
    );
  }, [isLoadingMore]);

  return (
    <>
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={[styles.topNav, responsiveStyles.topNav]}>
        <TouchableOpacity style={[styles.navButton, responsiveStyles.menuButton]} onPress={handlePreviousMonth}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.monthText, { fontFamily: getFontFamily('bold') }]}>{formatMonthDisplay(currentMonth)}</Text>
        <TouchableOpacity style={[styles.navButton, responsiveStyles.menuButton]} onPress={handleNextMonth}>
          <ArrowRightIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Loading indicator - Full screen */}
      {isLoading && (
        <View style={styles.fullScreenLoadingContainer}>
          {/* <ActivityIndicator size="large" color="#B62020" />
          <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
            Loading events...
          </Text> */}
        </View>
      )}

      {/* Events List - Only show when not loading and has events */}
      {!isLoading && events.length > 0 && (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id?.toString() || item.slug || Math.random().toString()}
          style={styles.eventsContainer}
          contentContainerStyle={styles.eventsContentContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreEvents}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
        />
      )}

      {/* No events message - Outside ScrollView for proper centering */}
      {!isLoading && events.length === 0 && (
        <View style={styles.noEventsContainer}>
          <Text style={[styles.noEventsText, { fontFamily: getFontFamily('body') }]}>
            No events found
          </Text>
          <Text style={[styles.noEventsSubText, { fontFamily: getFontFamily('body') }]}>
            Check back later for upcoming events
          </Text>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feed')}>
          <FeedIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <EventsIcon width={24} height={24} />
          <Text style={[styles.navText, styles.activeNavText, { fontFamily: getFontFamily('bold') }]}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Products')}>
          <ProductsIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyCoach')}>
          <MyCoachIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>My Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Courses')}>
          <CoursesIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Courses</Text>
        </TouchableOpacity>
      </View>
      

    </View>
      {isLoading && (
        <Loader value='Loading events...' />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    minHeight: Platform.OS === 'ios' ? 100 : 80,
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 0,
  },
  arrowButton: {
    padding: 0,
  },
  placeholder: {
    width: 24,
  },
  menuButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  eventsContainer: {
    flex: 1,
  },
  eventsContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Match Feed screen pattern exactly
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginBottom: 30, // Match Feed screen pattern - consistent spacing between cards
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    resizeMode: 'cover',
  },
  eventImagePlaceholder: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    paddingTop: 20,
    paddingLeft: 25,
    paddingRight: 18,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitleSection: {
    flex: 1,
    marginRight: 20,
    paddingRight: 5,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 14,
    color: '#000000',
    marginBottom: 15,
  },
  viewDetailsButton: {
    paddingHorizontal: 5,
    paddingVertical: 5,
  },
  viewDetailsText: {
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
    color: '#B62020',
    textDecorationLine: 'underline',
  },
  eventDetails: {
    gap: 8,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 25,
    paddingRight: 18,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 10,
    lineHeight: 16,
    marginLeft: 5,
    color: '#666666',
  },
  separator: {
    fontSize: 10,
    color: '#666666',
    marginHorizontal: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  activeNavText: {
    color: '#B62020',
    fontFamily: getFontFamily('heading'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    minHeight: 200,
  },
  fullScreenLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  noEventsContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noEventsSubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingLeft: 5,
  },
  locationContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666666',
  },

});

export default EventsScreen;
