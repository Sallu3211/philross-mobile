import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Clipboard,
  ToastAndroid,
  Linking,
  Image,
  KeyboardAvoidingView,
  Share,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { getFontFamily, } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
import DocumentCopyIcon from '../../assets/icons/document-copy.svg';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';
import Utils from '../../app/helpers/Utilities';
import share from '../../assets/icons/share.png';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getCoachList, submitIntakeForm } from '../../app/helpers/ApiHelper';
import { countryCodes, phoneLengthRules } from '../data/countryCodes';

const { width, height } = Dimensions.get('window');

const IntakeFormScreen = ({ route, navigation }: any) => {
  const [coachData, setCoachData] = useState<any>(null);
  const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    fitnessGoals: '',
    availability: [] as string[],
    location: { city: '', state: '' },
    trainingPreference: 'In-person',
    injuries: '',
    additionalInfo: '',
    phoneNumber: '',
    selectedCoach: null as any,
  });

  const [showShare, setShowShare] = useState(false);

  const scrollViewRef = useRef<any>(null);
  const handleInputFocus = (event:any) => {
    if (scrollViewRef?.current) {
      scrollViewRef?.current?.scrollTo({
        y: event.nativeEvent.target,
        animated: true,
      });
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, []);

  const fetchCoachData = async () => {
    try {
      setIsLoadingCoaches(true);
      const response = await getCoachList(navigation);
      if (response?.status || response?.success) {
        const coaches = response.data?.results || response.data || [];
        if (coaches.length > 0) {
          setCoachData(coaches);
        }
      }
    } catch (error) {
      console.log('fetchCoachData error >>> ', JSON.stringify(error))
    } finally {
      setIsLoadingCoaches(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    setShowShare(true);
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to detect country code from phone number
  const detectCountryCode = (phoneNumber: string): string => {
    // Remove all non-digit characters except +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // If phone starts with +, extract the country code
    if (cleanPhone.startsWith('+')) {
      // Find the longest matching country code
      const sortedCodes = countryCodes.sort((a, b) => b.code.length - a.code.length);
      
      for (const country of sortedCodes) {
        if (cleanPhone.startsWith(country.code)) {
          return country.code;
        }
      }
    }
    
    // If no country code detected, assume US (+1) as default
    return '+1';
  };

  // Function to extract phone number without country code
  const extractPhoneNumber = (phoneNumber: string): string => {
    const countryCode = detectCountryCode(phoneNumber);
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleanPhone.startsWith('+')) {
      return cleanPhone.substring(countryCode.length);
    }
    
    // If no + prefix, return the number as is
    return cleanPhone;
  };

  // Country-specific phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    const countryCode = detectCountryCode(phone);
    const cleanPhone = extractPhoneNumber(phone);
    
    const rules = phoneLengthRules[countryCode];
    if (!rules) {
      // If country code not found, use general international standard
      return cleanPhone.length >= 7 && cleanPhone.length <= 15;
    }
    
    return cleanPhone.length >= rules.min && cleanPhone.length <= rules.max;
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.fitnessGoals.trim()) {
        Alert.alert('Error', 'Please enter your fitness goals');
        return;
      }
      if (formData.availability.length === 0) {
        Alert.alert('Error', 'Please select at least one available day');
        return;
      }
      if (!formData.location.city.trim() || !formData.location.state.trim()) {
        Alert.alert('Error', 'Please enter your city and state');
        return;
      }
      if (!formData.phoneNumber.trim()) {
        Alert.alert('Error', 'Please enter your phone number');
        return;
      }
      if (!validatePhoneNumber(formData.phoneNumber)) {
        const countryCode = detectCountryCode(formData.phoneNumber);
        const cleanPhone = extractPhoneNumber(formData.phoneNumber);
        Alert.alert('Error', `Please enter a valid phone number for ${countryCode}. Current length: ${cleanPhone.length} digits`);
        return;
      }
      // if (!formData.selectedCoach) {
      //   Alert.alert('Error', 'Please select a coach');
      //   return;
      // }

      setIsSubmitting(true);

      // Prepare form data for API
      const detectedCountryCode = detectCountryCode(formData.phoneNumber);
      const cleanPhoneNumber = extractPhoneNumber(formData.phoneNumber);
      
      const apiFormData = {
        // coach: formData.selectedCoach.id,
        phone_number: `${detectedCountryCode}${cleanPhoneNumber}`,
        training_days: formData.availability,
        city: formData.location.city,
        state: formData.location.state,
        training_mode: formData.trainingPreference === 'In-person' ? 'in_person' : 'virtual',
        additional_info: formData.additionalInfo || 'None',
        medical_conditions: formData.injuries || 'None',
        primary_fitness_goals: formData.fitnessGoals,
      };

      console.log('🚀 Submitting intake form with data:', apiFormData);

      const response = await submitIntakeForm(apiFormData, navigation);

      if (response?.status || response?.success) {
        console.log('✅ Intake form submitted successfully');
        Alert.alert(
          'Success!',
          'Your intake form has been submitted successfully. We will contact you soon.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('ApplicationConfirmation')
            }
          ]
        );
      } else {
        console.log('❌ Intake form submission failed:', response);
        Alert.alert('Error', response?.message || 'Failed to submit intake form. Please try again.');
      }

    } catch (error) {
      console.error('❌ Error submitting intake form:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleAvailability = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(day) 
        ? prev.availability.filter(d => d !== day)
        : [...prev.availability, day]
    }));
  };

  const updateLocation = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>
          Intake Form
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        scrollEventThrottle={16}
      >
        <View style={styles.formContainer}>
          <Text style={[styles.formDescription, { fontFamily: getFontFamily('body') }]}>
            Help us tailor your training. Your answers will guide Master Phil in creating your ultimate personalized plan.
          </Text>

          {/* Question 1: Fitness Goals */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              1. What are your primary fitness goals?
            </Text>
            <TextInput
              style={[styles.textAreaInput, { fontFamily: getFontFamily('body') }]}
              value={formData.fitnessGoals}
              onChangeText={(text) => updateFormData('fitnessGoals', text)}
              placeholder="(e.g., strength, weight loss, endurance, specific skill)"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={6}
              onFocus={handleInputFocus}
            />
          </View>

          {/* Question 2: Availability */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              2. What days and times are you typically available for training?
            </Text>
            <View style={styles.daysContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    formData.availability.includes(day) && styles.dayButtonSelected
                  ]}
                  onPress={() => toggleAvailability(day)}
                >
                  <Text 
                    style={[
                      styles.dayButtonText,
                      { fontFamily: getFontFamily('body') },
                      formData.availability.includes(day) && styles.dayButtonTextSelected
                    ]}
                    numberOfLines={1}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Question 3: Location */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              3. Where are you located?
            </Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={[styles.locationInput, { fontFamily: getFontFamily('body') }]}
                value={formData.location.city}
                onChangeText={(text) => updateLocation('city', text)}
                placeholder="City"
                placeholderTextColor="#999999"
                onFocus={handleInputFocus}
              />
              <TextInput
                style={[styles.locationInput, { fontFamily: getFontFamily('body') }]}
                value={formData.location.state}
                onChangeText={(text) => updateLocation('state', text)}
                placeholder="State"
                placeholderTextColor="#999999"
                onFocus={handleInputFocus}
              />
            </View>
          </View>

          {/* Question 4: Phone Number */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              4. What's your phone number?
            </Text>
            <Text style={[styles.phoneHelperText, { fontFamily: getFontFamily('body') }]}>
              Include country code (e.g., +1 5551234567, +44 7700123456, +91 9876543210)
            </Text>
            <TextInput
              style={[styles.phoneInputSingle, { fontFamily: getFontFamily('body') }]}
              value={formData.phoneNumber}
              onChangeText={(text) => updateFormData('phoneNumber', text)}
              placeholder="+1 5551234567"
              placeholderTextColor="#999999"
              keyboardType="phone-pad"
              maxLength={20}
              onFocus={handleInputFocus}
            />
          </View>

          {/* Question 5: Coach Selection */}
          {/* <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              5. Select your preferred coach
            </Text>
            {isLoadingCoaches ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#B62020" />
                <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
                  Loading coaches...
                </Text>
              </View>
            ) : (
              <Dropdown
                style={styles.coachDropdown}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelectedText}
                placeholder="Select Coach"
                data={coachData || []}
                maxHeight={300}
                labelField="headline"
                valueField="id"
                value={formData.selectedCoach?.id}
                onChange={item => updateFormData('selectedCoach', item)}
                renderItem={(item) => (
                  <View style={styles.coachDropdownItem}>
                    <Image 
                      source={{ uri: item.cropped_image_url }} 
                      style={styles.coachImage}
                    />
                    <View style={styles.coachInfo}>
                      <Text style={styles.coachName}>{item.headline}</Text>
                      <Text style={styles.coachDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                )}
                renderLeftIcon={() => (
                  formData.selectedCoach ? (
                    <Image 
                      source={{ uri: formData.selectedCoach.cropped_image_url }} 
                      style={styles.selectedCoachImage}
                    />
                  ) : null
                )}
              />
            )}
          </View> */}

          {/* Question 6: Training Preference */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              5. How do you prefer to train?
            </Text>
            <View style={styles.trainingPreferenceContainer}>
              <TouchableOpacity
                style={[
                  styles.preferenceButton,
                  formData.trainingPreference === 'In-person' && styles.preferenceButtonSelected
                ]}
                onPress={() => updateFormData('trainingPreference', 'In-person')}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  { fontFamily: getFontFamily('body') },
                  formData.trainingPreference === 'In-person' && styles.preferenceButtonTextSelected
                ]}>
                  In-person
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.preferenceButton,
                  formData.trainingPreference === 'Virtual' && styles.preferenceButtonSelected
                ]}
                onPress={() => updateFormData('trainingPreference', 'Virtual')}
              >
                <Text style={[
                  styles.preferenceButtonText,
                  { fontFamily: getFontFamily('body') },
                  formData.trainingPreference === 'Virtual' && styles.preferenceButtonTextSelected
                ]}>
                  Virtual
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Question 7: Injuries */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              6. Do you have any current or past injuries, or medical conditions we should be aware of?
            </Text>
            <TextInput
              style={[styles.textAreaInput, { fontFamily: getFontFamily('body') }]}
              value={formData.injuries}
              onChangeText={(text) => updateFormData('injuries', text)}
              placeholder="(write injuries/conditions)"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={5}
              onFocus={handleInputFocus}
            />
          </View>

          {/* Question 8: Additional Info */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { fontFamily: getFontFamily('bold') }]}>
              7. Is there anything else you'd like us to know about your fitness journey?
            </Text>
            <TextInput
              style={[styles.textAreaInput, { fontFamily: getFontFamily('body') }]}
              value={formData.additionalInfo}
              onChangeText={(text) => updateFormData('additionalInfo', text)}
              placeholder="(write additional info)"
              placeholderTextColor="#999999"
              multiline
              numberOfLines={5}
              onFocus={handleInputFocus}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={[styles.submitButtonText, { fontFamily: getFontFamily('bold') }]}>
                SUBMIT APPLICATION
              </Text>
            )}
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
    </KeyboardAvoidingView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Extra padding at bottom for keyboard
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formDescription: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 32,
  },
  questionContainer: {
    marginBottom: 32,
  },
  questionText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 16,
    fontFamily: getFontFamily('bold'),
  },
  textAreaInput: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
    minHeight: 120,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    justifyContent: 'center',
  },
  dayButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: 47,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  dayButtonSelected: {
    backgroundColor: '#B62020',
    borderColor: '#B62020',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: '#000000',
  },
  locationDropdown: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 14,
    color: '#999999',
  },
  trainingPreferenceContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  preferenceButton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  preferenceButtonSelected: {
    backgroundColor: '#B62020',
    borderColor: '#B62020',
  },
  preferenceButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  preferenceButtonTextSelected: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
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
  },
  // Phone number styles
  phoneHelperText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  phoneInputSingle: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 14,
    color: '#000000',
  },
  // Coach dropdown styles
  coachDropdown: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  coachDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  coachImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  selectedCoachImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  coachInfo: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 4,
  },
  coachDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  // Dropdown styles
  dropdownPlaceholder: {
    fontSize: 14,
    color: '#999999',
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#000000',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  dropdownItemFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000000',
    marginRight: 8,
    fontFamily: getFontFamily('body'),
  },
  dropdownItemCountry: {
    fontSize: 12,
    color: '#666666',
  },
  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
  socialIcons: {
    width: Utils.normalize(48),
    height: Utils.normalize(48),
  },
});

export default IntakeFormScreen;
