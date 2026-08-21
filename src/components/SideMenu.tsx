/**
 * SideMenu — the app's single navigation drawer.
 *
 * Used by Dashboard, Feed, Courses, MyCoach and Products, so every screen gets
 * the same menu. Props are unchanged from the previous version
 * (isVisible / onClose / navigation) so no call site needed touching.
 *
 * Structure, top to bottom:
 *   dark header   brand mark + name + your plan
 *   dashboard     home, standing alone above the categories
 *   train         the things you do
 *   discover      the things you read or watch
 *   account       profile, contact, delete
 *   social row    original brand logos, links configurable in one place
 *   footer        version + log out
 *
 * Social marks use each brand's real logo. Facebook, Instagram, WhatsApp,
 * Telegram and X ship as full-colour PNG badges; YouTube and TikTok are drawn
 * as matching discs in ui/brandMarks, because the SVGs shipped here are
 * rounded-rectangle glyphs that broke the row's one-shape rhythm.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Alert,
  Dimensions,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';

import { useUser } from '../context/UserContext';
import { theme } from '../theme';
import { deleteAccount } from '../../app/helpers/ApiHelper';
import {
  Calendar,
  Check,
  Close,
  Coach,
  Courses as CoursesIcon,
  Flame,
  Gift,
  Home,
  Info,
  LogOut,
  Phone,
  Play,
  Shop,
  Star,
  User as UserIcon,
  IconProps,
} from './ui/icons';

import PhilrossLogo from '../../assets/bootsplash/logo.png';
import FacebookLogo from '../../assets/icons/facebook.png';
import InstagramLogo from '../../assets/icons/instagram.png';
import WhatsappLogo from '../../assets/icons/whatsapp.png';
import TelegramLogo from '../../assets/icons/telegram.png';
import XLogo from '../../assets/icons/x_icon.png';
import { LinkedInRound, TikTokRound, YouTubeRound } from './ui/brandMarks';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.84, 340);

/** One size for every social mark — PNG badge or drawn disc alike. */
const SOCIAL_SIZE = 32;

/**
 * Fallback links, used only until the admin's answer arrives — and if it never
 * does.
 *
 * These used to be the whole story, hardcoded, with tiktok, x, whatsapp and
 * telegram pinned to null. Phil had TikTok and LinkedIn set up in the admin
 * and neither could ever appear in the app, while the YouTube and Instagram
 * URLs here had drifted from the ones he had configured. Whatever is in the
 * admin is now what shows.
 */
export const SOCIAL_LINKS: Record<string, string | null> = {
  youtube: 'https://www.youtube.com/@TheMasterPhil',
  instagram: 'https://www.instagram.com/themasterphil',
  facebook: 'https://www.facebook.com/masterphilross',
  linkedin: null,
  tiktok: null,
  x: null,
  whatsapp: null,
  telegram: null,
};

const SOCIAL_ENDPOINT = 'https://api.philross.com/sitecontent/social-media-links/';

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
  navigation: any;
}

interface Item {
  key: string;
  label: string;
  icon: React.FC<IconProps>;
  tint: string;
  onPress: () => void;
  /** Navigator route this item leads to, so the current one can be marked. */
  route?: string;
  danger?: boolean;
}

