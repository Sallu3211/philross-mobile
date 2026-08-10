import React, { useEffect } from 'react';
import { View, StyleSheet, } from 'react-native';
import { useUser } from '../context/UserContext';

const SplashScreen = ({ navigation }: any) => {
  const { isLoggedIn, isLoading } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isLoggedIn) {
          // User is already logged in, go to the Dashboard
          navigation.replace('Dashboard');
        } else {
          // User is not logged in, go to Login
          navigation.replace('Login');
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, isLoggedIn, isLoading]);

  return (
    <View style={styles.container} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
