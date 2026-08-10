/**
 * VideoPlayerNew — the course video player.
 *
 * Poster first, player on tap: the source is only attached once someone asks
 * for it, so opening a course does not start buffering every lesson.
 *
 * This file also held an older `VideoPlayer` with a hand-built scrubber and
 * its own time formatting. Nothing imported it, and it was the last thing in
 * src/ still reaching for the pre-theme font helpers, so it is gone. Playback
 * controls come from react-native-video's native ones.
 */

import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Video, { OnProgressData } from 'react-native-video';
import { theme } from '../theme';
import { Play } from './ui/icons';
import { pushCleverTapEvent } from '../../App';

export interface VideoPlayerNewProps {
  /** Spelled as the API spells it. */
  videUrl: string;
  thumbnailUrl?: string;
  title: string;
  onProgress: (data: OnProgressData) => void;
  onEnd: () => void;
}

export const VideoPlayerNew: React.FC<VideoPlayerNewProps> = ({
  videUrl,
  thumbnailUrl,
  title,
  onProgress,
  onEnd,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    pushCleverTapEvent('video_viewed', {
      videoType: 'course_video',
      name: title,
    });
  }, [title]);

  return (
    <View style={styles.stage}>
      {isPlaying ? (
        <>
          <Video
            source={{
              uri: videUrl,
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
            controls
            resizeMode="contain"
            paused={false}
            onLoadStart={() => setIsBuffering(true)}
            onLoad={() => setIsBuffering(false)}
            onBuffer={({ isBuffering: b }) => setIsBuffering(b)}
            onProgress={onProgress}
            onEnd={onEnd}
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

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    aspectRatio: 16 / 9,
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
});

export default VideoPlayerNew;
