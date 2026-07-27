import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import QuoteUpIcon from '../../assets/icons/quote-up.svg';
import HomeIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';

const { width, height } = Dimensions.get('window');

const TestimonialsScreen = ({ navigation }: any) => {
  const colors = getColors();
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('https://api.philross.com/sitecontent/testimonials/');
      const data = await response.json();
      
      if (data.status && data.data && Array.isArray(data.data)) {
        setTestimonials(data.data);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  // Transform API data to match existing UI structure
  const transformedTestimonials = testimonials.map((testimonial, index) => ({
    id: index + 1,
    text: testimonial.message || 'No message available',
    author: testimonial.name || 'Anonymous',
    avatar: testimonial.photo_url ? { uri: testimonial.photo_url } : require('../../assets/icons/apple.png'),
  }));

  // Use API data if available, otherwise fall back to sample data
  const displayTestimonials = testimonials.length > 0 ? transformedTestimonials : [
    {
      id: 1,
      text: "Master Phil's guidance was life-changing. I achieved strength I never imagined!",
      author: "Sarah J.",
      avatar: require('../../assets/icons/apple.png'),
    },
    {
      id: 2,
      text: "The self-defense techniques are practical and empowering. Highly recommend!",
      author: "David M.",
      avatar: require('../../assets/icons/google.png'),
    },
  ];

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Centered Title */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeftIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={[styles.centeredTitle]}>Testimonials</Text>
        <TouchableOpacity style={styles.shareButton} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#B62020" />
            <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
              Loading testimonials...
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { fontFamily: getFontFamily('heading') }]}>
              Hear From Our Community
            </Text>

            <View style={styles.testimonialsList}>
              {displayTestimonials.map((testimonial) => (
                <View key={testimonial.id} style={styles.testimonialCard}>
                  <View style={styles.quoteIconContainer}>
                    <QuoteUpIcon width={40} height={40} />
                  </View>
                  <Text style={[styles.testimonialText, { fontFamily: getFontFamily('body') }]}>
                    {testimonial.text}
                  </Text>
                  <View style={styles.authorContainer}>
                    <View style={styles.avatarContainer}>
                      <Image source={testimonial.avatar} style={styles.avatar} resizeMode="cover" />
                    </View>
                    <Text style={[styles.authorName, { fontFamily: getFontFamily('body') }]}>
                      {testimonial.author}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>


      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Feed')}>
          <HomeIcon width={24} height={24} />
          <Text style={[styles.navText, { fontFamily: getFontFamily('body') }]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Events')}>
          <EventsIcon width={24} height={24} />
          <Text style={styles.navText}>Events</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Products')}>
          <ProductsIcon width={24} height={24} />
          <Text style={styles.navText}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyCoach')}>
          <MyCoachIcon width={24} height={24} />
          <Text style={styles.navText}>My Coach</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Courses')}>
          <CoursesIcon width={24} height={24} />
          <Text style={styles.navText}>Courses</Text>
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
    paddingHorizontal: 20,
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
  centeredTitleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: 15,
  },
  centeredTitle: {
    fontSize: 20,
    color: '#000000',
    textAlign: 'center',
    fontFamily: getFontFamily('heading'),
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 20,
    fontFamily: getFontFamily('heading'),
  },
  testimonialsList: {
    paddingVertical: 20,
    gap: 15,
    paddingBottom: 40, // Add extra bottom padding to separate from navigation
  },
  testimonialCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  quoteIconContainer: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  testimonialText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 15,
    fontFamily: getFontFamily('body'),
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 15,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorName: {
    fontSize: 14,
    color: '#000000',
    fontFamily: getFontFamily('body'),
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
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666666',
  },
});

export default TestimonialsScreen;