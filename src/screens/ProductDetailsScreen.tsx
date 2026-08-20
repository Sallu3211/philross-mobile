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
import { Close, Copy, Phone, Share, Shop } from '../components/ui/icons';
import { getProductDetail } from '../../app/helpers/ApiHelper';
import { isEmbeddableCheckout } from './CheckoutScreen';
import getContactInfo, { dialable, FALLBACK_PHONE } from '../services/contactInfo';
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

/** Product copy comes back with basic HTML; strip it for display. */
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

const ProductDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { productSlug } = route.params || {};

  const [productData, setProductData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [phone, setPhone] = useState(FALLBACK_PHONE);

  // Fetched once per mount; the service caches, so revisiting is free.
  useEffect(() => {
    let alive = true;
    getContactInfo().then(info => {
      if (alive) setPhone(info.phone);
    });
    return () => {
      alive = false;
    };
  }, []);

  const fetchProductDetails = useCallback(async () => {
    if (!productSlug) {
      setError('This product could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await getProductDetail(productSlug, navigation);

      // The endpoint has shipped three response shapes over time; accept any
      // of them rather than failing on a wrapper key.
      const data =
        response?.data ??
        (response && typeof response === 'object' ? response : null);

      if (data) {
        setProductData(data);
      } else {
        setError('We could not load this product.');
      }
    } catch (e) {
      setError('We could not load this product.');
    } finally {
      setIsLoading(false);
    }
  }, [productSlug, navigation]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const shareLink = productData?.slug
    ? `https://philrossapp.link/product/${productData.slug}`
    : 'https://philrossapp.link';

  /**
   * Stripe stays in the app; everything else goes to the browser.
   *
   * The split is deliberate, not a shortcut. Phil's Stripe payment links are a
   * single self-contained page, so keeping them inside means the shopper never
   * leaves. Amazon and the other shops are not: they want the browser's saved
   * logins and addresses, and Amazon actively degrades inside a WebView.
   */
  const handleShopNow = async () => {
    const link = productData?.destination_link;
    if (!link) {
      Alert.alert('Unavailable', 'This product has no shop link yet.');
      return;
    }

    if (isEmbeddableCheckout(link)) {
      navigation.navigate('Checkout', {
        url: link,
        title: plain(productData?.headline) || 'Checkout',
      });
      return;
    }

    try {
      await Linking.openURL(link);
    } catch (e) {
      Alert.alert('Unavailable', 'We could not open the shop link.');
    }
  };

  /**
   * Ring Phil about this product.
   *
   * Several items are priced but not straightforwardly buyable online — bulk
   * kettlebell orders, the 1-on-1 certification — and the client asked for a
   * way to speak to someone before paying. The product's name goes nowhere
   * over a phone line, so the alert names it: whoever answers should not have
   * to ask what the caller is ringing about.
   */
  const handleCall = () => {
    const name = plain(productData?.headline) || 'this product';
    Alert.alert(
      'Call about this product',
      `Call Phil on ${phone} about "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () =>
            Linking.openURL(`tel:${dialable(phone)}`).catch(() =>
              Alert.alert('Unavailable', 'This device cannot place calls.'),
            ),
        },
      ],
    );
  };

  const handleSocialShare = async (platform: string) => {
    const message = `${plain(productData?.headline) || 'Master Phil'}\n${shareLink}\n\nGet the Master Phil app:\nAndroid: ${ANDROID_APP_URL}\niOS: ${IOS_APP_URL}`;

    // Instagram has no share-by-URL scheme, so the honest fallback is the
    // clipboard rather than a link that silently does nothing.
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

  const socials = [
    { key: 'facebook', label: 'Facebook', png: FbIcon },
    { key: 'whatsapp', label: 'WhatsApp', png: WhatsAppIcon },
    { key: 'instagram', label: 'Instagram', png: InstagramIcon },
    { key: 'twitter', label: 'X', png: XIcon },
    { key: 'telegram', label: 'Telegram', png: TelegramIcon },
  ];

  const price = Number(productData?.price ?? 0);
  const description = plain(productData?.description);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title={plain(productData?.headline) || 'Product'}
        onBack={() => navigation.goBack()}
        right={
          productData ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowShare(true)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Share product"
            >
              <Share size={18} color={theme.color.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !productData ? (
        <ErrorState
          message={error ?? 'We could not load this product.'}
          onRetry={fetchProductDetails}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Product shots are portrait with their own white ground, so the
                image is fitted whole on a soft panel rather than cropped. */}
            <View style={styles.imagePanel}>
              {productData?.image_url || productData?.cropped_image_url ? (
                <Image
                  source={{
                    // Original in preference to the 16:9 crop — see the note
                    // in ProductsScreen. The crop discards most of a portrait
                    // product shot.
                    uri: productData.image_url ?? productData.cropped_image_url,
                  }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : (
                <Shop size={44} color={theme.color.text.disabled} />
              )}
            </View>

            <Text style={styles.title}>
              {plain(productData?.headline) || 'Product'}
            </Text>

            {price > 0 && (
              <Text style={styles.price}>${price.toFixed(2)}</Text>
            )}

            {!!description && <Text style={styles.body}>{description}</Text>}
          </ScrollView>

          {/* Pinned so the buy action stays reachable however long the copy. */}
          <View
            style={[
              styles.bar,
              { paddingBottom: Math.max(insets.bottom, theme.space.lg) },
            ]}
          >
            {/* Call sits to the left as an icon: present for anyone who wants
                it, without competing with the action most people came for. */}
            <TouchableOpacity
              style={styles.callBtn}
              onPress={handleCall}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Call Phil on ${phone} about this product`}
            >
              <Phone size={18} color={theme.color.text.primary} />
              <Text style={styles.callText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cta}
              onPress={handleShopNow}
              activeOpacity={0.9}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>
                {isEmbeddableCheckout(productData?.destination_link)
                  ? 'Buy now'
                  : 'Shop now'}
              </Text>
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
              <Text style={styles.sheetTitle}>Share product</Text>
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
              {socials.map(s => (
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

  imagePanel: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: theme.color.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.xl,
  },
  image: { width: '100%', height: '100%' },

  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    marginTop: theme.space.xl,
  },
  price: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    color: theme.color.brand.base,
    marginTop: theme.space.xs,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    marginTop: theme.space.lg,
  },

  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.screen,
    paddingTop: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  /** Fixed width, so the buy button's size does not move with it. */
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: 96,
    minHeight: 52,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border.strong,
    backgroundColor: theme.color.surface.app,
  },
  callText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
    includeFontPadding: false,
  },
  cta: {
    flex: 1,
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

export default ProductDetailsScreen;
