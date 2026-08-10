import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share as RNShare,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, Close, Copy, Share, User } from '../components/ui/icons';
import { getCoachDetail } from '../../app/helpers/ApiHelper';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';

const ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=com.philross';
const IOS_APP_URL = 'https://apps.apple.com/us/app/philross/id6751194230';

const toast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Copied', message);
  }
};

const plain = (html: unknown): string =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', png: FbIcon },
  { key: 'whatsapp', label: 'WhatsApp', png: WhatsAppIcon },
  { key: 'instagram', label: 'Instagram', png: InstagramIcon },
  { key: 'twitter', label: 'X', png: XIcon },
  { key: 'telegram', label: 'Telegram', png: TelegramIcon },
];

const CoachDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { coachSlug } = route.params || {};

  const [coachData, setCoachData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  const fetchCoachDetails = useCallback(async () => {
    if (!coachSlug) {
      setError('This programme could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await getCoachDetail(coachSlug, navigation);

      const data =
        response?.data ??
        (response && typeof response === 'object' ? response : null);

      if (data) {
        setCoachData(data);
      } else {
        setError('We could not load this programme.');
      }
    } catch (e) {
      setError('We could not load this programme.');
    } finally {
      setIsLoading(false);
    }
  }, [coachSlug, navigation]);

  useEffect(() => {
    fetchCoachDetails();
  }, [fetchCoachDetails]);

  const shareLink = coachData?.slug
    ? `https://philrossapp.link/coach/${coachData.slug}`
    : 'https://philrossapp.link';

  const handleSocialShare = async (platform: string) => {
    const message = `${plain(coachData?.headline) || 'Coaching with Master Phil'}\n${shareLink}\n\nGet the Master Phil app:\nAndroid: ${ANDROID_APP_URL}\niOS: ${IOS_APP_URL}`;

    if (platform === 'instagram') {
      Clipboard.setString(message);
      toast('Link copied — paste it into Instagram');
      return;
    }

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(message)}`,
    };

    const url = urls[platform];
    if (!url) return;

    try {
      await Linking.openURL(url);
    } catch (e) {
      await RNShare.share({ message });
    }
  };

  const handleStartIntakeForm = () => {
    if (!coachData?.id) {
      Alert.alert('Unavailable', 'This programme is not accepting applications yet.');
      return;
    }
    navigation.navigate('IntakeForm', {
      coachId: coachData.id,
      coachSlug: coachData.slug,
      instructorEmail: coachData.instructor?.email ?? '',
      instructorName: coachData.instructor?.full_name,
    });
  };

  /** key_benefits arrives as objects with a name, or as plain strings. */
  const benefits: string[] = Array.isArray(coachData?.key_benefits)
    ? coachData.key_benefits
        .map((b: any) => plain(b?.name ?? b))
        .filter(Boolean)
    : [];

  const instructor = coachData?.instructor;
  const instructorPhoto =
    instructor?.avatar || instructor?.profile_picture || instructor?.image;
  const hero = coachData?.cropped_image_url || coachData?.image_url;
  const description = plain(coachData?.description);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Coaching"
        onBack={() => navigation.goBack()}
        right={
          coachData ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowShare(true)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Share programme"
            >
              <Share size={18} color={theme.color.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !coachData ? (
        <ErrorState
          message={error ?? 'We could not load this programme.'}
          onRetry={fetchCoachDetails}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Shown only when the API sends a picture. The old screen drew a
                grey person glyph in a 220px box whether or not one existed. */}
            {!!hero && (
              <Image source={{ uri: hero }} style={styles.hero} resizeMode="cover" />
            )}

            <Text style={styles.title}>
              {plain(coachData?.headline) || 'Coaching with Master Phil'}
            </Text>

            {!!description && <Text style={styles.body}>{description}</Text>}

            {benefits.length > 0 && (
              <View style={styles.benefits}>
                <Text style={styles.sectionLabel}>What you get</Text>
                {benefits.map(b => (
                  <View key={b} style={styles.benefitRow}>
                    <View style={styles.tick}>
                      <Check size={11} color={theme.color.text.inverse} />
                    </View>
                    <Text style={styles.benefitText}>{b}</Text>
                  </View>
                ))}
              </View>
            )}

            {!!(instructor?.full_name || instructorPhoto) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Your coach</Text>
                <View style={styles.instructor}>
                  {instructorPhoto ? (
                    <Image
                      source={{ uri: instructorPhoto }}
                      style={styles.instructorAvatar}
                    />
                  ) : (
                    <View
                      style={[styles.instructorAvatar, styles.instructorFallback]}
                    >
                      <User size={20} color={theme.color.text.inverse} />
                    </View>
                  )}
                  <View style={styles.instructorText}>
                    <Text style={styles.instructorName} numberOfLines={1}>
                      {instructor?.full_name || instructor?.name || 'Master Phil Ross'}
                    </Text>
                    <Text style={styles.instructorRole} numberOfLines={1}>
                      {instructor?.role || instructor?.designation || 'Certified trainer'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View
            style={[
              styles.bar,
              { paddingBottom: Math.max(insets.bottom, theme.space.lg) },
            ]}
          >
            <TouchableOpacity
              style={styles.cta}
              onPress={handleStartIntakeForm}
              activeOpacity={0.9}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>Apply for coaching</Text>
            </TouchableOpacity>
            <Text style={styles.fine}>
              Tell us about your training and goals. Phil's team will get back to
              you.
            </Text>
          </View>
        </>
      )}

      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowShare(false)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, theme.space.xl) },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.grabber} />

            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Share programme</Text>
              <TouchableOpacity
                onPress={() => setShowShare(false)}
                hitSlop={theme.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Close size={17} color={theme.color.text.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.linkRow}>
              <Text style={styles.linkText} numberOfLines={1}>
                {shareLink}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => {
                  Clipboard.setString(shareLink);
                  toast('Link copied');
                }}
                accessibilityRole="button"
                accessibilityLabel="Copy link"
              >
                <Copy size={16} color={theme.color.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.socialRow}>
              {SOCIALS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={styles.social}
                  onPress={() => handleSocialShare(s.key)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Share on ${s.label}`}
                >
                  <View style={styles.socialDisc}>
                    <Image
                      source={s.png}
                      style={styles.socialImg}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.socialLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['4xl'],
  },

  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: theme.color.neutral[200],
    marginBottom: theme.space.lg,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    marginTop: theme.space.md,
  },

  section: { marginTop: theme.space['2xl'] },
  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    marginBottom: theme.space.md,
  },

  benefits: { marginTop: theme.space['2xl'], gap: theme.space.md },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
  },
  tick: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: theme.color.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
  },

  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.lg,
  },
  instructorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.color.neutral[200],
  },
  instructorFallback: {
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorText: { flex: 1, minWidth: 0 },
  instructorName: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },
  instructorRole: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    marginTop: 1,
  },

  bar: {
    paddingHorizontal: theme.space.screen,
    paddingTop: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
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
  fine: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 17,
    color: theme.color.text.muted,
    textAlign: 'center',
    marginTop: theme.space.sm,
  },

  overlay: {
    flex: 1,
    backgroundColor: theme.color.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.border.default,
    marginBottom: theme.space.lg,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    color: theme.color.text.primary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.surface.sunken,
    borderRadius: theme.radius.md,
    paddingLeft: theme.space.lg,
    paddingRight: theme.space.xs,
    paddingVertical: theme.space.xs,
    marginTop: theme.space.lg,
  },
  linkText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.space.xl,
  },
  social: { alignItems: 'center', gap: theme.space.xs, width: 58 },
  /** No plate behind the mark — each brand logo is already a finished
      circular shape, and a grey disc under it drew a competing outline. */
  socialDisc: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialImg: { width: 40, height: 40 },
  socialLabel: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
});

export default CoachDetailsScreen;
