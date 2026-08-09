import React, { useState, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SideMenu from '../components/SideMenu';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import SearchBar from '../components/ui/SearchBar';
import MediaListCard from '../components/ui/MediaListCard';
import { EmptyState, LoadingState } from '../components/ui/StateView';
import { Check, Coach, Courses as CoursesIcon } from '../components/ui/icons';
import { getCourseList } from '../../app/helpers/ApiHelper';
import EncryptedStorage from 'react-native-encrypted-storage';
import { pushCleverTapEvent } from '../../App';

const CoursesScreen = ({ navigation, route }: any) => {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [search, setSearch] = useState('');

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
    // fetchCourses reads enrolledCourseIds, so listing it here would re-subscribe
    // the focus listener on every fetch. Left as-is deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const parsed = parseInt(cleanValue, 10);
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

  const onItemPress = async (courseId: string, courseSlug: string) => {
    const navigateToFeed = () => {
      navigation.navigate('CourseDetails', { courseId, courseSlug });
    }
    navigateToFeed();
  }

  /** Percentages arrive as "0 %", "42", or 42 depending on the endpoint. */
  const toPercent = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    const n =
      typeof value === 'number'
        ? value
        : parseFloat(String(value).replace('%', '').trim());
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 0;
  };

  const query = search.trim().toLowerCase();
  const visible = query
    ? courses.filter((c: any) =>
        `${c?.title ?? ''} ${c?.instructor?.full_name ?? ''}`
          .toLowerCase()
          .includes(query),
      )
    : courses;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Courses"
        subtitle={
          courses.length > 0
            ? `${courses.length} ${courses.length === 1 ? 'course' : 'courses'}`
            : undefined
        }
        onMenu={() => setShowSideMenu(true)}
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search courses"
        />
      </View>

      {isLoadingCourses ? (
        <LoadingState label="Loading courses" />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item: any, i) => String(item?.id ?? item?.slug ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingCourses}
              onRefresh={fetchCourses}
              tintColor={theme.color.brand.base}
              colors={[theme.color.brand.base]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={CoursesIcon}
              title={query ? 'No matching courses' : 'No courses yet'}
              body={
                query
                  ? `Nothing matches "${search.trim()}". Try a different search.`
                  : 'New courses from Phil will appear here.'
              }
              actionLabel={query ? 'Clear search' : undefined}
              onAction={query ? () => setSearch('') : undefined}
            />
          }
          renderItem={({ item }: any) => {
            const progress = toPercent(item?.course_completed);
            const priceValue = parseFloat(item?.price ?? '0');

            return (
              <MediaListCard
                title={item?.title ?? 'Untitled course'}
                body={
                  typeof item?.description === 'string'
                    ? item.description
                    : Array.isArray(item?.description)
                    ? item.description.join(' ')
                    : undefined
                }
                imageUrl={item?.cropped_thumbnail_url ?? item?.cropped_image_url}
                meta={[
                  ...(item?.instructor?.full_name
                    ? [{ icon: Coach, label: item.instructor.full_name }]
                    : []),
                  ...(progress >= 100 ? [{ icon: Check, label: 'Completed' }] : []),
                ]}
                price={
                  Number.isFinite(priceValue) && priceValue > 0
                    ? `$${priceValue.toFixed(0)}`
                    : null
                }
                progress={progress}
                locked={!!item?.is_locked}
                badge={item?.is_paid_course ? 'Premium' : undefined}
                onPress={() => onItemPress(item?.id, item?.slug)}
              />
            );
          }}
        />
      )}

      <SideMenu
        isVisible={showSideMenu}
        onClose={() => setShowSideMenu(false)}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  searchWrap: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.lg,
  },
  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.md,
  },
});

export default CoursesScreen;
