import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
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
import FilterDropdown from '../components/ui/FilterDropdown';
import MediaListCard from '../components/ui/MediaListCard';
import { EmptyState, LoadingState } from '../components/ui/StateView';
import { Shop } from '../components/ui/icons';
import { getProductList, getProductCategories } from '../../app/helpers/ApiHelper';
import { pushCleverTapEvent } from '../../App';

/**
 * Rows per request. The server's default is 10 and its ceiling is 100; asking
 * for 50 fetches the whole catalogue in one round trip today while leaving
 * pagination working if it grows.
 */
const PAGE_SIZE = 50;

const ProductsScreen = ({ navigation }: any) => {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  /** Total the server reports, which is not the number loaded so far. */
  const [totalCount, setTotalCount] = useState(0);
  // Starts empty on purpose. The previous default listed Equipment / Apparel /
  // Guides / Support, none of which exist on the server — picking one returned
  // an empty list every time. A filter that cannot match anything is worse
  // than no filter, so the control simply does not render until the real
  // categories arrive.
  const [categories, setCategories] = useState<any[]>([]);
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
        setCategories([]);
      }
    } catch (error) {
      setCategories([]);
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
        // `page_size`, not `limit` — the server's paginator only reads the
        // former. See the note in getProductList.
        page_size: PAGE_SIZE,
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter if not "all"
      
      if (categoryToUse && categoryToUse !== 'all') {
        params.category = categoryToUse;
      }

      const response = await getProductList(navigation, params);

      // The endpoint answers {count, next, previous, results}, but has shipped
      // other shapes; unwrap a `data` envelope if one is there.
      const body =
        response?.results !== undefined
          ? response
          : response?.data?.results !== undefined
            ? response.data
            : response;

      // Parse products based on actual API response structure
      let newProducts: any[] = [];

      if (body?.results && Array.isArray(body.results)) {
        // Structure: { count: 19, next: ..., results: [...] }
        newProducts = body.results;
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
      
      if (typeof body?.count === 'number') setTotalCount(body.count);

      if (newProducts.length > 0) {
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }

        /**
         * The server says whether there is another page; we no longer guess.
         *
         * This used to be `newProducts.length === 20`, paired with a request
         * for `limit: 20` that the server ignored. It always came back with
         * 10, 10 never equalled 20, so "there is more" was false after the
         * very first page and the remaining nine products — including the
         * Level 1 certification and most of the books — could not be reached
         * by scrolling at all.
         */
        setHasMoreProducts(
          body?.next != null ? true : newProducts.length >= PAGE_SIZE,
        );
        setCurrentPage(page);
      } else {
        setHasMoreProducts(false);
        if (!append) {
          setProducts([]);
          setTotalCount(0);
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

  /**
   * Tapping a product now opens its page in the app.
   *
   * It used to fire straight out to Amazon or Stripe. That gave the shopper no
   * chance to read the description, no price in context, no share, and no way
   * to ring Phil before buying — and it dropped them into a browser from a
   * single tap, which reads as the app breaking rather than a link opening.
   * The detail screen carries the buy button; leaving is now a second,
   * deliberate tap.
   */
  const handleProductClick = (product: any) => {
    const slug = product?.slug ?? product?.id;

    if (slug) {
      navigation.navigate('ProductDetails', { productSlug: String(slug) });
      return;
    }

    // No slug means the detail endpoint has nothing to look up. Falling back
    // to the old behaviour beats a dead tap.
    if (product?.destination_link) {
      Linking.openURL(product.destination_link).catch(() =>
        Alert.alert('Link Error', 'Cannot open this link. Please try again later.'),
      );
      return;
    }

    Alert.alert('Unavailable', 'This product does not have a page yet.');
  };

  const categoryOptions = categories
    .filter((c: any) => (c?.id ?? c?.slug) !== 'all')
    .map((c: any) => ({
      id: String(c?.id ?? c?.slug),
      label: String(c?.label ?? c?.name ?? c?.slug ?? ''),
    }));

  const selectCategory = (id: string) => {
    // The dropdown reports its own "all" row, so there is no toggle-off case
    // to second-guess here — whatever it says is the new selection.
    setSelectedCategory(id);
    setCurrentPage(1);
    setProducts([]);
    fetchProducts(1, false, id);
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
          // The server's total, not how many have been scrolled into view —
          // the header used to read "10 items" for a catalogue of nineteen.
          totalCount > 0
            ? `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`
            : undefined
        }
        onMenu={() => setShowSideMenu(true)}
      />

      {/* Search and filter share one row and one baseline. They used to be two
          stacked bands at different widths — the search inset by the screen
          padding, the chips scrolling edge to edge — which is the misalignment
          that was reported. Both now sit inside the same padded row and both
          are 46pt tall, so their tops and bottoms line up exactly. */}
      <View style={styles.controls}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchInputChange}
          onSubmit={handleSearch}
          placeholder="Search books and gear"
          style={styles.search}
        />

        {categoryOptions.length > 0 && (
          <FilterDropdown
            options={categoryOptions}
            selected={selectedCategory}
            onSelect={selectCategory}
            allLabel="All products"
            placeholder="Filter"
            title="Category"
            style={styles.filter}
          />
        )}
      </View>

      {isLoading && products.length === 0 ? (
        <LoadingState label="Loading products" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item: any, i) => String(item?.id ?? i)}
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
            <MediaListCard
              // The API has no `title` field — the model calls it `headline`.
              // Reading `title` meant every card in the list said "Untitled".
              title={item?.headline ?? item?.title ?? 'Untitled'}
              body={item?.description}
              // The uncropped original, not `cropped_image_url`. That one is
              // generated to 800x450 from a crop box set in the admin, and the
              // box is destructive here: the kettlebell shots are 853x1280 and
              // it keeps y400-880, the book covers are 311x466 and it keeps
              // y146-320. About three fifths of every portrait product is
              // thrown away, which is why the artwork looked so zoomed in.
              imageUrl={item?.image_url ?? item?.cropped_image_url}
              // Fitted whole, on a white ground — a book cover with its title
              // cropped off is not a book cover.
              imageFit="contain"
              price={money(item?.price)}
              onPress={() => handleProductClick(item)}
            />
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space.lg,
  },
  /** Takes the row; minWidth:0 lets it actually shrink beside the filter. */
  search: { flex: 1, minWidth: 0 },
  /** Wide enough for "Fitness Equipment" without stealing the search field. */
  filter: { width: 132 },
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
