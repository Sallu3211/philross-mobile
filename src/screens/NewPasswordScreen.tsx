import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import EyeIcon from '../../assets/icons/Icons.svg';
import { forgotPasswordReset } from '../../app/helpers/ApiHelper';

const { width, height } = Dimensions.get('window');

const NewPasswordScreen = ({ navigation, route }: any) => {
  const colors = getColors();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loader, setLoader] = useState(false);
  
  // Get email from route params
  const { email } = route.params || {};

  // Validate route params
  useEffect(() => {
    console.log('Route params received:', route.params);
    console.log('Email from route params:', email);
    
    if (!email) {
      Alert.alert('Error', 'Invalid reset session. Please try again.', [
        { text: 'OK', onPress: () => navigation.navigate('ForgotPassword') }
      ]);
    }
  }, [email, navigation, route.params]);

  const handlePasswordReset = async () => {
    // Validation
    if (!email || !email.trim()) {
      Alert.alert('Error', 'Email is missing. Please try again.');
      return;
    }
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Debug: Check email value
    console.log('Email from route params:', email);
    console.log('Password data being sent:', {
      email: email,
      new_password: newPassword.trim(),
      confirm_password: confirmPassword.trim()
    });

    // Ensure email is properly set
    if (!email || typeof email !== 'string') {
      Alert.alert('Error', 'Email parameter is missing or invalid. Please try again.');
      return;
    }

    try {
      setLoader(true);
      const response = await forgotPasswordReset({
        email: email,
        new_password: newPassword.trim(),
        confirm_password: confirmPassword.trim()
      }, navigation);
      
      if (response?.status === true || response?.success === true) {
        // Password reset successful
        Alert.alert('Success', 'Password has been reset successfully!', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to login with success message
              navigation.navigate('Login', { 
                showSuccessMessage: true,
                successMessage: 'Password reset successfully! You can now login with your new password.'
              });
            }
          }
        ]);
      } else {
        // Handle error
        let errorMessage = 'Password reset failed. Please try again.';
        
        if (response?.message) {
          if (typeof response.message === 'string') {
            errorMessage = response.message;
          } else if (response.message?.error) {
            errorMessage = Array.isArray(response.message.error) 
              ? response.message.error[0] 
              : response.message.error;
          }
        }
        
        Alert.alert('Error', errorMessage);
      }
    } catch (error: any) {
      console.error('Error during password reset:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoader(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: getFontFamily('heading') }]}>
          Set New Password
        </Text>
        <Text style={[styles.subtitle, { fontFamily: getFontFamily('body') }]}>
          Enter your new password below
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* New Password Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontFamily: getFontFamily('body') }]}>
            New Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, { fontFamily: getFontFamily('body') }]}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={(text) => {
                // Remove spaces from password
                const cleanText = text.replace(/\s/g, '');
                setNewPassword(cleanText);
              }}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <EyeIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontFamily: getFontFamily('body') }]}>
            Confirm New Password
          </Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, { fontFamily: getFontFamily('body') }]}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={(text) => {
                // Remove spaces from confirm password
                const cleanText = text.replace(/\s/g, '');
                setConfirmPassword(cleanText);
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <EyeIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity 
          style={[
            styles.resetButton, 
            { backgroundColor: colors.primary },
            loader && { opacity: 0.7 }
          ]} 
          onPress={handlePasswordReset}
          disabled={loader}
        >
          <Text style={[styles.resetButtonText, { fontFamily: getFontFamily('bold') }]}>
            {loader ? 'Resetting Password...' : 'Reset Password'}
          </Text>
        </TouchableOpacity>

        {/* Back to Forgot Password */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={[styles.backButtonText, { fontFamily: getFontFamily('body') }]}>
            Back to Forgot Password
          </Text>
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginText, { fontFamily: getFontFamily('body') }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={[styles.loginLink, { fontFamily: getFontFamily('bold') }]}>
              Sign In
            </Text>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  form: {
    flex: 1,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: getFontFamily('heading'),
    color: '#000000',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    padding: 16,
  },
  resetButton: {
    backgroundColor: '#B62020',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
  },
  backButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: '#B62020',
    textDecorationLine: 'underline',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: '#000000',
  },
  loginLink: {
    fontSize: 14,
    color: '#B62020',
    textDecorationLine: 'underline',
  },
});

export default NewPasswordScreen;
