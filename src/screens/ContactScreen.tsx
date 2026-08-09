import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { LoadingState } from '../components/ui/StateView';
import { ChevronRight, Copy, Mail, Phone } from '../components/ui/icons';
import { SOCIAL_LINKS } from '../components/SideMenu';
import InstagramLogo from '../../assets/icons/instagram.png';
import FacebookLogo from '../../assets/icons/facebook.png';
import WhatsappLogo from '../../assets/icons/whatsapp.png';
import TelegramLogo from '../../assets/icons/telegram.png';
import XLogo from '../../assets/icons/x_icon.png';
import YouTubeMark from '../../assets/icons/mdi_youtube.svg';
import TikTokMark from '../../assets/icons/ic_baseline-tiktok.svg';
import LinkedInMark from '../../assets/icons/akar-icons_linkedin-fill.svg';

/** Shown only until the API answers; also the fallback if it never does. */
const FALLBACK_PHONE = '(551) 364-2545';
const FALLBACK_EMAIL = 'info@philross.com';

interface Social {
  key: string;
  label: string;
  /** Marks that ship as SVG can be tinted; the rest are multi-colour PNGs. */
  Svg?: React.FC<any>;
  color?: string;
  png?: number;
}

const SOCIALS: Social[] = [
  { key: 'youtube', label: 'YouTube', Svg: YouTubeMark, color: '#FF0000' },
  { key: 'instagram', label: 'Instagram', png: InstagramLogo },
  { key: 'facebook', label: 'Facebook', png: FacebookLogo },
  { key: 'tiktok', label: 'TikTok', Svg: TikTokMark, color: '#000000' },
  { key: 'linkedin', label: 'LinkedIn', Svg: LinkedInMark, color: '#0A66C2' },
  { key: 'x', label: 'X', png: XLogo },
  { key: 'whatsapp', label: 'WhatsApp', png: WhatsappLogo },
  { key: 'telegram', label: 'Telegram', png: TelegramLogo },
];

const toast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Copied', message);
  }
};

const ContactScreen = ({ navigation }: any) => {
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchContactData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Both endpoints are independent, so fetch them together rather than
      // making the social row wait on the contact details.
      const [contactRes, socialRes] = await Promise.all([
        fetch('https://api.philross.com/sitecontent/contact-info'),
        fetch('https://api.philross.com/sitecontent/social-media-links'),
      ]);
      const [contactData, socialData] = await Promise.all([
        contactRes.json(),
        socialRes.json(),
      ]);

      if (contactData?.status && contactData?.data) {
        setContactInfo(contactData.data);
      }
      if (socialData?.status && socialData?.data) {
        setSocialLinks(socialData.data);
      }
    } catch (error) {
      // Every field has a fallback, so a failed fetch still renders a usable page.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContactData();
  }, [fetchContactData]);

  const phone = contactInfo?.phone || FALLBACK_PHONE;
  const email = contactInfo?.email || FALLBACK_EMAIL;

  const copy = (value: string, what: string) => {
    try {
      Clipboard.setString(value);
      toast(`${what} copied`);
    } catch (e) {
      Alert.alert('Copy failed', `Could not copy the ${what.toLowerCase()}.`);
    }
  };

  /** API link wins; the hard-coded map is the fallback. Missing = hidden. */
  const socials = SOCIALS.map(s => ({
    ...s,
    url: socialLinks?.[s.key] || SOCIAL_LINKS[s.key] || null,
  })).filter(s => !!s.url);

  const renderRow = (
    key: string,
    Icon: typeof Phone,
    label: string,
    value: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      key={key}
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={styles.rowIcon}>
        <Icon size={18} color={theme.color.brand.base} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.copyBtn}
        hitSlop={theme.hitSlop}
        onPress={() => copy(value, label)}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label.toLowerCase()}`}
      >
        <Copy size={17} color={theme.color.text.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader title="Contact" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Get in touch</Text>
          <Text style={styles.sub}>
            Questions about training, events or an order? Reach Phil's team
            directly.
          </Text>

          {/* One card, hairline-separated rows — two bordered boxes stacked
              read as two unrelated things, which these are not. */}
          <View style={styles.card}>
            {renderRow('phone', Phone, 'Phone', phone, () =>
              Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`),
            )}
            <View style={styles.divider} />
            {renderRow('email', Mail, 'Email', email, () =>
              Linking.openURL(`mailto:${email}`),
            )}
          </View>

          {!!contactInfo?.address && (
            <View style={styles.addressCard}>
              <Text style={styles.rowLabel}>Address</Text>
              <Text style={styles.address}>{contactInfo.address}</Text>
            </View>
          )}

          {socials.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Follow Phil</Text>
              <View style={styles.socialWrap}>
                {socials.map((s, i) => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.socialBtn, i > 0 && styles.socialBtnDivided]}
                    onPress={() => Linking.openURL(s.url as string)}
                    activeOpacity={0.75}
                    accessibilityRole="link"
                    accessibilityLabel={s.label}
                  >
                    {s.Svg ? (
                      <s.Svg width={22} height={22} fill={s.color} />
                    ) : (
                      <Image
                        source={s.png}
                        style={styles.socialImg}
                        resizeMode="contain"
                      />
                    )}
                    <Text style={styles.socialLabel}>{s.label}</Text>
                    <ChevronRight size={13} color={theme.color.text.disabled} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
  },
  heading: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
  },
  sub: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
    marginTop: theme.space.xs,
  },

  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    marginTop: theme.space.xl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.lg,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.color.brand.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },
  rowValue: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
    marginTop: 2,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.sunken,
  },
  divider: {
    height: 1,
    backgroundColor: theme.color.border.subtle,
    marginLeft: theme.space.lg + 40 + theme.space.lg,
  },

  addressCard: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.lg,
    marginTop: theme.space.md,
  },
  address: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
    marginTop: theme.space.xs,
  },

  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    marginTop: theme.space['2xl'],
    marginBottom: theme.space.md,
  },
  socialWrap: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    minHeight: 52,
  },
  /** Hairline between rows only, so the card keeps one outer edge. */
  socialBtnDivided: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  socialImg: { width: 22, height: 22 },
  socialLabel: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
  },
});

export default ContactScreen;
