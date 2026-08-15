/**
 * WorkoutDetailScreen — one written workout, as a checklist you can tick.
 *
 * The client writes these as plain lines, one exercise each, and each line
 * becomes a row here. Nothing is parsed or interpreted, so what they type in
 * the admin is exactly what a member reads, on both platforms.
 *
 * The ticks are for the session in front of you, not a permanent record —
 * they reset when you leave. A written workout is a page you follow with the
 * phone on the floor beside you; the useful thing is knowing which set you
 * are on right now.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import LinearMeter from '../components/ui/LinearMeter';
import { ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, Clock, Lock, Tag } from '../components/ui/icons';
import { getWorkoutDetail } from '../../app/helpers/ApiHelper';

interface WorkoutDetail {
  id: number;
  title: string;
  slug: string;
  summary?: string;
  category_name?: string;
  level?: string;
  duration_minutes?: number | null;
  equipment?: string;
  steps: string[];
  locked: boolean;
}

const WorkoutDetailScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { slug, title } = route.params || {};

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Indices ticked in this sitting. Deliberately not persisted. */
  const [done, setDone] = useState<Set<number>>(new Set());

  const fetchWorkout = useCallback(async () => {
    if (!slug) {
      setError('This workout could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const res: any = await getWorkoutDetail(slug, navigation);
      const data = res?.data ?? res;

      if (data && data.title) {
        setWorkout(data);
      } else {
        setError('We could not load this workout.');
      }
    } catch (e) {
      setError('We could not load this workout.');
    } finally {
      setIsLoading(false);
    }
  }, [slug, navigation]);

  useEffect(() => {
    fetchWorkout();
  }, [fetchWorkout]);

  const toggle = (i: number) =>
    setDone(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  const steps = workout?.steps ?? [];
  const progress = steps.length ? (done.size / steps.length) * 100 : 0;
  const equipment = (workout?.equipment || '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title={workout?.category_name || 'Workout'}
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !workout ? (
        <ErrorState
          message={error ?? 'We could not load this workout.'}
          onRetry={fetchWorkout}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{workout.title || title}</Text>

            {!!workout.summary && (
              <Text style={styles.summary}>{workout.summary}</Text>
            )}

            <View style={styles.metaRow}>
              {!!workout.duration_minutes && (
                <View style={styles.meta}>
                  <Clock size={12} color={theme.color.text.muted} />
                  <Text style={styles.metaText}>
                    {workout.duration_minutes} min
                  </Text>
                </View>
              )}
              {!!workout.level && (
                <View style={styles.meta}>
                  <Tag size={12} color={theme.color.text.muted} />
                  <Text style={styles.metaText}>
                    {workout.level.charAt(0).toUpperCase() + workout.level.slice(1)}
                  </Text>
                </View>
              )}
            </View>

            {equipment.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What you need</Text>
                <View style={styles.kitRow}>
                  {equipment.map(item => (
                    <View key={item} style={styles.kit}>
                      <Text style={styles.kitText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {workout.locked ? (
              <View style={styles.lockedCard}>
                <View style={styles.lockedIcon}>
                  <Lock size={20} color={theme.color.text.inverse} />
                </View>
                <Text style={styles.lockedTitle}>This one is for members</Text>
                <Text style={styles.lockedBody}>
                  Subscribe to open this workout and the rest of the library.
                </Text>
                <TouchableOpacity
                  style={styles.lockedCta}
                  onPress={() => navigation.navigate('Paywall')}
                  activeOpacity={0.9}
                  accessibilityRole="button"
                >
                  <Text style={styles.lockedCtaText}>See membership</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.section}>
                <View style={styles.stepsHead}>
                  <Text style={styles.sectionLabel}>The workout</Text>
                  <Text style={styles.stepsCount}>
                    {done.size} of {steps.length}
                  </Text>
                </View>

                {steps.length > 1 && (
                  /**
                   * Not the app's progress green. #00FF00 is chosen for the
                   * dark hero card, where it is vivid; on this white card it
                   * sits at 1.4:1 and reads as a smear rather than a bar.
                   * The completion green is a real colour at 3.4:1, and it is
                   * what "done" already means everywhere else in the app.
                   */
                  <LinearMeter
                    progress={progress}
                    height={6}
                    color={theme.color.status.success}
                    trackColor={theme.color.status.successSubtle}
                    style={styles.meter}
                  />
                )}

                <View style={styles.stepsCard}>
                  {steps.map((step, i) => {
                    const ticked = done.has(i);
                    return (
                      <TouchableOpacity
                        key={`${i}-${step}`}
                        style={[styles.step, i > 0 && styles.stepDivided]}
                        onPress={() => toggle(i)}
                        activeOpacity={0.7}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: ticked }}
                        accessibilityLabel={step}
                      >
                        {/* Empty ring becomes a filled tick — the shape
                            changes, not just the colour. */}
                        <View style={[styles.tick, ticked && styles.tickOn]}>
                          {ticked && (
                            <Check size={12} color={theme.color.text.inverse} />
                          )}
                        </View>
                        <Text
                          style={[styles.stepText, ticked && styles.stepTextOn]}
                        >
                          {step}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fine}>
                  Ticks are just for this session — they clear when you leave.
                </Text>
              </View>
            )}
          </ScrollView>

          {!workout.locked && steps.length > 0 && (
            <View
              style={[
                styles.bar,
                { paddingBottom: Math.max(insets.bottom, theme.space.lg) },
              ]}
            >
              <TouchableOpacity
                style={styles.cta}
                onPress={() =>
                  setDone(
                    done.size === steps.length
                      ? new Set()
                      : new Set(steps.map((_, i) => i)),
                  )
                }
                activeOpacity={0.9}
                accessibilityRole="button"
              >
                <Text style={styles.ctaText}>
                  {done.size === steps.length ? 'Start again' : 'Tick everything'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['4xl'],
  },

  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
  },
  summary: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
    marginTop: theme.space.xs,
  },

  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.lg,
    marginTop: theme.space.md,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },

  section: { marginTop: theme.space['2xl'] },
  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },

  kitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
    marginTop: theme.space.md,
  },
  kit: {
    paddingHorizontal: theme.space.md,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.surface.sunken,
  },
  kitText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },

  stepsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepsCount: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    fontVariant: ['tabular-nums'],
  },
  meter: { marginTop: theme.space.sm },

  stepsCard: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    paddingHorizontal: theme.space.lg,
    marginTop: theme.space.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingVertical: theme.space.lg,
  },
  stepDivided: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.color.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickOn: {
    borderColor: theme.color.status.success,
    backgroundColor: theme.color.status.success,
  },
  stepText: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 21,
    color: theme.color.text.primary,
  },
  stepTextOn: {
    color: theme.color.text.muted,
    textDecorationLine: 'line-through',
  },
  fine: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.disabled,
    marginTop: theme.space.md,
    textAlign: 'center',
  },

  lockedCard: {
    alignItems: 'center',
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.xl,
    marginTop: theme.space['2xl'],
  },
  lockedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.status.locked,
    marginBottom: theme.space.lg,
  },
  lockedTitle: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.primary,
  },
  lockedBody: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
    textAlign: 'center',
    marginTop: theme.space.xs,
  },
  lockedCta: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
    marginTop: theme.space.lg,
  },
  lockedCtaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.onBrand,
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
    minHeight: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.hero,
  },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverse,
  },
});

export default WorkoutDetailScreen;
