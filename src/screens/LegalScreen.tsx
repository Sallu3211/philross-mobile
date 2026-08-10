/**
 * LegalScreen — Privacy Policy and Terms of Use, served from inside the app.
 *
 * Both documents used to open philross.com in a browser. Apple and Google both
 * want these reachable without leaving the app, and a browser hop in the middle
 * of signup or a purchase is where people abandon.
 *
 * One screen renders either document; the route param picks which:
 *   navigation.navigate('Legal', { doc: 'privacy' | 'terms' })
 *
 * The text lives in this file rather than being fetched, so it is available
 * offline and cannot change under a user who is mid-purchase. When the wording
 * changes, bump LAST_UPDATED — a policy with a stale date reads as abandoned.
 *
 * ⚠️ This is a plain-language starting point written from what the app
 * actually does. It has not been reviewed by a lawyer, and it must stay in
 * step with the public pages at philross.com and with the Play Store data
 * safety form and App Store privacy labels.
 */

import React from 'react';
import { Linking, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';

const LAST_UPDATED = '10 August 2026';
const SUPPORT_EMAIL = 'info@philross.com';

interface Section {
  heading: string;
  body: string[];
  bullets?: string[];
}

interface Doc {
  title: string;
  intro: string;
  sections: Section[];
}

const PRIVACY: Doc = {
  title: 'Privacy Policy',
  intro:
    'This policy explains what the Master Phil app collects, why it collects it, and what you can do about it.',
  sections: [
    {
      heading: 'What we collect',
      body: [
        'We collect only what the app needs to work:',
      ],
      bullets: [
        'Your account details — name and email address, given when you sign up or sign in with Google or Apple.',
        'Your training activity — which videos and courses you have opened and how far through them you are.',
        'Applications you submit — if you apply for coaching, the answers you give on that form, including your phone number and city.',
        'Basic technical data — device type, operating system version and app version, used to diagnose crashes.',
      ],
    },
    {
      heading: 'What we do not collect',
      body: [
        'We do not collect your payment card details. Subscriptions are purchased through the App Store or Google Play, and your card never passes through us. We only receive confirmation that a subscription is active.',
        'We do not sell your personal information, and we do not share it with advertisers.',
      ],
    },
    {
      heading: 'Why we use it',
      body: [
        'To give you access to the content your account is entitled to, to remember where you left off, to answer you when you contact us or apply for coaching, and to fix problems in the app.',
      ],
    },
    {
      heading: 'Who else sees it',
      body: [
        'A small number of services help us run the app, and they see only what they need:',
      ],
      bullets: [
        'Apple and Google — process subscription payments and tell us whether yours is active.',
        'RevenueCat — manages subscription status on our behalf.',
        'Our own servers — store your account, your applications and your training activity.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'We keep your account information for as long as your account exists. If you delete your account, we remove your personal information from our systems, except where we are required to keep records of transactions.',
      ],
    },
    {
      heading: 'Your choices',
      body: [
        'You can delete your account at any time from the menu, under Account. Deleting is permanent and removes your training progress with it.',
        `You can also write to us at ${SUPPORT_EMAIL} to ask what we hold about you, to correct it, or to have it deleted.`,
      ],
    },
    {
      heading: 'Children',
      body: [
        'The app is not intended for children under 13, and we do not knowingly collect information from them. If you believe a child has given us information, contact us and we will remove it.',
      ],
    },
    {
      heading: 'Changes',
      body: [
        'If this policy changes in a way that affects you, we will say so in the app. The date at the top always shows when it was last revised.',
      ],
    },
  ],
};

const TERMS: Doc = {
  title: 'Terms of Use',
  intro:
    'These terms cover your use of the Master Phil app. By using the app, you agree to them.',
  sections: [
    {
      heading: 'Your account',
      body: [
        'You need an account to use most of the app. Keep your sign-in details to yourself — you are responsible for what happens under your account. Give us accurate details, and tell us if they change.',
      ],
    },
    {
      heading: 'Subscriptions and the free trial',
      body: [
        'The app offers a monthly and an annual subscription. Both begin with a 7-day free trial.',
      ],
      bullets: [
        'Your trial is free for 7 days. If you do not cancel before it ends, the subscription starts and you are charged.',
        'Subscriptions renew automatically at the end of each period unless you cancel at least 24 hours before it ends.',
        'You are charged through your App Store or Google Play account. Manage or cancel your subscription there — not in this app.',
        'A subscription unlocks the tutorial library. Courses and coaching programmes are sold separately and are not included.',
      ],
    },
    {
      heading: 'Refunds',
      body: [
        'Refunds are handled by Apple and Google under their own policies, because they take the payment. We cannot issue a refund for a purchase made through their stores.',
      ],
    },
    {
      heading: 'What you can and cannot do with the content',
      body: [
        'Everything in the app — videos, courses, written material — belongs to Master Phil Ross or is licensed to him. Your subscription lets you watch it for your own personal training.',
        'You may not download, copy, re-upload, sell, or show it publicly, and you may not share your account so that others can watch it.',
      ],
    },
    {
      heading: 'Train safely',
      body: [
        'The app gives general fitness instruction. It is not medical advice, and nobody in it is your doctor.',
        'Talk to a qualified professional before starting any new training, especially if you are pregnant, injured, unwell, or have a condition that exercise could affect. Stop if something hurts. You train at your own risk.',
      ],
    },
    {
      heading: 'Coaching applications',
      body: [
        'Submitting an application does not create a coaching arrangement. We will review it and get back to you, and any coaching is agreed separately.',
      ],
    },
    {
      heading: 'Ending your access',
      body: [
        'You can stop using the app and delete your account at any time.',
        'We may suspend or close an account that breaks these terms — for example by sharing content or sign-in details.',
      ],
    },
    {
      heading: 'Availability',
      body: [
        'We try to keep the app working and the content available, but we cannot promise it will never be interrupted, and content may be added or removed over time.',
      ],
    },
    {
      heading: 'Contact',
      body: [`Questions about these terms: ${SUPPORT_EMAIL}`],
    },
  ],
};

const LegalScreen = ({ route, navigation }: any) => {
  const doc: Doc = route?.params?.doc === 'terms' ? TERMS : PRIVACY;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader title={doc.title} onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.updated}>Last updated {LAST_UPDATED}</Text>
        <Text style={styles.intro}>{doc.intro}</Text>

        {doc.sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>

            {section.body.map(paragraph => (
              <Text key={paragraph} style={styles.body}>
                {paragraph}
              </Text>
            ))}

            {section.bullets?.map(bullet => (
              <View key={bullet} style={styles.bulletRow}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.contact}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          accessibilityRole="link"
        >
          {SUPPORT_EMAIL}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
  },
  updated: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
  intro: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    // Looser than list copy: this is a screen of sustained reading.
    lineHeight: 24,
    color: theme.color.text.secondary,
    marginTop: theme.space.md,
  },

  section: { marginTop: theme.space['2xl'] },
  heading: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    lineHeight: theme.type.h3.lineHeight,
    color: theme.color.text.primary,
    marginBottom: theme.space.sm,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 22,
    color: theme.color.text.secondary,
    marginBottom: theme.space.sm,
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
    marginBottom: theme.space.sm,
  },
  /** Sits on the first line's optical centre, not its top. */
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.color.brand.base,
    marginTop: 8,
  },
  bulletText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 22,
    color: theme.color.text.secondary,
  },

  contact: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
    textAlign: 'center',
    marginTop: theme.space['3xl'],
  },
});

export default LegalScreen;
