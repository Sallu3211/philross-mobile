/**
 * useDashboardData — aggregates everything the dashboard renders.
 *
 * FIELD NAMES MATTER HERE. The API does not return `title`/`thumbnail`/`image`.
 * Feed items carry `name` + `cropped_thumbnail_url` + `slug`; courses carry
 * `title` + `cropped_thumbnail_url` + `slug` + `course_completed`. Guessing the
 * generic names silently yields "Untitled" cards with no artwork, which is what
 * the first version of this screen did.
 *
 * ⚠️ PROGRESS DATA IS CURRENTLY LOCAL-ONLY
 * The backend exposes no GET endpoint for progress: `getVideoProgress` and
 * `getCourseProgress` in ApiHelper are stubs that return a hardcoded 0, and the
 * only write path is POST `course/{video_id}/video_watched/` — which currently
 * sends an empty body. So this hook reads the same EncryptedStorage keys the
 * course screens already write (`course_progress_{id}`). Progress therefore
 * does NOT survive a reinstall and does NOT sync across devices. Once the API
 * grows a real progress endpoint, replace `readLocalCourseProgress` with that
 * call — nothing else here needs to change.
 */

import { useCallback, useEffect, useState } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import Purchases from 'react-native-purchases';
import {
  getCourseList,
  getFeedList,
  getServerSubscription,
} from '../../app/helpers/ApiHelper';
import type { ContinueItem } from '../components/dashboard/ContinueCard';
import { exactPercent } from '../utils/percent';
import {
  countDone as countTutorialsDone,
  loadAll as loadTutorialProgress,
} from '../services/tutorialProgress';

/** Length of the introductory free period, in days. */
export const FREE_TRIAL_DAYS = 7;

/** How many feed posts the "Fresh from Phil" rail shows before "See all". */
export const FEED_RAIL_COUNT = 4;

export type PlanState = 'trial' | 'trial-expired' | 'subscribed' | 'free';

export interface DashboardData {
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  overallProgress: number;
  completedCount: number;
  totalCount: number;

  continueItems: ContinueItem[];
  feedItems: ContinueItem[];

  planState: PlanState;
  trialDaysLeft: number;

  /** Tutorials — what the hero ring measures. */
  coursesInProgress: number;
  /** Courses, counted separately from the tutorial ring. */
  coursesTotal: number;
  coursesDone: number;
  lockedCount: number;

  refresh: () => Promise<void>;
}

/** The API returns list payloads in at least five different shapes. Normalise. */
function toArray(response: any): any[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  return [];
}

/** Percentages arrive as 42, "42", or "42%" depending on the endpoint. */
function toPercent(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace('%', '').trim());
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(n, 0), 100);
}

/** Both feed and course items use the same `cropped_*` artwork fields. */
function artworkOf(item: any): string | null {
  return item?.cropped_thumbnail_url ?? item?.cropped_image_url ?? null;
}

async function readLocalCourseProgress(courseId: number | string): Promise<number> {
  try {
    const raw = await EncryptedStorage.getItem(`course_progress_${courseId}`);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return toPercent(parsed?.progress ?? parsed?.completion ?? 0);
  } catch {
    return 0;
  }
}

/**
 * What plan this member is on.
 *
 * RevenueCat answers the trial question and nothing else can — `periodType`
 * and `expirationDate` are the store's own record of an introductory offer.
 * But it is not the only way to hold a subscription any more: Phil can grant
 * one from the admin, and RevenueCat has never heard of those. Asking it
 * alone reported a granted member as `free`, so the app unlocked their content
 * (the server decides that) while the menu badge and the dashboard chip both
 * called them a free account.
 *
 * So the server is asked first. It is the only place that knows about both
 * kinds of subscription. RevenueCat is still consulted afterwards, because a
 * server that says "subscribed" cannot tell us whether the member is inside a
 * free trial, and "Free week · 3 days left" is worth getting right.
 */
async function readPlanState(
  navigation: any,
): Promise<{ state: PlanState; daysLeft: number }> {
  let serverSubscribed = false;
  try {
    const res: any = await getServerSubscription(navigation);
    const body = res?.data ?? res;
    serverSubscribed = body?.is_subscribed === true;
  } catch {
    // Falls through to RevenueCat, which is the old behaviour.
  }

  try {
    const info = await Purchases.getCustomerInfo();
    const active = Object.values(info?.entitlements?.active ?? {});

    if (active.length > 0) {
      const entitlement: any = active[0];
      if (entitlement?.periodType === 'TRIAL' && entitlement?.expirationDate) {
        const msLeft = new Date(entitlement.expirationDate).getTime() - Date.now();
        return { state: 'trial', daysLeft: Math.max(Math.ceil(msLeft / 86_400_000), 0) };
      }
      return { state: 'subscribed', daysLeft: 0 };
    }

    // No store entitlement. If the server says they are subscribed, it is an
    // admin grant — RevenueCat is right that nothing was bought, and wrong
    // that there is no subscription.
    if (serverSubscribed) return { state: 'subscribed', daysLeft: 0 };

    const everSubscribed =
      Object.keys(info?.entitlements?.all ?? {}).length > 0 ||
      (info?.allPurchaseDates && Object.keys(info.allPurchaseDates).length > 0);

    return { state: everSubscribed ? 'trial-expired' : 'free', daysLeft: 0 };
  } catch {
    // RevenueCat unreachable — the server's answer is still worth having.
    return { state: serverSubscribed ? 'subscribed' : 'free', daysLeft: 0 };
  }
}

