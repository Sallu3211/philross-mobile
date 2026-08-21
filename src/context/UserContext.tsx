import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import Utils from '../../app/helpers/Utilities';
import { onUserLogOutCleverTap } from '../../App';
import Purchases from 'react-native-purchases';
import { getServerSubscription } from '../../app/helpers/ApiHelper';

interface User {
  id?: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  accessToken?: string;
  refreshToken?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  getUserInitial: () => string;
  isLoggedIn: boolean;
  isLoading: boolean;
  logout: () => void;
  isSubscribed: boolean;
  setIsSubscribed: (value: boolean) => void;
  /** Re-reads it from the server. Call after a purchase or a restore. */
  refreshSubscription: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false); // 👈 added

  // Auto-login on app start
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await EncryptedStorage.getItem('userData');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.log('Failed to load user data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  /**
   * Whether this member has premium, asked of the server.
   *
   * It has to be the server, not RevenueCat. A subscription can now also be
   * granted from the admin, and RevenueCat has no record of those — asking it
   * reported a granted member as free. The endpoint knows about both kinds.
   *
   * This was the whole bug behind the menu badge: `setIsSubscribed` existed
   * and was exported, and nothing in the app had ever called it, so the flag
   * sat at its initial `false` and the menu read "Free account" for everyone,
   * paying members included.
   */
  const refreshSubscription = React.useCallback(async () => {
    if (!user) {
      setIsSubscribed(false);
      return;
    }
    try {
      // navigation is only used to log out on a 401, and Utils.logout does not
      // touch it, so there is nothing to pass here.
      const res: any = await getServerSubscription(null);
      const body = res?.data ?? res;
      setIsSubscribed(body?.is_subscribed === true);
    } catch {
      // Leave the last known answer rather than downgrading someone to free
      // because one request failed.
    }
  }, [user]);

  useEffect(() => {
    refreshSubscription();
  }, [refreshSubscription]);

  // Store token in Utilities for API calls
  useEffect(() => {
    if (user?.accessToken) {
      // Store token in Utilities for API calls
      const storeToken = async () => {
        try {
          if (user.accessToken) {
            await Utils.setItem('authToken', user.accessToken);
          }
        } catch (error) {
          console.log('Failed to store auth token:', error);
        }
      };
      storeToken();
    }
  }, [user?.accessToken]);

  const getUserInitial = (): string => {
    if (!user?.fullName) return '?';
    
    // Get first letter of first name
    const firstName = user.fullName.split(' ')[0];
    return firstName.charAt(0).toUpperCase();
  };

  const isLoggedIn = !!user;

  const logout = async () => {
    try {
      await EncryptedStorage.removeItem('userData');
      // Also clear auth token
      try {
        await Utils.deleteItem('authToken');
      } catch (error) {
        console.log('Failed to remove auth token:', error);
      }
      setUser(null);
      // setIsSubscribed(false); // 👈 reset on logout
      onUserLogOutCleverTap();
      await Purchases.logOut();
    } catch (error) {
      console.log('Failed to remove user data from storage:', error);
      setUser(null);
      // setIsSubscribed(false);
    }
  };

  const setUserAndSave = async (userData: User | null) => {
    try {
      if (userData) {
        await EncryptedStorage.setItem('userData', JSON.stringify(userData));
      } else {
        await EncryptedStorage.removeItem('userData');
      }
      Purchases.logIn(userData?.id?.toString() ?? '');
      setUser(userData);
    } catch (error) {
      console.log('Failed to save user data to storage:', error);
      setUser(userData);
    }
  };

  const value: UserContextType = {
    user,
    setUser: setUserAndSave,
    getUserInitial,
    isLoggedIn,
    isLoading,
    logout,
    isSubscribed,
    setIsSubscribed,
    refreshSubscription,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
