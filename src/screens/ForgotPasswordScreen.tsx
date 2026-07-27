import React, { useState } from 'react';
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
import { forgotPasswordRequest } from '../../app/helpers/ApiHelper';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }: any) => {
  const colors = getColors();
  const [email, setEmail] = useState('');
  const [loader, setLoader] = useState(false);

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoader(true);
      const response = await forgotPasswordRequest(email.trim(), navigation);
      
      if (response?.status === true || response?.success === true) {
        // Email exists, navigate directly to password reset screen
        console.log('Email validated successfully, navigating to password reset with email:', email.trim());
        navigation.navigate('NewPassword', { email: email.trim() });
      } else {
        // Handle error - show user-friendly message
        Alert.alert('Error', 'Email not found.');
      }
    } catch (error: any) {
      console.error('Error during forgot password request:', error);
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
          Reset Password
        </Text>
        <Text style={[styles.subtitle, { fontFamily: getFontFamily('body') }]}>
          Enter your email to reset your password
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Email Field */}
        <View style={styles.inputContainer}>
          <Text style={[styles.label, { fontFamily: getFontFamily('body') }]}>
            Email
          </Text>
          <TextInput
            style={[styles.input, { fontFamily: getFontFamily('body') }]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            { backgroundColor: colors.primary },
            loader && { opacity: 0.7 }
          ]} 
          onPress={handleEmailSubmit}
          disabled={loader}
        >
          <Text style={[styles.actionButtonText, { fontFamily: getFontFamily('bold') }]}>
            {loader ? 'Checking...' : 'Continue'}
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
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    backgroundColor: '#B62020',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
    color: '#000000',
  },
  loginLink: {
    fontSize: 16,
    color: '#B62020',
    textDecorationLine: 'underline',
  },
});

export default ForgotPasswordScreen;
