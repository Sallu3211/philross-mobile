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

  // One field, because the backend stores one field. Splitting it into first and
  // last here only invented a shape the API does not accept.
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [notifications, setNotifications] = useState(true);

  /* Seed the form from whatever we already know, then refresh from the API. */
  useEffect(() => {
    setFullName(user?.fullName ?? '');
  }, [user]);

  useEffect(() => {
    (async () => {
      const pref = await EncryptedStorage.getItem(NOTIF_PREF_KEY).catch(() => null);
      if (pref !== null) setNotifications(pref === 'true');

      // The server is the source of truth for the name. When the profile
      // endpoint exists, whatever it returns overwrites both the field and
      // the cached user — so a name changed on another device shows up here,
      // and a reinstall recovers it rather than starting blank.
      const res: any = await getProfile(navigation).catch(() => null);
      const data = res?.data ?? res;
      const serverName = data?.full_name ?? data?.user?.full_name;
      if (serverName) {
        setFullName(serverName);
        if (serverName !== user?.fullName) {
          await setUser({ ...(user as any), fullName: serverName });
        }
      }
    })();
    // Runs once per screen entry. `user` and `setUser` are deliberately out:
    // this effect writes to the user it reads, so listing them would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  const onSave = useCallback(async () => {
    const name = fullName.trim();

    if (!name) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      const res: any = await updateProfile({ full_name: name }, navigation);

      const ok = res?.success !== false && res?.status !== false;

      /**
       * The API has no profile endpoint (confirmed against its OpenAPI schema),
       * so a 404 is not the user's problem and not something a retry fixes.
       * Rather than refuse the edit, keep it: UserContext persists to
       * EncryptedStorage, so the greeting, the avatar initial and the menu all
       * pick it up and it survives a restart. The one thing it cannot do is
       * reach the server, and the message says so rather than claiming a save
       * that did not happen.
       */
      if (!ok && !res?.serverUnsupported) {
        // A real server rejection — show what it actually said.
        const detail =
          typeof res?.message === 'string'
            ? res.message
            : Array.isArray(res?.message)
            ? res.message[0]
            : res?.message?.full_name?.[0] ?? 'Please try again.';
        Alert.alert('Could not save', detail);
        return;
      }

      // Write back into context so the greeting and avatar update immediately.
      await setUser({ ...(user as any), fullName: name });

      setDirty(false);

      if (res?.serverUnsupported) {
        Alert.alert('Saved on this device', res.message);
      } else {
        Alert.alert('Saved', 'Your name has been updated.');
      }
    } finally {
      setSaving(false);
    }
  }, [fullName, navigation, setUser, user]);

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
            {fullName.trim() || 'Your name'}
          </Text>
          <Text style={styles.identityEmail} numberOfLines={1}>
            {user?.email ?? ''}
          </Text>
        </View>

        {/* Editable name */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your details</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={t => {
                setFullName(t);
                setDirty(true);
              }}
              placeholder="Your name"
              placeholderTextColor={theme.color.text.disabled}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={onSave}
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
                  true: theme.color.accent.base,
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
            onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}
          />
          <Row
            icon={Info}
            label="Terms of use"
            tint={theme.color.neutral[600]}
            onPress={() => navigation.navigate('Legal', { doc: 'terms' })}
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
