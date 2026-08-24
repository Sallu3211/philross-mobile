import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Clipboard,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share as RNShare,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import EncryptedStorage from 'react-native-encrypted-storage';
import Orientation from 'react-native-orientation-locker';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '../components/ui/StateView';
import LinearMeter from '../components/ui/LinearMeter';
import { Check, Close, Copy, Play, Share, User } from '../components/ui/icons';
import { VideoPlayerNew } from '../components/VideoPlayer';
import { getCourseDetail, updateVideoProgress } from '../../app/helpers/ApiHelper';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';

const ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=com.philross';
const IOS_APP_URL = 'https://apps.apple.com/us/app/philross/id6751194230';

/** A video counts as watched at 90% — credits and outros are not content. */
const COMPLETE_AT = 90;

const toast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Copied', message);
  }
};

const plain = (value: unknown): string => {
  const text = Array.isArray(value) ? value.join(' ') : String(value ?? '');
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', png: FbIcon },
  { key: 'whatsapp', label: 'WhatsApp', png: WhatsAppIcon },
  { key: 'instagram', label: 'Instagram', png: InstagramIcon },
  { key: 'twitter', label: 'X', png: XIcon },
  { key: 'telegram', label: 'Telegram', png: TelegramIcon },
];

const CourseDetailsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { courseId, courseSlug } = route.params || {};

  const [courseData, setCourseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  /** video id → watched percentage, so each row can show its own state. */
  const [videoProgress, setVideoProgress] = useState<Record<string, number>>({});

  const [showShare, setShowShare] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  // The player goes landscape; the rest of the app does not.
  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => Orientation.lockToPortrait();
  }, []);

  const readEnrollment = useCallback(async (id: string): Promise<boolean> => {
    try {
      const data = await EncryptedStorage.getItem(`enrolled_${id}`);
      return data ? !!JSON.parse(data).isEnrolled : false;
    } catch (e) {
      return false;
    }
  }, []);

  const writeEnrollment = useCallback(async (id: string) => {
    try {
      await EncryptedStorage.setItem(
        `enrolled_${id}`,
        JSON.stringify({ isEnrolled: true, timestamp: Date.now() }),
      );
    } catch (e) {
      // Local cache only; the API remains the source of truth.
    }
  }, []);

  /**
   * Progress lives in local storage, keyed per video. The backend has no
   * progress GET, so this is the only record of what has been watched.
   */
  const loadProgress = useCallback(
    async (course: any) => {
      const videos: any[] = course?.course_videos ?? [];
      if (!courseId || videos.length === 0) return;

      const map: Record<string, number> = {};
      let watchedSum = 0;
      let completed = 0;

      for (const video of videos) {
        try {
          const stored = await EncryptedStorage.getItem(
            `video_progress_${courseId}_${video.id}`,
          );
          if (!stored) continue;
          const parsed = JSON.parse(stored);
          const pct = Number(parsed.watch_percentage) || 0;
          map[String(video.id)] = pct;
          watchedSum += pct;
          if (parsed.is_completed || pct >= COMPLETE_AT) completed++;
        } catch (e) {
          // A single unreadable key should not sink the whole calculation.
        }
      }

      setVideoProgress(map);
      setCourseProgress(
        Math.max(watchedSum / videos.length, (completed / videos.length) * 100),
      );
    },
    [courseId],
  );

  const resolveEnrollment = useCallback(
    async (course: any) => {
      if (!course) return;

      const locallyEnrolled = await readEnrollment(course.id);
      const hasServerFlag = !!course.is_enrolled;
      const isFree = !course.is_paid_course && !course.is_locked;
      const hasWatched = (course.course_videos ?? []).some(
        (v: any) => v.watch_percentage || v.is_completed,
      );

      const enrolled = locallyEnrolled || hasServerFlag || isFree || hasWatched;
      setIsEnrolled(enrolled);

      if (enrolled) {
        if (!locallyEnrolled) await writeEnrollment(course.id);
        await loadProgress(course);
      }
    },
    [readEnrollment, writeEnrollment, loadProgress],
  );

  const fetchCourseDetails = useCallback(async () => {
    if (!courseId || !courseSlug) {
      setError('This course could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await getCourseDetail(courseId, courseSlug, navigation);

      const data =
        response?.data ??
        (response && typeof response === 'object' ? response : null);

      if (!data) {
        setError('We could not load this course.');
        return;
      }

      setCourseData(data);
      await resolveEnrollment(data);
    } catch (e) {
      setError('We could not load this course.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, courseSlug, navigation, resolveEnrollment]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  // Coming back from the player should show the progress it just recorded.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (courseData) loadProgress(courseData);
    });
    return unsubscribe;
  }, [navigation, courseData, loadProgress]);

  const openLink = async (url?: string) => {
    if (!url) {
      Alert.alert('Unavailable', 'Enrollment for this course is not open yet.');
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Unavailable', 'We could not open the enrolment link.');
    }
  };

  const videoUrlOf = (video: any): string =>
    video?.video || video?.video_url || video?.url || video?.video_link || '';

  const handlePlayVideo = (video: any) => {
    if (!videoUrlOf(video)) {
      Alert.alert('Unavailable', 'This video is not ready to play yet.');
      return;
    }
    setSelectedVideo(video);
  };

  /** One writer for both the periodic update and the end-of-video call. */
  const recordProgress = useCallback(
    async (video: any, percent: number, completed: boolean) => {
      const payload = {
        video_id: video.id,
        course_id: courseId,
        watch_percentage: Math.round(percent),
        is_completed: completed,
      };
      try {
        await EncryptedStorage.setItem(
          `video_progress_${courseId}_${video.id}`,
          JSON.stringify({ ...payload, timestamp: Date.now() }),
        );
        setVideoProgress(prev => ({
          ...prev,
          [String(video.id)]: Math.round(percent),
        }));
        await updateVideoProgress(payload, navigation);
      } catch (e) {
        // Progress is best-effort; never interrupt playback for it.
      }
    },
    [courseId, navigation],
  );

  const shareLink = courseData?.slug
    ? `https://philrossapp.link/course/${courseData.slug}`
    : 'https://philrossapp.link';

  const handleSocialShare = async (platform: string) => {
    const message = `${courseData?.title ?? 'Master Phil'}\n${shareLink}\n\nGet the Master Phil app:\nAndroid: ${ANDROID_APP_URL}\niOS: ${IOS_APP_URL}`;

    if (platform === 'instagram') {
      Clipboard.setString(message);
      toast('Link copied — paste it into Instagram');
      return;
    }

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(message)}`,
    };

    const url = urls[platform];
    if (!url) return;

    try {
      await Linking.openURL(url);
    } catch (e) {
      await RNShare.share({ message });
    }
  };

  const videos: any[] = Array.isArray(courseData?.course_videos)
    ? courseData.course_videos
    : [];
  const description = plain(courseData?.description);
  const instructor = courseData?.instructor;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Course"
        onBack={() => navigation.goBack()}
        right={
          courseData ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowShare(true)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Share course"
            >
              <Share size={18} color={theme.color.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !courseData ? (
        <ErrorState
          message={error ?? 'We could not load this course.'}
          onRetry={fetchCourseDetails}
        />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {!!(courseData?.cropped_thumbnail_url || courseData?.videoThumbnail) && (
              <Image
                source={{
                  uri:
                    courseData.cropped_thumbnail_url || courseData.videoThumbnail,
                }}
                style={styles.hero}
                resizeMode="cover"
              />
            )}

            <Text style={styles.title}>{courseData?.title || 'Course'}</Text>

            {isEnrolled && courseProgress > 0 && (
              <View style={styles.progressCard}>
                <Text style={styles.progressLabel}>Your progress</Text>
                <LinearMeter progress={courseProgress} showValue height={7} />
              </View>
            )}

            {!!description && <Text style={styles.body}>{description}</Text>}

            {/* Only shown when the API actually names an instructor. The old
                screen fell back to a stock photo of a stranger. */}
            {!!(instructor?.full_name || instructor?.profile_pic) && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Instructor</Text>
                <View style={styles.instructor}>
                  {instructor?.profile_pic ? (
                    <Image
                      source={{ uri: instructor.profile_pic }}
                      style={styles.instructorAvatar}
                    />
                  ) : (
                    <View
                      style={[styles.instructorAvatar, styles.instructorFallback]}
                    >
                      <User size={20} color={theme.color.text.inverse} />
                    </View>
                  )}
                  <Text style={styles.instructorName} numberOfLines={1}>
                    {instructor?.full_name || 'Master Phil Ross'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Curriculum{videos.length > 0 ? ` · ${videos.length} videos` : ''}
              </Text>

              {videos.length === 0 ? (
                <View style={styles.emptyCurriculum}>
                  <Text style={styles.emptyText}>
                    The curriculum for this course is not published yet.
                  </Text>
                </View>
              ) : (
                <View style={styles.curriculum}>
                  {videos.map((video: any, i: number) => {
                    const pct = videoProgress[String(video.id)] ?? 0;
                    const done = pct >= COMPLETE_AT;
                    return (
                      <TouchableOpacity
                        key={video.id ?? i}
                        style={styles.lesson}
                        onPress={() => handlePlayVideo(video)}
                        activeOpacity={0.75}
                        accessibilityRole="button"
                        accessibilityLabel={`Play ${video.title}`}
                      >
                        <View style={[styles.seq, done && styles.seqDone]}>
                          {done ? (
                            <Check size={13} color={theme.color.text.inverse} />
                          ) : (
                            <Text style={styles.seqText} allowFontScaling={false}>
                              {video.sequence ?? i + 1}
                            </Text>
                          )}
                        </View>

                        <View style={styles.lessonText}>
                          <Text style={styles.lessonTitle} numberOfLines={2}>
                            {video.title || `Video ${i + 1}`}
                          </Text>
                          {pct > 0 && !done && (
                            <LinearMeter
                              progress={pct}
                              height={4}
                              style={styles.lessonMeter}
                            />
                          )}
                          {done && <Text style={styles.lessonDone}>Completed</Text>}
                        </View>

                        <View style={styles.playBtn}>
                          <Play size={14} color={theme.color.text.onBrand} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          <View
            style={[
              styles.bar,
              { paddingBottom: Math.max(insets.bottom, theme.space.lg) },
            ]}
          >
            <TouchableOpacity
              style={styles.cta}
              onPress={() => openLink(courseData?.destination_link)}
              activeOpacity={0.9}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>
                {isEnrolled ? 'Go to course' : 'Enroll now'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Player — full screen, black, and free to rotate. */}
      <Modal
        visible={!!selectedVideo}
        animationType="fade"
        onRequestClose={() => setSelectedVideo(null)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.player}>
          <SafeAreaView edges={['top']} style={styles.playerHead}>
            <Text style={styles.playerTitle} numberOfLines={1}>
              {selectedVideo?.title ?? ''}
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedVideo(null)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Close player"
            >
              <Close size={19} color={theme.color.text.inverse} />
            </TouchableOpacity>
          </SafeAreaView>

          {!!selectedVideo && (
            <VideoPlayerNew
              videUrl={videoUrlOf(selectedVideo)}
              thumbnailUrl={selectedVideo?.cropped_thumbnail_url}
              title={`${courseData?.title ?? ''} — ${selectedVideo?.title ?? ''}`}
              onProgress={data => {
                const total = data.seekableDuration;
                if (!total) return;
                const pct = (data.currentTime / total) * 100;
                const done = pct >= COMPLETE_AT;
                // Write on each 5% step, or once complete — not every frame.
                if (Math.floor(pct) % 5 === 0 || done) {
                  recordProgress(selectedVideo, pct, done);
                }
              }}
              onEnd={async () => {
                await recordProgress(selectedVideo, 100, true);
                await loadProgress(courseData);
              }}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setShowShare(false)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, theme.space.xl) },
            ]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.grabber} />

            <View style={styles.sheetHead}>
              <Text style={styles.sheetTitle}>Share course</Text>
              <TouchableOpacity
                onPress={() => setShowShare(false)}
                hitSlop={theme.hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Close size={17} color={theme.color.text.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.linkRow}>
              <Text style={styles.linkText} numberOfLines={1}>
                {shareLink}
              </Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => {
                  Clipboard.setString(shareLink);
                  toast('Link copied');
                }}
                accessibilityRole="button"
                accessibilityLabel="Copy link"
              >
                <Copy size={16} color={theme.color.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.socialRow}>
              {SOCIALS.map(s => (
                <TouchableOpacity
                  key={s.key}
                  style={styles.social}
                  onPress={() => handleSocialShare(s.key)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Share on ${s.label}`}
                >
                  <View style={styles.socialDisc}>
                    <Image
                      source={s.png}
                      style={styles.socialImg}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={styles.socialLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['4xl'],
  },

  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: theme.color.neutral[200],
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    marginTop: theme.space.lg,
  },

  progressCard: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 14,
    padding: theme.space.lg,
    marginTop: theme.space.lg,
    gap: theme.space.sm,
  },
  progressLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },

  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    marginTop: theme.space.lg,
  },

  section: { marginTop: theme.space['2xl'] },
  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    marginBottom: theme.space.md,
  },

  instructor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.lg,
  },
  instructorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.color.neutral[200],
  },
  instructorFallback: {
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructorName: {
    flex: 1,
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },

  curriculum: { gap: theme.space.sm },
  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 14,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  /** Number becomes a green tick once watched — shape changes, not just hue. */
  seq: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.sunken,
  },
  seqDone: { backgroundColor: theme.color.status.success },
  seqText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
    includeFontPadding: false,
  },
  lessonText: { flex: 1, minWidth: 0, gap: 4 },
  lessonTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 19,
    color: theme.color.text.primary,
  },
  lessonMeter: { marginTop: 2 },
  lessonDone: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.status.success,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.brand.base,
  },

  emptyCurriculum: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 14,
    padding: theme.space.xl,
  },
  emptyText: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.muted,
    textAlign: 'center',
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
    minHeight: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
  },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },

  player: { flex: 1, backgroundColor: '#000000' },
  playerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
  },
  playerTitle: {
    flex: 1,
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverse,
  },

  overlay: {
    flex: 1,
    backgroundColor: theme.color.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.color.surface.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: theme.space.xl,
    paddingTop: theme.space.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.color.border.default,
    marginBottom: theme.space.lg,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h2.fontSize,
    color: theme.color.text.primary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.surface.sunken,
    borderRadius: theme.radius.md,
    paddingLeft: theme.space.lg,
    paddingRight: theme.space.xs,
    paddingVertical: theme.space.xs,
    marginTop: theme.space.lg,
  },
  linkText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.card,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.space.xl,
  },
  social: { alignItems: 'center', gap: theme.space.xs, width: 58 },
  /** No plate behind the mark — each brand logo is already a finished
      circular shape, and a grey disc under it drew a competing outline. */
  socialDisc: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialImg: { width: 40, height: 40 },
  socialLabel: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
});

export default CourseDetailsScreen;
