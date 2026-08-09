/**
 * SideMenu — the app's single navigation drawer.
 *
 * Used by Dashboard, Feed, Courses, MyCoach and Products, so every screen gets
 * the same menu. Props are unchanged from the previous version
 * (isVisible / onClose / navigation) so no call site needed touching.
 *
 * Structure, top to bottom:
 *   dark header   brand + who you are + your plan
 *   train         the things you do
 *   discover      the things you read or watch
 *   account       profile, contact, delete
 *   social row    original brand logos, links configurable in one place
 *   footer        version + log out
 *
 * Social marks use each brand's real logo. Facebook, Instagram, WhatsApp,
 * Telegram and X ship as full-colour PNGs; YouTube and TikTok only exist here
 * as monochrome SVGs, so those are tinted to their brand colour.
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
  Gift,
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
import YouTubeMark from '../../assets/icons/mdi_youtube.svg';
import TikTokMark from '../../assets/icons/ic_baseline-tiktok.svg';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(SCREEN_W * 0.84, 340);

/**
 * Every outbound link in one place. Swap a URL here and it changes everywhere;
 * set one to null to hide that mark without touching the layout.
 */
export const SOCIAL_LINKS: Record<string, string | null> = {
  youtube: 'https://www.youtube.com/@TheMasterPhil',
  instagram: 'https://www.instagram.com/themasterphil',
  facebook: 'https://www.facebook.com/masterphilross',
  tiktok: null,
  x: null,
  whatsapp: null,
  telegram: null,
};

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
  danger?: boolean;
}

const SideMenu = ({ isVisible, onClose, navigation }: SideMenuProps) => {
  const { user, getUserInitial, logout, isSubscribed } = useUser();

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

  const train: Item[] = [
    {
      key: 'tutorials',
      label: 'Tutorials',
      icon: Play,
      tint: theme.color.brand.base,
      onPress: () => go('Feed'),
    },
    {
      key: 'courses',
      label: 'Courses',
      icon: CoursesIcon,
      tint: theme.color.status.info,
      onPress: () => go('Courses'),
    },
    {
      key: 'coach',
      label: 'My Coach',
      icon: Coach,
      tint: theme.color.status.success,
      onPress: () => go('MyCoach'),
    },
    {
      key: 'events',
      label: 'Events',
      icon: Calendar,
      tint: theme.color.progress.fill,
      onPress: () => go('Events'),
    },
  ];

  const discover: Item[] = [
    {
      key: 'books',
      label: 'Books & Gear',
      icon: Shop,
      tint: theme.color.brand.base,
      onPress: () => go('Products'),
    },
    {
      key: 'testimonials',
      label: 'Testimonials',
      icon: Star,
      tint: theme.color.progress.fill,
      onPress: () => go('Testimonials'),
    },
    {
      key: 'about',
      label: 'About Phil',
      icon: Info,
      tint: theme.color.neutral[600],
      onPress: () => go('About'),
    },
  ];

  const account: Item[] = [
    {
      key: 'profile',
      label: 'Profile & settings',
      icon: UserIcon,
      tint: theme.color.neutral[600],
      onPress: () => go('Profile'),
    },
    {
      key: 'contact',
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
    return (
      <TouchableOpacity
        key={item.key}
        style={styles.row}
        onPress={item.onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <View style={[styles.rowIcon, { backgroundColor: item.tint }]}>
          <IconCmp size={15} color={theme.color.text.inverse} />
        </View>
        <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const socials = [
    { key: 'youtube', Svg: YouTubeMark, color: '#FF0000' },
    { key: 'instagram', png: InstagramLogo },
    { key: 'facebook', png: FacebookLogo },
    { key: 'tiktok', Svg: TikTokMark, color: '#000000' },
    { key: 'x', png: XLogo },
    { key: 'whatsapp', png: WhatsappLogo },
    { key: 'telegram', png: TelegramLogo },
  ].filter(s => !!SOCIAL_LINKS[s.key]);

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
            <Image source={PhilrossLogo} style={styles.logo} resizeMode="contain" />
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

          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText} allowFontScaling={false}>
                {getUserInitial()}
              </Text>
            </View>
            <View style={styles.identityText}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.fullName?.trim() || 'Welcome'}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email ?? ''}
              </Text>
            </View>
          </View>

          <View style={styles.planChip}>
            {isSubscribed ? (
              <Check size={12} color={theme.color.status.successOnDark} />
            ) : (
              <Gift size={12} color={theme.color.progress.fillOnDark} />
            )}
            <Text
              style={[
                styles.planText,
                {
                  color: isSubscribed
                    ? theme.color.status.successOnDark
                    : theme.color.progress.fillOnDark,
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
                    onPress={() => openLink(SOCIAL_LINKS[s.key] as string)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={s.key}
                  >
                    {s.png ? (
                      <Image source={s.png} style={styles.socialImg} resizeMode="contain" />
                    ) : (
                      s.Svg && <s.Svg width={22} height={22} fill={s.color} />
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

  header: {
    backgroundColor: theme.color.surface.logoGround,
    paddingHorizontal: theme.space.xl,
    paddingTop: Platform.OS === 'ios' ? 58 : 34,
    paddingBottom: theme.space.xl,
    borderBottomRightRadius: 26,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: { width: 46, height: 46, marginLeft: -3 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginTop: theme.space.xl,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  identityText: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.inverse,
  },
  email: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.inverseMuted,
    marginTop: 1,
  },

  planChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    marginTop: theme.space.lg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  planText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
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
    paddingHorizontal: theme.space.sm,
    borderRadius: theme.radius.md,
    minHeight: theme.minTouch,
  },
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
  rowLabelDanger: { color: theme.color.brand.base },

  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.md,
    paddingHorizontal: theme.space.sm,
    marginTop: theme.space.xs,
  },
  socialBtn: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialImg: { width: 22, height: 22 },

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
