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
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontFamily, getColors } from '../utils/platform';
import SideMenu from '../components/SideMenu';
import MenuIcon from '../../assets/icons/menu.svg';
import TickCircleIcon from '../../assets/icons/tick-circle.svg';
import FeedIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/teacher-red.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import { getCoachList, submitIntakeForm } from '../../app/helpers/ApiHelper';
import { useUser } from '../context/UserContext';
import { Loader } from '../components/Loader';

const { width } = Dimensions.get('window');

const MyCoachScreen = ({ navigation }: any) => {
  const colors = getColors();
  const { user, getUserInitial, isLoggedIn } = useUser();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [coachData, setCoachData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch coach data on component mount
  useEffect(() => {
    fetchCoachData();
  }, []);

  // Fetch coach data from API
  const fetchCoachData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await getCoachList(navigation);
      
      if (response?.status || response?.success) {
        const coach = response.data;
          console.log('👨‍🏫 Coach data from API:', coach);
          setCoachData(coach);
      } else {
        setError('Failed to load coach information');
      }
    } catch (error) {
      setError('Failed to load coach information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartIntakeForm = async () => {
    try {
      if (!coachData?.id) {
        console.log('❌ No coach ID available for intake form');
        Alert.alert('Error', 'Coach information not available');
        return;
      }

      console.log('🚀 Starting intake form for coach ID:', coachData.id);
      
      // Navigate to IntakeForm with coach data
      navigation.navigate('IntakeForm', {
        coachId: coachData.id,
        coachSlug: coachData.slug,
        instructorEmail: coachData?.instructor_email ?? '',
        instructorName: coachData?.instructor_name,
      });
      
    } catch (error) {
      console.error('❌ Error starting intake form:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <>
    <View style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setShowSideMenu(true)}>
          <MenuIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Personal Training</Text>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileCircle}>
            <Text style={[styles.profileInitial, { fontFamily: getFontFamily('bold') }]}>{isLoggedIn ? getUserInitial() : '?'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
            {coachData && <Image
              source={{
                uri: coachData?.cropped_image_url || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80'
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />}
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              {/* <ActivityIndicator size="large" color="#B62020" />
              <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
                Loading coach information...
              </Text> */}
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>
                {error}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchCoachData}>
                <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          ) : coachData ? (
            <>
              <Text style={[styles.mainTitle, { fontFamily: getFontFamily('bold') }]}>
                {coachData.instructor?.full_name || coachData.instructor?.name || coachData.instructor?.title || coachData.headline}
              </Text>
              <Text style={[styles.description, { fontFamily: getFontFamily('body') }]}>
                {coachData.instructor?.bio || coachData.instructor?.description || coachData.description}
              </Text>

              {/* Key Benefits */}
              {coachData.key_benefits && coachData.key_benefits.length > 0 && (
                <>
                  <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>
                    Key Benefits
                  </Text>
                  
                  <View style={styles.benefitsList}>
                    {coachData.key_benefits.map((benefit: any, index: number) => (
                      <View key={benefit.id || index} style={styles.benefitItem}>
                        <TickCircleIcon width={20} height={20} />
                        <Text style={[styles.benefitText, { fontFamily: getFontFamily('body') }]}>
                          {benefit.name || 'Benefit'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Instructor */}
              <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('bold') }]}>
                Instructor:
              </Text>
              <View style={styles.instructorContainer}>
                <Image
                  source={{
                    uri: coachData?.cropped_instructor_image_url || 'https://randomuser.me/api/portraits/men/32.jpg'
                  }}
                  style={styles.instructorImage}
                />
                <Text style={[styles.instructorName, { fontFamily: getFontFamily('bold') }]}>
                  {coachData?.instructor_name || 'Instructor Name Not Available'}
                </Text>
              </View>

              {/* CTA Button */}
              <TouchableOpacity style={styles.ctaButton} onPress={handleStartIntakeForm}>
                <Text style={[styles.ctaButtonText, { fontFamily: getFontFamily('bold') }]}>
                  Start Intake Form
                </Text>
              </TouchableOpacity>
            </>
          ) : ( !isLoading &&
            <View style={styles.noDataContainer}>
              <Text style={[styles.noDataText, { fontFamily: getFontFamily('body') }]}>
                No coach information available
              </Text>
            </View>
          )}
        </View>
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
        <TouchableOpacity style={styles.navItem}>
          <MyCoachIcon width={24} height={24} />
          <Text style={[styles.navText, styles.activeNavText, { fontFamily: getFontFamily('body') }]}>My Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Courses')}>
          <CoursesIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Courses</Text>
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
      <SideMenu 
        isVisible={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        navigation={navigation}
      />
    </View>
      {isLoading && (
        <Loader value='Loading coach information...' />
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
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
  },
  content: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 16,
  },
  benefitsList: {
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
  instructorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  instructorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  instructorName: {
    fontSize: 18,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    backgroundColor: '#F0F0F0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    fontFamily: getFontFamily('body'),
  },
  ctaButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 0,
    marginBottom: 20,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
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
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 15,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
    fontFamily: getFontFamily('bold'),
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },

});

export default MyCoachScreen;