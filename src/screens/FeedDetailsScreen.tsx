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
import { Check, Close, Copy, Share } from '../components/ui/icons';
import { getFeedItem } from '../../app/helpers/ApiHelper';
import { pushCleverTapEvent } from '../../App';
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

/** Article bodies arrive with basic HTML; strip it so tags do not print. */
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
  if (!value) return '';
  const d = new Date(String(value));
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', png: FbIcon },
  { key: 'whatsapp', label: 'WhatsApp', png: WhatsAppIcon },
  { key: 'instagram', label: 'Instagram', png: InstagramIcon },
  { key: 'twitter', label: 'X', png: XIcon },
  { key: 'telegram', label: 'Telegram', png: TelegramIcon },
];

const FeedDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { feedSlug } = route.params || {};

  const [feedData, setFeedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    pushCleverTapEvent('article_viewed', {});
  }, []);

  const fetchFeedDetails = useCallback(async () => {
    if (!feedSlug) {
      setError('This article could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await getFeedItem(feedSlug, navigation);

      // The endpoint has shipped several wrapper shapes; accept any of them.
      const data =
        response?.data ??
        (response && typeof response === 'object' ? response : null);

      if (data) {
        setFeedData(data);
      } else {
        setError('We could not load this article.');
      }
    } catch (e) {
      setError('We could not load this article.');
    } finally {
      setIsLoading(false);
    }
  }, [feedSlug, navigation]);

  useEffect(() => {
    fetchFeedDetails();
  }, [fetchFeedDetails]);

  const shareLink = feedData?.slug
    ? `https://philrossapp.link/feed/${feedData.slug}`
    : 'https://philrossapp.link';

  const handleSocialShare = async (platform: string) => {
    const message = `${plain(feedData?.headline) || 'Master Phil'}\n${shareLink}\n\nGet the Master Phil app:\nAndroid: ${ANDROID_APP_URL}\niOS: ${IOS_APP_URL}`;

    // Instagram has no share-by-URL scheme, so say what actually happened
    // rather than opening a link that does nothing.
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

  const categories: string[] = (() => {
    const raw = feedData?.tag_category;
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((c: any) => String(c?.name ?? c ?? '').trim()).filter(Boolean);
  })();

  const focus: string[] = Array.isArray(feedData?.focus_on)
    ? feedData.focus_on.map((f: any) => plain(f)).filter(Boolean)
    : [];

  /** Related first; otherwise other articles carried over from the list. */
  const related: any[] = (() => {
    if (Array.isArray(feedData?.related_articles) && feedData.related_articles.length) {
      return feedData.related_articles.slice(0, 4);
    }
    const carried = route.params?.feedData;
    if (!Array.isArray(carried)) return [];
    return carried
      .filter(
        (item: any) =>
          (item?.feed_type === 'article' || item?.type === 'article') &&
          item?.slug !== feedSlug,
      )
      .slice(0, 4);
  })();

  const body = plain(feedData?.description);
  const date = formatDate(feedData?.created_at);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Article"
        onBack={() => navigation.goBack()}
        right={
          feedData ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowShare(true)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Share article"
            >
              <Share size={18} color={theme.color.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !feedData ? (
        <ErrorState
          message={error ?? 'We could not load this article.'}
          onRetry={fetchFeedDetails}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!!feedData?.cropped_image_url && (
            <Image
              source={{ uri: feedData.cropped_image_url }}
              style={styles.hero}
              resizeMode="cover"
            />
          )}

          {categories.length > 0 && (
            <View style={styles.tags}>
              {categories.map(c => (
                <View key={c} style={styles.tag}>
                  <Text style={styles.tagText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.title}>{plain(feedData?.headline) || 'Article'}</Text>

          {(feedData?.author || date) && (
            <View style={styles.byline}>
              {feedData?.author_profile_image ? (
                <Image
                  source={{ uri: feedData.author_profile_image }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarLetter} allowFontScaling={false}>
                    {String(feedData?.author ?? 'P').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.bylineText}>
                {!!feedData?.author && (
                  <Text style={styles.author} numberOfLines={1}>
                    {feedData.author}
                  </Text>
                )}
                {!!date && <Text style={styles.date}>{date}</Text>}
              </View>
            </View>
          )}

          {!!body && <Text style={styles.body}>{body}</Text>}

          {focus.length > 0 && (
            <View style={styles.focus}>
              <Text style={styles.sectionLabel}>Focus on</Text>
              {focus.map(f => (
                <View key={f} style={styles.focusRow}>
                  <View style={styles.tick}>
                    <Check size={11} color={theme.color.text.inverse} />
                  </View>
                  <Text style={styles.focusText}>{f}</Text>
                </View>
              ))}
            </View>
          )}

          {!!plain(feedData?.call_to_action) && (
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                {plain(feedData.call_to_action)}
              </Text>
            </View>
          )}

          {related.length > 0 && (
            <View style={styles.more}>
              <Text style={styles.sectionLabel}>More to read</Text>
              {related.map((a: any, i: number) => (
                <TouchableOpacity
                  key={a?.slug ?? i}
                  style={styles.moreRow}
                  activeOpacity={0.75}
                  disabled={!a?.slug}
                  onPress={() =>
                    navigation.push('FeedDetails', {
                      feedSlug: a.slug,
                      feedData: route.params?.feedData,
                    })
                  }
                >
                  <Image
                    source={{ uri: a?.cropped_image_url || a?.image_url }}
                    style={styles.moreThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.moreText}>
                    <Text style={styles.moreTitle} numberOfLines={2}>
                      {a?.headline || a?.title || 'Article'}
                    </Text>
                    {!!a?.read_time && (
                      <Text style={styles.moreMeta}>{a.read_time} min read</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
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
              <Text style={styles.sheetTitle}>Share article</Text>
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
    paddingBottom: theme.space['5xl'],
  },

  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: theme.color.neutral[200],
  },

  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.xs,
    marginTop: theme.space.lg,
  },
  tag: {
    backgroundColor: theme.color.brand.subtle,
    borderRadius: 999,
    paddingHorizontal: theme.space.md,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.brand.base,
  },

  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    marginTop: theme.space.md,
  },

  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginTop: theme.space.lg,
    paddingBottom: theme.space.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.color.border.subtle,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.color.neutral[200],
  },
  avatarFallback: {
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  bylineText: { flex: 1, minWidth: 0 },
  author: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
  },
  date: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    marginTop: 1,
  },

  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    // Looser than list copy: this is a screen of sustained reading.
    lineHeight: 24,
    color: theme.color.text.secondary,
    marginTop: theme.space.lg,
  },

  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },

  focus: { marginTop: theme.space['2xl'], gap: theme.space.md },
  focusRow: {
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
  focusText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
  },

  /** Brand-tinted so the closing ask reads as Phil speaking, not as body copy. */
  callout: {
    backgroundColor: theme.color.brand.subtle,
    borderRadius: 14,
    padding: theme.space.lg,
    marginTop: theme.space['2xl'],
  },
  calloutText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 21,
    color: theme.color.text.primary,
  },

  more: { marginTop: theme.space['3xl'], gap: theme.space.md },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 14,
    padding: theme.space.sm,
  },
  moreThumb: {
    width: 76,
    height: 60,
    borderRadius: 10,
    backgroundColor: theme.color.neutral[200],
  },
  moreText: { flex: 1, minWidth: 0, paddingRight: theme.space.sm },
  moreTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 19,
    color: theme.color.text.primary,
  },
  moreMeta: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    marginTop: 2,
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

export default FeedDetailsScreen;
