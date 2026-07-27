import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { getFontFamily, getColors } from '../utils/platform';
import PhilrossLogo from '../../assets/icons/logo_master.png';
import InfoIcon from '../../assets/icons/info-circle.svg';
import QuoteIcon from '../../assets/icons/quote-down-circle.svg';
import YouTubeIcon from '../../assets/icons/si_youtube-line.svg';
import BookIcon from '../../assets/icons/solar_book-broken.svg';
import CallIcon from '../../assets/icons/call.svg';
import CloseCircleIcon from '../../assets/icons/close-circle.svg';
import ExportIcon from '../../assets/icons/export.svg';
import DeleteIcon from '../../assets/icons/delete.svg';
import { useUser } from '../context/UserContext';
import { deleteAccount } from '../../app/helpers/ApiHelper';
import { CommonActions } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

interface SideMenuProps {
  isVisible: boolean;
  onClose: () => void;
  navigation: any;
}

const SideMenu = ({ isVisible, onClose, navigation }: SideMenuProps) => {
  const colors = getColors();
  const { user, logout, isLoggedIn } = useUser();

  const handleLogout = async () => {
    await logout();
    onClose();
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }], }));
  };

  const handleExternalLink = async (url: string) => {
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

  const menuItems = [
    { id: 1, title: 'About', icon: InfoIcon, hasExternalLink: false },
    { id: 2, title: 'Testimonials', icon: QuoteIcon, hasExternalLink: false },
    { id: 3, title: 'YouTube', icon: YouTubeIcon, hasExternalLink: true },
    { id: 4, title: 'Books', icon: BookIcon, hasExternalLink: true },
    { id: 5, title: 'Contact', icon: CallIcon, hasExternalLink: false },
    { id: 6, title: 'Delete Account', icon: DeleteIcon, hasExternalLink: false },
  ];

  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.menuContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CloseCircleIcon width={70} height={70} />
        </TouchableOpacity>

        {/* Brand Logo */}
        <View style={styles.brandLogoContainer}>
          <Image source={PhilrossLogo} style={{ width: 48, height: 48, borderRadius: 10 }} resizeMode="contain" />
        </View>

        {/* User Profile Section */}
        {isLoggedIn && user && (
          <View style={styles.userProfileSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { fontFamily: getFontFamily('bold') }]}>
                {user.fullName || 'User'}
              </Text>
              <Text style={[styles.userEmail, { fontFamily: getFontFamily('body') }]}>
                {user.email}
              </Text>
            </View>
          </View>
        )}

        {/* Menu Header */}
        <Text style={[styles.menuHeader, { fontFamily: getFontFamily('body') }]}>
          MAIN MENU
        </Text>

        {/* Menu Items */}
        <View style={styles.menuItems}>
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => {
                if (item.title === 'About') {
                  navigation.navigate('About');
                  onClose();
                } else if (item.title === 'Testimonials') {
                  navigation.navigate('Testimonials');
                  onClose();
                } else if (item.title === 'YouTube') {
                  handleExternalLink('https://www.youtube.com/@TheMasterPhil');
                } else if (item.title === 'Books') {
                  handleExternalLink('https://philross.com/books');
                } else if (item.title === 'Contact') {
                  navigation.navigate('Contact');
                  onClose();
                } else if (item.title === 'Delete Account') {
                  Alert.alert(
                    "Delete Account",
                    "Are you sure you want to permanently delete your account? This action cannot be undone.",
                    [
                      { text: "Cancel", style: "cancel", },
                      { text: "Delete", style: "destructive", onPress: () => { apiCall(); }, },
                    ],
                    { cancelable: true }
                  );
                  const onDelete = () => {
                    logout();
                    onClose();
                    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }], }));
                  }
                  const apiCall = async () => {
                    const response: any = await deleteAccount(navigation);
                    if (response?.status) {
                      onDelete();
                    }
                  }
                }
                // Add other navigation handlers here as needed
              }}
            >
              <View style={styles.menuItemLeft}>
                <item.icon width={24} height={24} />
                <Text style={[styles.menuItemText, { fontFamily: getFontFamily('body') }]}>
                  {item.title}
                </Text>
              </View>
              {item.hasExternalLink && (
                <ExportIcon width={20} height={20} />
              )}
            </TouchableOpacity>
          ))}
          
          {/* Logout Button - Only show if user is logged in */}
          {isLoggedIn && (
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]} 
              onPress={handleLogout}
            >
              <View style={styles.menuItemLeft}>
                <Text style={[styles.menuItemText, styles.logoutText, { fontFamily: getFontFamily('body') }]}>
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: width * 0.8,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 30,
    position: 'relative',
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    left: 0,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 80 : 60,
    right: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1001,
  },
  brandLogoContainer: {
    alignItems: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  menuHeader: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'left',
  },
  menuItems: {
    gap: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 15,
    fontFamily: getFontFamily('body'),
  },
  logoutItem: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    paddingBottom: 12,
    marginHorizontal: 10,
  },
  logoutText: {
    color: '#B62020',
    fontFamily: getFontFamily('heading'),
    textAlign: 'center',
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
  },
});

export default SideMenu;
