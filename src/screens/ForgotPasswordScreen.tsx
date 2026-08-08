/**
 * ForgotPasswordScreen — step one of the reset flow.
 *
 * Verifies the address exists, then hands off to NewPassword. Shares the auth
 * layout with Login and SignUp: black masthead carrying the logo, white sheet
 * below holding the form.
 */

import React, { useCallback, useState } from 'react';
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
import { ChevronRight, Mail } from '../components/ui/icons';
import PhilrossLogo from '../../assets/bootsplash/logo.png';
import { forgotPasswordRequest } from '../../app/helpers/ApiHelper';

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [loader, setLoader] = useState(false);

  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setLoader(true);
      const response = await forgotPasswordRequest(email.trim(), navigation);

      if (response?.status === true || response?.success === true) {
        navigation.navigate('NewPassword', { email: email.trim() });
      } else {
        Alert.alert('Error', 'Email not found.');
      }
    } catch (error: any) {
      console.error('Error during forgot password request:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoader(false);
    }
  }, [email, navigation]);

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
            onPress={() => navigation.goBack()}
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
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>We'll get you back to training.</Text>
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.lede}>
            Enter the email you signed up with and we'll take you through
            setting a new password.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrap}>
              <Mail size={17} color={theme.color.text.disabled} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.color.text.disabled}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="done"
                onSubmitEditing={handleEmailSubmit}
                editable={!loader}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loader && styles.btnDisabled]}
            onPress={handleEmailSubmit}
            disabled={loader}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {loader ? (
              <ActivityIndicator color={theme.color.text.onBrand} />
            ) : (
              <Text style={styles.primaryBtnText}>Continue</Text>
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
    // Only one field on this screen, so the masthead carries the height that
    // stops the sheet ending halfway up the display.
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
    fontSize: theme.type.body.fontSize,
    lineHeight: 21,
    color: theme.color.text.secondary,
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

export default ForgotPasswordScreen;
