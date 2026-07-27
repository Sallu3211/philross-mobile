import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  ToastAndroid,
  Clipboard,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontFamily, getColors } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
import TickCircleIcon from '../../assets/icons/tick-circle.svg';
import { getCoachDetail } from '../../app/helpers/ApiHelper';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';
import Utils from '../../app/helpers/Utilities';

const { width, height } = Dimensions.get('window');

const CoachDetailsScreen = ({ route, navigation }: any) => {
  const colors = getColors();
  
  // Get coach slug from route params
  const { coachSlug } = route.params || {};
  
  // Coach API state
  const [coachData, setCoachData] = useState<any>(null);
  const [isLoadingCoach, setIsLoadingCoach] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Share modal state
  const [showShare, setShowShare] = useState(false);

  // Fetch coach details when component mounts
  useEffect(() => {
    if (coachSlug) {
      fetchCoachDetails();
    } else {
      setError('No coach slug provided');
    }
  }, [coachSlug]);

  // Fetch coach details from API
  const fetchCoachDetails = async () => {
    try {
      setIsLoadingCoach(true);
      setError(null);
      
      const response = await getCoachDetail(coachSlug, navigation);
      
      let coachDataToSet: any = null;
      
      // Handle the actual API response structure: {data: {...}, status: true}
      if (response?.status && response?.data) {
        coachDataToSet = response.data;
      } else if (response?.success && response?.data) {
        coachDataToSet = response.data;
      } else if (response?.data) {
        coachDataToSet = response.data;
      } else if (response && typeof response === 'object') {
        coachDataToSet = response;
      } else {
        setError('Failed to load coach details');
        return;
      }
      
      console.log('👨‍🏫 Coach details from API:', coachDataToSet);
      console.log('👨‍🏫 Coach instructor data:', coachDataToSet?.instructor);
      console.log('👨‍🏫 Coach instructor type:', typeof coachDataToSet?.instructor);
      console.log('👨‍🏫 Coach instructor keys:', coachDataToSet?.instructor ? Object.keys(coachDataToSet.instructor) : 'No instructor');
      
      setCoachData(coachDataToSet);
      
    } catch (error) {
      setError('Failed to load coach details');
    } finally {
      setIsLoadingCoach(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleStartIntakeForm = async () => {
    try {
      if (!coachData?.id) {
        console.log('❌ No coach ID available for intake form');
        Alert.alert('Error', 'Coach information not available');
        return;
      }

      console.log('🚀 Starting intake form for coach ID:', coachData.id);
      
      // Navigate directly to IntakeForm since the API endpoint doesn't exist
      console.log('✅ Navigating directly to IntakeForm');
      navigation.navigate('IntakeForm', { 
        coachId: coachData.id,
        coachSlug: coachData.slug,
        instructorEmail: coachData.instructor?.email,
        instructorName: coachData.instructor?.full_name
      });
      
    } catch (error) {
      console.error('❌ Error starting intake form:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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

  // Show loading state
  if (isLoadingCoach) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Loading...</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading coach details...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Error</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCoachDetails}>
            <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show coach data
  if (!coachData) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Coach Not Found</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>Coach not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>
          {coachData?.headline || 'Coach Details'}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Coach Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Icon name="person" size={80} color="#CCCCCC" />
          </View>
        </View>
        
        {/* Coach Content */}
        <View style={styles.coachContent}>
          {/* Title and Description */}
          <View style={styles.titleSection}>
            <Text style={[styles.coachTitle, { fontFamily: getFontFamily('heading') }]}>
              {coachData?.headline || 'Coach Title'}
            </Text>
            <Text style={[styles.coachDescription, { fontFamily: getFontFamily('body') }]}>
              {coachData?.description || 'No description available'}
            </Text>
          </View>

          {/* Key Benefits */}
          {coachData?.key_benefits && coachData.key_benefits.length > 0 && (
            <View style={styles.benefitsSection}>
              <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>Key Benefits</Text>
              <View style={styles.benefitsList}>
                {coachData.key_benefits.map((benefit: any, index: number) => (
                  <View key={benefit.id || index} style={styles.benefitItem}>
                    <TickCircleIcon width={20} height={20} />
                    <Text style={[styles.benefitText, { fontFamily: getFontFamily('body') }]}>
                      {benefit.name || 'Benefit'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Instructor */}
          <View style={styles.instructorSection}>
            <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>Instructor</Text>
            <View style={styles.instructorCard}>
              <View style={styles.instructorImage}>
                {coachData?.instructor?.avatar || coachData?.instructor?.profile_picture || coachData?.instructor?.image ? (
                  <Image
                    source={{
                      uri: coachData.instructor.avatar || coachData.instructor.profile_picture || coachData.instructor.image
                    }}
                    style={styles.instructorAvatarImage}
                  />
                ) : (
                  <Icon name="person" size={35} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.instructorDetails}>
                <Text style={[styles.instructorName, { fontFamily: getFontFamily('bold') }]}>
                  {coachData?.instructor?.full_name || coachData?.instructor?.name || coachData?.instructor?.title || 'Instructor Name Not Available'}
                </Text>
                <Text style={[styles.instructorRole, { fontFamily: getFontFamily('body') }]}>
                  {coachData?.instructor?.role || coachData?.instructor?.designation || coachData?.instructor?.title || 'Certified Trainer'}
                </Text>
              </View>
            </View>
          </View>

          {/* Call to Action Button */}
          <TouchableOpacity 
            style={styles.ctaButton} 
            onPress={handleStartIntakeForm}
          >
            <Text style={[styles.ctaText, { fontFamily: getFontFamily('bold') }]}>
              START INTAKE FORM
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Share Modal */}
      {showShare && (
        <View style={styles.shareOverlay}>
          <View style={styles.shareModal}>
            <View style={styles.shareHeader}>
              <TouchableOpacity onPress={() => setShowShare(false)}>
                <Icon name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.shareContent}>
              <View style={styles.shareIconContainer}>
                <View style={styles.shareIcon}>
                  <Icon name="share-social" size={40} color="#FFFFFF" />
                </View>
              </View>
              <Text style={[styles.shareTitle, { fontFamily: getFontFamily('bold') }]}>Share Coach</Text>
              
              <View style={styles.shareLinkSection}>
                <Text style={[styles.shareSectionTitle, { fontFamily: getFontFamily('bold') }]}>Share your link</Text>
                <View style={styles.linkContainer}>
                  <Text style={[styles.linkText, { fontFamily: getFontFamily('body') }]}>
                    {coachData?.slug ? `https://philrossapp.link/coach/${coachData.slug}` : 'https://philrossapp.link/coach'}
                  </Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Icon name="copy-outline" size={20} color="#666666" />
                  </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachContent: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 25,
  },
  coachTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 15,
  },
  coachDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  benefitsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
  },
  benefitsList: {
    gap: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  instructorSection: {
    marginBottom: 30,
  },
  instructorCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#B62020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instructorAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontFamily: getFontFamily('body'),
  },
  instructorDetails: {
    flex: 1,
  },
  instructorName: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 4,
  },
  instructorRole: {
    fontSize: 14,
    color: '#666666',
  },
  ctaButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#B62020',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
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
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
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
    height: '100%', // Full screen height
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 250, // Moved up to provide more space at bottom
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingRight: 20, // Add right padding for close button
  },
  shareContent: {
    padding: 20,
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
    marginBottom: 20,
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
  socialIcons: {
    width: Utils.normalize(48),
    height: Utils.normalize(48),
  },
});

export default CoachDetailsScreen;
