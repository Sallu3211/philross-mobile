/**
 * NetworkProvider Context
 * 
 * Global context provider that manages network connectivity state across the entire app.
 * Automatically detects online/offline status and provides real-time updates.
 * 
 * Features:
 * - Real-time connectivity monitoring
 * - Automatic reconnection detection
 * - Optional banner display for offline state
 * - TypeScript support with full type safety
 * - Performance optimized with minimal re-renders
 * 
 * @example
 * ```tsx
 * // In App.tsx
 * <NetworkProvider showBanner={true}>
 *   <YourApp />
 * </NetworkProvider>
 * 
 * // In any component
 * const { isConnected, status } = useNetworkStatus();
 * ```
 */

import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import {
  NetworkContextValue,
  NetworkProviderProps,
  ConnectionStatus,
} from '../types/network';
import NoInternetBanner from '../components/NoInternetBanner';

/**
 * Network Context - provides network state to all child components
 */
export const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

/**
 * NetworkProvider Component
 * 
 * Wraps the application and provides network connectivity state to all children.
 * Automatically shows/hides a banner when connection status changes.
 * 
 * @param {NetworkProviderProps} props - Provider configuration
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({
  children,
  onConnectionChange,
  showBanner = true,
}) => {
  // State management
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.UNKNOWN);
  const [netInfoState, setNetInfoState] = useState<NetInfoState | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Refs to prevent memory leaks and unnecessary callbacks
  const unsubscribeRef = useRef<NetInfoSubscription | null>(null);
  const onConnectionChangeRef = useRef(onConnectionChange);
  
  // Update callback ref when it changes
  useEffect(() => {
    onConnectionChangeRef.current = onConnectionChange;
  }, [onConnectionChange]);

  /**
   * Determines connection status from NetInfo state
   * 
   * @param {NetInfoState} state - Raw NetInfo state object
   * @returns {boolean} True if connected, false otherwise
   */
  const getConnectionStatus = useCallback((state: NetInfoState): boolean => {
    // Check if connected and has internet reachability
    if (state.isConnected === false) {
      return false;
    }
    
    // For some connection types, check internet reachability
    if (state.isInternetReachable === false) {
      return false;
    }
    
    // If isInternetReachable is null (unknown), assume connected if isConnected is true
    return state.isConnected === true;
  }, []);

  /**
   * Handles network state changes
   * 
   * @param {NetInfoState} state - New network state from NetInfo
   */
  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const connected = getConnectionStatus(state);
    const newStatus = connected ? ConnectionStatus.ONLINE : ConnectionStatus.OFFLINE;
    
    // Update state
    setIsConnected(connected);
    setStatus(newStatus);
    setNetInfoState(state);
    
    // Mark as initialized after first update
    if (!isInitialized) {
      setIsInitialized(true);
    }
    
    // Call optional callback
    if (onConnectionChangeRef.current) {
      onConnectionChangeRef.current(connected);
    }
    
    // Log connection changes (remove in production)
    if (__DEV__) {
      console.log(`[NetworkProvider] Connection status: ${newStatus}`, {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    }
  }, [getConnectionStatus, isInitialized]);

  /**
   * Manually refresh network status
   * Useful for retry buttons or manual checks
   */
  const refresh = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      handleNetworkChange(state);
    } catch (error) {
      console.error('[NetworkProvider] Error fetching network state:', error);
    }
  }, [handleNetworkChange]);

  /**
   * Initialize network monitoring on mount
   */
  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch()
      .then(handleNetworkChange)
      .catch((error) => {
        console.error('[NetworkProvider] Error fetching initial network state:', error);
        // Set to online by default if fetch fails
        setIsConnected(true);
        setStatus(ConnectionStatus.UNKNOWN);
        setIsInitialized(true);
      });

    // Subscribe to network state changes
    unsubscribeRef.current = NetInfo.addEventListener(handleNetworkChange);

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [handleNetworkChange]);

  /**
   * Context value provided to children
   * Memoized to prevent unnecessary re-renders
   */
  const contextValue: NetworkContextValue = useMemo(
    () => ({
      isConnected,
      status,
      netInfoState,
      isInitialized,
      refresh,
    }),
    [isConnected, status, netInfoState, isInitialized, refresh]
  );

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
      {/* Show banner when offline (if enabled) */}
      {showBanner && !isConnected && isInitialized && <NoInternetBanner />}
    </NetworkContext.Provider>
  );
};

/**
 * Re-export for convenience
 */
export default NetworkProvider;

