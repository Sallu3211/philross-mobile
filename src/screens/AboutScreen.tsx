import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import DeviceInfo from 'react-native-device-info';
import TickCircleIcon from '../../assets/icons/tick-circle.svg';
import HomeIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';

const { width, height } = Dimensions.get('window');

const AboutScreen = ({ navigation }: any) => {
  const [aboutData, setAboutData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appVersion, setAppVersion] = useState<string>('');
  const [buildNumber, setBuildNumber] = useState<string>('');

  // Fetch About Us data from API and app version info
  useEffect(() => {
    fetchAboutData();
    fetchVersionInfo();
  }, []);

  const fetchAboutData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://api.philross.com/sitecontent/about-us');
      const data = await response.json();
      
      if (data.status && data.data) {
        setAboutData(data.data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersionInfo = async () => {
    try {
      const version = DeviceInfo.getVersion();
      const build = DeviceInfo.getBuildNumber();
      setAppVersion(version);
      setBuildNumber(build);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.header]}>About</Text>
          <TouchableOpacity style={styles.shareButton} />
        </View>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <View style={styles.mainImage}>
            {aboutData?.thumbnail_url ? (
              <Image 
                source={{ uri: aboutData.thumbnail_url }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>Loading Image...</Text>
              </View>
            )}
          </View>
        </View>

        {/* Biography Section */}
        <View style={styles.bioSection}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#B62020" />
              <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
                Loading About Us content...
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.nameHeading}>
                {aboutData?.heading ? 
                  aboutData.heading.replace(/<[^>]*>/g, '') : 
                  'Phil Ross'
                }
              </Text>
              
              <Text style={styles.bioText}>
                {aboutData?.content ? 
                  aboutData.content.replace(/<[^>]*>/g, '') : 
                  'Master Phil is a highly accomplished martial artist with over 50 years of experience across multiple disciplines. He holds black belts in Brazilian Jiu-Jitsu, Lethwei, Taekwondo, and Bando, and is a Master Kettlebell Instructor.'
                }
              </Text>
              
              <Text style={styles.bioText}>
                A former kickboxing and grappling champion, Division 1 wrestler, certified USA boxing coach, bodyguard, and trainer for professional athletes, law enforcement, and military special forces. His dedication to health, fitness, and self-reliance has earned him numerous accolades, including induction into the Black Belt Hall of Fame.
              </Text>
            </>
          )}
        </View>

        {/* Core Principles Section */}
        <View style={styles.principlesSection}>
          <Text style={styles.principlesHeading}>Our Core Principles</Text>
          
          <View style={styles.principlesList}>
            <View style={styles.principleItem}>
              <TickCircleIcon width={20} height={20} />
              <Text style={styles.principleText}>Discipline</Text>
            </View>
            
            <View style={styles.principleItem}>
              <TickCircleIcon width={20} height={20} />
              <Text style={styles.principleText}>Strength</Text>
            </View>
            
            <View style={styles.principleItem}>
              <TickCircleIcon width={20} height={20} />
              <Text style={styles.principleText}>Resilience</Text>
            </View>
          </View>
        </View>

        {/* Call to Action Button */}
        <TouchableOpacity 
          style={styles.exploreButton}
          onPress={() => navigation.navigate('Courses')}
        >
          <Text style={styles.exploreButtonText}>EXPLORE COURSES</Text>
        </TouchableOpacity>

        {/* App Version Information */}
        <Text style={styles.versionText}>Version {appVersion} ({buildNumber})</Text>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feed')}>
          <HomeIcon width={24} height={24} />
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
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Courses')}>
          <CoursesIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Courses</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    fontFamily: getFontFamily('heading'),
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainImage: {
    width: width * 0.92,
    height: width * 0.45,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  placeholderText: {
    color: '#888888',
    fontSize: 14,
  },
  bioSection: {
    marginBottom: 25,
  },
  nameHeading: {
    fontSize: 24,
    color: '#000000',
    marginBottom: 15,
    fontFamily: getFontFamily('bold'),
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 12,
    fontFamily: getFontFamily('body'),
  },
  principlesSection: {
    marginBottom: 25,
  },
  principlesHeading: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 15,
    fontFamily: getFontFamily('bold'),
  },
  principlesList: {
    gap: 10,
  },
  principleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  principleText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
    fontFamily: getFontFamily('body'),
  },
  exploreButton: {
    backgroundColor: '#B62020',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: getFontFamily('bold'),
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 16,
  },
  navText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
  versionText: {
    fontSize: 14,
    color: '#666666',
    fontFamily: getFontFamily('body'),
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default AboutScreen;
