/**
 * NoInternetScreen Component
 * 
 * A full-screen component that displays when there's no internet connection.
 * Can be used as a standalone screen or as an overlay.
 * 
 * Features:
 * - Beautiful, modern UI design
 * - Support for light and dark modes
 * - Customizable title, message, and retry button
 * - Animated illustration
 * - Retry functionality with loading state
 * 
 * @example
 * ```tsx
 * const { isConnected, refresh } = useNetworkStatus();
 * 
 * if (!isConnected) {
 *   return <NoInternetScreen onRetry={refresh} />;
 * }
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Animated,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { NoInternetScreenProps } from '../types/network';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const { width, height } = Dimensions.get('window');

/**
 * NoInternetScreen Component
 * 
 * Full-screen display for offline state with retry functionality.
 */
const NoInternetScreen: React.FC<NoInternetScreenProps> = ({
  title = 'No Internet Connection',
  message = 'Oops! Looks like you\'re not connected to the internet. Please check your connection and try again.',
  showRetryButton = true,
  retryButtonText = 'Try Again',
  onRetry,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { refresh, isConnected } = useNetworkStatus();
  
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  /**
   * Fade in animation on mount
   */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Pulse animation for icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
    
    return () => {
      pulseAnimation.stop();
    };
  }, [fadeAnim, scaleAnim, pulseAnim]);
  
  /**
   * Handle retry button press
   */
  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Call custom retry handler if provided
      if (onRetry) {
        await onRetry();
      } else {
        // Otherwise, use the default refresh from context
        await refresh();
      }
      
      // Wait a bit to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('[NoInternetScreen] Error during retry:', error);
    } finally {
      setIsRetrying(false);
    }
  };
  
  /**
   * Dynamic styles based on theme
   */
  const dynamicStyles = {
    container: {
      ...styles.container,
      backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
    },
    iconContainer: {
      ...styles.iconContainer,
      backgroundColor: isDarkMode ? '#1F1F1F' : '#F5F5F5',
      borderColor: isDarkMode ? '#333333' : '#E0E0E0',
    },
    title: {
      ...styles.title,
      color: isDarkMode ? '#FFFFFF' : '#1F1F1F',
    },
    message: {
      ...styles.message,
      color: isDarkMode ? '#AAAAAA' : '#666666',
    },
    retryButton: {
      ...styles.retryButton,
      backgroundColor: isDarkMode ? '#FFFFFF' : '#1F1F1F',
    },
    retryButtonText: {
      ...styles.retryButtonText,
      color: isDarkMode ? '#1F1F1F' : '#FFFFFF',
    },
    connectionStatus: {
      ...styles.connectionStatus,
    },
    connectionStatusText: {
      ...styles.connectionStatusText,
      color: isDarkMode ? '#666666' : '#999999',
    },
  };
  
  return (
    <View style={dynamicStyles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Animated Icon */}
        <Animated.View
          style={[
            dynamicStyles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Text style={styles.iconEmoji}>📡</Text>
          <View style={styles.iconSlash}>
            <Text style={styles.iconSlashText}>✕</Text>
          </View>
        </Animated.View>
        
        {/* Title */}
        <Text style={dynamicStyles.title}>{title}</Text>
        
        {/* Message */}
        <Text style={dynamicStyles.message}>{message}</Text>
        
        {/* Connection Status Indicator */}
        <View style={dynamicStyles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: '#FF6B6B' }]} />
          <Text style={dynamicStyles.connectionStatusText}>
            {isConnected ? 'Connected' : 'Offline'}
          </Text>
        </View>
        
        {/* Retry Button */}
        {showRetryButton && (
          <TouchableOpacity
            style={[
              dynamicStyles.retryButton,
              isRetrying && styles.retryButtonDisabled,
            ]}
            onPress={handleRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
          >
            {isRetrying ? (
              <ActivityIndicator
                color={isDarkMode ? '#1F1F1F' : '#FFFFFF'}
                size="small"
              />
            ) : (
              <Text style={dynamicStyles.retryButtonText}>
                {retryButtonText}
              </Text>
            )}
          </TouchableOpacity>
        )}
        
        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={[dynamicStyles.message, styles.tipsTitle]}>
            Quick Tips:
          </Text>
          <Text style={[dynamicStyles.message, styles.tipText]}>
            • Check if WiFi or mobile data is enabled
          </Text>
          <Text style={[dynamicStyles.message, styles.tipText]}>
            • Try turning Airplane mode on and off
          </Text>
          <Text style={[dynamicStyles.message, styles.tipText]}>
            • Move to an area with better signal
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

/**
 * Styles for the screen component
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    position: 'relative',
  },
  iconEmoji: {
    fontSize: 48,
  },
  iconSlash: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSlashText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionStatusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    marginTop: 48,
    alignItems: 'flex-start',
    width: '100%',
  },
  tipsTitle: {
    fontWeight: '600',
    marginBottom: 12,
    fontSize: 14,
  },
  tipText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
  },
});

export default NoInternetScreen;

