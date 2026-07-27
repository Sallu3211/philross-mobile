import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import Utils from '../../app/helpers/Utilities';
import { onUserLogOutCleverTap } from '../../App';
import Purchases from 'react-native-purchases';

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
  isSubscribed: boolean; // 👈 added
  setIsSubscribed: (value: boolean) => void; // 👈 added
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
    isSubscribed,       // 👈 added
    setIsSubscribed,    // 👈 added
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
