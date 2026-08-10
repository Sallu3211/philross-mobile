/**
 * Course video shape.
 *
 * This module was imported by VideoPlayer but had never been committed, so
 * every file that touched the player failed to typecheck. The fields are the
 * ones the player actually reads; the API sends more, and callers pass whole
 * API objects through, so the extra keys are tolerated rather than enumerated.
 */
import type { OnProgressData } from 'react-native-video';

export interface CourseVideo {
  id?: string | number;
  title: string;
  description?: string;
  /** Spelled as the API spells it. Renaming it would break the player props. */
  videUrl?: string;
  video?: string;
  video_url?: string;
  thumbnailUrl?: string;
  /** Seconds. Required — the player seeds its scrubber from it on mount. */
  duration: number;
  onProgress?: (data: OnProgressData) => void;
  onEnd?: () => void;
  [key: string]: any;
}

export interface CourseModule {
  id?: string | number;
  title?: string;
  description?: string;
  videos?: CourseVideo[];
  [key: string]: any;
}

export default CourseVideo;
