import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import { CourseVideo } from '../types/course';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import Video, { OnProgressData } from "react-native-video";
import PlayIcon from '../../assets/icons/solar_play-bold.svg';
import { pushCleverTapEvent } from '../../App';

const { width, height } = Dimensions.get('window');

interface VideoPlayerProps {
  video: CourseVideo;
  onProgressUpdate: (progress: number) => void;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, onProgressUpdate, onClose }) => {
  const colors = getColors();
  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Simulate video progress for demo purposes
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          const newProgress = (newTime / duration) * 100;
          setProgress(newProgress);
          
          // Update progress every 10 seconds
          if (Math.floor(newTime) % 10 === 0) {
            onProgressUpdate(newProgress);
          }
          
          if (newTime >= duration) {
            setIsPlaying(false);
            onProgressUpdate(100);
            return duration;
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, duration, onProgressUpdate]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const seekTo = (percentage: number) => {
    const newTime = (percentage / 100) * duration;
    setCurrentTime(newTime);
    setProgress(percentage);
    onProgressUpdate(percentage);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressBarPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const percentage = (locationX / width) * 100;
    seekTo(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Video Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Icon name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.videoTitle, { fontFamily: getFontFamily('bold') }]}>
          {video.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Video Player Placeholder */}
      <View style={styles.videoContainer}>
        <View style={styles.videoPlaceholder}>
          <Icon name="play-circle" size={80} color="#FFFFFF" />
          <Text style={[styles.placeholderText, { fontFamily: getFontFamily('body') }]}>
            Video Player
          </Text>
          <Text style={[styles.placeholderSubtext, { fontFamily: getFontFamily('body') }]}>
            {video.description || 'No description available'}
          </Text>
        </View>
      </View>

      {/* Video Controls */}
      <View style={styles.controls}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <TouchableOpacity
            style={styles.progressBar}
            onPress={handleProgressBarPress}
            activeOpacity={0.8}
          >
            <View style={styles.progressBackground}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { fontFamily: getFontFamily('body') }]}>
              {formatTime(currentTime)}
            </Text>
            <Text style={[styles.timeText, { fontFamily: getFontFamily('body') }]}>
              {formatTime(duration)}
            </Text>
          </View>
        </View>

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="play-skip-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
            <Icon 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="play-skip-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="volume-high" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="settings" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Icon name="expand" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Video Info */}
      <View style={styles.videoInfo}>
        <Text style={[styles.infoTitle, { fontFamily: getFontFamily('bold') }]}>
          {video.title}
        </Text>
        <Text style={[styles.infoDescription, { fontFamily: getFontFamily('body') }]}>
          {video.description || 'No description available'}
        </Text>
        
        {/* Progress Status */}
        <View style={styles.progressStatus}>
          <View style={styles.progressItem}>
            <Icon name="eye-outline" size={16} color="#B62020" />
            <Text style={[styles.progressText, { fontFamily: getFontFamily('body') }]}>
              {Math.round(progress)}% watched
            </Text>
          </View>
          
          <View style={styles.progressItem}>
            <Icon name="time-outline" size={16} color="#B62020" />
            <Text style={[styles.progressText, { fontFamily: getFontFamily('body') }]}>
              {formatTime(duration)} total
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

type VideoType = {
  videUrl: string;
  thumbnailUrl?: string;
  onProgress: (data: OnProgressData) => void;
  onEnd: () => void,
  title: string,
};

export const VideoPlayerNew = (video: VideoType) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    pushCleverTapEvent('video_viewed', { videoType: 'course_video', name: video.title });
  }, [])

  return (
    <View style={styles.videoContainerNew}>
      {isPlaying ? (<>
        <Video
          source={{
            uri: video.videUrl,
            bufferConfig: {
              minBufferMs: 15000,
              maxBufferMs: 50000,
              bufferForPlaybackMs: 2500,
              bufferForPlaybackAfterRebufferMs: 5000,
              backBufferDurationMs: 120000,
              cacheSizeMB: 200,
            }
          }}
          style={styles.video}
          controls
          resizeMode="contain"
          paused={false}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          onBuffer={({ isBuffering }) => setIsLoading(isBuffering)}
          onProgress={video.onProgress}
          onEnd={video.onEnd}
          controlsStyles={{ hideNext: true, hidePrevious: true, hideForward: true}}
        />
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
      </>
      ) : (
        <>
          {video.thumbnailUrl && <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.thumbnail} />}
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => setIsPlaying(true)}>
            <PlayIcon width={40} height={40} fill="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  closeButton: {
    padding: 8,
  },

  videoTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },

  placeholder: {
    width: 40,
  },

  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  videoPlaceholder: {
    alignItems: 'center',
    gap: 16,
  },

  placeholderText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: getFontFamily('bold'),
  },

  placeholderSubtext: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    maxWidth: 300,
  },

  controls: {
    padding: 20,
    gap: 20,
  },

  progressContainer: {
    gap: 12,
  },

  progressBar: {
    width: '100%',
  },

  progressBackground: {
    height: 4,
    backgroundColor: '#444444',
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#B62020',
    borderRadius: 2,
  },

  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  timeText: {
    fontSize: 14,
    color: '#CCCCCC',
  },

  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
  },

  controlButton: {
    padding: 12,
  },

  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#B62020',
    justifyContent: 'center',
    alignItems: 'center',
  },

  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  videoInfo: {
    padding: 20,
    backgroundColor: '#111111',
    gap: 16,
  },

  infoTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: getFontFamily('bold'),
  },

  infoDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },

  progressStatus: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },

  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  progressText: {
    fontSize: 14,
    color: '#CCCCCC',
  },

  videoContainerNew: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "black",
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 16 / 9,
    resizeMode: "cover",
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  playBtn: {
    position: "absolute",
    top: "40%",
    left: "40%",
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 1,
  },
});

export default VideoPlayer;
