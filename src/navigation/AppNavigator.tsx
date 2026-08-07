import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useUser } from '../context/UserContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FeedScreen from '../screens/FeedScreen';
import VideoScreen from '../screens/VideoScreen';
import EventsScreen from '../screens/EventsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import MyCoachScreen from '../screens/MyCoachScreen';
import CoursesScreen from '../screens/CoursesScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import FeedDetailsScreen from '../screens/FeedDetailsScreen';
import IntakeFormScreen from '../screens/IntakeFormScreen';
import ApplicationConfirmationScreen from '../screens/ApplicationConfirmationScreen';
import CoachDetailsScreen from '../screens/CoachDetailsScreen';
import AboutScreen from '../screens/AboutScreen';
import TestimonialsScreen from '../screens/TestimonialsScreen';
import ContactScreen from '../screens/ContactScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoggedIn, isLoading } = useUser();

  // Determine initial route based on login status.
  // Logged-in members land on the Dashboard; Feed is still reachable from it.
  // To revert the home screen, change 'Dashboard' back to 'Feed' here.
  const getInitialRoute = () => {
    if (isLoading) return 'Splash';
    return isLoggedIn ? 'Dashboard' : 'Splash';
  };

  return (
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="Video" component={VideoScreen} />
        <Stack.Screen name="Events" component={EventsScreen} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="MyCoach" component={MyCoachScreen} />
        <Stack.Screen name="Courses" component={CoursesScreen} />
        <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="FeedDetails" component={FeedDetailsScreen} />
        <Stack.Screen name="CoachDetails" component={CoachDetailsScreen} />
        <Stack.Screen name="IntakeForm" component={IntakeFormScreen} />
        <Stack.Screen name="ApplicationConfirmation" component={ApplicationConfirmationScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Testimonials" component={TestimonialsScreen} />
        <Stack.Screen name="Contact" component={ContactScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="NewPassword" component={NewPasswordScreen} />
      </Stack.Navigator>
  );
};

export default AppNavigator;
