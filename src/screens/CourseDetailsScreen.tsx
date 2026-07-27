import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
  Alert,
  Linking,
  Clipboard,
  ToastAndroid,
  Share,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import ShareIcon from '../../assets/icons/Icon.svg';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';
import Utils from '../../app/helpers/Utilities';
import share from '../../assets/icons/share.png';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DocumentCopyIcon from '../../assets/icons/document-copy.svg';
import RedPlayIcon from '../../assets/icons/solar_play-bold-1.svg';
import { getCourseDetail, enrollInCourse, updateVideoProgress, } from '../../app/helpers/ApiHelper';
import EncryptedStorage from 'react-native-encrypted-storage';
import Orientation from 'react-native-orientation-locker';
import { VideoPlayerNew } from '../components/VideoPlayer';

const { width, height } = Dimensions.get('window');

interface CourseModule {
  id: string;
  title: string;
  duration: string;
  completed?: boolean;
}

const CourseDetailsScreen = ({ route, navigation }: any) => {
  const colors = getColors();
  
  // Get course ID and slug from route params
  const { courseId, courseSlug } = route.params || {};
  
  // Course API state
  const [courseData, setCourseData] = useState<any>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  
  // Share modal state
  const [showShare, setShowShare] = useState(false);
  
  // Video player state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [courseProgress, setCourseProgress] = useState(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  
  // Enrollment state
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    Orientation.unlockAllOrientations();
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  // Fetch course details when component mounts
  useEffect(() => {
    if (courseId && courseSlug) {
      fetchCourseDetails();
    } else {
      setError('No course ID or slug provided');
    }
  }, [courseId, courseSlug]);

  // Load progress when course data is available
  useEffect(() => {
    if (courseData && isEnrolled) {
      console.log('🔄 Course data loaded, fetching progress...');
      fetchCourseProgress();
    }
  }, [courseData?.id, isEnrolled,]); // Fixed: use courseData.id and include fetchCourseProgress

  // Check for existing progress when component mounts
  useEffect(() => {
    const checkExistingProgress = async () => {
      if (courseId && !isLoadingCourse) {
        console.log('🔄 Checking for existing progress...');
        try {
          const courseProgressKey = `course_progress_${courseId}`;
          const storedProgress = await EncryptedStorage.getItem(courseProgressKey);
          
          if (storedProgress) {
            const progressData = JSON.parse(storedProgress);
            console.log('📊 Found existing progress:', progressData);
            setCourseProgress(progressData.progress || 0);
          }
        } catch (error) {
          console.log('❌ Error checking existing progress:', error);
        }
      }
    };
    
    checkExistingProgress();
  }, [courseId, isLoadingCourse]);



  // Add focus listener to check enrollment status and load progress when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('🔄 Screen focused, checking enrollment status and loading progress...');
      if (courseData) {
        // Re-check enrollment status when screen comes into focus
        if (courseData.is_enrolled || await getLocalEnrollmentStatus(courseData.id)) {
          console.log('✅ User is enrolled (from focus listener)');
          setIsEnrolled(true);
          // Load progress from local storage when returning to screen
          await fetchCourseProgress();
        }
      }
    });
    
    return unsubscribe;
  }, [navigation, courseData]);

  // Fetch course details from API
  const fetchCourseDetails = async () => {
    try {
      setIsLoadingCourse(true);
      setError(null);
      
      const response = await getCourseDetail(courseId, courseSlug, navigation);
      
      console.log('🔍 API Response:', response);
      console.log('🔍 Response type:', typeof response);
      console.log('🔍 Response keys:', response ? Object.keys(response) : 'No response');
      
      let courseDataToSet: any = null;
      
      // Handle the actual API response structure: {data: {...}, status: true}
      if (response?.status && response?.data) {
        courseDataToSet = response.data;
        console.log('✅ Using response.status + response.data');
      } else if (response?.success && response?.data) {
        courseDataToSet = response.data;
        console.log('✅ Using response.success + response.data');
      } else if (response?.data) {
        courseDataToSet = response.data;
        console.log('✅ Using response.data (no status/success)');
      } else if (response && typeof response === 'object') {
        courseDataToSet = response;
        console.log('✅ Using direct response object');
      } else {
        console.log('❌ No valid data structure found');
        setError('Failed to load course details');
        return;
      }
      
      console.log('🔍 Course data to set:', courseDataToSet);
      console.log('🔍 Course videos:', courseDataToSet?.course_videos);
      console.log('🔍 Course videos length:', courseDataToSet?.course_videos?.length);
      
      setCourseData(courseDataToSet);
      
      // Check enrollment status after setting course data
      await checkEnrollmentStatus(courseDataToSet);
      
    } catch (error) {
      console.error('❌ Error fetching course details:', error);
      setError('Failed to load course details');
    } finally {
      setIsLoadingCourse(false);
    }
  };

  // Function to save enrollment status locally
  const saveEnrollmentStatus = async (courseId: string, isEnrolled: boolean) => {
    try {
      const key = `enrolled_${courseId}`;
      await EncryptedStorage.setItem(key, JSON.stringify({ isEnrolled, timestamp: Date.now() }));
      console.log('✅ Enrollment status saved locally for course:', courseId);
    } catch (error) {
      console.log('❌ Error saving enrollment status locally:', error);
    }
  };

  // Function to get enrollment status locally
  const getLocalEnrollmentStatus = async (courseId: string): Promise<boolean> => {
    try {
      const key = `enrolled_${courseId}`;
      const data = await EncryptedStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('✅ Local enrollment status found for course:', courseId, parsed);
        return parsed.isEnrolled;
      }
    } catch (error) {
      console.log('❌ Error getting local enrollment status:', error);
    }
    return false;
  };

  // Function to check enrollment status
  const checkEnrollmentStatus = async (courseData: any) => {
    if (!courseData) return;
    
    console.log('🔍 Checking enrollment status for course:', courseData.title);
    console.log('🔍 Course data is_enrolled:', courseData.is_enrolled);
    console.log('🔍 Course data is_paid_course:', courseData.is_paid_course);
    console.log('🔍 Course data is_locked:', courseData.is_locked);
    console.log('🔍 Course data course_videos:', courseData.course_videos?.length || 0);
    
    // First check local storage for enrollment status
    const localEnrollmentStatus = await getLocalEnrollmentStatus(courseData.id);
    if (localEnrollmentStatus) {
      console.log('✅ User is enrolled (from local storage)');
      setIsEnrolled(true);
      await fetchCourseProgress();
      return;
    }
    
    // Check if user is enrolled from course data
    if (courseData.is_enrolled) {
      console.log('✅ User is enrolled (from is_enrolled flag)');
      setIsEnrolled(true);
      await saveEnrollmentStatus(courseData.id, true);
      await fetchCourseProgress();
      return;
    }
    
    // Also check if user has any progress (indicates enrollment)
    if (courseData.course_videos && courseData.course_videos.length > 0) {
      // Check if any video has progress data
      const hasProgress = courseData.course_videos.some((video: any) => 
        video.watch_percentage || video.is_completed
      );
      if (hasProgress) {
        console.log('✅ User is enrolled (from video progress)');
        setIsEnrolled(true);
        await saveEnrollmentStatus(courseData.id, true);
        await fetchCourseProgress();
        return;
      }
    }
    
    // Check if this is a free course (free courses might not have enrollment flag)
    if (!courseData.is_paid_course && !courseData.is_locked) {
      console.log('✅ Free course - user should have access');
      setIsEnrolled(true);
      await saveEnrollmentStatus(courseData.id, true);
      await fetchCourseProgress();
      return;
    }
    
    // For paid courses, check if user has any enrollment history or progress
    if (courseData.is_paid_course || courseData.is_locked) {
      console.log('🔍 Paid course detected, checking for enrollment history...');
      
      // Try to fetch course progress to see if user has any history
      try {
        await fetchCourseProgress();
        if (courseProgress > 0) {
          console.log('✅ User has progress in paid course, considering enrolled');
          setIsEnrolled(true);
          await saveEnrollmentStatus(courseData.id, true);
          return;
        }
      } catch (error) {
        console.log('❌ Error checking progress for paid course:', error);
      }
      
      // Also check if user has any video progress in local storage
      if (courseData.course_videos && courseData.course_videos.length > 0) {
        let hasLocalProgress = false;
        for (const video of courseData.course_videos) {
          try {
            const videoProgressKey = `video_progress_${courseData.id}_${video.id}`;
            const storedProgress = await EncryptedStorage.getItem(videoProgressKey);
            if (storedProgress) {
              hasLocalProgress = true;
              break;
            }
          } catch (error) {
            console.log(`❌ Error checking local progress for video ${video.id}:`, error);
          }
        }
        
        if (hasLocalProgress) {
          console.log('✅ User has local progress in paid course, considering enrolled');
          setIsEnrolled(true);
          await saveEnrollmentStatus(courseData.id, true);
          await fetchCourseProgress();
          return;
        }
      }
    }
    
    console.log('❌ User is not enrolled');
    setIsEnrolled(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleSocialShare = async (platform: string) => {
    const androidAppUrl = 'https://play.google.com/store/apps/details?id=com.philross';
    const iosAppUrl = 'https://apps.apple.com/us/app/philross/id6751194230';
    const shareMessage = `Master Phil App – Train Smarter. Get Stronger.\nUnlock expert training, fitness routines & the BodyBell Method® – anytime, anywhere!\n\nDownload now:\nAndroid: ${androidAppUrl}\niOS: ${iosAppUrl}`;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'telegram':
        shareUrl = `tg://msg?text=${encodeURIComponent(shareMessage)}`;
        break;
      case 'instagram':
        try {
          await Clipboard.setString(shareMessage);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Message copied to clipboard', ToastAndroid.SHORT);
          } else {
            Alert.alert('Message Copied', 'Master Phil app message copied to clipboard.');
          }
        } catch (e) {
          console.log('Copy failed:', e);
        }
        return;
      default:
        return;
    }

    if (shareUrl) {
      try {
        await Linking.openURL(shareUrl);
      } catch (error) {
        console.log('Failed to open URL:', error);
        await Share.share({ message: shareMessage });
      }
    }
  };

  const handlePlayVideo = (moduleId: string) => {
    console.log('🔍 Play button clicked for moduleId:', moduleId);
    console.log('🔍 Current courseData:', courseData);
    console.log('🔍 Course videos array:', courseData?.course_videos);
    
    // Find the video data for the selected module
    const video = courseData?.course_videos?.find((v: any) => v.id === moduleId);
    console.log('🔍 Found video:', video);
    
    if (video) {
      console.log('✅ Video found:', video);
      console.log('✅ Video ID:', video.id);
      console.log('✅ Video Title:', video.title);
      console.log('✅ Video URL field:', video.video);
      
      // Get video URL from backend data - using the correct field name 'video'
      const videoUrl = video.video || video.video_url || video.url || video.video_link;
      console.log('🔗 Final video URL:', videoUrl);
      
      if (videoUrl) {
        console.log('🔗 Opening video player for URL:', videoUrl);
        // Set selected video and open video modal
        setSelectedVideo(video);
        setShowVideoModal(true);
      } else {
        console.log('❌ No video URL found in video data');
        console.log('❌ Video object keys:', Object.keys(video));
        Alert.alert('Error', 'Video URL not available');
      }
    } else {
      console.log('❌ Video not found for moduleId:', moduleId);
      console.log('❌ Available videos:', courseData?.course_videos);
      Alert.alert('Error', 'Video not found');
    }
  };

  const fetchCourseProgress = useCallback(async () => {
    if (!courseId || !courseData?.course_videos) return;
    
    try {
      console.log('📊 Calculating course progress from video data...');
      
      // Get progress from local storage for each video
      let totalProgress = 0;
      let completedVideos = 0;
      
      for (const video of courseData.course_videos) {
        try {
          const videoProgressKey = `video_progress_${courseId}_${video.id}`;
          const storedProgress = await EncryptedStorage.getItem(videoProgressKey);
          
          if (storedProgress) {
            const videoData = JSON.parse(storedProgress);
            const watchPercentage = videoData.watch_percentage || 0;
            const isCompleted = videoData.is_completed || false;
            
            totalProgress += watchPercentage;
            
            if (isCompleted || watchPercentage >= 90) {
              completedVideos++;
            }
            
            console.log(`📊 Video ${video.id}: ${watchPercentage}% completed, isCompleted: ${isCompleted}`);
          }
        } catch (error) {
          console.log(`❌ Error getting progress for video ${video.id}:`, error);
        }
      }
      
      // Calculate overall course progress
      const totalVideos = courseData.course_videos.length;
      const averageProgress = totalVideos > 0 ? totalProgress / totalVideos : 0;
      const completionProgress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
      
      // Use the higher of average progress or completion progress
      const finalProgress = Math.max(averageProgress, completionProgress);
      setCourseProgress(finalProgress);
      
      console.log('✅ Course progress calculated:', finalProgress, '%');
      console.log('✅ Total videos:', totalVideos, 'Completed videos:', completedVideos);
      
      // Update course data with new progress only if it's different
      setCourseData((prev: any) => {
        const newProgress = `${Math.round(finalProgress)}%`;
        if (prev.course_completed !== newProgress) {
          return {
            ...prev,
            course_completed: newProgress
          };
        }
        return prev; // No change needed
      });
      
      // Save course progress locally
      try {
        const courseProgressKey = `course_progress_${courseId}`;
        const courseProgressData = {
          course_id: courseId,
          progress: finalProgress,
          timestamp: Date.now()
        };
        
        await EncryptedStorage.setItem(courseProgressKey, JSON.stringify(courseProgressData));
        console.log('💾 Course progress saved locally:', courseProgressData);
      } catch (error) {
        console.log('❌ Error saving course progress locally:', error);
      }
      
    } catch (error) {
      console.error('❌ Error calculating course progress:', error);
    }
  }, [courseId, courseData?.course_videos]);

  const handleEnroll = async (link: string) => {
    // Prevent multiple enrollment attempts
    // if (isEnrolling || isEnrolled) {
    //   return;
    // }
    
    // Implement enrollment functionality for all courses (free and paid)
    if (courseSlug) {
      try {
        setIsEnrolling(true);
        const response = await enrollInCourse(courseSlug, navigation);
        
        // Check if user is already enrolled
        if (response?.message && response.message.includes('already enrolled')) {
          // User is already enrolled, update the UI accordingly
          setIsEnrolled(true);
          setCourseData((prev: any) => ({
            ...prev,
            is_enrolled: true
          }));
          
          // Fetch course progress
          await fetchCourseProgress();
          
          // Show success message
          Alert.alert('Success', 'You are already enrolled in this course!');
          return;
        }
        
        if (response?.status) {
          console.log('✅ Enrollment successful! Updating UI...');
          // Alert.alert('Success', 'You have successfully enrolled in the course!');
          setIsEnrolled(true);
          
          // Save enrollment status locally
          await saveEnrollmentStatus(courseId, true);
          console.log('✅ Enrollment status saved locally');
          
          // Update course data to reflect enrollment
          setCourseData((prev: any) => ({
            ...prev,
            is_enrolled: true
          }));
          
          console.log('✅ Course data updated with enrollment status');
          
          // Fetch course progress after enrollment
          await fetchCourseProgress();
          
          console.log('✅ Course progress fetched, navigating back to Courses...');

          handleEnrollLink(link);
          
          // Navigate back to courses list with enrollment data
          // navigation.navigate('Courses', { 
          //   enrolledCourseId: courseId,
          //   enrolledCourseSlug: courseSlug 
          // });
        } else {
          Alert.alert('Error', response?.message || 'Failed to enroll in the course. Please try again.');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enroll in the course. Please try again.');
      } finally {
        setIsEnrolling(false);
      }
    } else {
      Alert.alert('Error', 'Course slug not available for enrollment.');
    }
  };

  const handleEnrollLink = async (url: string) => {
      try {
        await Linking.openURL(url);
      } catch (error: any) {
        Alert.alert(
          'Link Error',
          `Could not open: ${url}\n\nError: ${error?.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    };

  // Show loading state
  if (isLoadingCourse) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Loading...</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading course details...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Error</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCourseDetails}>
            <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show course data
  if (!courseData) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Course Not Found</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>Course not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>
          {courseData?.title || 'Loading...'}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Course Thumbnail */}
        <View style={styles.videoContainer}>
          <Image 
            source={{ uri: courseData?.cropped_thumbnail_url || courseData?.videoThumbnail }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
        </View>

        {/* Course Title and Description */}
        <View style={styles.courseInfoContainer}>
          <Text style={[styles.courseTitle, { fontFamily: getFontFamily('heading') }]}>
            {courseData?.title || 'Loading...'}
          </Text>
          <Text style={[styles.courseDescription, { fontFamily: getFontFamily('body') }]}>
            {Array.isArray(courseData?.description) ? courseData.description.join(' ') : courseData?.description || 'Loading...'}
          </Text>
          
          {/* Course Progress Bar */}
          {/* {isEnrolled && courseProgress > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                {Math.round(courseProgress)}% Complete
              </Text>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBar,
                    { width: `${courseProgress}%` }
                  ]} 
                />
              </View>
            </View>
          )} */}
        </View>

        {/* Instructor */}
        <View style={styles.instructorContainer}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>
            Instructor:
          </Text>
          <View style={styles.instructorProfile}>
            <Image 
              source={{ uri: courseData?.instructor?.profile_pic || 'https://randomuser.me/api/portraits/men/32.jpg' }}
              style={styles.instructorAvatar}
            />
            <Text style={[styles.instructorName, { fontFamily: getFontFamily('bold') }]}>
              {courseData?.instructor?.full_name}
            </Text>
          </View>
        </View>



        {/* Course Curriculum */}
        <View style={styles.curriculumContainer}>
          <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>
            Course Curriculum
          </Text>
          

          
          {courseData?.course_videos && courseData.course_videos.length > 0 ? (
            courseData.course_videos.map((video: any) => (
              <View key={video.id} style={styles.moduleCard}>
                <View style={styles.moduleNumberContainer}>
                  <Text style={[styles.moduleNumber, { fontFamily: getFontFamily('bold') }]}>
                    {video.sequence}
                  </Text>
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={[styles.moduleTitle, { fontFamily: getFontFamily('bold') }]}>
                    {video.title}
                  </Text>
                  <Text style={[styles.moduleDuration, { fontFamily: getFontFamily('body') }]}>
                    Video {video.sequence}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.playModuleButton}
                  onPress={() => handlePlayVideo(video.id)}
                >
                  <RedPlayIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.noModulesContainer}>
              <Text style={[styles.noModulesText, { fontFamily: getFontFamily('body') }]}>
                Course curriculum will be available soon
              </Text>
            </View>
          )}
        </View>

        {/* Enroll Button */}
        <TouchableOpacity
          style={[styles.enrollButton, isEnrolled && styles.enrolledButton]}
          onPress={() => { handleEnrollLink(courseData?.destination_link) }}>
          <Text style={[styles.enrollButtonText, { fontFamily: getFontFamily('bold') }]}>ENROLL NOW</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Share Modal */}
      {showShare && (
        <View style={styles.shareOverlay}>
          <View style={[styles.shareModal, { paddingBottom: insets.bottom }]}>
            <View style={styles.shareHeader}>
              <TouchableOpacity onPress={() => setShowShare(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.shareContent}>
              <View style={styles.shareIconContainer}>
                <View style={styles.shareIcon}>
                  <Image source={share} style={{ height: 40, width: 40 }} />
                </View>
              </View>
              <Text style={[styles.shareTitle, { fontFamily: getFontFamily('bold') }]}>Share</Text>
              <View style={styles.shareLinkSection}>
                <View style={styles.contentContainer}>
                  <Text style={[styles.contentText, { fontFamily: getFontFamily('bold') }]}>
                    PhilRoss App – Train Smarter. Get Stronger.{'\n'}
                    Unlock expert training, fitness routines & the BodyBell Method® – anytime, anywhere!
                  </Text>
                </View>
                
                <Text style={[styles.downloadTitle, { fontFamily: getFontFamily('bold') }]}>Download now:</Text>
                
                <View style={styles.downloadSection}>
                  <View style={styles.linkContainer}>
                    <Text style={[styles.linkText, { fontFamily: getFontFamily('body') }]}>
                      https://play.google.com/store/apps/details?id=com.philross
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => {
                        const androidLink = 'https://play.google.com/store/apps/details?id=com.philross';
                        try {
                          Clipboard.setString(androidLink);
                          if (Platform.OS === 'android') {
                            ToastAndroid.show('Android link copied', ToastAndroid.SHORT);
                          } else {
                            Alert.alert('Link Copied', 'Android link copied to clipboard');
                          }
                        } catch (e) {
                          console.log('Copy failed:', e);
                          Alert.alert('Copy Failed', 'Unable to copy link, please try again.');
                        }
                      }}
                    >
                      <DocumentCopyIcon width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.linkContainer}>
                    <Text style={[styles.linkText, { fontFamily: getFontFamily('body') }]}>
                      https://apps.apple.com/us/app/philross/id6751194230
                    </Text>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      onPress={() => {
                        const iosLink = 'https://apps.apple.com/us/app/philross/id6751194230';
                        try {
                          Clipboard.setString(iosLink);
                          if (Platform.OS === 'android') {
                            ToastAndroid.show('iOS link copied', ToastAndroid.SHORT);
                          } else {
                            Alert.alert('Link Copied', 'iOS link copied to clipboard');
                          }
                        } catch (e) {
                          console.log('Copy failed:', e);
                          Alert.alert('Copy Failed', 'Unable to copy link, please try again.');
                        }
                      }}
                    >
                      <DocumentCopyIcon width={20} height={20} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.shareToSection}>
                <Text style={[styles.shareSectionTitle, { fontFamily: getFontFamily('bold') }]}>Share to</Text>
                <View style={styles.socialButtons}>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('facebook')}>
                    <Image source={FbIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('whatsapp')}>
                    <Image source={WhatsAppIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('instagram')}>
                    <Image source={InstagramIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('twitter')}>
                   <Image source={XIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialShare('telegram')}>
                    <Image source={TelegramIcon} style={styles.socialIcons} resizeMode='contain' />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Video Player Modal */}
      {showVideoModal && selectedVideo && (
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModal}>
            <View style={styles.videoModalHeader}>
              <Text style={[styles.videoModalTitle, { fontFamily: getFontFamily('bold') }]}>
                {selectedVideo.title}
              </Text>
              <TouchableOpacity 
                style={styles.videoModalCloseButton}
                onPress={() => {
                  setShowVideoModal(false);
                  setSelectedVideo(null);
                }}
              >
                <Text style={styles.videoModalCloseText}>X</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.videoPlayerContainer}>
              {/* {isVideoLoading && (
                <View style={styles.videoLoadingContainer}>
                  <ActivityIndicator size="large" color="#B62020" />
                  <Text style={styles.videoLoadingText}>Loading video...</Text>
                </View>
              )} */}
              {/* <VideoPlayer
                ref={videoPlayerRef}
                source={{
                  uri: selectedVideo.video || selectedVideo.video_url || selectedVideo.url || selectedVideo.video_link
                }}
                showDuration={true}
                onLoadStart={() => {
                  console.log('🔄 Video loading started');
                  setIsVideoLoading(true);
                }}
                onLoad={(data) => {
                  console.log('✅ Video loaded successfully:', data);
                  setIsVideoLoading(false);
                }}
                onProgress={async (data) => {
                  console.log('📊 Video progress:', data);
                  
                  // Update video progress every 5 seconds or when significant progress is made
                  if (data.currentTime && data.seekableDuration) {
                    const progress = (data.currentTime / data.seekableDuration) * 100;
                    const isCompleted = progress >= 90; // Consider video completed at 90%
                    
                    // Update progress every 5% or every 30 seconds
                    const shouldUpdate = Math.floor(progress) % 5 === 0 || 
                                       Math.floor(data.currentTime) % 30 === 0 ||
                                       isCompleted;
                    
                    if (shouldUpdate) {
                      try {
                        console.log(`📊 Updating video progress: ${Math.round(progress)}% (${Math.round(data.currentTime)}s/${Math.round(data.seekableDuration)}s)`);
                        
                        // Save video progress locally
                        const videoProgressKey = `video_progress_${courseId}_${selectedVideo.id}`;
                        const videoProgressData = {
                          video_id: selectedVideo.id,
                          course_id: courseId,
                          watch_percentage: Math.round(progress),
                          is_completed: isCompleted,
                          timestamp: Date.now()
                        };
                        
                        await EncryptedStorage.setItem(videoProgressKey, JSON.stringify(videoProgressData));
                        console.log('💾 Video progress saved locally:', videoProgressData);
                        
                        // Also send to backend
                        await updateVideoProgress({
                          video_id: selectedVideo.id,
                          course_id: courseId,
                          watch_percentage: Math.round(progress),
                          is_completed: isCompleted
                        }, navigation);
                        
                        // Refresh course progress after significant updates
                        if (isCompleted || Math.floor(progress) % 25 === 0) {
                          await fetchCourseProgress();
                        }
                      } catch (error) {
                        console.log('❌ Error updating video progress:', error);
                      }
                    }
                  }
                }}
                onError={(e) => {
                  console.log('❌ Video player error:', e);
                  console.log('❌ Video URL being used:', selectedVideo.video || selectedVideo.video_url || selectedVideo.url || selectedVideo.video_link);
                  setIsVideoLoading(false);
                  Alert.alert(
                    'Video Error', 
                    'Failed to load video. Please check your internet connection and try again.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Retry', 
                        onPress: () => {
                          console.log('🔄 Retrying video playback...');
                          setIsVideoLoading(true);
                          // Force video player to reload
                          if (videoPlayerRef.current) {
                            videoPlayerRef.current.seek(0);
                          }
                        }
                      }
                    ]
                  );
                }}
                onEnd={async () => {
                  console.log('✅ Video ended - marking as completed');
                  try {
                    // Save video as 100% completed locally
                    const videoProgressKey = `video_progress_${courseId}_${selectedVideo.id}`;
                    const videoProgressData = {
                      video_id: selectedVideo.id,
                      course_id: courseId,
                      watch_percentage: 100,
                      is_completed: true,
                      timestamp: Date.now()
                    };
                    
                    await EncryptedStorage.setItem(videoProgressKey, JSON.stringify(videoProgressData));
                    console.log('💾 Video completed and saved locally:', videoProgressData);
                    
                    // Also send to backend
                    await updateVideoProgress({
                      video_id: selectedVideo.id,
                      course_id: courseId,
                      watch_percentage: 100,
                      is_completed: true
                    }, navigation);
                    
                    // Refresh course progress
                    await fetchCourseProgress();
                    
                    console.log('✅ Video marked as completed');
                  } catch (error) {
                    console.log('❌ Error marking video as completed:', error);
                  }
                }}
                style={styles.videoPlayer}
                controls={true}
                fullscreen={true}
                fullscreenOrientation="landscape"
              /> */}
              
              <VideoPlayerNew
                videUrl={selectedVideo?.video.toString() || ""}
                title={courseData?.title + ':- ' + selectedVideo.title}
                onProgress={async (data) => {
                  console.log('📊 Video progress:', data);

                  // Update video progress every 5 seconds or when significant progress is made
                  if (data.currentTime && data.seekableDuration) {
                    const progress = (data.currentTime / data.seekableDuration) * 100;
                    const isCompleted = progress >= 90; // Consider video completed at 90%

                    // Update progress every 5% or every 30 seconds
                    const shouldUpdate = Math.floor(progress) % 5 === 0 ||
                      Math.floor(data.currentTime) % 30 === 0 ||
                      isCompleted;

                    if (shouldUpdate) {
                      try {
                        console.log(`📊 Updating video progress: ${Math.round(progress)}% (${Math.round(data.currentTime)}s/${Math.round(data.seekableDuration)}s)`);

                        // Save video progress locally
                        const videoProgressKey = `video_progress_${courseId}_${selectedVideo.id}`;
                        const videoProgressData = {
                          video_id: selectedVideo.id,
                          course_id: courseId,
                          watch_percentage: Math.round(progress),
                          is_completed: isCompleted,
                          timestamp: Date.now()
                        };

                        await EncryptedStorage.setItem(videoProgressKey, JSON.stringify(videoProgressData));
                        console.log('💾 Video progress saved locally:', videoProgressData);

                        // Also send to backend
                        await updateVideoProgress({
                          video_id: selectedVideo.id,
                          course_id: courseId,
                          watch_percentage: Math.round(progress),
                          is_completed: isCompleted
                        }, navigation);

                        // Refresh course progress after significant updates
                        if (isCompleted || Math.floor(progress) % 25 === 0) {
                          await fetchCourseProgress();
                        }
                      } catch (error) {
                        console.log('❌ Error updating video progress:', error);
                      }
                    }
                  }
                }}
                onEnd={async () => {
                  console.log('✅ Video ended - marking as completed');
                  try {
                    // Save video as 100% completed locally
                    const videoProgressKey = `video_progress_${courseId}_${selectedVideo.id}`;
                    const videoProgressData = {
                      video_id: selectedVideo.id,
                      course_id: courseId,
                      watch_percentage: 100,
                      is_completed: true,
                      timestamp: Date.now()
                    };

                    await EncryptedStorage.setItem(videoProgressKey, JSON.stringify(videoProgressData));
                    console.log('💾 Video completed and saved locally:', videoProgressData);

                    // Also send to backend
                    await updateVideoProgress({
                      video_id: selectedVideo.id,
                      course_id: courseId,
                      watch_percentage: 100,
                      is_completed: true
                    }, navigation);

                    // Refresh course progress
                    await fetchCourseProgress();

                    console.log('✅ Video marked as completed');
                  } catch (error) {
                    console.log('❌ Error marking video as completed:', error);
                  }
                }}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  courseInfoContainer: {
    padding: 20,
  },
  courseTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 10,
  },
  courseDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  instructorContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 15,
  },
  instructorProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  instructorName: {
    fontSize: 16,
    color: '#000000',
  },
  curriculumContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  moduleNumberContainer: {
    width: 30,
    alignItems: 'center',
  },
  moduleNumber: {
    fontSize: 16,
    color: '#B62020',
  },
  moduleInfo: {
    flex: 1,
    marginLeft: 10,
  },
  moduleTitle: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
  },
  moduleDuration: {
    fontSize: 14,
    color: '#666666',
  },
  playModuleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedModuleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  // Completed video styles
  completedModuleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F0', // Light green background
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    borderWidth: 2,
    borderColor: '#4CAF50', // Green border
  },
  completedModuleNumberContainer: {
    width: 30,
    alignItems: 'center',
    backgroundColor: '#4CAF50', // Green background
    borderRadius: 15,
    paddingVertical: 5,
  },
  completedModuleNumber: {
    fontSize: 16,
    color: '#FFFFFF', // White text
    fontFamily: getFontFamily('bold'),
  },
  completedModuleTitle: {
    fontSize: 16,
    color: '#2E7D32', // Dark green text
    marginBottom: 5,
    fontFamily: getFontFamily('bold'),
  },
  completedModuleDuration: {
    fontSize: 14,
    color: '#4CAF50', // Green text
    fontFamily: getFontFamily('body'),
  },
  completedModuleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50', // Green background
    borderRadius: 20,
  },
  enrollButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#28A745', // Green background for enrolled state
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#B62020',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  noModulesContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noModulesText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 10,
  },

  shareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 1000,
  },
  shareModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 0, // Remove all padding
    width: '100%',
    // height: '100%', // Full screen height
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // top: 250, // Moved up to provide more space at bottom
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    paddingRight: 20, // Add right padding for close button
  },
  closeButton: {
    fontSize: 24,
    color: '#000000',
    fontFamily: getFontFamily('bold'),
    padding: 5,
  },
  shareContent: {
    alignItems: 'center',
    paddingTop: 15,
    paddingHorizontal: 20, // Add horizontal padding to content
  },
  shareIconContainer: {
    marginBottom: 2,
  },
  shareIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#B62020',
    borderRadius: 40,
  },
  shareTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 30,
  },
  shareLinkSection: {
    width: '100%',
    marginBottom: 30,
  },
  shareSectionTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 15,
  },
  contentContainer: {
    marginBottom: 20,
  },
  contentText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  downloadTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
    marginTop: -2,
  },
  downloadSection: {
    gap: 12,
    marginBottom: 40,
    marginTop: -10,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
  },
  copyButton: {
    padding: 5,
  },
  shareToSection: {
    width: '100%',
    marginBottom: 10,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 0,
  },
  socialButtonTransparent: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  
  // Video Modal Styles
  videoModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  videoModal: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: width * 0.95,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#000000',
  },
  videoModalTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  videoModalCloseButton: {
    padding: 5,
  },
  videoModalCloseText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    textAlign: 'center',
  },
  videoPlayerContainer: {
    width: '100%',
    // height: 400,
    backgroundColor: '#000000',
    // borderTopLeftRadius: 20,
    overflow: 'hidden',
    paddingBottom: 20,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  
  // Video Loading Styles
  videoLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  videoLoadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
    fontFamily: getFontFamily('body'),
  },
  progressContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontFamily: getFontFamily('body'),
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#B62020',
    borderRadius: 3,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  socialIcons: {
    width: Utils.normalize(48),
    height: Utils.normalize(48),
  },
});

export default CourseDetailsScreen;