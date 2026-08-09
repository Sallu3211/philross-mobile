import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontFamily, getColors, getResponsiveStyles } from '../utils/platform';
import SideMenu from '../components/SideMenu';
// Shared icon set, so the hamburger matches the one on the dashboard.
import { Menu as MenuIcon } from '../components/ui/icons';
import { theme as appTheme } from '../theme';
import FeedIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher-red.svg';
import LockIcon from '../../assets/icons/lock.svg';
import { getCourseList } from '../../app/helpers/ApiHelper';
import { useUser } from '../context/UserContext';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Loader } from '../components/Loader';
import { pushCleverTapEvent } from '../../App';

const { width } = Dimensions.get('window');

const CoursesScreen = ({ navigation, route }: any) => {
  const colors = getColors();
  const responsiveStyles = getResponsiveStyles();
  const { user, getUserInitial, isLoggedIn, isSubscribed, } = useUser();
  const [showSideMenu, setShowSideMenu] = useState(false);

  useEffect(() => {
    pushCleverTapEvent('courses_viewed', {});
  }, [])

  // Course API state
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  // Get enrollment data from route params
  const { enrolledCourseId, enrolledCourseSlug } = route?.params || {};

  // Fetch courses when component mounts and when screen comes into focus
  useEffect(() => {
    fetchCourses();
    
    // Add focus listener to refresh courses when returning from enrollment
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔄 Courses screen focused, refreshing courses...');
      fetchCourses();
    });
    
    return unsubscribe;
  }, [navigation]);

  // Update specific course enrollment status when returning from enrollment
  useEffect(() => {
    if (enrolledCourseId && enrolledCourseSlug && courses.length > 0) {
      console.log('🔄 Updating enrollment status for course:', enrolledCourseId);
      
      // Add to enrolled course IDs set
      setEnrolledCourseIds(prev => new Set([...prev, enrolledCourseId]));
      
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === enrolledCourseId 
            ? { ...course, is_enrolled: true }
            : course
        )
      );
      
      // Clear the route params after updating
      navigation.setParams({ enrolledCourseId: undefined, enrolledCourseSlug: undefined });
    }
  }, [enrolledCourseId, enrolledCourseSlug, courses.length, navigation]);

  // Store enrolled course IDs to preserve enrollment status
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  // Helper function to parse course completion percentage
  const getProgressPercentage = (completion: string | number): number => {
    if (!completion) return 0;
    
    if (typeof completion === 'number') {
      return Math.min(Math.max(completion, 0), 100); // Clamp between 0-100
    }
    
    if (typeof completion === 'string') {
      // Remove % symbol and parse
      const cleanValue = completion.replace('%', '').trim();
      const parsed = parseInt(cleanValue);
      if (isNaN(parsed)) return 0;
      return Math.min(Math.max(parsed, 0), 100); // Clamp between 0-100
    }
    
    return 0;
  };

  // Get local progress for a course
  const getLocalCourseProgress = async (courseId: number): Promise<number> => {
    try {
      // Try to get progress from local storage
      const progressKey = `course_progress_${courseId}`;
      const storedProgress = await EncryptedStorage.getItem(progressKey);
      
      if (storedProgress) {
        const progressData = JSON.parse(storedProgress);
        return progressData.progress || 0;
      }
      
      return 0;
    } catch (error) {
      console.log(`❌ Error getting local progress for course ${courseId}:`, error);
      return 0;
    }
  };

  // Check if course is enrolled locally
  const getLocalEnrollmentStatus = async (courseId: number): Promise<boolean> => {
    try {
      const enrollmentKey = `enrolled_${courseId}`;
      const storedEnrollment = await EncryptedStorage.getItem(enrollmentKey);
      
      if (storedEnrollment) {
        const enrollmentData = JSON.parse(storedEnrollment);
        return enrollmentData.isEnrolled || false;
      }
      
      return false;
    } catch (error) {
      console.log(`❌ Error getting local enrollment status for course ${courseId}:`, error);
      return false;
    }
  };

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setIsLoadingCourses(true);
      
      const response = await getCourseList(navigation);
      
      let coursesToSet: any[] = [];
      
      // Handle different response structures from apiCall
      if (response?.success && response?.data?.results && Array.isArray(response.data.results)) {
        coursesToSet = response.data.results;
      } else if (response?.success && response?.data && Array.isArray(response.data)) {
        coursesToSet = response.data;
      } else if (response?.data?.results && Array.isArray(response.data.results)) {
        coursesToSet = response.data.results;
      } else if (response?.data && Array.isArray(response.data)) {
        coursesToSet = response.data;
      } else if (response && Array.isArray(response)) {
        coursesToSet = response;
      } else {
        coursesToSet = [];
      }
      
      // Process courses to add enrollment status
      const processedCourses = coursesToSet.map((course: any) => {
        // Check if course has progress data (indicates enrollment)
        const hasProgress = course.course_completed && 
          course.course_completed !== '0%' && 
          getProgressPercentage(course.course_completed) > 0;
        
        // Check if course is free (free courses might not have enrollment flag)
        const isFreeCourse = !course.is_paid_course && !course.is_locked;
        
        // Check if course is already marked as enrolled in our local state
        const isLocallyEnrolled = enrolledCourseIds.has(course.id);
        
        return {
          ...course,
          is_enrolled: course.is_enrolled || hasProgress || isFreeCourse || isLocallyEnrolled
        };
      });
      
      console.log('🔍 Processed courses with enrollment status:', processedCourses);
      console.log('🔍 Enrolled course IDs in local state:', Array.from(enrolledCourseIds));
      setCourses(processedCourses);
      
      // Check for local progress data and enrollment status
      console.log('📊 Checking for local progress data and enrollment status...');
      
      for (const course of processedCourses) {
        try {
          // Check local enrollment status for all courses
          const localEnrollment = await getLocalEnrollmentStatus(course.id);
          if (localEnrollment) {
            course.is_enrolled = true;
            console.log(`📊 Course ${course.id} locally enrolled`);
          }
          
          // Check local progress for enrolled courses
          if (course.is_enrolled) {
            const localProgress = await getLocalCourseProgress(course.id);
            if (localProgress > 0) {
              course.course_completed = `${localProgress}%`;
              console.log(`📊 Course ${course.id} local progress: ${localProgress}%`);
            }
          }
        } catch (error) {
          console.log(`❌ Error checking local data for course ${course.id}:`, error);
        }
      }
      
      setCourses(processedCourses);
      
    } catch (error) {
      setCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const onItemPress = async (courseId: string, courseSlug: string, isPaid: boolean) => {
    const navigateToFeed = () => {
      navigation.navigate('CourseDetails', { courseId, courseSlug });
    }
    navigateToFeed();
  }

  return (
    <>
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowSideMenu(true)}>
          <MenuIcon size={22} color={appTheme.color.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Courses</Text>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileButtonText}>{isLoggedIn ? getUserInitial() : '?'}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoadingCourses ? (
          <View style={styles.loadingContainer}>
          </View>
        ) : courses.length > 0 ? (
          courses.map((course: any, index: number) => {
            console.log(`🔍 Course ${index + 1}:`, course.title);
            console.log(`🔍 is_enrolled:`, course.is_enrolled);
            console.log(`🔍 is_paid_course:`, course.is_paid_course);
            console.log(`🔍 course_completed:`, course.course_completed);
            console.log(`🔍 Course ID:`, course.id);
            console.log(`🔍 In enrolledCourseIds:`, enrolledCourseIds.has(course.id));
            
            return (
            <TouchableOpacity 
              key={index}
              style={styles.courseCard}
                onPress={() => {
                  onItemPress(course?.id ?? '', course?.slug ?? '', course.is_paid_course && !course.is_enrolled)
                }}
              >
              <View style={styles.courseContent}>
                <View style={styles.courseHeader}>
                  <View style={styles.courseInfo}>
                    <Text 
                      style={[styles.courseTitle, { fontFamily: getFontFamily('heading') }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {course.title || 'Untitled Course'}
                    </Text>
                    <Text 
                      style={[styles.courseDescription, { fontFamily: getFontFamily('body') }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {Array.isArray(course.description) ? course.description.join(' ') : course.description || 'No description available'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.continueButton}
                    onPress={() => {
                      // Navigate to course details with course ID and slug
                      navigation.navigate('CourseDetails', { 
                        courseId: course.id,
                        courseSlug: course.slug 
                      });
                    }}
                  >
                    <Text style={[styles.continueButtonText, { fontFamily: getFontFamily('bold') }]}>
                      {course.is_enrolled ? 'Continue >' : 'Explore Course'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Progress section for enrolled courses only */}
                {/* {course.is_enrolled && (
                  <View style={styles.progressContainer}>
                    <Text style={[styles.progressText, { fontFamily: getFontFamily('body') }]}>
                      {course.course_completed && course.course_completed !== '0%' ? getProgressPercentage(course.course_completed) : 0}% Complete
                    </Text>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { 
                            width: `${course.course_completed && course.course_completed !== '0%' ? getProgressPercentage(course.course_completed) : 0}%`,
                            opacity: (course.course_completed && course.course_completed !== '0%' ? getProgressPercentage(course.course_completed) : 0) < 5 ? 0.7 : 1,
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )} */}
              </View>
              
              <View style={styles.courseImageContainer}>
                <Image 
                  source={{ 
                    uri: course.cropped_thumbnail_url
                  }}
                  style={styles.courseImage}
                  resizeMode="cover"
                />
                
                {/* Badge - Lock icon for paid courses, Free for free courses and enrolled courses */}
                {/* <View style={[styles.freeBadge, course.is_paid_course && !course.is_enrolled && styles.lockedBadge]}>
                  {course.is_paid_course ? (
                    <>
                        {!isSubscribed && <LockIcon width={16} height={16} fill="none" stroke="#B62020" strokeWidth="2" />}
                        <Text style={[styles.lockText, { fontFamily: getFontFamily('body') }]}>{isSubscribed ? 'Unlocked' : "Lock"}</Text>
                    </>
                  ) : (
                    <Text style={[styles.freeText, { fontFamily: getFontFamily('body') }]}>Free</Text>
                  )}
                </View> */}
              </View>
            </TouchableOpacity>
            );
          })
        ) : ( !isLoadingCourses &&
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontFamily: getFontFamily('body') }]}>
              {isLoadingCourses ? 'Loading courses...' : 'No courses available'}
            </Text>
            <Text style={[styles.emptySubtext, { fontFamily: getFontFamily('body') }]}>
              {isLoadingCourses ? 'Please wait while we fetch your courses' : 'Check back later for new courses'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feed')}>
          <FeedIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
          <EventsIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Products')}>
          <ProductsIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyCoach')}>
          <MyCoachIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>My Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <CoursesIcon width={24} height={24} />
          <Text style={[styles.navText, styles.activeNavText, { fontFamily: getFontFamily('bold') }]}>Courses</Text>
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
      <SideMenu 
        isVisible={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        navigation={navigation}
      />
    </View>
      {isLoadingCourses && (
        <Loader value='Loading courses...' />
      )}
    </>
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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
  },
  title: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Match Feed screen pattern
  },
  courseCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  courseContent: {
    padding: 20,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
    marginRight: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 4,
    flexShrink: 1,
    lineHeight: 20,
    textAlign: 'left',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 0,
    lineHeight: 18,
    textAlign: 'left',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    textAlign: 'left',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#B62020',
    borderRadius: 3,
    minWidth: 6, // Ensure minimum width for very small percentages
  },
  continueButton: {
    alignSelf: 'flex-start',
  },
  continueButtonText: {
    color: '#B62020',
    fontSize: 16,
    textDecorationLine: 'underline',
  },

  exploreButton: {
    alignSelf: 'flex-start',
  },
  exploreButtonText: {
    color: '#B62020',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  courseImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  courseImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  lockBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: '#B62020',
    fontSize: 12,
    fontFamily: getFontFamily('heading'),
    marginLeft: 4,
  },
  freeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 20,
  },
  freeText: {
    color: '#B62020',
    fontSize: 12,
    fontFamily: getFontFamily('heading'),
  },
  lockedBadge: {
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  activeNavText: {
    color: '#B62020',
    fontFamily: getFontFamily('heading'),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    minHeight: 200,
  },
  loadingText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
});

export default CoursesScreen;
