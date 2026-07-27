import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  Clipboard,
  ToastAndroid,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MapView, { Marker } from 'react-native-maps';
import { getFontFamily, getColors } from '../utils/platform';
import FeedIcon from '../../assets/icons/home.svg';
import FeedIconRed from '../../assets/icons/Vector.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import EventsIconRed from '../../assets/icons/calendar_red.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
import DocumentCopyIcon from '../../assets/icons/document-copy.svg';
import share from '../../assets/icons/share.png';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';
import Utils from '../../app/helpers/Utilities';
import LocationIcon from '../../assets/icons/location.svg';
import { getEventDetail } from '../../app/helpers/ApiHelper';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const EventDetailsScreen = ({ route, navigation }: any) => {
  const colors = getColors();
  
  // Get event slug and source screen from route params
  const { eventSlug, sourceScreen = 'Events' } = route.params || {};
  
  // Event API state
  const [eventData, setEventData] = useState<any>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  
  // Share modal state
  const [showShare, setShowShare] = useState(false);



  // Fetch event details when component mounts
  useEffect(() => {
    if (eventSlug) {
      fetchEventDetails();
    } else {
      setError('No event slug provided');
    }
  }, [eventSlug]);

  // Fetch event details from API
  const fetchEventDetails = async () => {
    try {
      setIsLoadingEvent(true);
      setError(null);
      

      
      const response = await getEventDetail(eventSlug, navigation);
      

      
      let eventDataToSet: any = null;
      
      // Handle the actual API response structure: {data: {...}, status: true}
      if (response?.status && response?.data) {

        eventDataToSet = response.data;
      } else if (response?.success && response?.data) {

        eventDataToSet = response.data;
      } else if (response?.data) {

        eventDataToSet = response.data;
      } else if (response && typeof response === 'object') {

        eventDataToSet = response;
      } else {

        setError('Failed to load event details');
        return;
      }
      
      // Debug instructor data
      if (eventDataToSet?.instructor) {
        console.log('👨‍🏫 Instructor data received:', JSON.stringify(eventDataToSet.instructor, null, 2));
        console.log('👨‍🏫 Instructor image URLs:');
        console.log('  - image:', eventDataToSet.instructor.image);
        console.log('  - profile_image_url:', eventDataToSet.instructor.profile_image_url);
        console.log('  - image_url:', eventDataToSet.instructor.image_url);
        console.log('  - avatar_url:', eventDataToSet.instructor.avatar_url);
        console.log('👨‍🏫 Instructor name fields:');
        console.log('  - name:', eventDataToSet.instructor.name);
        console.log('  - full_name:', eventDataToSet.instructor.full_name);
        console.log('  - id:', eventDataToSet.instructor.id);
      } else {
        console.log('❌ No instructor data found in event');
      }

      setEventData(eventDataToSet);
      

      
    } catch (error) {

      setError('Failed to load event details');
    } finally {
      setIsLoadingEvent(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleMapPress = async () => {
    if (!(eventData?.latitude && eventData?.longitude)) return;

    const { name, location, latitude, longitude } = eventData;
    const query = encodeURIComponent(`${name}, ${location}`);

    if (Platform.OS == 'ios') {
      const isAppleMapInstalled = await Linking.canOpenURL('maps://');
      const appleMapURL = `maps://?address=${query}&q=${encodeURIComponent(name)}&ll=${latitude},${longitude}`;
      const appleMapBrowserURL = `https://maps.apple.com/?address=${query}&q=${encodeURIComponent(name)}&ll=${latitude},${longitude}`;
      await Linking.openURL(isAppleMapInstalled ? appleMapURL : appleMapBrowserURL);
    } else {
      const googleMapURL = `geo:${latitude},${longitude}?q=${query}`;
      const googleMapBrowserURL = `https://www.google.com/maps?q=${latitude},${longitude}(${query})`;
      const isGoogleMapInstalled = await Linking.canOpenURL(googleMapURL);
      await Linking.openURL(isGoogleMapInstalled ? googleMapURL : googleMapBrowserURL);
    }
  };

  // Format date for display
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric'
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Date TBD';
    }
  };

  // Format time range
  const formatTimeRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startTime = start.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = end.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    } catch (error) {
      return 'Time TBD';
    }
  };

  // Show loading state
  if (isLoadingEvent) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Loading...</Text>
          <View style={styles.navButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading event details...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Error</Text>
          <View style={styles.navButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchEventDetails}>
            <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show event data
  if (!eventData) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Event Not Found</Text>
          <View style={styles.navButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>Event not found</Text>
        </View>
      </View>
    );
  }

  const handleLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert(
        'Link Error',
        `Could not open: ${url}\n\nError: ${error?.message || 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSocialShare = async (platform: string) => {
    const androidAppUrl = 'https://play.google.com/store/apps/details?id=com.philross';
    const iosAppUrl = 'https://apps.apple.com/us/app/philross/id6751194230';
    const shareMessage = `Master Phil App – Train Smarter. Get Stronger.\nUnlock expert training, fitness routines & the BodyBell Method® – anytime, anywhere!\n\nDownload now:\nAndroid: ${androidAppUrl}\niOS: ${iosAppUrl}`;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'telegram':
        shareUrl = `tg://msg?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'instagram':
        try {
          await Clipboard.setString(shareMessage);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Message copied to clipboard', ToastAndroid.SHORT);
          } else {
            Alert.alert('Message Copied', 'Master Phil app message copied to clipboard.');
          }
        } catch (e) {
          console.log('Copy failed:', e);
        }
        return;
      default:
        return;
    }

    if (shareUrl) {
      try {
        await Linking.openURL(shareUrl);
      } catch (error) {
        console.log('Failed to open URL:', error);
        await Share.share({ message: shareMessage });
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Event Details</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleShare}>
          <ShareIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Image */}
        <View style={styles.eventImageContainer}>
          {eventData?.cropped_image_url ? (
            <Image
              source={{ uri: eventData.cropped_image_url }}
              style={styles.eventImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.eventImagePlaceholder}>
              <Icon name="calendar-outline" size={60} color="#CCCCCC" />
            </View>
          )}
        </View>
        
        {/* Event Content */}
        <View style={styles.eventContent}>
          {/* Title and Description */}
          <Text style={[styles.eventTitle, { fontFamily: getFontFamily('bold') }]}>
            {eventData?.name || 'Event Title'}
          </Text>
          <Text style={[styles.eventDescription, { fontFamily: getFontFamily('body') }]}>
            {eventData?.description || 'No description available'}
          </Text>

          {/* Event Details */}
          <View style={[styles.eventDetails, { marginBottom: eventData?.event_type == 'virtual' ? 0 : 25 }]}>


            <View style={styles.detailRow}>
              <LocationIcon width={14} height={14} />
              <Text 
                style={[styles.detailText, { fontFamily: getFontFamily('body') }]}
                numberOfLines={2}
              >
                {eventData?.event_type == 'virtual' ? 'Virtual' : eventData?.location || 'Location TBD'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <EventsIcon width={14} height={14} />
              <View style={styles.dateTimeContainer}>
                {eventData?.start_datetime ? (
                  <>
                    <Text style={[styles.dateText, { fontFamily: getFontFamily('body') }]}>
                      {formatEventDate(eventData.start_datetime)}
                    </Text>
                    <Text style={[styles.timeText, { fontFamily: getFontFamily('body') }]}>
                      {formatTimeRange(eventData.start_datetime, eventData.end_datetime)}
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.dateText, { fontFamily: getFontFamily('body') }]}>
                    Date & Time TBD
                  </Text>
                )}
              </View>
            </View>
          </View>

          {eventData?.event_type == 'virtual' ?
            <TouchableOpacity onPress={() => handleLink(eventData?.virtual_event_link)} style={styles.mapSection}>
              <Text style={[styles.mapText, { fontFamily: getFontFamily('body') }]}>
                Event Link
              </Text>
              <Text style={[styles.coordinatesText, { fontFamily: getFontFamily('body') }]}>
                {eventData?.virtual_event_link}
              </Text>
            </TouchableOpacity> :
            <View style={styles.mapSection}>
              {eventData?.latitude != null && eventData?.longitude != null ? (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.mapView}
                    region={{
                      latitude: Number.parseFloat(eventData.latitude),
                      longitude: Number.parseFloat(eventData.longitude),
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsCompass={true}
                    showsScale={true}
                    onPress={handleMapPress}
                    focusable
                    provider='google'
                    googleMapId={Platform.OS === 'android' ? 'AIzaSyDFxmKbo9cbdZXLT9jBsTW8AcLZpautTwU' : 'AIzaSyBY2EUiYpSxkKFhaJGAKewgN11PWyrACts'}
                  >
                    <Marker
                      coordinate={{
                        latitude: Number.parseFloat(eventData.latitude),
                        longitude: Number.parseFloat(eventData.longitude),
                      }}
                      title={eventData?.name || eventData?.title || 'Event Location'}
                      description={eventData?.location || 'Event Location'}
                      pinColor="#B62020"
                    />
                  </MapView>
                  <TouchableOpacity style={{...styles.mapClick, pointerEvents: 'box-none'}} onPress={handleMapPress} />
                </View>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <LocationIcon width={32} height={32} />
                  <Text style={[styles.mapText, { fontFamily: getFontFamily('body') }]}>
                    Map View
                  </Text>
                  <Text style={[styles.coordinatesText, { fontFamily: getFontFamily('body') }]}>
                    Location coordinates not available
                  </Text>
                </View>
              )}
            </View>
          }

          {/* Pricing */}
          {eventData?.pricing_options && eventData.pricing_options.length > 0 && (
            <View style={styles.pricingSection}>
              <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>Pricing:</Text>
              <View style={styles.pricingButtons}>
                {eventData.pricing_options.map((option: any, index: number) => (
                  <TouchableOpacity key={index} style={styles.pricingButton}>
                    <Text style={[styles.pricingText, { fontFamily: getFontFamily('bold') }]}>
                      {option.name ? option.name.replace('_', ' ').toUpperCase() : 'Standard'} - ${Number.parseFloat(option.price || '0').toFixed(2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Instructor */}
          {eventData?.instructor && (
            <View style={styles.instructorSection}>
              <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>Instructor:</Text>
              <View style={styles.instructorInfo}>
                <View style={styles.instructorImage}>
                  {eventData.instructor?.image ? (
                    <Image
                      source={{ uri: eventData.instructor.image }}
                      style={styles.instructorImageStyle}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('❌ Instructor image failed to load:', eventData.instructor.image, error);
                      }}
                      onLoad={() => {
                        console.log('✅ Instructor image loaded successfully:', eventData.instructor.image);
                      }}
                    />
                  ) : eventData.instructor?.profile_image_url ? (
                    <Image
                      source={{ uri: eventData.instructor.profile_image_url }}
                      style={styles.instructorImageStyle}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('❌ Instructor profile image failed to load:', eventData.instructor.profile_image_url, error);
                      }}
                      onLoad={() => {
                        console.log('✅ Instructor profile image loaded successfully:', eventData.instructor.profile_image_url);
                      }}
                    />
                  ) : eventData.instructor?.image_url ? (
                    <Image
                      source={{ uri: eventData.instructor.image_url }}
                      style={styles.instructorImageStyle}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('❌ Instructor image_url failed to load:', eventData.instructor.image_url, error);
                      }}
                      onLoad={() => {
                        console.log('✅ Instructor image_url loaded successfully:', eventData.instructor.image_url);
                      }}
                    />
                  ) : eventData.instructor?.avatar_url ? (
                    <Image
                      source={{ uri: eventData.instructor.avatar_url }}
                      style={styles.instructorImageStyle}
                      resizeMode="cover"
                      onError={(error) => {
                        console.log('❌ Instructor avatar failed to load:', eventData.instructor.avatar_url, error);
                      }}
                      onLoad={() => {
                        console.log('✅ Instructor avatar loaded successfully:', eventData.instructor.avatar_url);
                      }}
                    />
                  ) : (
                    <View style={styles.instructorPlaceholder}>
                      <Icon name="person" size={30} color="#CCCCCC" />
                    </View>
                  )}
                </View>
                <Text style={[styles.instructorName, { fontFamily: getFontFamily('bold') }]}>
                  {eventData.instructor?.name || eventData.instructor?.full_name || `Instructor ${eventData.instructor?.id || ''}`}
                </Text>
              </View>
            </View>
          )}

          {/* Call to Action Button */}
          <TouchableOpacity onPress={()=>handleLink(eventData?.destination_link)} style={styles.ctaButton}>
            <Text style={[styles.ctaText, { fontFamily: getFontFamily('bold') }]}>
              LOCK IN YOUR SPOT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Share Modal */}
      {showShare && (
        <View style={styles.shareOverlay}>
          <View style={[styles.shareModal, { paddingBottom: insets.bottom }]}>
            <View style={styles.shareHeader}>
              <TouchableOpacity onPress={() => setShowShare(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.shareContent}>
              <View style={styles.shareIconContainer}>
                <View style={styles.shareIcon}>
                  <Image source={share} style={{ height: 40, width: 40 }} />
                </View>
              </View>
              <Text style={[styles.shareTitle, { fontFamily: getFontFamily('bold') }]}>Share</Text>
              
              <View style={styles.shareLinkSection}>
                <View style={styles.contentContainer}>
                  <Text style={[styles.contentText, { fontFamily: getFontFamily('bold') }]}>
                    PhilRoss App – Train Smarter. Get Stronger.{'\n'}
                    Unlock expert training, fitness routines & the BodyBell Method® – anytime, anywhere!
                  </Text>
                </View>
                
                <Text style={[styles.downloadTitle, { fontFamily: getFontFamily('bold') }]}>Download now:</Text>
                
                <View style={styles.downloadSection}>
                  <View style={styles.linkContainer}>
                    <Text style={[styles.linkText, { fontFamily: getFontFamily('body') }]}>
                      https://play.google.com/store/apps/details?id=com.philross
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => {
                        const androidLink = 'https://play.google.com/store/apps/details?id=com.philross';
                        try {
                          Clipboard.setString(androidLink);
                          if (Platform.OS === 'android') {
                            ToastAndroid.show('Android link copied', ToastAndroid.SHORT);
                          } else {
                            Alert.alert('Link Copied', 'Android link copied to clipboard');
                          }
                        } catch (e) {
                          console.log('Copy failed:', e);
                          Alert.alert('Copy Failed', 'Unable to copy link, please try again.');
                        }
                      }}
                    >
                      <DocumentCopyIcon width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.linkContainer}>
                    <Text style={[styles.linkText, { fontFamily: getFontFamily('body') }]}>
                      https://apps.apple.com/us/app/philross/id6751194230
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => {
                        const iosLink = 'https://apps.apple.com/us/app/philross/id6751194230';
                        try {
                          Clipboard.setString(iosLink);
                          if (Platform.OS === 'android') {
                            ToastAndroid.show('iOS link copied', ToastAndroid.SHORT);
                          } else {
                            Alert.alert('Link Copied', 'iOS link copied to clipboard');
                          }
                        } catch (e) {
                          console.log('Copy failed:', e);
                          Alert.alert('Copy Failed', 'Unable to copy link, please try again.');
                        }
                      }}
                    >
                      <DocumentCopyIcon width={20} height={20} />
                  </TouchableOpacity>
                  </View>
                </View>
              </View>
              
              <View style={styles.shareToSection}>
                <Text style={[styles.shareSectionTitle, { fontFamily: getFontFamily('bold') }]}>Share to</Text>
                <View style={styles.socialButtons}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('facebook')}>
                    <Image source={FbIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('whatsapp')}>
                    <Image source={WhatsAppIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('instagram')}>
                    <Image source={InstagramIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('twitter')}>
                   <Image source={XIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('telegram')}>
                    <Image source={TelegramIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feed')}>
          {sourceScreen === 'Feed' ? (
            <FeedIconRed width={24} height={24} />
          ) : (
            <FeedIcon width={24} height={24} />
          )}
          <Text style={[styles.navText, sourceScreen === 'Feed' && styles.activeNavText, { fontFamily: getFontFamily('body') }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          {sourceScreen === 'Events' ? (
            <EventsIconRed width={24} height={24} />
          ) : (
            <EventsIcon width={24} height={24} />
          )}
          <Text style={[styles.navText, sourceScreen === 'Events' && styles.activeNavText, { fontFamily: getFontFamily('body') }]}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Products')}>
          <ProductsIcon width={24} height={24} />
          <Text style={[styles.navText, sourceScreen === 'Products' && styles.activeNavText, { fontFamily: getFontFamily('body') }]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyCoach')}>
          <MyCoachIcon width={24} height={24} />
          <Text style={[styles.navText, sourceScreen === 'MyCoach' && styles.activeNavText, { fontFamily: getFontFamily('body') }]}>My Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Courses')}>
          <CoursesIcon width={24} height={24} />
          <Text style={[styles.navText, sourceScreen === 'Courses' && styles.activeNavText, { fontFamily: getFontFamily('body') }]}>Courses</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 15,
  },
  navButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  content: {
    flex: 1,
  },
  eventImageContainer: {
    width: '100%',
    height: 250,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  eventImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 15,
  },
  eventDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 20,
  },
  eventDetails: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  detailText: {
    fontSize: 10,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  dateTimeContainer: {
    marginLeft: 8,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 3,
    fontFamily: getFontFamily('body'),
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
  separator: {
    fontSize: 10,
    color: '#666666',
    marginHorizontal: 6,
  },
  mapSection: {
    marginBottom: 25,
  },
  mapContainer: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapClick: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 3,
    zIndex: 100,
  },
  mapView: {
    width: '100%',
    height: 190,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    width: '100%',
    height: 190,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  pricingSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 15,
  },
  pricingButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
  },
  pricingButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    minWidth: 120,
  },
  pricingText: {
    fontSize: 11,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  instructorSection: {
    marginBottom: 30,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorImage: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  instructorImageStyle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  instructorName: {
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  instructorPlaceholder: {
    width: 35,
    height: 35,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 17.5,
  },
  ctaButton: {
    backgroundColor: '#B62020',
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: getFontFamily('bold'),
    color: '#FFFFFF',
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
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 5,
  },
  shareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  shareModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 0, // Remove all padding
    width: '100%',
    // height: '100%', // Full screen height
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // top: 250, // Moved up to provide more space at bottom
  },
  closeButton: {
    fontSize: 24,
    color: '#000000',
    fontFamily: getFontFamily('bold'),
    padding: 5,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingRight: 20, // Add right padding for close button
  },
  shareContent: {
   paddingTop: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B62020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareIcon: {
    width: 40,
    height: 40,
  },
  shareTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
  },
  shareLinkSection: {
    width: '100%',
    marginBottom: 20,
  },
  shareSectionTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    paddingRight: 10,
  },
  copyButton: {
    padding: 5,
  },
  shareToSection: {
    width: '100%',
    marginBottom: 10,
    // marginTop: -60,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  contentContainer: {
    marginBottom: 20,
  },
  contentText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  downloadTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
    marginTop: -2,
  },
  downloadSection: {
    gap: 12,
    marginBottom: 40,
    marginTop: -10,
  },
  socialIcons: {
    width: Utils.normalize(48),
    height: Utils.normalize(48),
  },
});

export default EventDetailsScreen;
