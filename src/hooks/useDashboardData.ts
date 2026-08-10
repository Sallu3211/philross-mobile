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
import { getCourseList, getFeedList } from '../../app/helpers/ApiHelper';
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

  coursesInProgress: number;
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
 * Reads trial state straight from RevenueCat rather than tracking it ourselves.
 * `periodType === 'TRIAL'` is set by the store while an introductory offer is
 * running, and `expirationDate` is when it converts to a paid renewal.
 */
async function readPlanState(): Promise<{ state: PlanState; daysLeft: number }> {
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

    const everSubscribed =
      Object.keys(info?.entitlements?.all ?? {}).length > 0 ||
      (info?.allPurchaseDates && Object.keys(info.allPurchaseDates).length > 0);

    return { state: everSubscribed ? 'trial-expired' : 'free', daysLeft: 0 };
  } catch {
    return { state: 'free', daysLeft: 0 };
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
          readPlanState(),
          loadTutorialProgress(),
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
         * Tutorials are the thing most people actually work through — courses
         * are bought separately and many users own none — so the hero counts
         * both. A tutorial is worth 0 or 100: there is no partial state for
         * something you either did or did not do.
         */
        const tutorialSlugs = feedAll.map((f: any) => f?.slug);
        const tutorialsDone = countTutorialsDone(tutorialMarks, tutorialSlugs);

        const units = [
          ...tracked.map(x => x.progress),
          ...tutorialSlugs.map((s: string) =>
            s && tutorialMarks[s]?.done ? 100 : 0,
          ),
        ];

        const avg =
          units.length > 0
            ? units.reduce((sum, p) => sum + p, 0) / units.length
            : 0;

        setOverallProgress(exactPercent(avg));
        setCompletedCount(done + tutorialsDone);
        setTotalCount(units.length);
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
    lockedCount,
    refresh,
  };
}

export default useDashboardData;
