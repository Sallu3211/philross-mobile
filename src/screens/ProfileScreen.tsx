/**
 * ProfileScreen — account details and app settings.
 *
 * Reached from the dashboard avatar. Name edits PATCH `accounts/profile/` and
 * then write straight back into UserContext, so the greeting and avatar initial
 * update everywhere in the app without a reload or a re-login.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import EncryptedStorage from 'react-native-encrypted-storage';

import { useUser } from '../context/UserContext';
import { theme } from '../theme';
import { Constants } from '../../app/config/constants';
import {
  deleteAccount,
  getProfile,
  updateProfile,
} from '../../app/helpers/ApiHelper';
import {
  Bell,
  Check,
  ChevronRight,
  Info,
  Lock,
  IconProps,
} from '../components/ui/icons';

const NOTIF_PREF_KEY = 'pref_push_notifications';

interface RowProps {
  icon: React.FC<IconProps>;
  label: string;
  tint?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}

const Row: React.FC<RowProps> = ({
  icon: IconCmp,
  label,
  tint = theme.color.neutral[600],
  onPress,
  danger,
  right,
}) => {
  const Container: any = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? theme.color.brand.base : tint }]}>
        <IconCmp size={15} color={theme.color.text.inverse} />
      </View>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]} numberOfLines={1}>
        {label}
      </Text>
      {right ?? (onPress ? <ChevronRight size={15} color={theme.color.text.disabled} /> : null)}
    </Container>
  );
};

const ProfileScreen = ({ navigation }: any) => {
  const { user, setUser, getUserInitial, logout } = useUser();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notifications, setNotifications] = useState(true);

  /* Seed the form from whatever we already know, then refresh from the API. */
  useEffect(() => {
    const parts = (user?.fullName ?? '').trim().split(/\s+/);
    setFirstName(user?.firstName || parts[0] || '');
    setLastName(user?.lastName || parts.slice(1).join(' ') || '');
  }, [user]);

  useEffect(() => {
    (async () => {
      const pref = await EncryptedStorage.getItem(NOTIF_PREF_KEY).catch(() => null);
      if (pref !== null) setNotifications(pref === 'true');

      const res: any = await getProfile(navigation).catch(() => null);
      const data = res?.data ?? res;
      if (data && (data.first_name || data.last_name)) {
        setFirstName(prev => data.first_name ?? prev);
        setLastName(prev => data.last_name ?? prev);
      }
    })();
  }, [navigation]);

  const onSave = useCallback(async () => {
    const first = firstName.trim();
    const last = lastName.trim();

    if (!first) {
      Alert.alert('Name required', 'Please enter your first name.');
      return;
    }

    setSaving(true);
    try {
      const res: any = await updateProfile(
        { first_name: first, last_name: last, full_name: `${first} ${last}`.trim() },
        navigation,
      );

      const ok = res?.success !== false && res?.status !== false;
      if (!ok) {
        Alert.alert('Could not save', res?.message ?? 'Please try again.');
        return;
      }

      // Write back into context so the greeting and avatar update immediately.
      await setUser({
        ...(user as any),
        firstName: first,
        lastName: last,
        fullName: `${first} ${last}`.trim(),
      });

      setDirty(false);
      Alert.alert('Saved', 'Your name has been updated.');
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, navigation, setUser, user]);

  const onToggleNotifications = useCallback(async (next: boolean) => {
    setNotifications(next);
    await EncryptedStorage.setItem(NOTIF_PREF_KEY, String(next)).catch(() => {});
  }, []);

  const onLogout = useCallback(async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
          );
        },
      },
    ]);
  }, [logout, navigation]);

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
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }),
            );
          },
        },
      ],
    );
  }, [logout, navigation]);

  const openLink = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open link', url);
    }
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={theme.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <View style={styles.backChevron}>
            <ChevronRight size={18} color={theme.color.text.primary} />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.bigAvatar}>
            <Text style={styles.bigAvatarText} allowFontScaling={false}>
              {getUserInitial()}
            </Text>
          </View>
          <Text style={styles.identityName} numberOfLines={1}>
            {`${firstName} ${lastName}`.trim() || 'Your name'}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
        </View>

        {/* Editable name */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your details</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={t => {
                setFirstName(t);
                setDirty(true);
              }}
              placeholder="First name"
              placeholderTextColor={theme.color.text.disabled}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={t => {
                setLastName(t);
                setDirty(true);
              }}
              placeholder="Last name"
              placeholderTextColor={theme.color.text.disabled}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.input, styles.inputDisabled]}>
              <Text style={styles.inputDisabledText} numberOfLines={1}>
                {user?.email ?? '—'}
              </Text>
            </View>
            <Text style={styles.fieldHint}>Email cannot be changed here.</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={!dirty || saving}
            activeOpacity={0.88}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color={theme.color.text.onBrand} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>
          <Row
            icon={Bell}
            label="Push notifications"
            tint={theme.color.status.info}
            right={
              <Switch
                value={notifications}
                onValueChange={onToggleNotifications}
                trackColor={{
                  false: theme.color.neutral[300],
                  true: theme.color.progress.fill,
                }}
                thumbColor={theme.color.surface.card}
              />
            }
          />
          <Row
            icon={Lock}
            label="Change password"
            tint={theme.color.neutral[600]}
            onPress={() => navigation.navigate('ForgotPassword')}
          />
        </View>

        {/* Support & legal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Support & legal</Text>
          <Row
            icon={Info}
            label="Contact us"
            tint={theme.color.status.success}
            onPress={() => navigation.navigate('Contact')}
          />
          <Row
            icon={Info}
            label="Privacy policy"
            tint={theme.color.neutral[600]}
            onPress={() => openLink(Constants.privacyPolicyUrl)}
          />
          <Row
            icon={Info}
            label="Terms of use"
            tint={theme.color.neutral[600]}
            onPress={() => openLink(Constants.termsOfUseUrl)}
          />
        </View>

        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Row
            icon={Check}
            label="Log out"
            tint={theme.color.neutral[600]}
            onPress={onLogout}
          />
          <Row icon={Lock} label="Delete account" danger onPress={onDelete} />
        </View>

        <Text style={styles.version}>
          {`Version ${DeviceInfo.getVersion()} (${DeviceInfo.getBuildNumber()})`}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const GUTTER = theme.space.screen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GUTTER,
    paddingTop: theme.space.sm,
    paddingBottom: theme.space.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backChevron: {
    // The chevron glyph points right; flip it for "back".
    transform: [{ scaleX: -1 }],
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.primary,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.xl,
  },
  identity: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: theme.space.md,
  },
  bigAvatar: {
    width: 76,
    height: 76,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.md,
    ...theme.shadow.md,
  },
  bigAvatarText: {
    fontFamily: theme.font.bold,
    fontSize: 30,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  identityName: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    letterSpacing: theme.type.h2.letterSpacing,
    color: theme.color.text.primary,
  },
  identityEmail: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.muted,
  },
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    padding: theme.space.xl,
    gap: theme.space.lg,
    ...theme.shadow.sm,
  },
  cardTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },
  field: { gap: theme.space.sm },
  fieldLabel: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    fontFamily: theme.font.medium,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
    backgroundColor: theme.color.surface.app,
    minHeight: theme.minTouch,
  },
  inputDisabled: {
    justifyContent: 'center',
    backgroundColor: theme.color.neutral[100],
  },
  inputDisabledText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.muted,
  },
  fieldHint: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.disabled,
  },
  saveBtn: {
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    minHeight: theme.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.space.xs,
  },
  saveBtnDisabled: { opacity: 0.42 },
  saveBtnText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.onBrand,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
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
  version: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.disabled,
    textAlign: 'center',
  },
});

export default ProfileScreen;
