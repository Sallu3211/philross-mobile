import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getFontFamily, getColors } from '../utils/platform';
import MenuIcon from '../../assets/icons/menu.svg';
import SideMenu from '../components/SideMenu';
import FeedIcon from '../../assets/icons/home.svg';
import EventsIcon from '../../assets/icons/calendar.svg';
import ProductsIcon from '../../assets/icons/bag-2-red.svg';
import MyCoachIcon from '../../assets/icons/weight.svg';
import CoursesIcon from '../../assets/icons/teacher.svg';
import SearchIcon from '../../assets/icons/search-normal.svg';
import { getProductList, getProductCategories } from '../../app/helpers/ApiHelper';
import { useUser } from '../context/UserContext';
import { Loader } from '../components/Loader';
import { pushCleverTapEvent } from '../../App';

const { width } = Dimensions.get('window');

const ProductsScreen = ({ navigation }: any) => {
  const colors = getColors();
  const { user, getUserInitial, isLoggedIn } = useUser();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [categories, setCategories] = useState<any[]>([
    { id: 'all', label: 'All Products', slug: 'all' },
    { id: 'equipment', label: 'Equipment', slug: 'equipment' },
    { id: 'apparel', label: 'Apparel', slug: 'apparel' },
    { id: 'guides', label: 'Guides', slug: 'guides' },
    { id: 'support', label: 'Support', slug: 'support' }
  ]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Ref for search timeout
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories and products on component mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    pushCleverTapEvent('products_viewed', {});
  }, []);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  // Debug selectedCategory changes
  useEffect(() => {
    // selectedCategory changed
  }, [selectedCategory]);

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await getProductCategories(navigation);
      
      if (response?.data && Array.isArray(response.data)) {
        // Add "All Products" option at the beginning
        const apiCategories = [
          { id: 'all', label: 'All Products', slug: 'all' },
          ...response.data.map((cat: any) => ({
            id: cat.slug || cat.id,
            label: cat.name || cat.label,
            slug: cat.slug || cat.id
          }))
        ];
        
        setCategories(apiCategories);
      } else if (response?.results && Array.isArray(response.results)) {
        // Alternative response structure
        const apiCategories = [
          { id: 'all', label: 'All Products', slug: 'all' },
          ...response.results.map((cat: any) => ({
            id: cat.slug || cat.id,
            label: cat.name || cat.label,
            slug: cat.slug || cat.id
          }))
        ];
        
        setCategories(apiCategories);
      } else {
        // Fallback to default categories if API fails
        setCategories([
          { id: 'all', label: 'All Products', slug: 'all' },
          { id: 'equipment', label: 'Equipment', slug: 'equipment' },
          { id: 'apparel', label: 'Apparel', slug: 'apparel' },
          { id: 'guides', label: 'Guides', slug: 'guides' },
          { id: 'support', label: 'Support', slug: 'support' }
        ]);
      }
    } catch (error) {
      // Fallback to default categories on error
      setCategories([
        { id: 'all', label: 'All Products', slug: 'all' },
        { id: 'equipment', label: 'Equipment', slug: 'equipment' },
        { id: 'apparel', label: 'Apparel', slug: 'apparel' },
        { id: 'guides', label: 'Guides', slug: 'guides' },
        { id: 'support', label: 'Support', slug: 'support' }
      ]);
    } finally {
      setIsLoadingCategories(false);
    }
  };


  // Fetch products
  const fetchProducts = async (page = 1, append = false, forceCategory?: string) => {
    try {
      setIsLoading(true);
      
      // Use forceCategory if provided, otherwise use selectedCategory
      const categoryToUse = forceCategory !== undefined ? forceCategory : selectedCategory;
      
      const params: any = {
        page: page,
        limit: 20
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter if not "all"
      
      if (categoryToUse && categoryToUse !== 'all') {
        params.category = categoryToUse;
      }

      const response = await getProductList(navigation, params);
      
      // Parse products based on actual API response structure
      let newProducts: any[] = [];
      
      if (response?.results && Array.isArray(response.results)) {
        // Structure: { count: 2, results: [...] }
        newProducts = response.results;
      } else if (response?.data && Array.isArray(response.data)) {
        // Structure: { data: [...] }
        newProducts = response.data;
      } else if (response?.status && response?.data) {
        // Structure: { status: true, data: [...] }
        newProducts = Array.isArray(response.data) ? response.data : [];
      } else if (response?.success && response?.data) {
        // Structure: { success: true, data: [...] }
        newProducts = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        // Structure: [...] (direct array)
        newProducts = response;
      } else {
        // No valid data structure found in response
      }
      
      if (newProducts.length > 0) {
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        setHasMoreProducts(newProducts.length === 20); // Assuming 20 is the page size
        setCurrentPage(page);
      } else {
        if (!append) {
          setProducts([]);
        }
      }
    } catch (error) {
      if (!append) {
        setProducts([]);
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };



  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    setHasMoreProducts(true);
    setProducts([]); // Clear current products
    fetchProducts(1, false);
  };

  // Handle search input change with debouncing
  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear products and reset pagination when search changes
    if (text.trim() !== searchQuery.trim()) {
      setCurrentPage(1);
      setHasMoreProducts(true);
      setProducts([]);
      
      // Debounce the search to avoid too many API calls
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchTimeout.current = setTimeout(() => {
        if (text.trim()) {
          setIsSearching(true);
          fetchProducts(1, false);
        } else {
          // If search is empty, fetch products without search
          setIsSearching(true);
          fetchProducts(1, false);
        }
      }, 500); // 500ms delay
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    if (!isLoading && hasMoreProducts) {
      fetchProducts(currentPage + 1, true);
    }
  };

  // Handle product click - open external link
  const handleProductClick = async (product: any) => {
    try {
            if (product.destination_link) {
        // Open external link in new tab/browser
        const supported = await Linking.canOpenURL(product.destination_link);
        
        if (supported) {
          await Linking.openURL(product.destination_link);
        } else {
          Alert.alert(
            'Link Error',
            'Cannot open this link. Please try again later.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'No Link Available',
          'This product does not have a purchase link yet.',
        [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to open product link. Please try again.',
        [{ text: 'OK' }]
      );
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
                  <Text style={[styles.title, { fontFamily: getFontFamily('bold') }]}>Products</Text>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>{isLoggedIn ? getUserInitial() : '?'}</Text>
          </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon width={20} height={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="search..."
            placeholderTextColor="#666666"
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#B62020" style={styles.searchLoading} />
          )}
          {searchQuery.trim() && !isSearching && (
            <TouchableOpacity 
              style={styles.clearSearchButton}
              onPress={() => {
                setSearchQuery('');
                setProducts([]);
                fetchProducts(1, false);
              }}
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

        {/* Category Filters */}
        <View style={styles.categoryFilters}>
          {isLoadingCategories ? (
            <View style={styles.categoryLoadingContainer}>
              <ActivityIndicator size="small" color="#B62020" />
              <Text style={[styles.categoryLoadingText, { fontFamily: getFontFamily('body') }]}>
                Loading categories...
              </Text>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContainer}
              style={styles.categoryScrollView}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.id && styles.activeCategoryButton,
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    // Reset to first page when category changes
                    setCurrentPage(1);
                    setProducts([]);
                    // Fetch products with new category - pass category directly to avoid race condition
                    fetchProducts(1, false, category.id);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.id && styles.activeCategoryText,
                      { fontFamily: getFontFamily('body') }
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Products Grid */}
      <ScrollView 
        style={styles.productsContainer} 
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            loadMoreProducts();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Search Results Header */}
        {searchQuery.trim() && products.length > 0 && (
          <View style={styles.searchResultsHeader}>
            <Text style={[styles.searchResultsText, { fontFamily: getFontFamily('bold') }]}>
              Search results for "{searchQuery}"
            </Text>
            <Text style={[styles.searchResultsCount, { fontFamily: getFontFamily('body') }]}>
              {products.length} product{products.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}
        
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.productCard}
              onPress={() => handleProductClick(product)}
            >
              <View style={styles.imageCard}>
                {product.cropped_image_url ? (
                  <Image
                    source={{ uri: product.cropped_image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Icon name="image-outline" size={40} color="#CCCCCC" />
                  </View>
                )}
              </View>
              <View style={styles.productContent}>
                <Text 
                  style={[styles.productTitle, { fontFamily: getFontFamily('bold') }]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {product.headline || product.title || 'Product Title'}
                </Text>
                <Text 
                  style={[styles.productDescription, { fontFamily: getFontFamily('body') }]}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {product.description || 'No description available'}
                </Text>
                <View style={styles.productPriceRow}>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceLabel, { fontFamily: getFontFamily('body') }]}>Price</Text>
                    <Text style={[styles.productPrice, { fontFamily: getFontFamily('bold') }]}>
                      ${parseFloat(product.price || '0').toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.shopNowButton}
                    onPress={() => handleProductClick(product)}
                  >
                    <Text style={[styles.shopNowText, { fontFamily: getFontFamily('bold') }]}>
                      Shop Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              {/* <ActivityIndicator size="large" color="#B62020" />
              <Text style={[styles.loadingText, { fontFamily: getFontFamily('body') }]}>
                Loading products...
              </Text> */}
            </View>
          )}
          
          {/* No products message */}
          {!isLoading && products.length === 0 && (
            <View style={styles.noProductsContainer}>
              <Text style={[styles.noProductsText, { fontFamily: getFontFamily('body') }]}>
                No products found
              </Text>
              <Text style={[styles.noProductsSubText, { fontFamily: getFontFamily('body') }]}>
                Try adjusting your search or category filter
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
        <TouchableOpacity style={styles.navItem}>
          <ProductsIcon width={24} height={24} />
          <Text style={[styles.navText, styles.activeNavText, { fontFamily: getFontFamily('bold') }]}>Products</Text>
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

      {/* Side Menu */}
      <SideMenu 
        isVisible={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        navigation={navigation}
      />
    </View>
      {isLoading && (
        <Loader value='Loading products...' />
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    minHeight: Platform.OS === 'ios' ? 100 : 80,
  },
  menuButton: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000000',
  },
  clearSearchButton: {
    padding: 8,
    marginRight: 5,
  },
  clearSearchText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: getFontFamily('bold'),
  },
  searchLoading: {
    marginRight: 10,
  },
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#F8F8F8',
    marginBottom: 10,
  },
  searchResultsText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 5,
  },
  searchResultsCount: {
    fontSize: 14,
    color: '#666666',
  },

  productsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 50) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContent: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between', // This ensures price section stays at bottom
  },
  productTitle: {
    fontSize: 13,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
    marginTop: 0,
  },
  productDescription: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 6,
  },
  productPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 10,
    color: '#666666',
  },
  productPrice: {
    fontSize: 16,
    fontFamily: getFontFamily('bold'),
    color: '#000000',
  },
  shopNowButton: {
    backgroundColor: '#B62020',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  shopNowText: {
    fontSize: 12,
    fontFamily: getFontFamily('bold'),
    color: '#FFFFFF',
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
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 10,
  },
  noProductsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  noProductsText: {
    fontSize: 18,
    color: '#666666',
    marginTop: 15,
    marginBottom: 8,
  },
  noProductsSubText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  categoryFilters: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 15,
  },
  categoryScrollView: {
    flexGrow: 0,
    paddingHorizontal: 20,
  },
  categoryScrollContainer: {
    paddingRight: 20, // Add right padding for last item
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 8, // Reduced from 10 to 8 for tighter spacing
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
  },
  activeCategoryButton: {
    backgroundColor: '#B62020',
    borderColor: '#B62020',
  },
  categoryText: {
    fontSize: 14,
    color: '#333333',
  },
  activeCategoryText: {
    color: '#FFFFFF',
  },
  categoryLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 10,
  },
  categoryLoadingText: {
    marginLeft: 10,
    color: '#666666',
    fontSize: 14,
  },
});

export default ProductsScreen;
