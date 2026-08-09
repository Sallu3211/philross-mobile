import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  StatusBar,
  FlatList,
  Alert,
} from 'react-native';
import { getFontFamily, getResponsiveStyles } from '../utils/platform';
import SideMenu from '../components/SideMenu';
// Shared icon set, so the hamburger matches the one on the dashboard.
import { Menu as MenuIcon } from '../components/ui/icons';
import { theme as appTheme } from '../theme';
import PhilrossLogo from '../../assets/icons/logo_master.png';
import ArrowDownIcon from '../../assets/icons/arrow-down.svg';
import FilterIcon from '../../assets/icons/filter.svg';
import FeedIcon from '../../assets/icons/Vector.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import SolarPlayIcon from '../../assets/icons/solar_play-bold.svg';
import TickSquareIcon from '../../assets/icons/tick-square.svg';
import LockIcon from '../../assets/icons/lock.svg';
import { useUser } from '../context/UserContext';
import { getFeedCategories, getWorkoutTypes, getFeedList } from '../../app/helpers/ApiHelper';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Loader } from '../components/Loader';
import { pushCleverTapEvent } from '../../App';
import { checkSubscriptionAndProceed, hasActiveSubscription } from '../services/subscriptionService';
import { useFocusEffect } from '@react-navigation/native';

const { height } = Dimensions.get('window');

