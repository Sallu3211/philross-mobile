/**
 * useDashboardData — aggregates everything the dashboard renders.
 *
 * ⚠️ PROGRESS DATA IS CURRENTLY LOCAL-ONLY
 * The backend exposes no GET endpoint for progress: `getVideoProgress` and
 * `getCourseProgress` in ApiHelper are stubs that return a hardcoded 0, and the
 * only write path is POST `course/{video_id}/video_watched/` — which currently
 * sends an empty body (its payload fields are commented out).
 *
 * So this hook reads the same EncryptedStorage keys the course screens already
 * write (`course_progress_{id}`). That makes the rings real rather than fake,
 * but it means progress does NOT survive a reinstall and does NOT sync across
 * devices. Once the API grows a real progress endpoint, replace
 * `readLocalCourseProgress` with that call — nothing else here needs to change.
 */

import { useCallback, useEffect, useState } from 'react';
import EncryptedStorage from 'react-native-encrypted-storage';
import Purchases from 'react-native-purchases';
import { getCourseList, getFeedList } from '../../app/helpers/ApiHelper';
import type { ContinueItem } from '../components/dashboard/ContinueCard';

/** Length of the introductory free period, in days. */
export const FREE_TRIAL_DAYS = 7;

export type PlanState = 'trial' | 'trial-expired' | 'subscribed' | 'free';

export interface DashboardData {
  loading: boolean;
  refreshing: boolean;
  error: string | null;

  /** 0–100 across every enrolled course. */
  overallProgress: number;
  completedCount: number;
  totalCount: number;

  /** Courses with progress > 0 and < 100, most advanced first. */
  continueItems: ContinueItem[];
  /** Newest feed tutorials, for the "Fresh from Phil" rail. */
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
      const isTrial = entitlement?.periodType === 'TRIAL';

      if (isTrial && entitlement?.expirationDate) {
        const msLeft = new Date(entitlement.expirationDate).getTime() - Date.now();
        const daysLeft = Math.max(Math.ceil(msLeft / 86_400_000), 0);
        return { state: 'trial', daysLeft };
      }
      return { state: 'subscribed', daysLeft: 0 };
    }

    // No active entitlement. Did they ever have one? If so the trial lapsed.
    const everSubscribed =
      Object.keys(info?.entitlements?.all ?? {}).length > 0 ||
      (info?.allPurchaseDates && Object.keys(info.allPurchaseDates).length > 0);

    return {
      state: everSubscribed ? 'trial-expired' : 'free',
      daysLeft: 0,
    };
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
        const [courseRes, feedRes, plan] = await Promise.all([
          getCourseList(navigation, { limit: 20 }).catch(() => null),
          getFeedList(navigation, { limit: 10 }).catch(() => null),
          readPlanState(),
        ]);

        setPlanState(plan.state);
        setTrialDaysLeft(plan.daysLeft);

        /* ── Courses → progress rings ─────────────────────────────────────── */
        const courses = toArray(courseRes?.data ?? courseRes);

        const withProgress = await Promise.all(
          courses.map(async (c: any) => {
            // Prefer a server-provided figure if the endpoint ever starts
            // returning one; fall back to what we stored locally.
            const apiPct = toPercent(c?.completion ?? c?.progress);
            const localPct = await readLocalCourseProgress(c?.id ?? c?.slug);
            return { course: c, progress: Math.max(apiPct, localPct) };
          }),
        );

        const enrolled = withProgress.filter(
          x => x.course?.is_enrolled || x.progress > 0,
        );

        const done = enrolled.filter(x => x.progress >= 100).length;
        const inFlight = enrolled.filter(x => x.progress > 0 && x.progress < 100);

        const avg =
          enrolled.length > 0
            ? enrolled.reduce((sum, x) => sum + x.progress, 0) / enrolled.length
            : 0;

        setOverallProgress(Math.round(avg));
        setCompletedCount(done);
        setTotalCount(enrolled.length);
        setCoursesInProgress(inFlight.length);

        setContinueItems(
          inFlight
            .sort((a, b) => b.progress - a.progress)
            .slice(0, 8)
            .map(x => ({
              id: x.course?.id ?? x.course?.slug,
              title: x.course?.title ?? x.course?.name ?? 'Untitled course',
              meta: x.course?.category?.name
                ? `Course · ${x.course.category.name}`
                : 'Course',
              progress: x.progress,
              imageUrl:
                x.course?.thumbnail ?? x.course?.image ?? x.course?.cover_image ?? null,
              locked: false,
            })),
        );

        /* ── Feed → newest tutorials rail ─────────────────────────────────── */
        const feed = toArray(feedRes?.data ?? feedRes);
        setLockedCount(feed.filter((f: any) => f?.locked).length);

        setFeedItems(
          feed.slice(0, 8).map((f: any) => ({
            id: f?.id,
            title: f?.title ?? f?.name ?? 'Untitled',
            meta: f?.workout_type?.name ?? f?.category?.name ?? 'Tutorial',
            progress: 0,
            imageUrl: f?.thumbnail ?? f?.image ?? f?.cover_image ?? null,
            locked: !!f?.locked,
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
