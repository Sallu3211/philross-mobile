import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { theme } from '../theme';
import { Check, Eye, EyeOff, Lock, Mail } from '../components/ui/icons';
import googleImage from '../../assets/icons/google.png';
import appleImage from '../../assets/icons/apple.png';
// The current brand logo — same asset the splash screen uses, so login matches
// what people see at launch. assets/icons/*.png still hold the pre-rebrand mark.
import PhilrossLogo from '../../assets/bootsplash/logo.png';
import { useUser } from '../context/UserContext';
import { login, socialAuthLogin } from '../../app/helpers/ApiHelper';
import { onUserLoginCleverTap } from '../../App';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Toast from 'react-native-toast-message';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Purchases from 'react-native-purchases';
import { hasPendingAnonymousPurchase } from '../services/subscriptionService';
import { CommonActions } from '@react-navigation/native';

type AuthData = {
  provider: 'google' | 'apple';
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};

const LoginScreen = ({ navigation, route }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loader, setLoader] = useState(false);
  /**
   * Tracked separately from `loader`. Both flows used to share one flag, so
   * tapping "Continue with Google" flipped the email Log In button to
   * "Logging In..." — the wrong button appeared busy.
   */
  const [socialLoader, setSocialLoader] = useState<'google' | 'apple' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [hasPendingPurchase, setHasPendingPurchase] = useState(false);
  
  const { setUser } = useUser();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedData = await EncryptedStorage.getItem('rememberedUser');
        if (savedData) {
          const { email, password } = JSON.parse(savedData);
          setEmail(email);
          setPassword(password);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Error loading saved credentials:', error);
      }
    };
    loadSavedCredentials();
  }, []);



  // Check for pending anonymous purchase
  useEffect(() => {
    const checkPending = async () => {
      const pending = await hasPendingAnonymousPurchase();
      setHasPendingPurchase(pending);
    };
    checkPending();
  }, []);

  // Check for success message from password reset
  useEffect(() => {
    if (route.params?.showSuccessMessage && route.params?.successMessage) {
      Alert.alert('Success', route.params.successMessage);
      // Clear the params to avoid showing the message again
      navigation.setParams({ showSuccessMessage: false, successMessage: '' });
    }
  }, [route.params, navigation]);

  const handleLogin = async () => {
    // Clear previous field errors
    setFieldErrors({});
    
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    try {
      setLoader(true);
      const response = await login({
        email: email.trim(),
        password: password
      }, navigation);
      
      // Check for success based on backend response structure
      if (response?.status === true || response?.success === true || response?.token || response?.access) {
        // Success - store user data and navigate to Feed
        const accessToken = response?.data?.access || response?.access || response?.token; // prefer data.access
        const refreshToken = response?.data?.refresh || response?.refresh;
        
        const userData = {
          email: email.trim(),
          fullName: response?.data?.user?.full_name || response?.user?.full_name || email.split('@')[0], // Use backend data or fallback
          id: response?.data?.user?.user_id || response?.user?.id,
          accessToken,
          refreshToken,
        };
        
        // Store user data in context
        setUser(userData);

        // Login to RevenueCat (transfers any anonymous purchases to this user)
        try {
          await Purchases.logIn(String(userData.id));
          console.log('✅ RevenueCat login successful for user:', userData.id);
          
          // ⭐ Clear anonymous purchase data after login
          if (hasPendingPurchase) {
            console.log('🎉 Anonymous purchase transferred to user account!');
            
            // Clear the stored anonymous purchase data
            await EncryptedStorage.removeItem('anonymous_purchase_data');
            console.log('✅ Anonymous purchase data cleared after login');
            
            // Update state
            setHasPendingPurchase(false);
          }
        } catch (rcError) {
          console.error('RevenueCat login error:', rcError);
        }

        await onUserLoginCleverTap({
          id: String(response?.data?.user?.id ?? response?.user?.id),
          name: response?.data?.user?.full_name ?? response?.user?.full_name ?? email.split('@')[0],
          email: email.trim(),
        });
        
        // Also store tokens in Utils for API calls
        try {
          await EncryptedStorage.setItem("authToken", accessToken);
          if (refreshToken) {
            await EncryptedStorage.setItem("refreshToken", refreshToken);
          }
        } catch (error) {
          console.error('Failed to store tokens:', error);
        }

        if (rememberMe) {
          try {
            await EncryptedStorage.setItem('rememberedUser', JSON.stringify({ email: email.trim(), password }));
          } catch (error) { console.log('Failed to save remembered credentials:', error); }
        } else { await EncryptedStorage.removeItem('rememberedUser'); }
        
        // Navigate to Feed
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Dashboard' }], }));
      } else {
        // Handle field-specific errors
        if (response?.fieldErrors && typeof response.fieldErrors === 'object') {
          setFieldErrors(response.fieldErrors);
        }
        
        // Handle different response formats safely
        let errorMessage = 'Login failed. Please check your credentials.';
        
        if (response?.message) {
          if (typeof response.message === 'string') {
            errorMessage = response.message;
          } else if (Array.isArray(response.message)) {
            // Handle array messages - take the first element
            errorMessage = response.message[0] || 'Login failed. Please check your credentials.';
          } else if (response.message?.error) {
            errorMessage = Array.isArray(response.message.error) 
              ? response.message.error[0] 
              : response.message.error;
          } else if (typeof response.message === 'object') {
            // If it's an object, try to find a message property
            if (response.message.message && Array.isArray(response.message.message)) {
              errorMessage = response.message.message[0];
            } else if (response.message.message && typeof response.message.message === 'string') {
              errorMessage = response.message.message;
            } else {
              errorMessage = 'Login failed. Please check your credentials.';
            }
          }
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error during login:', error);
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error && typeof error === 'object') {
        if (error.message) {
          // Handle array messages in error.message
          if (Array.isArray(error.message)) {
            errorMessage = error.message[0] || 'Something went wrong. Please try again.';
          } else if (typeof error.message === 'string') {
            errorMessage = error.message;
          } else {
            errorMessage = 'Something went wrong. Please try again.';
          }
        } else if (error.toString) {
          errorMessage = error.toString();
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoader(false);
    }
  };

  // ---- Google Login ----
  const loginWithGoogle = async (): Promise<AuthData | null> => {
    try {
      GoogleSignin.configure({
        webClientId: '323198781293-0q2vpo2e68khshf9u35j4teiknej1tml.apps.googleusercontent.com',
        offlineAccess: true,
        scopes: ['email', 'profile'],
        forceCodeForRefreshToken: true,
        accountName: undefined, // This forces account selection screen
      });
      await GoogleSignin.hasPlayServices();
      // Sign out first to force account selection (with error handling)
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        // Ignore sign out errors - user might not be signed in
        console.log('No user to sign out:', signOutError);
      }
      const userInfo = await GoogleSignin.signIn();
      return {
        provider: 'google',
        sub: userInfo?.user?.id,
        name: userInfo?.user?.name ?? '',
        email: userInfo?.user?.email,
        picture: userInfo?.user?.photo ?? '',
      };
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      Alert.alert('Google Sign-In Error', error.message || 'Google authentication failed');
      return null;
    }
  };

  // ---- Apple Login ----
  const loginWithApple = async (): Promise<AuthData | null> => {
    try {
      const { appleAuth } = require('@invertase/react-native-apple-authentication');

      if (!appleAuth.isSupported) {
        Alert.alert('Error', 'Apple authentication not supported on this device');
        return null;
      }

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identity token returned');
      }

      return {
        provider: 'apple',
        sub: appleAuthRequestResponse.user,
        name: appleAuthRequestResponse.fullName
          ? `${appleAuthRequestResponse.fullName.givenName ?? ''} ${appleAuthRequestResponse.fullName.familyName ?? ''}`.trim()
          : '',
        email: appleAuthRequestResponse.email ?? '',
        picture: '',
      };
    } catch (error: any) {
      console.error('Apple Sign-In Error:', error);
      Alert.alert('Apple Sign-In Error', error.message || 'Apple authentication failed');
      return null;
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    // Check internet connection first
    if (!isConnected) {
      Toast.show({
        type: 'error',
        text1: 'No Internet Connection',
        text2: 'Please check your internet connection and try again.',
        position: 'bottom',
        visibilityTime: 3000,
      });
      return;
    }

    try {
      setSocialLoader(provider);

      let authData: AuthData | null = null;

      if (provider === 'google') {
        authData = await loginWithGoogle();
      } else if (provider === 'apple') {
        authData = await loginWithApple();
      }

      if (!authData) return; // exit if login failed

      // 🔹 Handle API call once (common for both providers)
      const response = await socialAuthLogin(authData, navigation);

      if (response?.status === true || response?.success === true || response?.token || response?.access) {
        const accessToken = response?.data?.access || response?.access || response?.token;
        const refreshToken = response?.data?.refresh || response?.refresh;

        const userData = {
          email: authData.email?.trim() || '',
          /**
           * The two login endpoints return different shapes, and this only
           * handled one of them.
           *
           *   POST accounts/login/              → data.user.full_name  (nested)
           *   POST accounts/social-auth-login/  → data.full_name       (flat)
           *
           * Reading only the nested form meant every Google sign-in fell
           * through to `authData.name` — the name on the device's Google
           * account — so a name the user had set in Profile was replaced by
           * their Google name on every login. The server had it right the
           * whole time; the app was not reading it.
           *
           * The provider's name stays as a last resort, for a brand-new
           * account the server has no name for yet.
           */
          fullName:
            response?.data?.user?.full_name ||
            response?.data?.full_name ||
            response?.user?.full_name ||
            authData.name ||
            (authData.email ? authData.email.split('@')[0] : ''),
          id: response?.data?.user_id || response?.data?.user?.user_id || authData.sub,
          accessToken,
          refreshToken,
        };

        setUser(userData);

        // Login to RevenueCat (transfers any anonymous purchases to this user)
        try {
          await Purchases.logIn(String(userData.id));
          console.log('✅ RevenueCat social login successful for user:', userData.id);
          
          // ⭐ Clear anonymous purchase data after social login
          if (hasPendingPurchase) {
            console.log('🎉 Anonymous purchase transferred via social login!');
            
            // Clear the stored anonymous purchase data
            await EncryptedStorage.removeItem('anonymous_purchase_data');
            console.log('✅ Anonymous purchase data cleared after social login');
            
            // Update state
            setHasPendingPurchase(false);
          }
        } catch (rcError) {
          console.error('RevenueCat social login error:', rcError);
        }

        await onUserLoginCleverTap({
          // Same two shapes as above — analytics should record the account's
          // name, not whatever the device's Google account happens to say.
          id: String(userData.id),
          name:
            response?.data?.user?.full_name ??
            response?.data?.full_name ??
            response?.user?.full_name ??
            authData.name ??
            authData.email?.split('@')[0] ??
            '',
          email: authData.email?.trim() ?? '',
        });

        try {
          await EncryptedStorage.setItem('authToken', accessToken);
          if (refreshToken) {
            await EncryptedStorage.setItem('refreshToken', refreshToken);
          }
        } catch (storageError) {
          console.error('Failed to store tokens:', storageError);
        }

        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Dashboard' }], }));
      }
    } catch (error: any) {
      console.error(`Error during ${provider} authentication:`, error);
      Alert.alert('Error', `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`);
    } finally {
      setSocialLoader(null);
    }
  };

  const busy = loader || socialLoader !== null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.color.surface.logoGround} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Dark masthead — the logo needs a dark ground, and it separates the
            brand from the form so the form reads as the thing to act on. */}
        <View style={styles.masthead}>
          <Image source={PhilrossLogo} style={styles.logo} resizeMode="contain" />
          <View style={styles.mastheadText}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Your strength journey awaits.</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, fieldErrors.email && styles.inputWrapError]}>
              <Mail size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.color.text.disabled}
                value={email}
                onChangeText={text => {
                  setEmail(text);
                  if (fieldErrors.email) {
                    setFieldErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                editable={!busy}
              />
            </View>
            {!!fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrap, fieldErrors.password && styles.inputWrapError]}>
              <Lock size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={theme.color.text.disabled}
                value={password}
                onChangeText={text => {
                  setPassword(text.replace(/\s/g, ''));
                  if (fieldErrors.password) {
                    setFieldErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!busy}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={theme.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} color={theme.color.text.muted} />
                ) : (
                  <Eye size={18} color={theme.color.text.muted} />
                )}
              </TouchableOpacity>
            </View>
            {!!fieldErrors.password && (
              <Text style={styles.errorText}>{fieldErrors.password}</Text>
            )}
          </View>

          {/* Remember me + forgot */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.remember}
              onPress={() => setRememberMe(!rememberMe)}
              hitSlop={theme.hitSlop}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                {rememberMe && <Check size={11} color={theme.color.text.inverse} />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              hitSlop={theme.hitSlop}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary action */}
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={busy}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {loader ? (
              <ActivityIndicator color={theme.color.text.onBrand} />
            ) : (
              <Text style={styles.primaryBtnText}>Log in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social */}
          <View style={styles.socialCol}>
            <TouchableOpacity
              style={[styles.socialBtn, busy && styles.btnDisabled]}
              onPress={() => handleSocialAuth('google')}
              disabled={busy}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {socialLoader === 'google' ? (
                <ActivityIndicator color={theme.color.text.primary} size="small" />
              ) : (
                <>
                  <Image source={googleImage} style={styles.socialLogo} />
                  <Text style={styles.socialText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={[styles.socialBtn, busy && styles.btnDisabled]}
                onPress={() => handleSocialAuth('apple')}
                disabled={busy}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                {socialLoader === 'apple' ? (
                  <ActivityIndicator color={theme.color.text.primary} size="small" />
                ) : (
                  <>
                    <Image source={appleImage} style={styles.socialLogo} />
                    <Text style={styles.socialText}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SignUp')}
              hitSlop={theme.hitSlop}
            >
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.color.surface.logoGround },
  scroll: { flexGrow: 1 },

  /** Logo and greeting share one row — a lockup rather than a stack. */
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.logoGround,
    paddingHorizontal: theme.space['2xl'],
    // Login has only two fields, so without a taller masthead the sheet ends
    // well short of the bottom and the screen reads half-empty.
    paddingTop: 65,
    paddingBottom: theme.space['3xl'],
  },
  logo: {
    width: 58,
    height: 58,
    marginLeft: -4, // optical alignment: the artwork carries its own padding
  },
  mastheadText: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: theme.font.bold,
    // h1 rather than display: beside a 58px logo the larger step wraps.
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.inverse,
  },
  subtitle: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: theme.type.body.lineHeight,
    color: theme.color.text.inverseSecondary,
    marginTop: theme.space.sm,
  },

  /** White sheet lifted over the dark masthead. */
  sheet: {
    flex: 1,
    backgroundColor: theme.color.surface.app,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.space['2xl'],
    paddingTop: theme.space['3xl'],
    paddingBottom: theme.space['4xl'],
    gap: theme.space.xl,
  },

  field: { gap: theme.space.sm },
  label: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.color.border.subtle,
    paddingHorizontal: theme.space.lg,
    minHeight: 52,
  },
  inputWrapError: { borderColor: theme.color.brand.base },
  input: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
    paddingVertical: theme.space.md,
  },
  errorText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.brand.base,
  },

  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -theme.space.xs,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: theme.color.brand.base,
    borderColor: theme.color.brand.base,
  },
  rememberText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.secondary,
  },
  forgot: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },

  primaryBtn: {
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },

  divider: { flexDirection: 'row', alignItems: 'center', gap: theme.space.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.color.border.subtle },
  dividerText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },

  socialCol: { gap: theme.space.md },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.color.border.subtle,
    minHeight: 52,
  },
  socialLogo: { width: 19, height: 19 },
  socialText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.space.sm,
  },
  footerText: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.secondary,
  },
  footerLink: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },
});

export default LoginScreen;