const FeedScreen = ({ navigation }: any) => {
  const responsiveStyles = getResponsiveStyles();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const { getUserInitial, isLoggedIn, isSubscribed } = useUser();
  const [showFilter, setShowFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  
  // New state for workout types and feed data
  const [workoutTypes, setWorkoutTypes] = useState<any[]>([]);
  const [selectedWorkoutTypes, setSelectedWorkoutTypes] = useState<string[]>([]);
  const [feedData, setFeedData] = useState<any[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [isLoadingWorkoutTypes, setIsLoadingWorkoutTypes] = useState(false);
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeedData();
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
    setShowCategoryFilter(false);
  };

  // Reset workout type filters
  const resetWorkoutTypeFilters = () => {
    setSelectedWorkoutTypes([]);
    setFeedError(null); // Clear any previous errors
    // Convert category names to IDs for the API
    const categoryIds = selectedCategories.map(categoryName => {
      const category = categories.find(cat => (cat.name || cat) === categoryName);
      return category ? category.id : null;
    }).filter(id => id !== null);
    fetchFeedData({ category: categoryIds.length > 0 ? categoryIds.join(',') : '' }); // Fetch with only category filters
    setShowFilter(false);
  };

  // Reset category filters
  const resetCategoryFilters = () => {
    setSelectedCategories([]);
    setFeedError(null); // Clear any previous errors
    // Convert workout type names to IDs for the API
    const workoutTypeIds = selectedWorkoutTypes.map(typeName => {
      const workoutType = workoutTypes.find(wt => wt.name === typeName);
      return workoutType ? workoutType.id : null;
    }).filter(id => id !== null);
    fetchFeedData({ workout_type: workoutTypeIds }); // Fetch with only workout type filters
    setShowCategoryFilter(false);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedWorkoutTypes([]);
    setSelectedCategories([]);
    setFeedError(null); // Clear any previous errors
    fetchFeedData(); // Fetch without filters
    setShowFilter(false);
    setShowCategoryFilter(false);
  };

  // Render workout type item for FlatList
  const renderWorkoutTypeItem = ({ item }: { item: any }) => {
    const isSelected = selectedWorkoutTypes.includes(item.name || item);
    
    return (
      <TouchableOpacity 
        style={styles.filterGridItem}
        onPress={() => handleWorkoutTypeSelect(item.name || item)}
      >
        {isSelected ? <TickSquareIcon width={20} height={20} style={styles.checkboxIcon} /> :
          <View style={[
            styles.checkbox,
            isSelected ? styles.checkboxSelected : styles.checkboxUnselected
          ]}>
          </View>}
        <View style={styles.filterOptionTextContainer}>
          <Text style={[styles.filterOptionText, { fontFamily: getFontFamily('body') }]}>
            {item.name || item}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render category item for FlatList
  const renderCategoryItem = ({ item }: { item: any }) => {
    const isSelected = selectedCategories.includes(item.name || item);
    
    return (
      <TouchableOpacity 
        style={styles.filterGridItem}
        onPress={() => handleCategorySelect(item)}
      >
        {isSelected ? <TickSquareIcon width={20} height={20} style={styles.checkboxIcon} /> :
          <View style={[
            styles.checkbox,
            isSelected ? styles.checkboxSelected : styles.checkboxUnselected
          ]}>
          </View>}
        <View style={styles.filterOptionTextContainer}>
          <Text style={[styles.filterOptionText, { fontFamily: getFontFamily('body') }]}>
            {item.name || item}
          </Text>
        </View>
      </TouchableOpacity>
    );
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


  return (
    <>
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      


      {/* Top Navigation Bar */}
      <View style={[styles.topNav, responsiveStyles.topNav]}>
        <TouchableOpacity style={[styles.menuButton, responsiveStyles.menuButton]} onPress={() => setShowSideMenu(true)}>
          <MenuIcon size={22} color={appTheme.color.text.primary} />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image source={PhilrossLogo} style={{ width: 44, height: 44, borderRadius: 9 }} resizeMode="contain" />
        </View>
        <TouchableOpacity 
          style={[styles.profileButton, responsiveStyles.profileButton]}
          onPress={() => setShowSideMenu(true)}
        >
          <Text style={styles.profileIcon}>
            {isLoggedIn ? getUserInitial() : '?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Feed Header */}
      <View style={styles.feedHeader}>
        <Text style={[styles.feedTitle, { fontFamily: getFontFamily('heading') }]}>Feed</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowCategoryFilter(true)}>
            <Text style={[styles.filterText, { fontFamily: getFontFamily('body') }]}>
              {selectedCategories.length > 0 ? `${selectedCategories.length} Categories` : 'All Categories'}
            </Text>
            <ArrowDownIcon width={16} height={16} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterIconButton} onPress={() => setShowFilter(true)}>
            <FilterIcon width={20} height={20} />
          </TouchableOpacity>
        </View>
      </View>

            {/* Loading indicator - Full screen */}
      {isLoadingFeed ? (
        <View style={styles.fullScreenLoadingContainer} />
      ) : feedError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>{feedError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            setFeedError(null);
            fetchFeedData();
          }}>
            <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : feedData.length > 0 ? (
        <ScrollView style={styles.feedContent} showsVerticalScrollIndicator={false}>
          {feedData.map((item: any, index: number) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.eventCard,
                index === feedData.length - 1 && styles.lastEventCard
              ]}
              onPress={() => onItemPress(item)}
            >
              <View style={styles.eventContent}>
                <View style={styles.eventHeader}>
                  <View style={styles.eventTitleSection}>
                    <Text style={[styles.eventTitle, { fontFamily: getFontFamily('heading') }]}>
                      {item.headline || 'Untitled'}
                    </Text>
                    <Text style={[styles.eventDescription, { fontFamily: getFontFamily('body') }]}>
                      {Array.isArray(item.description) ? item.description.join(' ') : item.description || 'No description available'}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.eventImagePlaceholder}>
                {item.cropped_thumbnail_url ? (
                  <Image 
                    source={{ uri: item.cropped_thumbnail_url }} 
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                ) : item.cropped_image_url ? (
                  <Image 
                    source={{ uri: item.cropped_image_url }} 
                    style={styles.eventImage}
                    resizeMode="cover"
                  />
                ) : (
                  <SolarPlayIcon width={60} height={60} />
                )}
                
                {/* Video Play Icon Overlay */}
                {item.feed_type === 'video' && (
                  <View style={styles.videoPlayOverlay}>
                    <SolarPlayIcon width={40} height={40} fill="#FFFFFF" />
                  </View>
                )}
                
                {/* Badge - Lock icon for paid, text for free */}
                <View style={[styles.freeBadge, item.is_paid_feed && styles.lockedBadge]}>
                  {item.is_paid_feed ? (
                    <>
                      {item?.locked && <LockIcon width={16} height={16} fill="none" stroke="#B62020" strokeWidth="2" />}
                      <Text style={styles.lockText}>{!item?.locked ? 'Unlocked' : 'Lock'}</Text>
                    </>
                  ) : (
                    <Text style={styles.freeText}>Free</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : ( !isLoadingFeed &&
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontFamily: getFontFamily('body') }]}>No feed items available</Text>
          <Text style={[styles.emptySubtext, { fontFamily: getFontFamily('body') }]}>Try refreshing or check back later</Text>
        </View>
      )}

      {/* Category Filter Modal */}
      {showCategoryFilter && (
        <TouchableOpacity 
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryFilter(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { fontFamily: getFontFamily('heading') }]}>Categories</Text>
              <TouchableOpacity onPress={resetCategoryFilters}>
                <Text style={[styles.resetText, { fontFamily: getFontFamily('body') }]}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, styles.workoutTypeTitle]}>Select Categories</Text>
              
              {isLoadingCategories ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading categories...</Text>
                </View>
              ) : categories.length > 0 ? (
                <FlatList
                  data={categories}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item, index) => `${item.id || item.name || index}`}
                  numColumns={2}
                  contentContainerStyle={styles.flatListContainer}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>No categories available</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={[styles.applyButtonText, { fontFamily: getFontFamily('body') }]}>
                APPLY FILTERS ({selectedCategories.length})
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Filter Modal */}
      {showFilter && (
        <TouchableOpacity 
          style={styles.filterOverlay}
          activeOpacity={1}
          onPress={() => setShowFilter(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { fontFamily: getFontFamily('heading') }]}>Filter</Text>
              <TouchableOpacity onPress={resetWorkoutTypeFilters}>
                <Text style={[styles.resetText, { fontFamily: getFontFamily('body') }]}>Reset</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, styles.workoutTypeTitle]}>Workout Type</Text>
              
              {isLoadingWorkoutTypes ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading...</Text>
                </View>
              ) : workoutTypes.length > 0 ? (
                <FlatList
                  data={workoutTypes}
                  renderItem={renderWorkoutTypeItem}
                  keyExtractor={(item, index) => `${item.id || item.name || index}`}
                  numColumns={2}
                  contentContainerStyle={styles.flatListContainer}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={true}
                />
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>No workout types available</Text>
                </View>
              )}
            </View>
            
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
              <Text style={[styles.applyButtonText, { fontFamily: getFontFamily('body') }]}>
                APPLY FILTERS ({selectedWorkoutTypes.length})
              </Text>
              </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <FeedIcon width={24} height={24} />
          <Text style={[styles.navText, styles.activeNavText, { fontFamily: getFontFamily('bold') }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
          <EventsIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Events</Text>
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

      {/* Side Menu */}
      <SideMenu 
        isVisible={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        navigation={navigation}
      />
    </View>
      {isLoadingFeed && (
        <Loader value='Loading feed...' />
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
  },
  menuButton: {
    padding: 5,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#666666',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#FFFFFF',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  feedTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 15,
  },
  filterText: {
    fontSize: 14,
    color: '#000000',
    marginRight: 8,
  },
  dislikeButton: {
    padding: 8,
  },
  filterIconButton: {
    padding: 8,
  },
  feedContent: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 100, // Add bottom padding to create space above footer
  },
  contentCard: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 10,
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
  eventImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12, // All corners rounded
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12, // All corners rounded
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    padding: 20,
    paddingBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eventTitleSection: {
    flex: 1,
    marginRight: 15,
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
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666666',
  },
  cardTitle: {
    fontSize: 24,
    color: '#000000',
    marginBottom: 12,
    fontFamily: getFontFamily('heading'),
  },
  cardDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
    fontFamily: getFontFamily('body'),
  },
  mediaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  videoThumbnail: {
    height: 220,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  playTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 16,
    borderRightWidth: 0,
    borderBottomWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: '#000000',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 3,
  },
  freeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF', // White background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12, // Only top-left corner rounded
    borderTopRightRadius: 0, // Top-right corner square
    borderBottomLeftRadius: 0, // Bottom-left corner square
    borderBottomRightRadius: 12, // Bottom-right corner square
  },
  freeText: {
    color: '#B62020', // Red text
    fontSize: 12,
    fontFamily: getFontFamily('heading'),
  },
  lockedBadge: {
    position: 'absolute',
    bottom: 0, // Same as freeBadge
    right: 0, // Same as freeBadge
    backgroundColor: '#FFFFFF', // White background
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopLeftRadius: 12, // Only top-left corner rounded
    borderTopRightRadius: 0, // Top-right corner square
    borderBottomLeftRadius: 0, // Bottom-left corner square
    borderBottomRightRadius: 12, // Bottom-right corner rounded
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: '#B62020',
    fontSize: 12,
    fontFamily: getFontFamily('heading'),
    marginLeft: 4,
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    width: '100%',
    maxHeight: height * 0.45,
    minHeight: height * 0.45,
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 999,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterTitle: {
    fontFamily: getFontFamily('heading'),
    fontSize: 18,
    lineHeight: 20,
    letterSpacing: 0,
    color: '#000000',
  },
  resetText: {
    fontFamily: getFontFamily('body'),
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0,
    color: '#000000',
  },
  filterSection: {
    flex: 1,
    marginBottom: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 10,
  },
  flatListContainer: {
    paddingBottom: 10,
  },
  buttonContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  filterGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxIcon: {
    borderRadius: 4,
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#B62020',
    borderColor: '#B62020',
  },
  checkboxUnselected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  filterOptionTextContainer: {
    flex: 1,
  },
  applyButton: {
    borderRadius: 32,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#B62020',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: getFontFamily('body'),
  },
  workoutTypeTitle: {
    fontFamily: getFontFamily('heading'),
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: 0,
    marginBottom: 15,
  },
  lastEventCard: {
    marginBottom: 30,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
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
  dropdownOverlay: {
    position: 'absolute',
    top: 150, // Position closer to the category button
    left: 18,
    right: 18,
    zIndex: 1000,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    maxHeight: 230, // Smaller height
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownScroll: {
    padding: 8, // Smaller padding
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, // Smaller padding
    paddingHorizontal: 14, // Smaller padding
    borderRadius: 8, // Smaller radius
    marginVertical: 2, // Smaller margin
    backgroundColor: '#FFFFFF',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  dropdownItemText: {
    fontSize: 14, // Smaller font size
    color: '#333333',
    fontFamily: getFontFamily('body'),
  },
  dropdownItemTextSelected: {
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
  checkmarkContainer: {
    marginLeft: 10,
    padding: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#B62020',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryText: {
    fontSize: 12,
    color: '#333333',
    fontFamily: getFontFamily('body'),
  },
});

export default FeedScreen;
