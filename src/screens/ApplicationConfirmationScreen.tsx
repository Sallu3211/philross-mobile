import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
import MaskGroupIcon from '../../assets/icons/Mask group.svg';

const { width } = Dimensions.get('window');

const ApplicationConfirmationScreen = ({ navigation }: any) => {
  const colors = getColors();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    // Handle share functionality
    console.log('Share confirmation');
  };

  const handleReturnToFeed = () => {
    navigation.navigate('Feed');
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>
          Thank You!
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <MaskGroupIcon width={120} height={120} />
        </View>

        {/* Success Message */}
        <Text style={[styles.successTitle, { fontFamily: getFontFamily('bold') }]}>
          Your Application is Submitted!
        </Text>

        <Text style={[styles.successMessage, { fontFamily: getFontFamily('body') }]}>
          Master Phil's team will review your details with precision and contact you within 24-48 hours to forge your personalized coaching plan. Get ready to activate your potential!
        </Text>

      </View>

      {/* Return to Feed Button - Full Width */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.returnButton} onPress={handleReturnToFeed}>
          <Text style={[styles.returnButtonText, { fontFamily: getFontFamily('bold') }]}>
            RETURN TO FEED
          </Text>
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
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
  successMessage: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
    marginBottom: 48,
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  returnButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  returnButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
  },
});

export default ApplicationConfirmationScreen;
