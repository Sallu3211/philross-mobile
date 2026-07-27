/**
 * Network Status Types
 * 
 * Defines TypeScript interfaces and types for network connectivity handling
 */

import { NetInfoState } from '@react-native-community/netinfo';

/**
 * Network connection status
 */
export enum ConnectionStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown',
}

/**
 * Network context state interface
 */
export interface NetworkContextState {
  /**
   * Current connection status
   */
  isConnected: boolean;
  
  /**
   * Connection status enum value
   */
  status: ConnectionStatus;
  
  /**
   * Raw NetInfo state for advanced use cases
   */
  netInfoState: NetInfoState | null;
  
  /**
   * Whether the network state has been initialized
   */
  isInitialized: boolean;
}

/**
 * Network context value interface
 */
export interface NetworkContextValue extends NetworkContextState {
  /**
   * Manually refresh network status
   */
  refresh: () => Promise<void>;
}

/**
 * Network provider props
 */
export interface NetworkProviderProps {
  children: React.ReactNode;
  
  /**
   * Optional: Custom callback when connection status changes
   */
  onConnectionChange?: (isConnected: boolean) => void;
  
  /**
   * Optional: Show banner by default (default: true)
   */
  showBanner?: boolean;
}

/**
 * No Internet Banner props
 */
export interface NoInternetBannerProps {
  /**
   * Position of the banner (default: 'top')
   */
  position?: 'top' | 'bottom';
  
  /**
   * Custom message to display
   */
  message?: string;
  
  /**
   * Animation duration in milliseconds (default: 300)
   */
  animationDuration?: number;
  
  /**
   * Custom styles for the banner
   */
  style?: any;
}

/**
 * No Internet Screen props
 */
export interface NoInternetScreenProps {
  /**
   * Custom title
   */
  title?: string;
  
  /**
   * Custom message
   */
  message?: string;
  
  /**
   * Show retry button (default: true)
   */
  showRetryButton?: boolean;
  
  /**
   * Custom retry button text
   */
  retryButtonText?: string;
  
  /**
   * Callback when retry button is pressed
   */
  onRetry?: () => void;
}