const SideMenu = ({ isVisible, onClose, navigation }: SideMenuProps) => {
  const { logout, isSubscribed } = useUser();

  /**
   * The links Phil has configured, fetched once per mount.
   *
   * Seeded with the constants above so the row is never empty on first paint
   * and still works offline; whatever the admin returns replaces them. Keys
   * the API does not mention are dropped rather than left at their old
   * hardcoded value — a link Phil has removed should disappear.
   */
  const [links, setLinks] = React.useState<Record<string, string | null>>(
    SOCIAL_LINKS,
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(SOCIAL_ENDPOINT);
        const json = await res.json();
        const data = json?.data;
        if (alive && data && typeof data === 'object') {
          const next: Record<string, string | null> = {};
          Object.keys(data).forEach(k => {
            const url = String(data[k] ?? '').trim();
            if (url) next[k.toLowerCase()] = url;
          });
          if (Object.keys(next).length > 0) setLinks(next);
        }
      } catch {
        // Keeps the fallbacks.
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /**
   * The route the drawer opened over. Marking it means the menu answers
   * "where am I" as well as "where can I go" — the one thing the old one
   * could not do.
   */
  const currentRoute: string | undefined = (() => {
    try {
      const state = navigation.getState?.();
      return state?.routes?.[state.index]?.name;
    } catch (e) {
      return undefined;
    }
  })();

  const slide = useRef(new Animated.Value(-DRAWER_W)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: isVisible ? 0 : -DRAWER_W,
        duration: isVisible ? 260 : 200,
        easing: isVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: isVisible ? 1 : 0,
        duration: isVisible ? 260 : 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, slide, fade]);

  /** Close first, then navigate — otherwise the drawer animates over the new screen. */
  const go = useCallback(
    (screen: string, params?: object) => {
      onClose();
      requestAnimationFrame(() => navigation.navigate(screen, params));
    },
    [navigation, onClose],
  );

  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', url);
    }
  }, []);

  const onLogout = useCallback(() => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          onClose();
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
          );
        },
      },
    ]);
  }, [logout, navigation, onClose]);

  const onDelete = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account and all your progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res: any = await deleteAccount(navigation);
            if (res?.success === false || res?.status === false) {
              Alert.alert('Could not delete', res?.message ?? 'Please try again.');
              return;
            }
            await logout();
            onClose();
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
            );
          },
        },
      ],
    );
  }, [logout, navigation, onClose]);

  /** Home sits above the groups — it is where you go back to, not a category. */
  const home: Item[] = [
    {
      key: 'dashboard',
      route: 'Dashboard',
      label: 'Dashboard',
      icon: Home,
      tint: theme.color.text.primary,
      onPress: () => go('Dashboard'),
    },
  ];

  const train: Item[] = [
    {
      // First in Train, and above Tutorials: browsing the twelve categories is
      // the thing members came to do. Tutorials are how Phil explains a
      // movement; workouts are the session you actually follow.
      key: 'workouts',
      route: 'Workouts',
      label: 'Workouts',
      icon: Flame,
      tint: theme.color.brand.base,
      onPress: () => go('Workouts'),
    },
    {
      key: 'tutorials',
      route: 'Feed',
      label: 'Tutorials',
      icon: Play,
      tint: theme.color.status.warning,
      onPress: () => go('Feed'),
    },
    {
      key: 'courses',
      route: 'Courses',
      label: 'Courses',
      icon: CoursesIcon,
      tint: theme.color.status.info,
      onPress: () => go('Courses'),
    },
    {
      key: 'coach',
      route: 'MyCoach',
      label: 'My Coach',
      icon: Coach,
      tint: theme.color.status.success,
      onPress: () => go('MyCoach'),
    },
    {
      key: 'events',
      route: 'Events',
      label: 'Events',
      icon: Calendar,
      tint: theme.color.accent.base,
      onPress: () => go('Events'),
    },
  ];

  const discover: Item[] = [
    {
      key: 'books',
      route: 'Products',
      label: 'Books & Gear',
      icon: Shop,
      tint: theme.color.brand.base,
      onPress: () => go('Products'),
    },
    {
      key: 'testimonials',
      route: 'Testimonials',
      label: 'Testimonials',
      icon: Star,
      tint: theme.color.accent.base,
      onPress: () => go('Testimonials'),
    },
    {
      key: 'about',
      route: 'About',
      label: 'About Phil',
      icon: Info,
      tint: theme.color.neutral[600],
      onPress: () => go('About'),
    },
  ];

  const account: Item[] = [
    {
      key: 'profile',
      route: 'Profile',
      label: 'Profile & settings',
      icon: UserIcon,
      tint: theme.color.neutral[600],
      onPress: () => go('Profile'),
    },
    {
      key: 'contact',
      route: 'Contact',
      label: 'Contact us',
      icon: Phone,
      tint: theme.color.status.success,
      onPress: () => go('Contact'),
    },
    {
      key: 'delete',
      label: 'Delete account',
      icon: Close,
      tint: theme.color.brand.base,
      onPress: onDelete,
      danger: true,
    },
  ];

  const renderItem = (item: Item) => {
    const IconCmp = item.icon;
    const active = !!item.route && item.route === currentRoute;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.row, active && styles.rowActive]}
        onPress={item.onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
      >
        <View style={[styles.rowIcon, { backgroundColor: item.tint }]}>
          <IconCmp size={15} color={theme.color.text.inverse} />
        </View>
        <Text
          style={[
            styles.rowLabel,
            active && styles.rowLabelActive,
            item.danger && styles.rowLabelDanger,
          ]}
        >
          {item.label}
        </Text>
        {/* A bar rather than a tint alone, so "you are here" survives a
            colour-blind read and a dim screen. */}
        {active && <View style={styles.activeBar} />}
      </TouchableOpacity>
    );
  };

  /**
   * Only the marks Phil has actually set up, in a fixed order.
   *
   * The order is ours rather than the API's: a JSON object has no meaningful
   * order, and the row should not rearrange itself between loads.
   */
  const socials = [
    { key: 'youtube', Svg: YouTubeRound },
    { key: 'instagram', png: InstagramLogo },
    { key: 'facebook', png: FacebookLogo },
    { key: 'tiktok', Svg: TikTokRound },
    { key: 'linkedin', Svg: LinkedInRound },
    { key: 'x', png: XLogo },
    { key: 'whatsapp', png: WhatsappLogo },
    { key: 'telegram', png: TelegramLogo },
  ].filter(s => !!links[s.key]);

  if (!isVisible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX: slide }] }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.brand}>
              <Image source={PhilrossLogo} style={styles.logo} resizeMode="contain" />
              <View style={styles.brandText}>
                <Text style={styles.brandName}>MASTER PHIL</Text>
                <Text style={styles.brandTag}>BodyBell Method®</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <Close size={17} color={theme.color.text.inverse} />
            </TouchableOpacity>
          </View>

          {/* No name or email here — the profile avatar already sits in the
              top right of every screen, and repeating it made the drawer
              open on the one thing nobody came here to read. */}
          {/* Solid tinted plate, not a 10%-white wash. The old chip put small
              amber text on near-black behind a barely-there background, so the
              one line telling you what you are paying for was the hardest
              thing in the drawer to read. */}
          <View
            style={[
              styles.planChip,
              isSubscribed ? styles.planChipPaid : styles.planChipFree,
            ]}
          >
            {isSubscribed ? (
              <Check size={13} color={theme.color.status.successOnDark} />
            ) : (
              <Gift size={13} color={theme.color.accent.onDark} />
            )}
            <Text
              style={[
                styles.planText,
                {
                  color: isSubscribed
                    ? theme.color.status.successOnDark
                    : theme.color.accent.onDark,
                },
              ]}
            >
              {isSubscribed ? 'Premium member' : 'Free account'}
            </Text>
          </View>
        </View>

        {/* Body */}
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {/* No group label — it stands alone above the categories. */}
          {home.map(renderItem)}

          <Text style={styles.groupLabel}>Train</Text>
          {train.map(renderItem)}

          <Text style={styles.groupLabel}>Discover</Text>
          {discover.map(renderItem)}

          <Text style={styles.groupLabel}>Account</Text>
          {account.map(renderItem)}

          {socials.length > 0 && (
            <>
              <Text style={styles.groupLabel}>Follow Master Phil</Text>
              <View style={styles.socialRow}>
                {socials.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={styles.socialBtn}
                    onPress={() => openLink(links[s.key] as string)}
                    activeOpacity={0.6}
                    hitSlop={theme.hitSlop}
                    accessibilityRole="button"
                    accessibilityLabel={s.key}
                  >
                    {s.png ? (
                      <Image source={s.png} style={styles.socialImg} resizeMode="contain" />
                    ) : (
                      s.Svg && <s.Svg size={SOCIAL_SIZE} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={onLogout}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <LogOut size={16} color={theme.color.brand.base} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
          <Text style={styles.version}>
            {`Version ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,8,10,0.55)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_W,
    backgroundColor: theme.color.surface.app,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 24,
        shadowOffset: { width: 6, height: 0 },
      },
      android: { elevation: 16 },
    }),
  },

  /**
   * Square bottom edge. The rounded bottom-right corner cut into the drawer
   * against a straight left edge and read as a rendering fault rather than a
   * shape.
   */
  header: {
    backgroundColor: theme.color.surface.logoGround,
    paddingHorizontal: theme.space.xl,
    paddingTop: Platform.OS === 'ios' ? 58 : 34,
    paddingBottom: theme.space.lg,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: theme.space.md, flex: 1 },
  logo: { width: 44, height: 44, marginLeft: -3 },
  brandText: { flex: 1, minWidth: 0 },
  brandName: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    letterSpacing: 1.1,
    color: theme.color.text.inverse,
    includeFontPadding: false,
  },
  brandTag: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: 0.4,
    color: theme.color.text.inverseMuted,
    marginTop: 2,
    includeFontPadding: false,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: theme.space.lg,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  /** Amber at 18% plus a matching hairline — legible on black, still quiet. */
  planChipFree: {
    backgroundColor: 'rgba(224,172,51,0.18)',
    borderColor: 'rgba(224,172,51,0.45)',
  },
  planChipPaid: {
    backgroundColor: 'rgba(18,200,138,0.18)',
    borderColor: 'rgba(18,200,138,0.45)',
  },
  planText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },

  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.xl,
  },
  groupLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    marginTop: theme.space.lg,
    marginBottom: theme.space.sm,
    paddingHorizontal: theme.space.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.md,
    borderRadius: theme.radius.lg,
    minHeight: theme.minTouch,
  },
  rowActive: { backgroundColor: theme.color.surface.card },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },
  rowLabelActive: { fontFamily: theme.font.semibold },
  rowLabelDanger: { color: theme.color.brand.base },
  activeBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: theme.color.brand.base,
  },

  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.lg,
    paddingHorizontal: theme.space.md,
    marginTop: theme.space.xs,
  },
  /**
   * No plate behind the mark. Each brand logo is already a finished circular
   * shape, so a rounded square under it drew a second, competing outline.
   * The button keeps its 44pt touch area without painting anything.
   */
  socialBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialImg: { width: SOCIAL_SIZE, height: SOCIAL_SIZE },

  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.lg,
    paddingBottom: Platform.OS === 'ios' ? theme.space['3xl'] : theme.space.xl,
    gap: theme.space.md,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.brand.subtle,
    borderRadius: theme.radius.md,
    minHeight: 46,
  },
  logoutText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.brand.base,
  },
  version: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    color: theme.color.text.disabled,
    textAlign: 'center',
  },
});

export default SideMenu;
