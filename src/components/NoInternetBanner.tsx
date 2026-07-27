/**
 * NoInternetBanner Component
 * 
 * A beautiful, animated banner that appears when the device loses internet connection.
 * Automatically slides in from the top/bottom with smooth animations and disappears when reconnected.
 * 
 * Features:
 * - Smooth slide-in/slide-out animations
 * - Support for light and dark modes
 * - Customizable position (top/bottom)
 * - Customizable message and styling
 * - Lightweight and performant
 * 
 * @example
 * ```tsx
 * <NoInternetBanner position="top" message="No Internet Connection" />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useColorScheme,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { NoInternetBannerProps } from '../types/network';

const { width } = Dimensions.get('window');

/**
 * Get safe area top inset
 * Uses StatusBar height as fallback if SafeAreaProvider is not available
 */
const getSafeAreaTop = (): number => {
  if (Platform.OS === 'ios') {
    // For iOS, use a reasonable default for devices with notch
    return 44; // Standard iOS safe area top
  }
  // For Android, use StatusBar height + extra padding for better visibility
  const statusBarHeight = StatusBar.currentHeight || 0;
  return statusBarHeight + 8; // Add 8px extra padding for Android
};

/**
 * Get safe area bottom inset
 */
const getSafeAreaBottom = (): number => {
  if (Platform.OS === 'ios') {
    // For iOS devices with home indicator
    return 34;
  }
  // For Android, add some padding at bottom
  return 8;
};

/**
 * NoInternetBanner Component
 * 
 * Displays a banner notification when internet connection is lost.
 * Automatically animates in/out based on connection status.
 */
const NoInternetBanner: React.FC<NoInternetBannerProps> = ({
  position = 'top',
  message = 'No Internet Connection',
  animationDuration = 300,
  style,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  // Use fallback safe area values
  const topInset = getSafeAreaTop();
  const bottomInset = getSafeAreaBottom();
  
  // Animation value for slide in/out
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  /**
   * Animate banner in when component mounts
   */
  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: animationDuration,
      useNativeDriver: true,
    }).start();
    
    // Slide out animation on unmount
    return () => {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }).start();
    };
  }, [slideAnim, animationDuration]);
  
  /**
   * Calculate translation based on position
   */
  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: position === 'top' ? [-100, 0] : [100, 0],
  });
  
  /**
   * Calculate opacity for fade effect
   */
  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  /**
   * Dynamic styles based on theme and position
   */
  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: isDarkMode ? '#1F1F1F' : '#FFFFFF',
      borderBottomColor: isDarkMode ? '#333333' : '#E0E0E0',
      ...(position === 'top' 
        ? { 
            top: 0,
            paddingTop: topInset,
            borderBottomWidth: 1,
          } 
        : { 
            bottom: 0,
            paddingBottom: bottomInset,
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? '#333333' : '#E0E0E0',
          }
      ),
    },
    contentContainer: {
      ...styles.contentContainer,
    },
    iconContainer: {
      ...styles.iconContainer,
      backgroundColor: isDarkMode ? '#FF6B6B20' : '#FF6B6B15',
    },
    textContainer: {
      ...styles.textContainer,
    },
    messageText: {
      ...styles.messageText,
      color: isDarkMode ? '#FFFFFF' : '#1F1F1F',
    },
    subText: {
      ...styles.subText,
      color: isDarkMode ? '#AAAAAA' : '#666666',
    },
  };
  
  return (
    <Animated.View
      style={[
        dynamicStyles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <View style={dynamicStyles.contentContainer}>
        {/* Warning Icon */}
        <View style={dynamicStyles.iconContainer}>
          <Text style={styles.iconText}>⚠️</Text>
        </View>
        
        {/* Message Text */}
        <View style={dynamicStyles.textContainer}>
          <Text style={dynamicStyles.messageText} numberOfLines={1}>
            {message}
          </Text>
          <Text style={dynamicStyles.subText} numberOfLines={1}>
            Please check your network connection
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

/**
 * Styles for the banner component
 */
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: width,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subText: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default NoInternetBanner;

