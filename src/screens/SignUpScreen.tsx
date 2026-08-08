import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';
import { Check, Eye, EyeOff, Lock, Mail, User } from '../components/ui/icons';
import GoogleLogo from '../../assets/icons/google.png';
import AppleLogo from '../../assets/icons/apple.png';
// The current brand logo — same asset the splash screen uses.
import PhilrossLogo from '../../assets/bootsplash/logo.png';
import { signUp, socialAuthLogin } from '../../app/helpers/ApiHelper';
import { useUser } from '../context/UserContext';
import EncryptedStorage from 'react-native-encrypted-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { onUserLoginCleverTap } from '../../App';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import Toast from 'react-native-toast-message';
import { CommonActions } from '@react-navigation/native';

type AuthData = {
  provider: 'google' | 'apple';
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
};
const SignUpScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loader, setLoader] = useState(false);
  /** Separate from `loader` so a social tap never makes the Sign up button busy. */
  const [socialLoader, setSocialLoader] = useState<'google' | 'apple' | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const { setUser } = useUser();
  const { isConnected } = useNetworkStatus();

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreeToTerms(false);
  };

  const openTermsOfService = () => {
    Linking.openURL('https://philross.com/privacy-policy-terms-of-use');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://philross.com/privacy-policy-terms-of-use');
  };

  const handleSignUp = async () => {
    // Clear previous field errors
    setFieldErrors({});
    
    // Validation
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    try {
      setLoader(true);
      const response = await signUp({
        email: email.trim(),
        password: password,
        fullName: fullName.trim(),
        confirmPassword: confirmPassword
      }, navigation);
      
      // Check for success based on backend response structure
      if (response?.status === true || response?.success === true || response?.token || response?.access) {
        // Success - store user data and automatically log in
        const userData = {
          email: response?.data?.user?.email ?? '',
          fullName: response?.data?.user?.full_name ?? '',
          id: response?.data?.user?.user_id ?? '',
          refreshToken: response?.data?.refresh ?? '',
          accessToken: response?.data?.access ?? '',
        };

        await EncryptedStorage.setItem('authToken', response?.data?.access ?? '');

        console.log('userData >> ', userData);
        
        // Store user data in context (auto-login)
        setUser(userData);

        await onUserLoginCleverTap({
          id: String(response?.user?.id ?? response?.id),
          name: fullName.trim(),
          email: email.trim(),
        });
        
        resetForm();
        
        // Navigate to Feed immediately after successful signup
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Dashboard' }], }));
      } else {
        // Handle field-specific errors
        if (response?.fieldErrors && typeof response.fieldErrors === 'object') {
          setFieldErrors(response.fieldErrors);
        }
        
        // Handle different response formats safely
        let errorMessage = 'Sign up failed. Please try again.';
        
        if (response?.message) {
          if (typeof response.message === 'string') {
            errorMessage = response.message;
          } else if (Array.isArray(response.message)) {
            // Handle array messages - take the first element
            errorMessage = response.message[0] || 'Sign up failed. Please try again.';
          } else if (response.message?.password) {
            // Handle password validation errors
            if (Array.isArray(response.message.password)) {
              errorMessage = response.message.password[0];
            } else {
              errorMessage = response.message.password;
            }
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
              errorMessage = 'Sign up failed. Please try again.';
            }
          }
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error during sign up:', error);
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
          fullName:
            response?.data?.user?.full_name ||
            response?.user?.full_name ||
            authData.name ||
            (authData.email ? authData.email.split('@')[0] : ''),
          id: response?.data?.user_id || authData.sub,
          accessToken,
          refreshToken,
        };

        setUser(userData);

        await onUserLoginCleverTap({
          id: String(response?.data?.user?.id ?? response?.user?.id ?? authData.sub),
          name:
            response?.data?.user?.full_name ??
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
        <View style={styles.masthead}>
          <Image source={PhilrossLogo} style={styles.logo} resizeMode="contain" />
          <View style={styles.mastheadText}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start training with Master Phil.</Text>
          </View>
        </View>

        <View style={styles.sheet}>
          {/* Full name */}
          <View style={styles.field}>
            <Text style={styles.label}>Full name</Text>
            <View style={[styles.inputWrap, fieldErrors.full_name && styles.inputWrapError]}>
              <User size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={theme.color.text.disabled}
                value={fullName}
                onChangeText={text => {
                  setFullName(text);
                  if (fieldErrors.full_name) {
                    setFieldErrors(prev => ({ ...prev, full_name: '' }));
                  }
                }}
                autoCapitalize="words"
                returnKeyType="next"
                editable={!busy}
              />
            </View>
            {!!fieldErrors.full_name && (
              <Text style={styles.errorText}>{fieldErrors.full_name}</Text>
            )}
          </View>

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
                placeholder="At least 8 characters"
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
                returnKeyType="next"
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

          {/* Confirm password */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View
              style={[
                styles.inputWrap,
                fieldErrors.confirm_password && styles.inputWrapError,
              ]}
            >
              <Lock size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={theme.color.text.disabled}
                value={confirmPassword}
                onChangeText={text => {
                  setConfirmPassword(text.replace(/\s/g, ''));
                  if (fieldErrors.confirm_password) {
                    setFieldErrors(prev => ({ ...prev, confirm_password: '' }));
                  }
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                editable={!busy}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={theme.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={
                  showConfirmPassword ? 'Hide password' : 'Show password'
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} color={theme.color.text.muted} />
                ) : (
                  <Eye size={18} color={theme.color.text.muted} />
                )}
              </TouchableOpacity>
            </View>
            {!!fieldErrors.confirm_password && (
              <Text style={styles.errorText}>{fieldErrors.confirm_password}</Text>
            )}
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.terms}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreeToTerms }}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxOn]}>
              {agreeToTerms && <Check size={11} color={theme.color.text.inverse} />}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink} onPress={openTermsOfService}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.termsLink} onPress={openPrivacyPolicy}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Primary action */}
          <TouchableOpacity
            style={[styles.primaryBtn, busy && styles.btnDisabled]}
            onPress={handleSignUp}
            disabled={busy}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {loader ? (
              <ActivityIndicator color={theme.color.text.onBrand} />
            ) : (
              <Text style={styles.primaryBtnText}>Create account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
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
                  <Image source={GoogleLogo} style={styles.socialLogo} />
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
                    <Image source={AppleLogo} style={styles.socialLogo} />
                    <Text style={styles.socialText}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              hitSlop={theme.hitSlop}
            >
              <Text style={styles.footerLink}>Log in</Text>
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

  /** Logo and heading share one row — a lockup rather than a stack. */
  masthead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.logoGround,
    paddingHorizontal: theme.space['2xl'],
    paddingTop: theme.space['2xl'],
    paddingBottom: theme.space.xl,
  },
  logo: {
    width: 58,
    height: 58,
    marginLeft: -4,
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

  sheet: {
    flex: 1,
    backgroundColor: theme.color.surface.app,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: theme.space['2xl'],
    paddingTop: theme.space['2xl'],
    paddingBottom: theme.space['3xl'],
    gap: theme.space.lg,
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

  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md },
  checkbox: {
    width: 19,
    height: 19,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: theme.color.brand.base,
    borderColor: theme.color.brand.base,
  },
  termsText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 19,
    color: theme.color.text.secondary,
  },
  termsLink: {
    fontFamily: theme.font.semibold,
    color: theme.color.brand.base,
  },

  primaryBtn: {
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.space.xs,
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

export default SignUpScreen;
