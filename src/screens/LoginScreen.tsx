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
} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { getFontFamily, getColors } from '../utils/platform';
import EyeIcon from '../../assets/icons/Icons.svg';
import googleImage from '../../assets/icons/google.png';
import appleImage from '../../assets/icons/apple.png';
import { useUser } from '../context/UserContext';
import { login, socialAuthLogin } from '../../app/helpers/ApiHelper';
import Utils from '../../app/helpers/Utilities';
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

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation, route }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loader, setLoader] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [hasPendingPurchase, setHasPendingPurchase] = useState(false);
  
  const colors = getColors();
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
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Feed' }], }));
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
    <View style={styles.container}>
      {/* {hasPendingPurchase && (
        <View style={styles.premiumBanner}>
          <Text style={styles.premiumBannerText}>
            🎉 You have a premium purchase! Login to activate it.
          </Text>
        </View>
      )} */}

      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: getFontFamily('heading') }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { fontFamily: getFontFamily('body') }]}>Your Strength Journey Awaits.</Text>
      </View>

      <View style={styles.form}>
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

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxText, { fontFamily: getFontFamily('body') }]}>Remember me</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={[styles.forgotPassword, { fontFamily: getFontFamily('body') }]}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.loginButton, 
            { backgroundColor: colors.primary },
            loader && { opacity: 0.7 }
          ]} 
          onPress={handleLogin}
          disabled={loader}
        >
          <Text style={[styles.loginButtonText, { fontFamily: getFontFamily('bold') }]}>
            {loader ? 'Logging In...' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, { fontFamily: getFontFamily('body') }]}>Or login with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth('google')}>
            <Image source={googleImage} style={{ width: 20, height: 20, marginRight: 8, backgroundColor: 'transparent' }} />
            <Text style={[styles.socialButtonText, { fontFamily: getFontFamily('body') }]}>Google</Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialAuth('apple')} >
            <Image source={appleImage} style={{ width: 22, height: 22, marginRight: 8, backgroundColor: 'transparent' }} />
            <Text style={[styles.socialButtonText, { fontFamily: getFontFamily('body') }]}>Apple</Text>
          </TouchableOpacity>}
        </View>

        <View style={styles.signupContainer}>
          <Text style={[styles.signupText, { fontFamily: getFontFamily('body') }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={[styles.signupLink, { color: colors.primary, fontFamily: getFontFamily('bold') }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  premiumBanner: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: 10,
  },
  premiumBannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: getFontFamily('bold'),
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 80 : 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
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
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#B62020',
    borderWidth: 2,
  },
  errorText: {
    color: '#B62020',
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
    borderColor: '#B62020',
    borderWidth: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 16,
  },
  eyeIconText: {
    fontSize: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#B62020',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#B62020',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
  },
  checkboxText: {
    fontSize: 16,
    color: '#000000',
  },
  forgotPassword: {
    fontSize: 16,
    color: '#B62020',
    textDecorationLine: 'underline',
  },
  loginButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
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
    fontSize: 14,
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
    fontSize: 16,
    color: '#000000',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#000000',
  },
  signupLink: {
    fontSize: 16,
    fontFamily: getFontFamily('heading'),
  },
});

export default LoginScreen;
