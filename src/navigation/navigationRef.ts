/**
 * Standalone navigation ref.
 *
 * Lives here rather than in App.tsx so that services can navigate without
 * importing App — subscriptionService needs to open the paywall, and importing
 * App from a service would be a circular dependency.
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/** Navigate from outside a component. No-ops safely before the tree is ready. */
export function navigateFromAnywhere(name: string, params?: object): boolean {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
    return true;
  }
  return false;
}

export default navigationRef;
