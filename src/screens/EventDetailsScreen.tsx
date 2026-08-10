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
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '../components/ui/StateView';
import {
  Calendar,
  Close,
  Copy,
  MapPin,
  Play,
  Share,
  Tag,
  User,
} from '../components/ui/icons';
import { getEventDetail } from '../../app/helpers/ApiHelper';
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

const formatDate = (value: unknown): string => {
  const d = new Date(String(value ?? ''));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTimeRange = (start: unknown, end: unknown): string => {
  const s = new Date(String(start ?? ''));
  if (isNaN(s.getTime())) return '';
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const e = new Date(String(end ?? ''));
  const from = s.toLocaleTimeString('en-US', opts);
  if (isNaN(e.getTime())) return from;
  return `${from} – ${e.toLocaleTimeString('en-US', opts)}`;
};

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', png: FbIcon },
  { key: 'whatsapp', label: 'WhatsApp', png: WhatsAppIcon },
  { key: 'instagram', label: 'Instagram', png: InstagramIcon },
  { key: 'twitter', label: 'X', png: XIcon },
  { key: 'telegram', label: 'Telegram', png: TelegramIcon },
];

const EventDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { eventSlug } = route.params || {};

  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  const fetchEventDetails = useCallback(async () => {
    if (!eventSlug) {
      setError('This event could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await getEventDetail(eventSlug, navigation);

      const data =
        response?.data ??
        (response && typeof response === 'object' ? response : null);

      if (data) {
        setEventData(data);
      } else {
        setError('We could not load this event.');
      }
    } catch (e) {
      setError('We could not load this event.');
    } finally {
      setIsLoading(false);
    }
  }, [eventSlug, navigation]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails]);

  const isVirtual = eventData?.event_type === 'virtual';
  const lat = Number.parseFloat(eventData?.latitude);
  const lng = Number.parseFloat(eventData?.longitude);
  const hasMap = !isVirtual && !isNaN(lat) && !isNaN(lng);

  const shareLink = eventData?.slug
    ? `https://philrossapp.link/event/${eventData.slug}`
    : 'https://philrossapp.link';

  const openLink = async (url?: string, missing = 'This link is not available yet.') => {
    if (!url) {
      Alert.alert('Unavailable', missing);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Unavailable', 'We could not open that link.');
    }
  };

  const openMaps = async () => {
    if (!hasMap) return;
    const query = encodeURIComponent(
      `${eventData?.name ?? ''}, ${eventData?.location ?? ''}`.trim(),
    );

    if (Platform.OS === 'ios') {
      const native = `maps://?q=${query}&ll=${lat},${lng}`;
      const web = `https://maps.apple.com/?q=${query}&ll=${lat},${lng}`;
      const canNative = await Linking.canOpenURL('maps://');
      await Linking.openURL(canNative ? native : web);
    } else {
      const native = `geo:${lat},${lng}?q=${query}`;
      const web = `https://www.google.com/maps?q=${lat},${lng}`;
      const canNative = await Linking.canOpenURL(native);
      await Linking.openURL(canNative ? native : web);
    }
  };

  const handleSocialShare = async (platform: string) => {
    const message = `${eventData?.name ?? 'Master Phil event'}\n${shareLink}\n\nGet the Master Phil app:\nAndroid: ${ANDROID_APP_URL}\niOS: ${IOS_APP_URL}`;

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

  const description = plain(eventData?.description);
  const date = formatDate(eventData?.start_datetime);
  const time = formatTimeRange(eventData?.start_datetime, eventData?.end_datetime);
  const instructor = eventData?.instructor;
  const instructorPhoto =
    instructor?.image ||
    instructor?.profile_image_url ||
    instructor?.image_url ||
    instructor?.avatar_url;
  const pricing: any[] = Array.isArray(eventData?.pricing_options)
    ? eventData.pricing_options
    : [];

  const metaRow = (
    key: string,
    Icon: typeof Calendar,
    label: string,
    value: string,
    onPress?: () => void,
  ) => (
    <TouchableOpacity
      key={key}
      style={styles.metaRow}
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.metaIcon}>
        <Icon size={16} color={theme.color.brand.base} />
      </View>
      <View style={styles.metaText}>
        <Text style={styles.metaLabel}>{label}</Text>
        <Text style={styles.metaValue}>{value}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Event"
        onBack={() => navigation.goBack()}
        right={
          eventData ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowShare(true)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Share event"
            >
              <Share size={18} color={theme.color.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !eventData ? (
        <ErrorState
          message={error ?? 'We could not load this event.'}
          onRetry={fetchEventDetails}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!!eventData?.cropped_image_url && (
              <Image
                source={{ uri: eventData.cropped_image_url }}
                style={styles.hero}
                resizeMode="cover"
              />
            )}

            <Text style={styles.title}>{eventData?.name || 'Event'}</Text>

            {/* When, where and how much, as one card of labelled rows — these
                are the three things someone decides on. */}
            <View style={styles.metaCard}>
              {!!date &&
                metaRow('when', Calendar, 'When', time ? `${date} · ${time}` : date)}

              {!!date && <View style={styles.metaDivider} />}

              {isVirtual
                ? metaRow(
                    'where',
                    Play,
                    'Where',
                    'Online event',
                    eventData?.virtual_event_link
                      ? () => openLink(eventData.virtual_event_link)
                      : undefined,
                  )
                : metaRow(
                    'where',
                    MapPin,
                    'Where',
                    eventData?.location || 'Location to be announced',
                    hasMap ? openMaps : undefined,
                  )}
            </View>

            {!!description && <Text style={styles.body}>{description}</Text>}

            {hasMap && (
              <TouchableOpacity
                style={styles.mapCard}
                onPress={openMaps}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Open in maps"
              >
                <MapView
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                  region={{
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{ latitude: lat, longitude: lng }}
                    title={eventData?.name || 'Event'}
                    description={eventData?.location || ''}
                    pinColor={theme.color.brand.base}
                  />
                </MapView>
              </TouchableOpacity>
            )}

            {pricing.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Pricing</Text>
                <View style={styles.priceWrap}>
                  {pricing.map((p: any, i: number) => (
                    <View key={p?.name ?? i} style={styles.priceChip}>
                      <Tag size={13} color={theme.color.text.secondary} />
                      <Text style={styles.priceName}>
                        {String(p?.name ?? 'Standard').replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.priceValue}>
                        ${Number.parseFloat(p?.price ?? '0').toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!!instructor && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Instructor</Text>
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
                  <Text style={styles.instructorName} numberOfLines={1}>
                    {instructor?.name || instructor?.full_name || 'Instructor'}
                  </Text>
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
              activeOpacity={0.9}
              accessibilityRole="button"
              onPress={() =>
                openLink(
                  eventData?.destination_link,
                  'Booking for this event is not open yet.',
                )
              }
            >
              <Text style={styles.ctaText}>Lock in your spot</Text>
            </TouchableOpacity>
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
              <Text style={styles.sheetTitle}>Share event</Text>
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
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    marginTop: theme.space.lg,
  },

  metaCard: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    marginTop: theme.space.lg,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.lg,
  },
  metaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.brand.subtle,
  },
  metaText: { flex: 1, minWidth: 0 },
  metaLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },
  metaValue: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 19,
    color: theme.color.text.primary,
    marginTop: 2,
  },
  metaDivider: {
    height: 1,
    backgroundColor: theme.color.border.subtle,
    marginLeft: theme.space.lg + 36 + theme.space.lg,
  },

  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    marginTop: theme.space.xl,
  },

  /**
   * The map is a preview, not a control. Gestures are disabled and the whole
   * card opens the real maps app — a half-working embedded map that pans but
   * cannot route is worse than a picture that gets you there.
   */
  mapCard: {
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: theme.space.xl,
    backgroundColor: theme.color.neutral[200],
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

  priceWrap: { gap: theme.space.sm },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    minHeight: 46,
  },
  priceName: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
    textTransform: 'capitalize',
  },
  priceValue: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
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
  instructorName: {
    flex: 1,
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
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
  socialDisc: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.sunken,
  },
  socialImg: { width: 24, height: 24 },
  socialLabel: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
});

export default EventDetailsScreen;
