import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SideMenu from '../components/SideMenu';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import SearchBar from '../components/ui/SearchBar';
import FilterChips from '../components/ui/FilterChips';
import { EmptyState, LoadingState } from '../components/ui/StateView';
import { ChevronRight, Shop } from '../components/ui/icons';
import { getProductList, getProductCategories } from '../../app/helpers/ApiHelper';
import { pushCleverTapEvent } from '../../App';

const ProductsScreen = ({ navigation }: any) => {
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
  const [, setIsLoadingCategories] = useState(false);
  const [, setIsSearching] = useState(false);
  
  // Ref for search timeout
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch categories and products on component mount
  useEffect(() => {
    fetchCategories();
    fetchProducts();
    pushCleverTapEvent('products_viewed', {});
    // Mount-only: both fetchers close over state they also set, so listing them
    // here would refetch on every result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const chipOptions = categories
    .filter((c: any) => (c?.id ?? c?.slug) !== 'all')
    .map((c: any) => ({
      id: String(c?.id ?? c?.slug),
      label: String(c?.label ?? c?.name ?? c?.slug ?? ''),
    }));

  const selectCategory = (id: string) => {
    const next = selectedCategory === id ? 'all' : id;
    setSelectedCategory(next);
    setCurrentPage(1);
    fetchProducts(1, false, next);
  };

  const money = (value: unknown): string | null => {
    const n = parseFloat(String(value ?? ''));
    return Number.isFinite(n) && n > 0 ? `$${n.toFixed(n % 1 === 0 ? 0 : 2)}` : null;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Books & Gear"
        subtitle={
          products.length > 0
            ? `${products.length} ${products.length === 1 ? 'item' : 'items'}`
            : undefined
        }
        onMenu={() => setShowSideMenu(true)}
      />

      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchInputChange}
          onSubmit={handleSearch}
          placeholder="Search books and gear"
        />
      </View>

      {chipOptions.length > 0 && (
        <FilterChips
          options={chipOptions}
          selected={selectedCategory === 'all' ? [] : [selectedCategory]}
          onToggle={selectCategory}
          onClear={() => selectCategory('all')}
          allLabel="All"
          style={styles.chips}
        />
      )}

      {isLoading && products.length === 0 ? (
        <LoadingState label="Loading products" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item: any, i) => String(item?.id ?? i)}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => loadMoreProducts()}
          refreshControl={
            <RefreshControl
              refreshing={isLoading && products.length > 0}
              onRefresh={() => fetchProducts(1, false)}
              tintColor={theme.color.brand.base}
              colors={[theme.color.brand.base]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Shop}
              title={searchQuery ? 'Nothing found' : 'No products yet'}
              body={
                searchQuery
                  ? `Nothing matches "${searchQuery}". Try a different search.`
                  : "Phil's books and gear will appear here."
              }
              actionLabel={searchQuery ? 'Clear search' : undefined}
              onAction={searchQuery ? () => handleSearchInputChange('') : undefined}
            />
          }
          ListFooterComponent={
            isLoading && products.length > 0 ? (
              <View style={styles.footerLoad}>
                <ActivityIndicator color={theme.color.brand.base} />
              </View>
            ) : null
          }
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleProductClick(item)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={item?.title ?? 'Product'}
            >
              {/* Square frame with `contain`, not a cropped strip. Book covers
                  are portrait; the old fixed 100pt "cover" cut their tops off. */}
              <View style={styles.imageFrame}>
                {item?.cropped_image_url ? (
                  <Image
                    source={{ uri: item.cropped_image_url }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imageEmpty}>
                    <Shop size={26} color={theme.color.text.disabled} />
                  </View>
                )}
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item?.title ?? 'Untitled'}
                </Text>
                {!!item?.headline && (
                  <Text style={styles.cardSub} numberOfLines={2}>
                    {item.headline}
                  </Text>
                )}
                <View style={styles.cardFoot}>
                  {money(item?.price) ? (
                    <Text style={styles.price}>{money(item?.price)}</Text>
                  ) : (
                    <Text style={styles.priceMuted}>View</Text>
                  )}
                  <ChevronRight size={13} color={theme.color.text.disabled} />
                </View>
              </View>
            </TouchableOpacity>
          )}
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
    paddingBottom: theme.space.md,
  },
  chips: { marginBottom: theme.space.md },
  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.md,
  },
  column: { gap: theme.space.md },

  card: {
    flex: 1,
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    overflow: 'hidden',
  },
  /** Square, so every tile lines up regardless of the artwork's shape. */
  imageFrame: {
    aspectRatio: 1,
    backgroundColor: theme.color.neutral[0],
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space.md,
  },
  image: { width: '100%', height: '100%' },
  imageEmpty: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.surface.sunken,
    borderRadius: theme.radius.md,
  },

  cardBody: {
    padding: theme.space.lg,
    paddingTop: theme.space.md,
    gap: 3,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  cardTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight,
    color: theme.color.text.primary,
  },
  cardSub: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.overline.fontSize,
    lineHeight: 15,
    color: theme.color.text.muted,
  },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.space.sm,
  },
  price: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },
  priceMuted: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
  footerLoad: { paddingVertical: theme.space.xl },
});

export default ProductsScreen;
