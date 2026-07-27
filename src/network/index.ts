/**
 * Network Handling System - Barrel Export
 * 
 * Centralized exports for all network-related functionality.
 * Import everything you need from this single file for cleaner imports.
 * 
 * @example
 * ```tsx
 * // Instead of multiple imports:
 * import { useNetworkStatus } from '../hooks/useNetworkStatus';
 * import { NetworkProvider } from '../context/NetworkProvider';
 * import NoInternetBanner from '../components/NoInternetBanner';
 * 
 * // Use single import:
 * import { 
 *   useNetworkStatus, 
 *   NetworkProvider, 
 *   NoInternetBanner 
 * } from '../network';
 * ```
 */

// Context & Provider
export { NetworkProvider, NetworkContext } from '../context/NetworkProvider';

// Hooks
export { useNetworkStatus } from '../hooks/useNetworkStatus';

// Components
export { default as NoInternetBanner } from '../components/NoInternetBanner';
export { default as NoInternetScreen } from '../components/NoInternetScreen';

// Utilities
export {
  checkInternetConnection,
  getNetworkInfo,
  waitForConnection,
  getConnectionStatus,
  isWiFiConnection,
  isCellularConnection,
  executeWhenOnline,
  retryWithBackoff,
} from '../utils/networkUtils';

// Types
export type {
  ConnectionStatus,
  NetworkContextState,
  NetworkContextValue,
  NetworkProviderProps,
  NoInternetBannerProps,
  NoInternetScreenProps,
} from '../types/network';

export { ConnectionStatus as NetworkConnectionStatus } from '../types/network';

