/**
 * SplashScreen — the app's own opening frame.
 *
 * There are two splashes here and they are not the same thing. The native one
 * (react-native-bootsplash) is a black screen with a 120pt logo; it covers the
 * moment before JavaScript is running and cannot show anything elaborate. This
 * screen is the one after it, and it is where the artwork belongs: it is a
 * normal React view, so the photograph can fill the screen at any aspect ratio.
 *
 * Nothing is drawn over the image. What was supplied is a finished piece of
 * artwork — the wordmark is already in it, on Phil's shirt — so a logo or a
 * gradient on top would be repeating work the designer has already done.
 */

import React, { useEffect } from 'react';
import { Image, StatusBar, StyleSheet, View } from 'react-native';
import { useUser } from '../context/UserContext';
import SplashArt from '../../assets/splash/splash.jpg';

/** How long the artwork is held before moving on. */
const HOLD_MS = 2600;

const SplashScreen = ({ navigation }: any) => {
  const { isLoggedIn, isLoading } = useUser();

  useEffect(() => {
    /**
     * Two conditions, not one: the hold has elapsed AND the session is known.
     *
     * The previous version started a single 3s timer and checked `isLoading`
     * only at the moment it fired. If the session was still resolving then —
     * a cold start on a slow connection — the timer was spent, nothing
     * navigated, and the app sat on the splash indefinitely. Because
     * `isLoading` is a dependency the effect re-runs when it settles, so this
     * version moves on as soon as both are true, whichever finishes last.
     */
    if (isLoading) return;

    const timer = setTimeout(() => {
      navigation.replace(isLoggedIn ? 'Dashboard' : 'Login');
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [navigation, isLoggedIn, isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* `cover` on a 9:16 photograph: a taller phone crops a little top and
          bottom, a shorter one a little from the sides. Either way the screen
          is filled and Phil stays centred — `contain` would letterbox him
          inside black bars on almost every device. */}
      <Image source={SplashArt} style={styles.art} resizeMode="cover" />
    </View>
  );
};

const styles = StyleSheet.create({
  // Black behind the image: it is what shows for the frame before the JPEG
  // decodes, and it matches the artwork's own edges so the seam is invisible.
  container: { flex: 1, backgroundColor: '#000000' },
  art: { flex: 1, width: '100%' },
});

export default SplashScreen;
