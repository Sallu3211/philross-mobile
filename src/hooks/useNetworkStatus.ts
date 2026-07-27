/**
 * useNetworkStatus Hook
 * 
 * Custom hook to track network connectivity status across the app.
 * Uses @react-native-community/netinfo to monitor real-time connection changes.
 * 
 * @example
 * ```tsx
 * const { isConnected, status, refresh } = useNetworkStatus();
 * 
 * if (!isConnected) {
 *   return <NoInternetScreen />;
 * }
 * ```
 */

import { useContext } from 'react';
import { NetworkContext } from '../context/NetworkProvider';
import { NetworkContextValue } from '../types/network';

/**
 * Hook to access network status from NetworkProvider context
 * 
 * @throws {Error} If used outside of NetworkProvider
 * @returns {NetworkContextValue} Network status and control methods
 */
export const useNetworkStatus = (): NetworkContextValue => {
  const context = useContext(NetworkContext);
  
  if (context === undefined) {
    throw new Error(
      'useNetworkStatus must be used within a NetworkProvider. ' +
      'Wrap your app with <NetworkProvider> in App.tsx'
    );
  }
  
  return context;
};

/**
 * Re-export for convenience
 */
export default useNetworkStatus;