export function useDashboardData(navigation: any): DashboardData {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [overallProgress, setOverallProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [coursesInProgress, setCoursesInProgress] = useState(0);
  const [coursesTotal, setCoursesTotal] = useState(0);
  const [coursesDone, setCoursesDone] = useState(0);
  const [lockedCount, setLockedCount] = useState(0);
  const [continueItems, setContinueItems] = useState<ContinueItem[]>([]);
  const [feedItems, setFeedItems] = useState<ContinueItem[]>([]);
  const [planState, setPlanState] = useState<PlanState>('free');
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  const load = useCallback(
    async (isRefresh: boolean) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      try {
        // No `limit`. A limit here silently made the percentage a fraction of
        // a page rather than of the catalogue: asking for 12 tutorials out of
        // 88 meant one completed tutorial read as 8%, not 1%. Both endpoints
        // return the full set in one response (`next: null`).
        const [courseRes, feedRes, plan, tutorialMarks] = await Promise.all([
          getCourseList(navigation).catch(() => null),
          getFeedList(navigation).catch(() => null),
          readPlanState(navigation),
          loadTutorialProgress(navigation),
        ]);

        setPlanState(plan.state);
        setTrialDaysLeft(plan.daysLeft);

        /* ── Courses → progress rings ─────────────────────────────────────── */
        const courses = toArray(courseRes?.data ?? courseRes);

        const withProgress = await Promise.all(
          courses.map(async (c: any) => {
            // ⚠️ `course_completed` is a PERCENTAGE STRING like "0 %", not a
            // boolean. Treating it as a flag made every course read as 100%
            // complete, because any non-empty string is truthy.
            const apiPct = toPercent(
              c?.course_completed ?? c?.completion ?? c?.progress,
            );
            const localPct = await readLocalCourseProgress(c?.id ?? c?.slug);
            return { course: c, progress: Math.max(apiPct, localPct) };
          }),
        );

        if (__DEV__) {
          console.log(
            '📊 DASHBOARD courses:',
            JSON.stringify(
              courses.map((c: any) => ({
                id: c?.id,
                title: c?.title,
                is_enrolled: c?.is_enrolled,
                course_completed: c?.course_completed,
                completion: c?.completion,
                progress: c?.progress,
                total_videos: c?.total_videos,
                watched_videos: c?.watched_videos,
              })),
              null,
              1,
            ),
          );
        }

        /**
         * The whole catalogue is the denominator, always.
         *
         * This used to narrow to "courses you have started" as soon as you
         * started one, which made the number move for the wrong reason:
         * finishing your first course out of six jumped the ring from 17% to
         * 100%, because the denominator had quietly shrunk from 6 to 1. A
         * denominator that changes with your progress is not a percentage.
         */
        const tracked = withProgress;

        const done = tracked.filter(x => x.progress >= 100).length;
        const inFlight = tracked.filter(x => x.progress > 0 && x.progress < 100);

        /* ── Tutorials → the other half of the progress story ─────────────── */
        const feedAll = toArray(feedRes?.data ?? feedRes);

        /**
         * The hero ring measures TUTORIALS ONLY.
         *
         * Courses are sold separately through external links at $199–$499 and
         * most people own none, so folding six of them into the same ring as
         * 88 tutorials mixed two unrelated things and made the number hard to
         * reason about. Courses now have their own counters below.
         *
         * A tutorial is worth 0 or 100 — there is no partial state for
         * something you either did or did not do.
         */
        const tutorialSlugs = feedAll.map((f: any) => f?.slug);
        const tutorialsDone = countTutorialsDone(tutorialMarks, tutorialSlugs);
        const tutorialTotal = tutorialSlugs.length;

        setOverallProgress(
          exactPercent(tutorialTotal > 0 ? (tutorialsDone / tutorialTotal) * 100 : 0),
        );
        setCompletedCount(tutorialsDone);
        setTotalCount(tutorialTotal);

        setCoursesTotal(tracked.length);
        setCoursesDone(done);
        setCoursesInProgress(inFlight.length);

        setContinueItems(
          inFlight
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 8)
            .map(x => ({
              id: x.course?.id,
              slug: x.course?.slug,
              title: x.course?.title ?? 'Untitled course',
              meta: x.course?.is_paid_course ? 'Premium course' : 'Course',
              progress: x.progress,
              imageUrl: artworkOf(x.course),
              locked: !!x.course?.is_locked,
            })),
        );

        /* ── Feed → "Fresh from Phil" rail ────────────────────────────────── */
        setLockedCount(feedAll.filter((f: any) => f?.locked).length);

        setFeedItems(
          feedAll.slice(0, FEED_RAIL_COUNT).map((f: any) => ({
            id: f?.id,
            slug: f?.slug,
            title: f?.name ?? f?.headline ?? 'Untitled',
            meta: f?.feed_type ?? 'Tutorial',
            progress: 0,
            imageUrl: artworkOf(f),
            locked: !!f?.locked,
            source: f,
          })),
        );
      } catch (e: any) {
        console.log('Dashboard load failed:', e);
        setError('We could not load your dashboard. Pull down to try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return {
    loading,
    refreshing,
    error,
    overallProgress,
    completedCount,
    totalCount,
    continueItems,
    feedItems,
    planState,
    trialDaysLeft,
    coursesInProgress,
    coursesTotal,
    coursesDone,
    lockedCount,
    refresh,
  };
}

export default useDashboardData;
