import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
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
import Video from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, Close, Copy, Play, Share } from '../components/ui/icons';
import {
  AUTO_COMPLETE_AT,
  isDone as readDone,
  setDone as writeDone,
} from '../services/tutorialProgress';
import { getFeedItem } from '../../app/helpers/ApiHelper';
import { pushCleverTapEvent } from '../../App';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';

const ANDROID_APP_URL =
  'https://play.google.com/store/apps/details?id=com.philross';
const IOS_APP_URL = 'https://apps.apple.com/us/app/philross/id6751194230';

const toast = (message: string) => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
    Alert.alert('Copied', message);
  }
};

const plain = (html: unknown): string =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', png: FbIcon },
  { key: 'whatsapp', label: 'WhatsApp', png: WhatsAppIcon },
  { key: 'instagram', label: 'Instagram', png: InstagramIcon },
  { key: 'twitter', label: 'X', png: XIcon },
  { key: 'telegram', label: 'Telegram', png: TelegramIcon },
];

interface PlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  /** Fires once playback passes the auto-complete threshold. */
  onWatched?: () => void;
}

/**
 * Poster until tapped, then the real player. Loading the video only on
 * demand keeps the screen cheap to open on a slow connection.
 */
const FeedVideoPlayer: React.FC<PlayerProps> = ({
  videoUrl,
  thumbnailUrl,
  title,
  onWatched,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  /** Guards onWatched — onProgress fires several times a second. */
  const reportedWatched = useRef(false);

  useEffect(() => {
    pushCleverTapEvent('video_viewed', { videoType: 'feed_video', name: title });
  }, [title]);

  return (
    <View style={styles.stage}>
      {isPlaying ? (
        <>
          <Video
            source={{
              uri: videoUrl,
              bufferConfig: {
                minBufferMs: 15000,
                maxBufferMs: 50000,
                bufferForPlaybackMs: 2500,
                bufferForPlaybackAfterRebufferMs: 5000,
                backBufferDurationMs: 120000,
                cacheSizeMB: 200,
              },
            }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            paused={false}
            controls
            onLoadStart={() => setIsBuffering(true)}
            onLoad={() => setIsBuffering(false)}
            onBuffer={({ isBuffering: b }) => setIsBuffering(b)}
            onProgress={data => {
              const total = data.seekableDuration;
              if (!total || reportedWatched.current) return;
              if ((data.currentTime / total) * 100 >= AUTO_COMPLETE_AT) {
                reportedWatched.current = true;
                onWatched?.();
              }
            }}
            controlsStyles={{
              hideNext: true,
              hidePrevious: true,
              hideForward: true,
            }}
          />
          {isBuffering && (
            <View style={styles.buffer} pointerEvents="none">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </>
      ) : (
        <>
          {!!thumbnailUrl && (
            <Image
              source={{ uri: thumbnailUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setIsPlaying(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Play video"
          >
            <Play size={22} color={theme.color.text.onBrand} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const VideoScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { videoData } = route.params || {};

  const [videoDetails, setVideoDetails] = useState<any>(videoData ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [done, setDoneState] = useState(false);

  const slug: string | undefined = videoDetails?.slug ?? videoData?.slug;

  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => Orientation.lockToPortrait();
  }, []);

  useEffect(() => {
    let alive = true;
    readDone(slug, navigation).then(v => alive && setDoneState(v));
    return () => {
      alive = false;
    };
  }, [slug, navigation]);

  const toggleDone = useCallback(async () => {
    if (!slug) return;
    const next = !done;
    setDoneState(next); // Optimistic: the write is local and cannot fail loudly.
    await writeDone(slug, next, navigation);
  }, [slug, done, navigation]);

  /** Playing to the end marks it without the user having to say so. */
  const markWatched = useCallback(async () => {
    if (!slug || done) return;
    setDoneState(true);
    await writeDone(slug, true, navigation);
  }, [slug, done, navigation]);

  const fetchDetails = useCallback(async () => {
    if (!videoData?.slug) {
      setError('This video could not be opened.');
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);

      const response = await getFeedItem(videoData.slug, navigation);

      if ((response?.status || response?.success) && response?.data) {
        setVideoDetails(response.data);
      } else if (videoData) {
        // The list already carried enough to play; a failed refresh should
        // not blank a screen that could have worked.
        setVideoDetails(videoData);
      } else {
        setError('We could not load this video.');
      }
    } catch (e) {
      if (videoData) {
        setVideoDetails(videoData);
      } else {
        setError('We could not load this video.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [videoData, navigation]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const shareLink = videoDetails?.slug
    ? `https://philrossapp.link/video/${videoDetails.slug}`
    : 'https://philrossapp.link';

  const handleSocialShare = async (platform: string) => {
    const message = `${videoDetails?.headline ?? 'Master Phil'}\n${shareLink}\n\nGet the Master Phil app:\nAndroid: ${ANDROID_APP_URL}\niOS: ${IOS_APP_URL}`;

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

  const related: any[] = Array.isArray(videoDetails?.related_feeds)
    ? videoDetails.related_feeds.slice(0, 4)
    : [];

  const description = plain(videoDetails?.description);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Video"
        onBack={() => navigation.goBack()}
        right={
          videoDetails ? (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowShare(true)}
              hitSlop={theme.hitSlop}
              accessibilityRole="button"
              accessibilityLabel="Share video"
            >
              <Share size={18} color={theme.color.text.primary} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !videoDetails ? (
        <ErrorState
          message={error ?? 'We could not load this video.'}
          onRetry={fetchDetails}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <FeedVideoPlayer
            videoUrl={videoDetails?.video ?? ''}
            thumbnailUrl={videoDetails?.cropped_thumbnail_url}
            title={videoDetails?.headline ?? 'Video'}
            onWatched={markWatched}
          />

          {/* The explicit mark. Tutorials get followed along with — paused,
              rewound, sets repeated — so playing straight through is a poor
              proxy for having done one. Watching to the end still marks it. */}
          <TouchableOpacity
            style={[styles.doneBtn, done && styles.doneBtnOn]}
            onPress={toggleDone}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ checked: done }}
            accessibilityLabel={done ? 'Marked as done' : 'Mark as done'}
          >
            <View style={[styles.doneTick, done && styles.doneTickOn]}>
              {done && <Check size={12} color={theme.color.surface.hero} />}
            </View>
            <Text style={[styles.doneText, done && styles.doneTextOn]}>
              {done ? 'Completed' : 'Mark as done'}
            </Text>
          </TouchableOpacity>

          {/* The audience tags — Athlete, Coach, Homepage, Fitness Enthusiast —
              used to be listed here. They say who a tutorial is aimed at, not
              what it is, so they told the person already watching it nothing.
              They have been retired from the admin too; the field is still on
              the record, just not shown. */}

          <Text style={styles.title}>{videoDetails?.headline || 'Video'}</Text>

          {!!description && <Text style={styles.body}>{description}</Text>}

          {related.length > 0 && (
            <View style={styles.more}>
              <Text style={styles.sectionLabel}>More to watch</Text>
              {related.map((v: any, i: number) => (
                <TouchableOpacity
                  key={v?.slug ?? i}
                  style={styles.moreRow}
                  activeOpacity={0.75}
                  onPress={() => navigation.push('Video', { videoData: v })}
                >
                  <View style={styles.moreThumbWrap}>
                    <Image
                      source={{
                        uri: v?.cropped_thumbnail_url || v?.thumbnail_url,
                      }}
                      style={styles.moreThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.moreBadge}>
                      <Play size={11} color={theme.color.text.onBrand} />
                    </View>
                  </View>
                  <Text style={styles.moreTitle} numberOfLines={2}>
                    {v?.headline || v?.title || 'Video'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

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
              <Text style={styles.sheetTitle}>Share video</Text>
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
    paddingBottom: theme.space['5xl'],
  },

  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buffer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.brand.base,
  },

  /**
   * Dark plate, matching the drawer masthead and the hero card. The action is
   * the one commitment on this screen, so it earns the app's heaviest surface
   * rather than looking like another outlined row.
   */
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.md,
    minHeight: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.hero,
    marginTop: theme.space.lg,
  },
  doneBtnOn: { backgroundColor: theme.color.surface.heroRaised },
  /** Empty ring → filled tick. The shape carries the state, not the hue. */
  doneTick: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTickOn: {
    borderColor: theme.color.status.successOnDark,
    backgroundColor: theme.color.status.successOnDark,
  },
  doneText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.inverse,
  },
  doneTextOn: { color: theme.color.status.successOnDark },


  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    marginTop: theme.space.md,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    marginTop: theme.space.md,
  },

  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },
  more: { marginTop: theme.space['3xl'], gap: theme.space.md },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 14,
    padding: theme.space.sm,
  },
  moreThumbWrap: {
    width: 96,
    height: 62,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.color.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreThumb: { ...StyleSheet.absoluteFillObject },
  moreBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(182,32,32,0.92)',
  },
  moreTitle: {
    flex: 1,
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 19,
    color: theme.color.text.primary,
    paddingRight: theme.space.sm,
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

export default VideoScreen;
