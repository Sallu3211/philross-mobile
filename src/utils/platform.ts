import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Platform-specific configurations
const baseConfig = {
  fontFamily: {
    heading: 'PlayfairDisplay-SemiBold',
    body: 'OpenSans-Regular',
    bold: 'OpenSans-Bold',
  },
  colors: {
    primary: '#B62020',
    background: '#FFFFFF',
    text: '#000000',
    secondary: '#666666',
  },
};

export const platformConfig = {
  ios: baseConfig,
  android: baseConfig,
};

export const currentConfig = isIOS ? platformConfig.ios : platformConfig.android;

// Get current platform config
export const getPlatformConfig = () => {
  return isIOS ? platformConfig.ios : platformConfig.android;
};

// Platform-specific font family
export const getFontFamily = (type: 'heading' | 'body' | 'bold'): string => { 
  return currentConfig.fontFamily[type]; 
};

// Platform-specific colors
export const getColors = () => {
  return getPlatformConfig().colors;
};

// Universal responsive styles for consistent screen sizing
export const getResponsiveStyles = () => {
  return {
    topNav: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 24,
      paddingTop: isIOS ? 60 : 40,
      paddingBottom: 20,
      minHeight: isIOS ? 100 : 80,
    },
    menuButton: {
      padding: 8,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    profileButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#000000',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      minWidth: 40,
      minHeight: 40,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      minWidth: 40,
      minHeight: 40,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: 50,
      minHeight: 200,
    },
    fullScreenLoadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: '#FFFFFF',
    },
    loadingText: {
      fontSize: 16,
      color: '#666666',
      marginTop: 10,
      textAlign: 'center' as const,
    },
  };
};
