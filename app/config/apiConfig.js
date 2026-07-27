import { Platform } from 'react-native';

// Get your machine's local IP address for Android emulator
// You can find this by running 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
const getLocalIPAddress = () => {
    // Your machine's current Wi-Fi IPv4 (update if it changes, e.g. after reconnecting to Wi-Fi)
    return '10.190.211.97';
};

// Check if running in Android emulator
const isAndroidEmulator = () => {
    return Platform.OS === 'android' && __DEV__;
};

// API Configuration
export const apiConfig = {
    // Base URLs for different environments
    baseUrls: {
        // Production API
        production: 'https://api.philross.com/',
        
        // Development API - use your actual API server
        development: 'https://api.philross.com/',
        
        // Local development (for Android emulator)
        local: `http://${getLocalIPAddress()}:8000/`,
        
        // Alternative: Use the actual API server if accessible from emulator
        emulator: 'https://api.philross.com/'
    },
    
    // Get the appropriate base URL based on environment
    getBaseUrl: () => {
        if (__DEV__) {
            const localUrl = isAndroidEmulator()
                ? 'http://10.0.2.2:8000/'
                : `http://${getLocalIPAddress()}:8000/`;
            console.log('🔧 Dev build: using local backend at', localUrl);
            return localUrl;
        }
        return 'https://api.philross.com/';
    },
    
    // Timeout settings
    timeout: {
        short: 10000,    // 10 seconds
        medium: 30000,   // 30 seconds
        long: 60000      // 60 seconds
    },
    
    // Retry settings
    retry: {
        maxAttempts: 3,
        delayMs: 1000
    }
};

// Export the current base URL
export const getCurrentBaseUrl = () => apiConfig.getBaseUrl();

export default apiConfig;
