import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, } from 'react-native';
import SplashLogo from '../../assets/icons/splash.png';
import { useUser } from '../context/UserContext';

const { width, height } = Dimensions.get('window');
const IMAGE_ASPECT_RATIO = 1;

const SplashScreen = ({ navigation }: any) => {
  const { isLoggedIn, isLoading } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isLoggedIn) {
          // User is already logged in, go to Feed
          navigation.replace('Feed');
        } else {
          // User is not logged in, go to Login
          navigation.replace('Login');
        }
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, isLoggedIn, isLoading]);

  return (
    <View style={styles.container}>
      <Image source={SplashLogo} style={{ width: '55%', aspectRatio: IMAGE_ASPECT_RATIO, }} resizeMode='contain' />
    </View>
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
