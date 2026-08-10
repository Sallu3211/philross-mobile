/**
 * DashboardScreen — the member home screen.
 *
 * Layout order is deliberate, top to bottom:
 *   1. Greeting          — who you are, menu and profile
 *   2. Hero meter        — the one figure the screen leads with
 *   3. KPI row           — three headline counts, finishing the progress story
 *   4. Trial banner      — only while the free week is offered, running or lapsed
 *   5. Continue          — resume what you already started (highest intent)
 *   6. Quick actions     — the six things members actually do
 *   7. New tutorials     — discovery, with lock state for non-members
 *
 * Horizontal rails bleed to the screen edge (negative margin + matching inset
 * padding) so cards scroll off the edge rather than stopping at a gutter, which
 * is what makes a rail read as scrollable.
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
import { useFocusEffect } from '@react-navigation/native';

import SideMenu from '../components/SideMenu';
import { useUser } from '../context/UserContext';
import { theme } from '../theme';

import HeroProgressCard from '../components/dashboard/HeroProgressCard';
import StatTile from '../components/dashboard/StatTile';
import TrialBanner, { TrialMode } from '../components/dashboard/TrialBanner';
import SectionHeader from '../components/dashboard/SectionHeader';
import ContinueCard, { ContinueItem } from '../components/dashboard/ContinueCard';
import QuickActions, { QuickAction } from '../components/dashboard/QuickActions';
import { StatusTone } from '../components/ui/StatusChip';
import {
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Coach,
  Courses,
  Gift,
  Info,
  Lock,
  LockCircle,
  Menu,
  Play,
  ProgressCircle,
  Shop,
  IconProps,
} from '../components/ui/icons';

import useDashboardData, { FREE_TRIAL_DAYS } from '../hooks/useDashboardData';

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

  /**
   * Opens our own paywall rather than the Superwall-hosted one. The remote
   * template couldn't follow the app's design and never surfaced the Play
   * Console free-trial offer, so members never saw the first week was free.
   */
  const openPaywall = useCallback(
    (onUnlocked?: () => void) => {
      navigation.navigate('Paywall', {
        onSuccess: () => {
          onUnlocked?.();
          d.refresh();
        },
      });
    },
    [navigation, d],
  );

  // Marking a tutorial done happens on another screen, so the counts here are
  // stale by the time you come back. Re-read on focus.
  useFocusEffect(
    useCallback(() => {
      d.refresh();
      // Refreshing on every focus is the point; d changes each render.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  /** CourseDetails reads BOTH courseId and courseSlug from its route params. */
  const openCourse = useCallback(
    (item: ContinueItem) => {
      navigation.navigate('CourseDetails', {
        courseId: item.id,
        courseSlug: item.slug,
      });
    },
    [navigation],
  );

  /**
   * Same split as the Tutorials list: a video opens the player, everything
   * else opens the article. Sending both to FeedDetails made a tutorial in
   * "Fresh from Phil" open as an article with no way to watch it.
   */
  const openFeedItem = useCallback(
    (item: ContinueItem) => {
      const go = () =>
        item.source?.feed_type === 'video'
          ? navigation.navigate('Video', {
              videoData: item.source,
              sourceScreen: 'Dashboard',
            })
          : navigation.navigate('FeedDetails', {
              feedSlug: item.slug,
              sourceScreen: 'Dashboard',
            });
      if (item.locked) {
        openPaywall(go);
        return;
      }
      go();
    },
    [navigation, openPaywall],
  );

  const actions: QuickAction[] = useMemo(
    () => [
      {
        key: 'feed',
        label: 'Tutorials',
        icon: Play,
        tint: theme.color.brand.base,
        tintBg: theme.color.brand.subtle,
        onPress: () => navigation.navigate('Feed'),
      },
      {
        key: 'courses',
        label: 'Courses',
        icon: Courses,
        tint: theme.color.status.info,
        tintBg: theme.color.status.infoSubtle,
        badge: d.coursesInProgress > 0 ? `${d.coursesInProgress} active` : undefined,
        onPress: () => navigation.navigate('Courses'),
      },
      {
        key: 'coach',
        label: 'My Coach',
        icon: Coach,
        tint: theme.color.status.success,
        tintBg: theme.color.status.successSubtle,
        onPress: () => navigation.navigate('MyCoach'),
      },
      {
        key: 'events',
        label: 'Events',
        icon: Calendar,
        tint: theme.color.progress.fill,
        tintBg: theme.color.progress.subtle,
        onPress: () => navigation.navigate('Events'),
      },
      {
        key: 'shop',
        label: 'Books',
        icon: Shop,
        tint: theme.color.brand.base,
        tintBg: theme.color.brand.subtle,
        onPress: () => navigation.navigate('Products'),
      },
      {
        key: 'about',
        label: 'About',
        icon: Info,
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

  const planIcon: React.FC<IconProps> =
    d.planState === 'trial'
      ? Clock
      : d.planState === 'subscribed'
      ? Check
      : d.planState === 'trial-expired'
      ? Lock
      : Gift;

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
            <Menu size={20} color={theme.color.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.greeting} numberOfLines={1}>
              {greetingFor(new Date())}
            </Text>
            <Text style={styles.name} numberOfLines={1}>
              {firstName}
            </Text>
          </View>

          {/* Same size and radius as the menu button so they read as a pair. */}
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
            hitSlop={theme.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Profile and settings"
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
          planIcon={planIcon}
          completedCount={d.completedCount}
          totalCount={d.totalCount}
          subtitle={
            // Keyed off whether anything is actually under way, not off the
            // course count — the count now falls back to the whole catalogue.
            d.completedCount === 0 && d.coursesInProgress === 0
              ? 'Start a course and your progress shows up here.'
              : 'Keep going. Consistency beats intensity.'
          }
          loading={d.loading}
        />

        {/* 3 ── KPI group. Sits directly under the hero so the three counts read
             as part of the progress story, before any sales messaging.
             One card, three segments, hairline dividers between them. */}
        <View style={styles.kpiCard}>
          <StatTile
            value={d.completedCount}
            label="Completed"
            icon={CheckCircle}
            tint={theme.color.status.success}
            loading={d.loading}
          />
          <View style={styles.kpiDivider} />
          <StatTile
            value={d.coursesInProgress}
            label="In progress"
            icon={ProgressCircle}
            tint={theme.color.progress.fill}
            loading={d.loading}
            onPress={() => navigation.navigate('Courses')}
          />
          <View style={styles.kpiDivider} />
          <StatTile
            value={d.lockedCount}
            label="Locked"
            icon={LockCircle}
            tint={theme.color.neutral[500]}
            loading={d.loading}
            onPress={() => openPaywall()}
          />
        </View>

        {/* 4 ── Trial */}
        {trialMode && (
          <TrialBanner
            mode={trialMode}
            daysLeft={d.trialDaysLeft}
            trialLengthDays={FREE_TRIAL_DAYS}
            onPressCta={() => openPaywall()}
          />
        )}

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
              style={styles.railBleed}
              contentContainerStyle={styles.rail}
            >
              {d.continueItems.map(item => (
                <ContinueCard key={String(item.id)} item={item} onPress={openCourse} />
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
              style={styles.railBleed}
              contentContainerStyle={styles.rail}
            >
              {d.feedItems.map(item => (
                <ContinueCard
                  key={String(item.id)}
                  item={item}
                  onPress={openFeedItem}
                  width={168}
                  height={116}
                  mediaOnly
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

const GUTTER = theme.space.screen;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.surface.app,
  },
  content: {
    paddingHorizontal: GUTTER,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingTop: theme.space.sm,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.color.text.muted,
  },
  name: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    lineHeight: theme.type.h2.lineHeight,
    letterSpacing: theme.type.h2.letterSpacing,
    color: theme.color.text.primary,
  },
  avatar: {
    // Matches menuBtn exactly — same box, same corner radius.
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  error: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },
  /** One card holding all three counts. */
  kpiCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.space.xs,
    ...theme.shadow.sm,
  },
  /** Hairline between segments — inset top and bottom so it reads as a rule. */
  kpiDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: theme.color.border.subtle,
    marginVertical: theme.space.lg,
  },
  section: {
    gap: theme.space.lg,
  },
  /** Let rails run to the physical screen edge. */
  railBleed: {
    marginHorizontal: -GUTTER,
  },
  rail: {
    gap: theme.space.md,
    paddingHorizontal: GUTTER,
  },
});

export default DashboardScreen;
