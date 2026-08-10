/**
 * Tutorial progress — server-first, with the device as a cache.
 *
 * THE RULE
 * The account owns your progress, not the phone. Delete the app, reinstall it,
 * sign in on a second device: what you have completed comes back, because it
 * came from the server. The local copy exists so the list can paint instantly
 * and so marking something done still works on a train with no signal.
 *
 * ⚠️ THE SERVER DOES NOT SERVE THESE ENDPOINTS YET.
 * Verified against the live OpenAPI schema (Aug 2026) — the API is 30 paths
 * and none of them read or write tutorial progress. Until they exist, every
 * call falls back to the cache and progress is device-only, which is exactly
 * the limitation this module is shaped to remove.
 *
 * The two endpoints needed, and nothing else:
 *   GET  /feed/progress/           → [{ slug, is_completed, completed_at }]
 *   POST /feed/{slug}/completed/   ← { is_completed: boolean }
 *
 * See BACKEND-REQUIREMENTS.md for the Django implementation. No app change is
 * needed when they land — this file already calls them.
 *
 * HOW SYNC RESOLVES
 * The server wins on read. Anything marked while offline is queued in
 * `pending` and pushed on the next successful read, so a mark made on a train
 * is not lost and does not silently lose to a stale server copy either.
 */

import EncryptedStorage from 'react-native-encrypted-storage';
import { getFeedProgress, setFeedCompleted } from '../../app/helpers/ApiHelper';

const KEY = 'tutorial_progress_v1';
const PENDING_KEY = 'tutorial_progress_pending_v1';

export interface TutorialMark {
  /** True once the user marked it, or watched effectively all of it. */
  done: boolean;
  /** ms epoch, so a future "recently completed" list can sort by it. */
  at: number;
}

export type TutorialProgressMap = Record<string, TutorialMark>;

/** Watched this far counts as done without the user having to say so. */
export const AUTO_COMPLETE_AT = 92;

async function readCache(): Promise<TutorialProgressMap> {
  try {
    const raw = await EncryptedStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TutorialProgressMap) : {};
  } catch (e) {
    // A corrupt blob should read as "nothing done", never crash a screen.
    return {};
  }
}

async function writeCache(map: TutorialProgressMap): Promise<void> {
  try {
    await EncryptedStorage.setItem(KEY, JSON.stringify(map));
  } catch (e) {
    // Best effort. Losing a cached mark is a nuisance; crashing is worse.
  }
}

/** slug → intended state, for marks made while the server was unreachable. */
async function readPending(): Promise<Record<string, boolean>> {
  try {
    const raw = await EncryptedStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

async function writePending(queue: Record<string, boolean>): Promise<void> {
  try {
    await EncryptedStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch (e) {
    // Ignore.
  }
}

/**
 * Pushes anything queued offline, then drops what the server accepted.
 * Runs on read, so it needs no scheduler of its own.
 */
async function flushPending(navigation: any): Promise<void> {
  const queue = await readPending();
  const slugs = Object.keys(queue);
  if (slugs.length === 0) return;

  const remaining: Record<string, boolean> = {};

  for (const slug of slugs) {
    const res: any = await setFeedCompleted(slug, queue[slug], navigation);
    const accepted = res?.success !== false && res?.status !== false;
    if (!accepted) remaining[slug] = queue[slug];
  }

  await writePending(remaining);
}

/**
 * Server first; cache on failure.
 *
 * `navigation` is optional so screens that only need the cached view — a list
 * painting on mount — can skip the network entirely.
 */
export async function loadAll(navigation?: any): Promise<TutorialProgressMap> {
  const cached = await readCache();
  if (!navigation) return cached;

  try {
    await flushPending(navigation);

    const res: any = await getFeedProgress(navigation);
    const rows = res?.data ?? res?.results ?? null;

    if (!Array.isArray(rows)) return cached;

    const fromServer: TutorialProgressMap = {};
    for (const row of rows) {
      const slug = row?.slug;
      if (!slug || !row?.is_completed) continue;
      fromServer[slug] = {
        done: true,
        at: row?.completed_at ? new Date(row.completed_at).getTime() : Date.now(),
      };
    }

    await writeCache(fromServer);
    return fromServer;
  } catch (e) {
    return cached;
  }
}

export async function isDone(
  slug?: string | null,
  navigation?: any,
): Promise<boolean> {
  if (!slug) return false;
  const all = await loadAll(navigation);
  return !!all[slug]?.done;
}

/**
 * Records a mark and returns the updated map, so callers can set state from
 * the result instead of re-reading storage.
 *
 * The cache is written first and the screen updates from it immediately —
 * waiting on a round trip to tick a checkbox feels broken. The server call
 * follows; if it fails the slug is queued and retried on the next read.
 */
export async function setDone(
  slug: string | null | undefined,
  done: boolean,
  navigation?: any,
): Promise<TutorialProgressMap> {
  const all = await readCache();
  if (!slug) return all;

  if (done) {
    all[slug] = { done: true, at: Date.now() };
  } else {
    delete all[slug];
  }
  await writeCache(all);

  if (navigation) {
    const res: any = await setFeedCompleted(slug, done, navigation);
    const accepted = res?.success !== false && res?.status !== false;
    if (!accepted) {
      const queue = await readPending();
      queue[slug] = done;
      await writePending(queue);
    }
  }

  return all;
}

/** How many of the given slugs are marked done. */
export function countDone(
  map: TutorialProgressMap,
  slugs: (string | undefined | null)[],
): number {
  return slugs.filter(s => !!s && !!map[s]?.done).length;
}
