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
  Alert,
  Linking,
  Clipboard,
  ToastAndroid,
  Share,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import BookIcon from '../../assets/icons/solar_book-broken.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
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
import { pushCleverTapEvent } from '../../App';

const { width, height } = Dimensions.get('window');

const FeedDetailsScreen = ({ route, navigation }: any) => {
  const colors = getColors();
  const [showShare, setShowShare] = useState(false);
  
  // Get source screen from route params
  const { sourceScreen } = route.params || {};
  
  // Get feed data from route params
  const { feedSlug } = route.params || {};
  const [feedData, setFeedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

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
  
  useEffect(() => {
    pushCleverTapEvent('article_viewed', {});
  }, [])
  
  // Fetch feed details when component mounts
  useEffect(() => {
    if (feedSlug) {
      fetchFeedDetails();
    } else {
      setError('No feed slug provided');
    }
  }, [feedSlug]);

  // Fetch feed details from API
  const fetchFeedDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getFeedItem(feedSlug, navigation);
      
      let feedDataToSet: any = null;
      
      // Handle the actual API response structure: {data: {...}, status: true}
      if (response?.status && response?.data) {
        feedDataToSet = response.data;
      } else if (response?.success && response?.data) {
        feedDataToSet = response.data;
      } else if (response?.data) {
        feedDataToSet = response.data;
      } else if (response && typeof response === 'object') {
        feedDataToSet = response;
      } else {
        setError('Failed to load article details');
        return;
      }
      
      setFeedData(feedDataToSet);
      
    } catch (error) {
      console.error('❌ Error fetching feed details:', error);
      setError('Failed to load article details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    setShowShare(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Feed')}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { fontFamily: getFontFamily('bold') }]}>Loading...</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading article details...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Feed')}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { fontFamily: getFontFamily('bold') }]}>Error</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFeedDetails}>
            <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show feed data
  if (!feedData) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Feed')}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { fontFamily: getFontFamily('bold') }]}>Article Not Found</Text>
          <View style={styles.headerActions} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>Article not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Feed')}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { fontFamily: getFontFamily('bold') }]}>Article</Text>
        <View style={styles.headerActions}>
          {/* <TouchableOpacity style={styles.actionButton}>
            <BookIcon width={24} height={24} />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <ShareIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Article Section */}
        <View style={styles.articleSection}>
          <View style={styles.articleImage}>
            {feedData?.cropped_image_url ? (
              <Image
                source={{ uri: feedData.cropped_image_url }}
                style={styles.articleThumbnail}
                resizeMode="cover"
              />
            ) : null}
          </View>
          
          {feedData?.headline ? (
            <Text style={[styles.articleTitle, { fontFamily: getFontFamily('heading') }]}>
              {feedData.headline}
            </Text>
          ) : null}
          
          {/* Display multiple categories */}
          {feedData?.tag_category && (
            <View style={styles.categoriesContainer}>
              {Array.isArray(feedData.tag_category) ? (
                feedData.tag_category.map((category: any, catIndex: number) => (
                  <View key={catIndex} style={styles.categoryBadge}>
                    <Text style={[styles.categoryText, { fontFamily: getFontFamily('body') }]}>
                      {category.name || category}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.categoryBadge}>
                  <Text style={[styles.categoryText, { fontFamily: getFontFamily('body') }]}>
                    {feedData.tag_category.name || feedData.tag_category}
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Author and Date Section - Only show if data exists */}
          {(feedData?.author || feedData?.created_at) && (
            <View style={styles.authorDateSection}>
              <View style={styles.authorInfo}>
                {feedData?.author_profile_image ? (
                  <Image
                    source={{ uri: feedData.author_profile_image }}
                    style={styles.authorProfileImage}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.authorTextContainer}>
                  {feedData?.author && (
                    <Text style={[styles.authorText, { fontFamily: getFontFamily('body') }]}>
                      {feedData.author}
                    </Text>
                  )}
                  {feedData?.created_at && (
                    <Text style={[styles.dateText, { fontFamily: getFontFamily('body') }]}>
                      {new Date(feedData.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
          
          {feedData?.description ? (
            <Text style={[styles.articleDescription, { fontFamily: getFontFamily('body') }]}>
              {feedData.description}
            </Text>
          ) : null}
        </View>

        {/* Focus On Section - Only show if focus_on data exists */}
        {feedData?.focus_on && feedData.focus_on.length > 0 && (
          <View style={styles.focusSection}>
            <Text style={[styles.focusTitle, { fontFamily: getFontFamily('bold') }]}>Focus on</Text>
            <View style={styles.focusList}>
              {feedData.focus_on.map((point: string, index: number) => (
                <View key={index} style={styles.focusItem}>
                  <View style={styles.checkmarkIcon}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                  <Text style={[styles.focusText, { fontFamily: getFontFamily('body') }]}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Call to Action Section - Only show if CTA data exists */}
        {feedData?.call_to_action && (
          <View style={styles.ctaSection}>
            <Text style={[styles.ctaText, { fontFamily: getFontFamily('body') }]}>
              {feedData.call_to_action}
            </Text>
          </View>
        )}

        {/* More Articles Section - Only show if related_articles exist */}
        {feedData?.related_articles && feedData.related_articles.length > 0 && (
          <View style={styles.moreArticlesSection}>
            <Text style={[styles.moreArticlesTitle, { fontFamily: getFontFamily('heading') }]}>
              More Articles You'll Like
            </Text>
            
            <View style={styles.moreArticlesGrid}>
              {feedData.related_articles.slice(0, 2).map((article: any, index: number) => (
                <TouchableOpacity key={index} style={styles.articleCard}>
                  <View style={styles.articleCardImage}>
                    {article.image_url ? (
                      <Image
                        source={{ uri: article.image_url }}
                        style={styles.articleCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <FeedIcon width={60} height={60} />
                    )}
                  </View>
                  <View style={styles.articleCardContent}>
                    <Text 
                      style={[styles.articleCardTitle, { fontFamily: getFontFamily('bold') }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {article.headline || article.title || 'Related Article'}
                    </Text>
                    {article.read_time && (
                      <Text style={[styles.articleCardReadTime, { fontFamily: getFontFamily('body') }]}>
                        {article.read_time} min read
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Articles from Feed API Section - Show when related_articles are not available */}
        {(!feedData?.related_articles || feedData.related_articles.length === 0) && route.params?.feedData && (
          <View style={styles.moreArticlesSection}>
            <Text style={[styles.moreArticlesTitle, { fontFamily: getFontFamily('heading') }]}>
              More Articles You'll Like
            </Text>
            
            {(() => {
              const availableArticles = route.params.feedData.filter((item: any) => 
                (item.feed_type === 'article' || item.type === 'article') && 
                item.slug !== feedSlug
              );
              
              if (availableArticles.length > 0) {
                return (
                  <View style={styles.moreArticlesGrid}>
                    {availableArticles.slice(0, 2).map((article: any, index: number) => (
                      <TouchableOpacity 
                        key={index} 
                        style={styles.articleCard}
                        onPress={() => {
                          // Navigate to the article
                          if (article.slug) {
                            navigation.navigate('FeedDetails', {
                              feedSlug: article.slug,
                              feedData: route.params.feedData
                            });
                          }
                        }}
                      >
                        <View style={styles.articleCardImage}>
                          {article.cropped_image_url || article.image_url ? (
                            <Image
                              source={{ uri: article.cropped_image_url || article.image_url }}
                              style={styles.articleCardImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <FeedIcon width={60} height={60} />
                          )}
                        </View>
                        <View style={styles.articleCardContent}>
                          <Text 
                            style={[styles.articleCardTitle, { fontFamily: getFontFamily('bold') }]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {article.headline || article.title || 'Article Title'}
                          </Text>
                          {article.read_time && (
                            <Text style={[styles.articleCardReadTime, { fontFamily: getFontFamily('body') }]}>
                              {article.read_time} min read
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              } else {
                return (
                  <View style={styles.noMoreContentContainer}>
                    <Text style={[styles.noMoreContentText, { fontFamily: getFontFamily('body') }]}>
                      No More Content
                    </Text>
                  </View>
                );
              }
            })()}
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('heading'),
  },
  content: {
    flex: 1,
  },
  articleSection: {
    padding: 20,
  },
  articleImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  articleThumbnail: {
    width: '100%',
    height: '100%',
  },
  articlePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  articleTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 16,
    lineHeight: 32,
  },
  articleDescription: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
    marginBottom: 20,
  },
  authorDateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#B62020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
  },
  authorTextContainer: {
    flexDirection: 'column',
  },
  authorText: {
    fontSize: 14,
    color: '#666666',
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
  },
  focusSection: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  focusTitle: {
    fontSize: 20,
    color: '#000000',
    marginBottom: 16,
  },
  focusList: {
    // Empty for now
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmarkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#B62020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
  },
  focusText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  ctaSection: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 26,
  },
  moreArticlesSection: {
    padding: 20,
  },
  moreArticlesTitle: {
    fontSize: 20,
    color: '#000000',
    marginBottom: 16,
  },
  moreArticlesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleCard: {
    width: (width - 60) / 2,
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
  articleCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  articleCardContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  articleCardTitle: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 8,
    lineHeight: 16,
    fontFamily: getFontFamily('heading'),
  },
  articleCardReadTime: {
    fontSize: 12,
    color: '#666666',
  },
  relatedSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 16,
  },
  relatedArticles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  relatedArticle: {
    width: (width - 60) / 2,
    alignItems: 'center',
  },
  relatedThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  relatedArticleTitle: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    fontFamily: getFontFamily('body'),
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
    padding: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  copyButton: {
    padding: 8,
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
  noMoreContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noMoreContentText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
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

export default FeedDetailsScreen;
