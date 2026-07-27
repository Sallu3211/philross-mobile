import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import EyeIcon from '../../assets/icons/Icons.svg';
import GoogleLogo from '../../assets/icons/google.png';
import AppleLogo from '../../assets/icons/apple.png';
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
const { width } = Dimensions.get('window');

const SignUpScreen = ({ navigation }: any) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loader, setLoader] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const colors = getColors();
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
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Feed' }], }));
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
      setLoader(true);

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

        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Feed' }], }));
      }

    } catch (error: any) {
      console.error(`Error during ${provider} authentication:`, error);
      Alert.alert('Error', `${provider.charAt(0).toUpperCase() + provider.slice(1)} authentication failed. Please try again.`);
    } finally {
      setLoader(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}}>
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: getFontFamily('heading') }]}>Hi, Welcome</Text>
        <Text style={[styles.subtitle, { fontFamily: getFontFamily('body') }]}>Join Master Phil's Fitness & Self-Defense Community</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: getFontFamily('heading') }]}>Full Name</Text>
          <TextInput
            style={[
              styles.input, 
              { fontFamily: getFontFamily('body') },
              fieldErrors.full_name && styles.inputError
            ]}
            placeholder="Phil Rose"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              // Clear full_name error when user starts typing
              if (fieldErrors.full_name) {
                setFieldErrors(prev => ({ ...prev, full_name: '' }));
              }
            }}
            autoCapitalize="words"
          />
          {fieldErrors.full_name && (
            <Text style={styles.errorText}>{fieldErrors.full_name}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: getFontFamily('heading') }]}>Email</Text>
          <TextInput
            style={[
              styles.input, 
              { fontFamily: getFontFamily('body') },
              fieldErrors.email && styles.inputError
            ]}
            placeholder="phillrose123@gmail.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              // Clear email error when user starts typing
              if (fieldErrors.email) {
                setFieldErrors(prev => ({ ...prev, email: '' }));
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {fieldErrors.email && (
            <Text style={styles.errorText}>{fieldErrors.email}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: getFontFamily('heading') }]}>Password</Text>
          <View style={[styles.passwordContainer, fieldErrors.password && styles.passwordContainerError]}>
            <TextInput
              style={[
                styles.passwordInput, 
                { fontFamily: getFontFamily('body') },
                fieldErrors.password && styles.inputError
              ]}
              placeholder="**************"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                // Remove spaces from password
                const cleanText = text.replace(/\s/g, '');
                setPassword(cleanText);
                // Clear password error when user starts typing
                if (fieldErrors.password) {
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <EyeIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
          {fieldErrors.password && (
            <Text style={styles.errorText}>{fieldErrors.password}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { fontFamily: getFontFamily('heading') }]}>Confirm Password</Text>
          <View style={[styles.passwordContainer, fieldErrors.confirm_password && styles.passwordContainerError]}>
            <TextInput
              style={[
                styles.passwordInput, 
                { fontFamily: getFontFamily('body') },
                fieldErrors.confirm_password && styles.inputError
              ]}
              placeholder="**************"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                // Remove spaces from confirm password
                const cleanText = text.replace(/\s/g, '');
                setConfirmPassword(cleanText);
                // Clear confirm_password error when user starts typing
                if (fieldErrors.confirm_password) {
                  setFieldErrors(prev => ({ ...prev, confirm_password: '' }));
                }
              }}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <EyeIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
          {fieldErrors.confirm_password && (
            <Text style={styles.errorText}>{fieldErrors.confirm_password}</Text>
          )}
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreeToTerms(!agreeToTerms)}
          >
            <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
              {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { fontFamily: getFontFamily('body') }]}>
              I agree to the{' '}
              <Text style={[styles.termsLink, { color: colors.primary }]} onPress={openTermsOfService}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={[styles.termsLink, { color: colors.primary }]} onPress={openPrivacyPolicy}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.signupButton, 
            { backgroundColor: colors.primary },
            loader && { opacity: 0.7 }
          ]} 
          onPress={handleSignUp}
          disabled={loader}
        >
          <Text style={[styles.signupButtonText, { fontFamily: getFontFamily('bold') }]}>
            {loader ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, { fontFamily: getFontFamily('body') }]}>Or sign up with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth('google')}>
            <Image source={GoogleLogo} style={{ width: 20, height: 20, marginRight: 8, backgroundColor: 'transparent' }} resizeMode="contain" />
            <Text style={[styles.socialButtonText, { fontFamily: getFontFamily('body') }]}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth('apple')}>
            <Image source={AppleLogo} style={{ width: 22, height: 22, marginRight: 8, backgroundColor: 'transparent' }} resizeMode="contain" />
            <Text style={[styles.socialButtonText, { fontFamily: getFontFamily('body') }]}>Apple</Text>
          </TouchableOpacity>}
        </View>

        <View style={styles.signinContainer}>
          <Text style={[styles.signinText, { fontFamily: getFontFamily('body') }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.signinLink, { color: colors.primary, fontFamily: getFontFamily('bold') }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 80 : 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: getFontFamily('heading'),
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: getFontFamily('heading'),
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordContainerError: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  eyeIconText: {
    fontSize: 20,
  },
  termsContainer: {
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
  },
  termsText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    fontFamily: getFontFamily('heading'),
  },
  signupButton: {
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999999',
    fontSize: 12,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 12,
    marginHorizontal: 8,
  },
  googleIcon: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#4285F4',
    marginRight: 8,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    fontSize: 14,
    color: '#000000',
  },
  signinLink: {
    fontSize: 14,
    fontFamily: getFontFamily('heading'),
  },

});

export default SignUpScreen;
