/**
 * Tutorial progress — the one place that records whether a feed tutorial is done.
 *
 * WHY THIS EXISTS
 * Course videos record progress automatically from playback percentage. Feed
 * tutorials recorded nothing at all, so the dashboard's rings had no tutorial
 * data to count, and there was no way for anyone to say "I did that one".
 *
 * Auto-detection is not enough on its own here: a tutorial is something you
 * follow along with, and people pause, rewind and repeat sets rather than
 * playing straight through. So this stores an explicit mark, set by the user,
 * and treats a near-complete playthrough as a mark too.
 *
 * WHERE IT LIVES
 * EncryptedStorage on the device, keyed by tutorial slug.
 *
 * ⚠️ DEVICE-ONLY, FOR NOW. The API has no endpoint for tutorial progress —
 * neither read nor write. Reinstalling the app or signing in on a second
 * device starts from zero. Making this survive needs two things from the
 * backend, and nothing app-side can substitute:
 *
 *   GET  feed/progress/            → [{ slug, is_completed, completed_at }]
 *   POST feed/{slug}/completed/    → { is_completed: bool }
 *
 * When those exist, call them from `setDone` and `loadAll` below; the rest of
 * the app talks to this module and will not need to change.
 */

import EncryptedStorage from 'react-native-encrypted-storage';

const KEY = 'tutorial_progress_v1';

export interface TutorialMark {
  /** True once the user marked it, or watched effectively all of it. */
  done: boolean;
  /** ms epoch, so a future "recently completed" list can sort by it. */
  at: number;
}

export type TutorialProgressMap = Record<string, TutorialMark>;

/** Watched this far counts as done without the user having to say so. */
export const AUTO_COMPLETE_AT = 92;

export async function loadAll(): Promise<TutorialProgressMap> {
  try {
    const raw = await EncryptedStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as TutorialProgressMap) : {};
  } catch (e) {
    // A corrupt blob should read as "nothing done", never crash a screen.
    return {};
  }
}

export async function isDone(slug?: string | null): Promise<boolean> {
  if (!slug) return false;
  const all = await loadAll();
  return !!all[slug]?.done;
}

/**
 * Records a mark and returns the updated map, so callers can set state from
 * the result instead of re-reading storage.
 */
export async function setDone(
  slug: string | null | undefined,
  done: boolean,
): Promise<TutorialProgressMap> {
  const all = await loadAll();
  if (!slug) return all;

  if (done) {
    all[slug] = { done: true, at: Date.now() };
  } else {
    delete all[slug];
  }

  try {
    await EncryptedStorage.setItem(KEY, JSON.stringify(all));
  } catch (e) {
    // Best effort. Losing a mark is a nuisance; crashing the player is worse.
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
