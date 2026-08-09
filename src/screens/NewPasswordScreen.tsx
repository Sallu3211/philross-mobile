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
import { theme } from '../theme';
import { ChevronRight, Eye, EyeOff, Lock } from '../components/ui/icons';
import PhilrossLogo from '../../assets/bootsplash/logo.png';
import { forgotPasswordReset } from '../../app/helpers/ApiHelper';

const NewPasswordScreen = ({ navigation, route }: any) => {
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
          <TouchableOpacity
            style={styles.back}
            onPress={() => navigation.navigate('ForgotPassword')}
            hitSlop={theme.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <View style={styles.backChevron}>
              <ChevronRight size={17} color={theme.color.text.inverse} />
            </View>
          </TouchableOpacity>

          <View style={styles.mastheadRow}>
            <Image source={PhilrossLogo} style={styles.logo} resizeMode="contain" />
            <View style={styles.mastheadText}>
              <Text style={styles.title}>New password</Text>
              <Text style={styles.subtitle}>Choose something you'll remember.</Text>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          {!!email && (
            <Text style={styles.lede}>
              Setting a new password for <Text style={styles.ledeStrong}>{email}</Text>
            </Text>
          )}

          {/* New password */}
          <View style={styles.field}>
            <Text style={styles.label}>New password</Text>
            <View style={styles.inputWrap}>
              <Lock size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="At least 8 characters"
                placeholderTextColor={theme.color.text.disabled}
                value={newPassword}
                onChangeText={t => setNewPassword(t.replace(/\s/g, ''))}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                returnKeyType="next"
                editable={!loader}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                hitSlop={theme.hitSlop}
                accessibilityRole="button"
                accessibilityLabel={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color={theme.color.text.muted} />
                ) : (
                  <Eye size={18} color={theme.color.text.muted} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm password */}
          <View style={styles.field}>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.inputWrap}>
              <Lock size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor={theme.color.text.disabled}
                value={confirmPassword}
                onChangeText={t => setConfirmPassword(t.replace(/\s/g, ''))}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handlePasswordReset}
                editable={!loader}
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
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loader && styles.btnDisabled]}
            onPress={handlePasswordReset}
            disabled={loader}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {loader ? (
              <ActivityIndicator color={theme.color.text.onBrand} />
            ) : (
              <Text style={styles.primaryBtnText}>Save new password</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remembered it? </Text>
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

  masthead: {
    backgroundColor: theme.color.surface.logoGround,
    paddingHorizontal: theme.space['2xl'],
    paddingTop: 28,
    paddingBottom: theme.space['3xl'],
  },
  back: { marginBottom: 32 },
  backChevron: {
    // The chevron glyph points right; flip it for "back".
    transform: [{ scaleX: -1 }],
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mastheadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
  },
  logo: { width: 58, height: 58, marginLeft: -4 },
  mastheadText: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: theme.font.bold,
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
    paddingTop: theme.space['3xl'],
    paddingBottom: theme.space['4xl'],
    gap: theme.space.xl,
  },
  lede: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
  },
  ledeStrong: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.primary,
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
  input: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
    paddingVertical: theme.space.md,
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

export default NewPasswordScreen;
