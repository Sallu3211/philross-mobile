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
  Linking,
  Clipboard,
  ToastAndroid,
  Share,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontFamily, getColors } from '../utils/platform';
import ArrowLeftIcon from '../../assets/icons/arrow-left.svg';
import share from '../../assets/icons/share.png';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProductDetail } from '../../app/helpers/ApiHelper';
import FbIcon from '../../assets/icons/facebook.png';
import WhatsAppIcon from '../../assets/icons/whatsapp.png';
import InstagramIcon from '../../assets/icons/instagram.png';
import XIcon from '../../assets/icons/x_icon.png';
import TelegramIcon from '../../assets/icons/telegram.png';
import Utils from '../../app/helpers/Utilities';

const { width, height } = Dimensions.get('window');

const ProductDetailsScreen = ({ route, navigation }: any) => {
  const colors = getColors();
  const insets = useSafeAreaInsets();
  
  // Get product slug from route params
  const { productSlug } = route.params || {};
  
  // Product API state
  const [productData, setProductData] = useState<any>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Share modal state
  const [showShare, setShowShare] = useState(false);

  // Debug: Log current state
  console.log('🛍️ ProductDetailsScreen render - productSlug:', productSlug);
  console.log('🛍️ ProductDetailsScreen render - productData:', productData);
  console.log('🛍️ ProductDetailsScreen render - isLoadingProduct:', isLoadingProduct);
  console.log('🛍️ ProductDetailsScreen render - error:', error);

  // Fetch product details when component mounts
  useEffect(() => {
    if (productSlug) {
      fetchProductDetails();
    } else {
      setError('No product slug provided');
    }
  }, [productSlug]);

  // Fetch product details from API
  const fetchProductDetails = async () => {
    try {
      setIsLoadingProduct(true);
      setError(null);
      
      console.log('🔍 Fetching product details for slug:', productSlug);
      
      const response = await getProductDetail(productSlug, navigation);
      
      console.log('🛍️ Product details response:', response);
      console.log('🛍️ Response type:', typeof response);
      console.log('🛍️ Response keys:', response ? Object.keys(response) : 'No response');
      console.log('🛍️ Has success field:', !!response?.success);
      console.log('🛍️ Has data field:', !!response?.data);
      console.log('🛍️ Data type:', typeof response?.data);
      console.log('🛍️ Data content:', response?.data);
      
      let productDataToSet: any = null;
      
      // Handle the actual API response structure: {data: {...}, status: true}
      if (response?.status && response?.data) {
        console.log('✅ Setting product data from response.status + response.data');
        productDataToSet = response.data;
      } else if (response?.success && response?.data) {
        console.log('✅ Setting product data from response.success + response.data');
        productDataToSet = response.data;
      } else if (response?.data) {
        console.log('✅ Setting product data from response.data (no status/success)');
        productDataToSet = response.data;
      } else if (response && typeof response === 'object') {
        console.log('✅ Setting product data from direct response object');
        productDataToSet = response;
      } else {
        console.warn('❌ Failed to fetch product details - no valid data found:', response);
        setError('Failed to load product details');
        return;
      }
      
      console.log('🛍️ Product data to set:', productDataToSet);
      console.log('🛍️ Product data keys:', productDataToSet ? Object.keys(productDataToSet) : 'No data');
      
      setProductData(productDataToSet);
      
      // Force a re-render check
      setTimeout(() => {
        console.log('🛍️ Product data state after setState:', productData);
        console.log('🛍️ Product data state keys after setState:', productData ? Object.keys(productData) : 'No state');
      }, 100);
      
    } catch (error) {
      console.error('❌ Error fetching product details:', error);
      setError('Failed to load product details');
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleShopNow = async () => {
    if (productData?.destination_link) {
      try {
        const supported = await Linking.canOpenURL(productData.destination_link);
        if (supported) {
          await Linking.openURL(productData.destination_link);
        } else {
          Alert.alert('Error', 'Cannot open product link');
        }
      } catch (error) {
        console.error('Error opening product link:', error);
        Alert.alert('Error', 'Failed to open product link');
      }
    } else {
      Alert.alert('Error', 'Product link not available');
    }
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

  // Show loading state
  if (isLoadingProduct) {
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
          <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>Loading product details...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchProductDetails}>
            <Text style={[styles.retryButtonText, { fontFamily: getFontFamily('bold') }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show product data
  if (!productData) {
    return (
      <View style={styles.container}>
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeftIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Product Not Found</Text>
          <View style={styles.shareButton} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontFamily: getFontFamily('body') }]}>Product not found</Text>
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
          {productData?.headline || 'Product Details'}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <ShareIcon width={24} height={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {productData?.cropped_image_url ? (
            <Image 
              source={{ uri: productData.cropped_image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="image-outline" size={60} color="#CCCCCC" />
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          <Text style={[styles.productTitle, { fontFamily: getFontFamily('heading') }]}>
            {productData?.headline || 'Product Title'}
          </Text>
          <Text style={[styles.productPrice, { fontFamily: getFontFamily('bold') }]}>
            ${parseFloat(productData?.price || '0').toFixed(2)}
          </Text>
          <Text style={[styles.productDescription, { fontFamily: getFontFamily('body') }]}>
            {productData?.description || 'No description available'}
          </Text>
        </View>

        {/* Shop Now Button */}
        <TouchableOpacity 
          style={styles.shopNowButton} 
          onPress={handleShopNow}
        >
          <Text style={[styles.shopNowButtonText, { fontFamily: getFontFamily('bold') }]}>
            SHOP NOW
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Share Modal */}
      {showShare && (
        <View style={styles.shareOverlay}>
          <View style={[styles.shareModal, { paddingBottom: insets.bottom }]}>
            <View style={styles.shareHeader}>
              <TouchableOpacity onPress={() => setShowShare(false)}>
                <Icon name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.shareContent}>
              <View style={styles.shareIconContainer}>
                <View style={styles.shareIcon}>
                  <Image source={share} style={{ height: 40, width: 40 }} />
                </View>
              </View>
              <Text style={[styles.shareTitle, { fontFamily: getFontFamily('bold') }]}>Share Product</Text>
              
              <View style={styles.shareLinkSection}>
                <Text style={[styles.shareSectionTitle, { fontFamily: getFontFamily('bold') }]}>Share your link</Text>
                <View style={styles.linkContainer}>
                  <Text style={[styles.linkText, { fontFamily: getFontFamily('body') }]}>
                    {productData?.slug ? `https://philrossapp.link/product/${productData.slug}` : 'https://philrossapp.link/product'}
                  </Text>
                  <TouchableOpacity style={styles.copyButton}>
                    <Icon name="copy-outline" size={20} color="#666666" />
                  </TouchableOpacity>
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
  imageContainer: {
    width: '100%',
    height: 300,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoContainer: {
    padding: 20,
  },
  productTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 10,
  },
  productPrice: {
    fontSize: 28,
    fontFamily: getFontFamily('bold'),
    color: '#B62020',
    marginBottom: 15,
  },
  productDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  shopNowButton: {
    backgroundColor: '#B62020',
    borderRadius: 30,
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  shopNowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
  shareOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
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
  shareContent: {
    padding: 20,
    alignItems: 'center',
  },
  shareIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#B62020',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareIcon: {
    width: 40,
    height: 40,
  },
  shareTitle: {
    fontSize: 24,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginBottom: 20,
  },
  shareLinkSection: {
    width: '100%',
    marginBottom: 20,
  },
  shareSectionTitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 10,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    padding: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    paddingRight: 10,
  },
  copyButton: {
    padding: 5,
  },
  shareToSection: {
    width: '100%',
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  socialIcons: {
    width: Utils.normalize(48),
    height: Utils.normalize(48),
  },
});

export default ProductDetailsScreen;
