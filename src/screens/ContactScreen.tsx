import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
  Alert,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import HomeIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import CallIcon from '../../assets/icons/call.svg';
import CopyIcon from '../../assets/icons/copy.svg';
import MailIcon from '../../assets/icons/sms.svg';
import YouTubeIcon from '../../assets/icons/mdi_youtube.svg';
import FacebookIcon from '../../assets/icons/mage_facebook.svg';
import InstagramIcon from '../../assets/icons/ri_instagram-line.svg';
import LinkedInIcon from '../../assets/icons/akar-icons_linkedin-fill.svg';
import TikTokIcon from '../../assets/icons/ic_baseline-tiktok.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';

const { width, height } = Dimensions.get('window');

const ContactScreen = ({ navigation, route }: any) => {
  const colors = getColors();
  const currentRoute = route?.name;
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [socialMediaLinks, setSocialMediaLinks] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch contact info
      const contactResponse = await fetch('https://api.philross.com/sitecontent/contact-info');
      const contactData = await contactResponse.json();
      
      if (contactData.status && contactData.data) {
        setContactInfo(contactData.data);
      }
      
      // Fetch social media links
      const socialResponse = await fetch('https://api.philross.com/sitecontent/social-media-links');
      const socialData = await socialResponse.json();
      
      if (socialData.status && socialData.data) {
        setSocialMediaLinks(socialData.data);
      }
      
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneCall = () => {
    const phoneNumber = contactInfo?.phone || '(551)364-2545';
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = () => {
    const email = contactInfo?.email || 'info@philross.com';
    Linking.openURL(`mailto:${email}`);
  };

  const handleSocialMedia = (platform: string) => {
    let url = '';
    
    if (socialMediaLinks && socialMediaLinks[platform]) {
      url = socialMediaLinks[platform];
    } else {
      // Fallback URLs if API data is not available
      switch (platform) {
        case 'youtube':
          url = 'https://www.youtube.com/@TheMasterPhil';
          break;
        case 'facebook':
          url = 'https://www.facebook.com/Masterphilindustries/';
          break;
        case 'instagram':
          url = 'https://www.instagram.com/masterphilross/';
          break;
        case 'linkedin':
          url = 'https://www.linkedin.com/in/phil-ross-bodybell-method/';
          break;
        case 'tiktok':
          url = 'https://www.tiktok.com/@Masterphilmafa';
          break;
        default:
          break;
      }
    }
    
    if (url) {
      Linking.openURL(url);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Use API data if available, otherwise fall back to hardcoded values
  const displayPhone = contactInfo?.phone || '(551) 364-2545';
  const displayEmail = contactInfo?.email || 'info@philross.com';

  return (
    <View style={styles.container}>
      {/* Top Centered Title */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.centeredTitle]}>Contact</Text>
        <TouchableOpacity style={styles.shareButton} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B62020" />
            <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
              Loading contact information...
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('heading') }]}>
              Get In Touch
            </Text>
            <Text style={[styles.sectionDescription, { fontFamily: getFontFamily('body') }]}>
              We're here to help you. Reach out with any questions or feedback.
            </Text>

            {/* Contact Information */}
            <View style={styles.contactInfoContainer}>
              {/* Phone */}
              <TouchableOpacity style={styles.contactItem} onPress={handlePhoneCall}>
                <View style={styles.contactIconContainer}>
                  <CallIcon width={24} height={24} />
                </View>
                <View style={styles.contactTextContainer}>
                  <Text style={[styles.contactLabel, { fontFamily: getFontFamily('body') }]}>{displayPhone}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.copyButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    try {
                      Clipboard.setString(displayPhone);
                      if (Platform.OS === 'android') {
                        ToastAndroid.show('Phone number copied', ToastAndroid.SHORT);
                      } else {
                        Alert.alert('Copied', 'Phone number copied to clipboard');
                      }
                    } catch (e) {
                      console.log('Copy failed:', e);
                      Alert.alert('Copy Failed', 'Unable to copy phone number, please try again.');
                    }
                  }}
                >
                  <CopyIcon width={20} height={20} />
                </TouchableOpacity>
              </TouchableOpacity>

              {/* Email */}
              <TouchableOpacity style={styles.contactItem} onPress={handleEmail}>
                <View style={styles.contactIconContainer}>
                  <MailIcon width={24} height={24} />
                </View>
                <View style={styles.contactTextContainer}>
                  <Text style={[styles.contactLabel, { fontFamily: getFontFamily('body') }]}>{displayEmail}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.copyButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={() => {
                    try {
                      Clipboard.setString(displayEmail);
                      if (Platform.OS === 'android') {
                        ToastAndroid.show('Email copied', ToastAndroid.SHORT);
                      } else {
                        Alert.alert('Copied', 'Email copied to clipboard');
                      }
                    } catch (e) {
                      console.log('Copy failed:', e);
                      Alert.alert('Copy Failed', 'Unable to copy email, please try again.');
                    }
                  }}
                >
                  <CopyIcon width={20} height={20} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>

            {/* Social Media */}
            <Text style={[styles.socialMediaTitle, { fontFamily: getFontFamily('heading') }]}>
              Social Media
            </Text>
            <View style={styles.socialMediaContainer}>
              <TouchableOpacity 
                style={styles.socialMediaButton} 
                onPress={() => handleSocialMedia('youtube')}
              >
                <YouTubeIcon width={28} height={28} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialMediaButton} 
                onPress={() => handleSocialMedia('facebook')}
              >
                <FacebookIcon width={28} height={28} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialMediaButton} 
                onPress={() => handleSocialMedia('instagram')}
              >
                <InstagramIcon width={28} height={28} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialMediaButton} 
                onPress={() => handleSocialMedia('linkedin')}
              >
                <LinkedInIcon width={28} height={28} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialMediaButton} 
                onPress={() => handleSocialMedia('tiktok')}
              >
                <TikTokIcon width={28} height={28} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feed')}>
          <HomeIcon 
            width={24} 
            height={24} 
          />
          <Text style={[
            styles.navText, 
            { fontFamily: getFontFamily('body') }
          ]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
          <EventsIcon 
            width={24} 
            height={24} 
          />
          <Text style={[
            styles.navText, 
            { fontFamily: getFontFamily('body') }
          ]}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Products')}>
          <ProductsIcon 
            width={24} 
            height={24} 
          />
          <Text style={[
            styles.navText, 
            { fontFamily: getFontFamily('body') }
          ]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyCoach')}>
          <MyCoachIcon 
            width={24} 
            height={24} 
          />
          <Text style={[
            styles.navText, 
            { fontFamily: getFontFamily('body') }
          ]}>My Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Courses')}>
          <CoursesIcon 
            width={24} 
            height={24} 
          />
          <Text style={[
            styles.navText, 
            { fontFamily: getFontFamily('body') }
          ]}>Courses</Text>
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
  centeredTitleContainer: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  centeredTitle: {
    fontSize: 20,
    fontFamily: getFontFamily('heading'),
    color: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 30,
    lineHeight: 20,
  },
  contactInfoContainer: {
    marginBottom: 30,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    color: '#000000',
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  socialMediaTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
  },
  socialMediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 2,
  },
  socialMediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    gap: 1,
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
    marginTop: 4,
    color: '#666666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
});

export default ContactScreen;