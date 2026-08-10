import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Check } from '../components/ui/icons';

const ApplicationConfirmationScreen = ({ navigation }: any) => (
  <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

    {/* No back or share here on purpose. The application is already sent;
        the only useful move is forward. */}
    <View style={styles.content}>
      <View style={styles.badge}>
        <Check size={38} color={theme.color.text.inverse} />
      </View>

      <Text style={styles.title}>Application sent</Text>

      <Text style={styles.body}>
        Master Phil's team will review your details and get back to you within
        24 to 48 hours to build your coaching plan.
      </Text>
    </View>

    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => navigation.navigate('Dashboard')}
        activeOpacity={0.9}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText}>Back to dashboard</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space['3xl'],
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.status.success,
    marginBottom: theme.space['2xl'],
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.display.fontSize,
    lineHeight: theme.type.display.lineHeight,
    letterSpacing: theme.type.display.letterSpacing,
    color: theme.color.text.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    textAlign: 'center',
    marginTop: theme.space.md,
  },
  bar: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.lg,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
  },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },
});

export default ApplicationConfirmationScreen;
