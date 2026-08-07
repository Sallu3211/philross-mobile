/**
 * DashboardScreen — the member home screen.
 *
 * Layout order is deliberate, top to bottom:
 *   1. Greeting          — who you are, one tap to the menu
 *   2. Hero meter        — the one figure the screen leads with
 *   3. Trial banner      — only while the free week is running or lapsed
 *   4. KPI row           — three headline numbers, not three tiny charts
 *   5. Continue          — resume what you already started (highest intent)
 *   6. Quick actions     — the six things members actually do
 *   7. New tutorials     — discovery, with lock state for non-members
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SideMenu from '../components/SideMenu';
import MenuIcon from '../../assets/icons/menu.svg';
import { useUser } from '../context/UserContext';
import { theme } from '../theme';

import HeroProgressCard from '../components/dashboard/HeroProgressCard';
import StatTile from '../components/dashboard/StatTile';
import TrialBanner, { TrialMode } from '../components/dashboard/TrialBanner';
import SectionHeader from '../components/dashboard/SectionHeader';
import ContinueCard, { ContinueItem } from '../components/dashboard/ContinueCard';
import QuickActions, { QuickAction } from '../components/dashboard/QuickActions';
import { StatusTone } from '../components/ui/StatusChip';

import useDashboardData, { FREE_TRIAL_DAYS } from '../hooks/useDashboardData';
import { checkSubscriptionAndProceed } from '../services/subscriptionService';

const greetingFor = (date: Date) => {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const DashboardScreen = ({ navigation }: any) => {
  const { user, getUserInitial } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const d = useDashboardData(navigation);

  const firstName = useMemo(
    () => (user?.firstName || user?.fullName || '').split(' ')[0] || 'there',
    [user],
  );

  /** Everything paywalled routes through the existing Superwall/RevenueCat flow. */
  const openPaywall = useCallback(
    (onUnlocked?: () => void) => {
      checkSubscriptionAndProceed(() => onUnlocked?.());
    },
    [],
  );

  const openItem = useCallback(
    (item: ContinueItem) => {
      if (item.locked) {
        openPaywall(() => navigation.navigate('FeedDetails', { id: item.id }));
        return;
      }
      navigation.navigate('CourseDetails', { courseId: item.id });
    },
    [navigation, openPaywall],
  );

  const openFeedItem = useCallback(
    (item: ContinueItem) => {
      if (item.locked) {
        openPaywall(() => navigation.navigate('FeedDetails', { id: item.id }));
        return;
      }
      navigation.navigate('FeedDetails', { id: item.id });
    },
    [navigation, openPaywall],
  );

  const actions: QuickAction[] = useMemo(
    () => [
      {
        key: 'feed',
        label: 'Tutorials',
        glyph: '▶',
        tint: theme.color.brand.base,
        tintBg: theme.color.brand.subtle,
        onPress: () => navigation.navigate('Feed'),
      },
      {
        key: 'courses',
        label: 'Courses',
        glyph: '🎓',
        tint: theme.color.status.info,
        tintBg: theme.color.status.infoSubtle,
        badge: d.coursesInProgress > 0 ? `${d.coursesInProgress} active` : undefined,
        onPress: () => navigation.navigate('Courses'),
      },
      {
        key: 'coach',
        label: 'My Coach',
        glyph: '🏋',
        tint: theme.color.status.success,
        tintBg: theme.color.status.successSubtle,
        onPress: () => navigation.navigate('MyCoach'),
      },
      {
        key: 'events',
        label: 'Events',
        glyph: '📅',
        tint: theme.color.status.warning,
        tintBg: theme.color.status.warningSubtle,
        onPress: () => navigation.navigate('Events'),
      },
      {
        key: 'shop',
        label: 'Books & Gear',
        glyph: '🛍',
        tint: theme.color.brand.base,
        tintBg: theme.color.brand.subtle,
        onPress: () => navigation.navigate('Products'),
      },
      {
        key: 'about',
        label: 'About Phil',
        glyph: 'ℹ',
        tint: theme.color.neutral[600],
        tintBg: theme.color.neutral[100],
        onPress: () => navigation.navigate('About'),
      },
    ],
    [navigation, d.coursesInProgress],
  );

  const planLabel =
    d.planState === 'trial'
      ? `Free week · ${d.trialDaysLeft} ${d.trialDaysLeft === 1 ? 'day' : 'days'} left`
      : d.planState === 'subscribed'
      ? 'Premium member'
      : d.planState === 'trial-expired'
      ? 'Trial ended'
      : 'Free account';

  const planTone: StatusTone =
    d.planState === 'trial'
      ? 'warning'
      : d.planState === 'subscribed'
      ? 'success'
      : d.planState === 'trial-expired'
      ? 'brand'
      : 'neutral';

  /**
   * Free tier + free trial run side by side, so the banner has three faces:
   * never-trialled members get the offer, members inside the week get a
   * countdown, and lapsed members get the win-back. Paid members see none.
   */
  const trialMode: TrialMode | null =
    d.planState === 'trial'
      ? 'active'
      : d.planState === 'trial-expired'
      ? 'expired'
      : d.planState === 'free'
      ? 'available'
      : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={d.refreshing}
            onRefresh={d.refresh}
            tintColor={theme.color.brand.base}
            colors={[theme.color.brand.base]}
          />
        }
      >
        {/* 1 ── Greeting */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            style={styles.menuBtn}
            hitSlop={theme.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Open menu"
          >
            <MenuIcon width={22} height={22} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.greeting}>{greetingFor(new Date())}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {firstName}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatar}
            accessibilityRole="button"
            accessibilityLabel="Your profile"
          >
            <Text style={styles.avatarText} allowFontScaling={false}>
              {getUserInitial()}
            </Text>
          </TouchableOpacity>
        </View>

        {!!d.error && <Text style={styles.error}>{d.error}</Text>}

        {/* 2 ── Hero meter */}
        <HeroProgressCard
          progress={d.overallProgress}
          planLabel={planLabel}
          planTone={planTone}
          completedCount={d.completedCount}
          totalCount={d.totalCount}
          subtitle={
            d.totalCount === 0
              ? 'Start a course and your progress will show up here.'
              : 'Keep going — consistency beats intensity.'
          }
          loading={d.loading}
        />

        {/* 3 ── Trial */}
        {trialMode && (
          <TrialBanner
            mode={trialMode}
            daysLeft={d.trialDaysLeft}
            trialLengthDays={FREE_TRIAL_DAYS}
            onPressCta={() => openPaywall()}
          />
        )}

        {/* 4 ── KPI row */}
        <View style={styles.kpiRow}>
          <StatTile
            value={d.completedCount}
            label="Courses completed"
            glyph="✓"
            tint={theme.color.status.success}
            tintBg={theme.color.status.successSubtle}
            loading={d.loading}
          />
          <StatTile
            value={d.coursesInProgress}
            label="In progress"
            glyph="◐"
            tint={theme.color.brand.base}
            tintBg={theme.color.brand.subtle}
            loading={d.loading}
            onPress={() => navigation.navigate('Courses')}
          />
          <StatTile
            value={d.lockedCount}
            label="Locked tutorials"
            glyph="🔒"
            tint={theme.color.neutral[600]}
            tintBg={theme.color.neutral[100]}
            loading={d.loading}
            onPress={() => openPaywall()}
          />
        </View>

        {/* 5 ── Continue */}
        {d.continueItems.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Pick up where you left off"
              caption="Your courses in progress"
              onPressAction={() => navigation.navigate('Courses')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {d.continueItems.map(item => (
                <ContinueCard key={String(item.id)} item={item} onPress={openItem} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6 ── Quick actions */}
        <View style={styles.section}>
          <SectionHeader title="Explore" />
          <QuickActions actions={actions} />
        </View>

        {/* 7 ── New tutorials */}
        {d.feedItems.length > 0 && (
          <View style={styles.section}>
            <SectionHeader
              title="Fresh from Phil"
              caption="Newest tutorials in your feed"
              onPressAction={() => navigation.navigate('Feed')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {d.feedItems.map(item => (
                <ContinueCard
                  key={String(item.id)}
                  item={item}
                  onPress={openFeedItem}
                  width={208}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <SideMenu
        isVisible={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.surface.app,
  },
  content: {
    paddingHorizontal: theme.space.xl,
    paddingBottom: theme.space['5xl'],
    gap: theme.space['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingTop: theme.space.md,
  },
  menuBtn: {
    width: theme.minTouch,
    height: theme.minTouch,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontFamily: theme.font.body,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.muted,
  },
  name: {
    fontFamily: theme.font.heading,
    fontSize: theme.type.h2.fontSize,
    lineHeight: theme.type.h2.lineHeight,
    color: theme.color.text.primary,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },
  error: {
    fontFamily: theme.font.body,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: theme.space.md,
  },
  section: {
    gap: theme.space.lg,
  },
  rail: {
    gap: theme.space.md,
    paddingRight: theme.space.xs,
  },
});

export default DashboardScreen;
