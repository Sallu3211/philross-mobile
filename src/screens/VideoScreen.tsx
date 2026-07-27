import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  StatusBar,
  ActivityIndicator,
  Linking,
  Clipboard,
  ToastAndroid,
  Alert,
  Share,
} from 'react-native';
import { getFontFamily } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import BookIcon from '../../assets/icons/solar_book-broken.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
import PlayIcon from '../../assets/icons/solar_play-bold.svg';
import FeedIcon from '../../assets/icons/home.svg';
import FeedIconRed from '../../assets/icons/Vector.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';
import Utils from '../../app/helpers/Utilities';
import share from '../../assets/icons/share.png';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DocumentCopyIcon from '../../assets/icons/document-copy.svg';
import { getFeedItem } from '../../app/helpers/ApiHelper';
import Video from "react-native-video";
import Orientation from 'react-native-orientation-locker';
import { pushCleverTapEvent } from '../../App';

const { width, height } = Dimensions.get('window');

const VideoScreen = ({ route, navigation }: any) => {
  const [showShare, setShowShare] = useState(false);
  
  // Get source screen from route params
  const { sourceScreen } = route.params || {};
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);
  
  // Get video data from route params
  const { videoData } = route.params || {};
  
  // Use data directly from route params instead of making API call
  useEffect(() => {
    if (videoData?.slug) {
      setVideoDetails(videoData);
      fetchFeedDetails(videoData?.slug);
    } else {
      setError('No video slug provided');
    }
  }, [videoData?.slug]);
  
  // Handle social media sharing
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

  // API call for details

  const fetchFeedDetails = async (slug: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getFeedItem(slug, navigation);
      if ((response?.status || response?.success) && response?.data) {
        setVideoDetails(response?.data);
      } else {
        setError('Failed to load article details');
        return;
      }
    } catch (error) {
      console.error('❌ Error fetching feed details:', error);
      setError('Failed to load article details');
    } finally {
      setIsLoading(false);
    }
  };


  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { fontFamily: getFontFamily('bold') }]}>Video</Text>
        <View style={styles.headerActions}>
          {/* <TouchableOpacity style={styles.actionButton}>
            <BookIcon width={24} height={24} />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowShare(true)}>
            <ShareIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B62020" />
            <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
              Loading video details...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { fontFamily: getFontFamily('bold') }]}>
              Error Loading Video
            </Text>
            <Text style={[styles.errorMessage, { fontFamily: getFontFamily('body') }]}>
              {error}
            </Text>
                         <TouchableOpacity style={styles.retryButton} onPress={() => {
               if (videoData?.slug) {
                 setVideoDetails(videoData);
                 setIsLoading(false);
               }
             }}>
               <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>
                 Retry
               </Text>
             </TouchableOpacity>
          </View>
        )}

        {/* Video Content - Show only when data is loaded */}
        {!isLoading && !error && (videoDetails) && (
          <>
            {/* Main Video Section */}
            <View style={styles.videoSection}>
              <FeedVideoPlayer
                thumbnailUrl={videoDetails?.cropped_thumbnail_url}
                videUrl={videoDetails?.video || ''}
                title={videoDetails?.headline || 'Video Title'}
              />
              {/* Video Title and Description */}
              <View style={styles.videoInfo}>
                <Text style={[styles.videoTitle, { fontFamily: getFontFamily('heading') }]}>
                  {videoDetails?.headline || 'Video Title'}
                </Text>
                
                {/* Display multiple categories */}
                {videoDetails?.tag_category && (
                  <View style={styles.categoriesContainer}>
                    {Array.isArray(videoDetails.tag_category) ? (
                      videoDetails.tag_category.map((category: any, catIndex: number) => (
                        <View key={catIndex} style={styles.categoryBadge}>
                          <Text style={[styles.categoryText, { fontFamily: getFontFamily('body') }]}>
                            {category.name || category}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.categoryBadge}>
                        <Text style={[styles.categoryText, { fontFamily: getFontFamily('body') }]}>
                          {videoDetails.tag_category.name || videoDetails.tag_category}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                
                <Text style={[styles.videoDescription, { fontFamily: getFontFamily('body') }]}>
                  {videoDetails?.description || 'Video description will appear here.'}
                </Text>
              </View>
            </View>

        {/* Related Content Section */}
            {videoDetails?.related_feeds && videoDetails.related_feeds.length > 0 && (
        <View style={styles.relatedSection}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>Related Content</Text>
                <View style={styles.relatedGrid}>
                  {videoDetails.related_feeds.slice(0, 2).map((video: any, index: number) => (
                 <TouchableOpacity 
                   key={index} 
                      style={styles.videoCard}
                      onPress={() => navigation.push('Video', { videoData: video })}
                    >
                      <View style={styles.videoCardImage}>
                        {video.cropped_thumbnail_url || video.thumbnail_url ? (
                       <Image
                            source={{ uri: video.cropped_thumbnail_url || video.thumbnail_url }}
                            style={styles.videoCardThumbnail}
                         resizeMode="cover"
                       />
                     ) : (
                          <View style={styles.videoCardPlaceholder}>
                            <PlayIcon width={24} height={24} fill="#FFFFFF" />
                          </View>
                        )}
                        <View style={styles.playButtonOverlay}>
                          <PlayIcon width={24} height={24} fill="#FFFFFF" />
                     </View>
                   </View>
                      <View style={styles.videoCardContent}>
                        <Text
                          style={[styles.videoCardTitle, { fontFamily: getFontFamily('bold') }]}
                          numberOfLines={2}
                        >
                          {video.headline || video.title || 'Video Title'}
                        </Text>
                 </View>
                    </TouchableOpacity>
                  ))}
                     </View>
                   </View>
             )}
        </>
        )}
      </ScrollView>

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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
          <EventsIcon width={24} height={24} />
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
    </View>
  );
};

type VideoType = {
  videUrl: string;
  thumbnailUrl: string;
  title: string;
};

const FeedVideoPlayer = (video: VideoType) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    pushCleverTapEvent('video_viewed', { videoType: 'feed_video', name: video.title });
  }, [])

  return (
    <View style={styles.videoContainer}>
      {isPlaying ? (<>
        <Video
          source={{
            uri: video.videUrl,
            bufferConfig: {
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
              backBufferDurationMs: 120000,
              cacheSizeMB: 200,
            }
          }}
          style={styles.video}
          resizeMode="contain"
          paused={false}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          controls={true}
          controlsStyles={{ hideNext: true, hidePrevious: true, hideForward: true}}
        />
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </>
      ) : (
        <>
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail} />
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setIsPlaying(true)}>
            <PlayIcon width={40} height={40} fill="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
  },
  backButton: {
    padding: 5,
  },
  screenTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  videoSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  videoInfo: {
    marginTop: 10,
    marginBottom: 20,
  },
  videoTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 12,
  },
  videoDescription: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  relatedSection: {
    marginBottom: 30,
    paddingLeft: 2,
    paddingRight: 20,
  },
  relatedGrid: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
  },
  videoCard: {
    width: (width - 56) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 10,
  },
  videoCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoCardThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoCardPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  videoCardTitle: {
    fontSize: 12,
    color: '#000000',
    lineHeight: 16,
    fontFamily: getFontFamily('heading'),
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
    paddingVertical: 8,
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
  shareOverlay: {
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
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingRight: 20, // Add right padding for close button
  },
  closeButton: {
    fontSize: 24,
    color: '#000000',
    fontFamily: getFontFamily('bold'),
    padding: 5,
  },
  shareContent: {
    alignItems: 'center',
    paddingTop: 15,
    paddingHorizontal: 20, // Add horizontal padding to content
  },
  shareIconContainer: {
    marginBottom: 2,
  },
  shareIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B62020',
    borderRadius: 40,
  },
  shareTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 30,
  },
  shareLinkSection: {
    width: '100%',
    marginBottom: 30,
  },
  shareSectionTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 15,
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
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  copyButton: {
    padding: 5,
  },
  shareToSection: {
    width: '100%',
    marginBottom: 10,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent background
  },
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 15,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#B62020',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#B62020',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: getFontFamily('bold'),
  },

  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "black",
    borderRadius: 12,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: "cover",
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  playBtn: {
    position: "absolute",
    top: "40%",
    left: "40%",
  },

  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  categoryBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 12,
    color: '#666666',
  },
  socialIcons: {
    width: Utils.normalize(48),
    height: Utils.normalize(48),
  },
});

export default VideoScreen;
