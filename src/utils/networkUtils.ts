/**
 * Network Utility Functions
 * 
 * Helper functions for network-related operations and checks.
 * These utilities can be used throughout the app for network-dependent logic.
 */

import NetInfo from '@react-native-community/netinfo';
import { ConnectionStatus } from '../types/network';

/**
 * Check if the device is currently connected to the internet
 * 
 * @returns {Promise<boolean>} True if connected, false otherwise
 * 
 * @example
 * ```tsx
 * const isOnline = await checkInternetConnection();
 * if (isOnline) {
 *   // Proceed with network request
 * }
 * ```
 */
export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
  } catch (error) {
    console.error('[networkUtils] Error checking internet connection:', error);
    return false;
  }
};

/**
 * Get detailed network information
 * 
 * @returns {Promise<object>} Network state details
 * 
 * @example
 * ```tsx
 * const networkInfo = await getNetworkInfo();
 * console.log('Connection type:', networkInfo.type);
 * console.log('Is connected:', networkInfo.isConnected);
 * ```
 */
export const getNetworkInfo = async () => {
  try {
    const state = await NetInfo.fetch();
    return {
      type: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      details: state.details,
    };
  } catch (error) {
    console.error('[networkUtils] Error getting network info:', error);
    return {
      type: 'unknown',
      isConnected: false,
      isInternetReachable: false,
      details: null,
    };
  }
};

/**
 * Wait for internet connection with timeout
 * Useful for operations that require internet but can wait
 * 
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<boolean>} True if connected within timeout, false otherwise
 * 
 * @example
 * ```tsx
 * const connected = await waitForConnection(5000);
 * if (connected) {
 *   // Proceed with network operation
 * } else {
 *   // Show error or retry
 * }
 * ```
 */
export const waitForConnection = async (timeout: number = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      if (unsubscribe) {
        unsubscribe();
      }
      resolve(false);
    }, timeout);

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        clearTimeout(timeoutId);
        if (unsubscribe) {
          unsubscribe();
        }
        resolve(true);
      }
    });
  });
};

/**
 * Get connection status as enum
 * 
 * @returns {Promise<ConnectionStatus>} Connection status enum
 */
export const getConnectionStatus = async (): Promise<ConnectionStatus> => {
  try {
    const state = await NetInfo.fetch();
    
    if (state.isConnected === false) {
      return ConnectionStatus.OFFLINE;
    }
    
    if (state.isInternetReachable === false) {
      return ConnectionStatus.OFFLINE;
    }
    
    if (state.isConnected === true) {
      return ConnectionStatus.ONLINE;
    }
    
    return ConnectionStatus.UNKNOWN;
  } catch (error) {
    console.error('[networkUtils] Error getting connection status:', error);
    return ConnectionStatus.UNKNOWN;
  }
};

/**
 * Check if connection is WiFi
 * 
 * @returns {Promise<boolean>} True if connected via WiFi
 */
export const isWiFiConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi';
  } catch (error) {
    console.error('[networkUtils] Error checking WiFi connection:', error);
    return false;
  }
};

/**
 * Check if connection is cellular
 * 
 * @returns {Promise<boolean>} True if connected via cellular
 */
export const isCellularConnection = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'cellular';
  } catch (error) {
    console.error('[networkUtils] Error checking cellular connection:', error);
    return false;
  }
};

/**
 * Execute a function only when online
 * Automatically waits for connection if offline
 * 
 * @param {Function} fn - Function to execute when online
 * @param {number} timeout - Maximum time to wait for connection (default: 10000)
 * @returns {Promise<any>} Result of the function or null if timeout
 * 
 * @example
 * ```tsx
 * const result = await executeWhenOnline(async () => {
 *   return await fetchUserData();
 * });
 * ```
 */
export const executeWhenOnline = async <T>(
  fn: () => Promise<T>,
  timeout: number = 10000
): Promise<T | null> => {
  const isOnline = await checkInternetConnection();
  
  if (isOnline) {
    return await fn();
  }
  
  // Wait for connection
  const connected = await waitForConnection(timeout);
  
  if (connected) {
    return await fn();
  }
  
  console.warn('[networkUtils] Timeout waiting for internet connection');
  return null;
};

/**
 * Retry a function with exponential backoff when network fails
 * 
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds (default: 1000)
 * @returns {Promise<any>} Result of the function or throws error
 * 
 * @example
 * ```tsx
 * const data = await retryWithBackoff(async () => {
 *   return await fetchData();
 * }, 3, 1000);
 * ```
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Check connection before retry
      const isOnline = await checkInternetConnection();
      
      if (!isOnline && i < maxRetries - 1) {
        // Wait for connection
        await waitForConnection(5000);
      }
      
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        const delay = initialDelay * Math.pow(2, i);
        console.log(`[networkUtils] Retry ${i + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries reached');
};

