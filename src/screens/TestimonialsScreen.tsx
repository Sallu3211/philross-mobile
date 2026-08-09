import React, { useState, useEffect } from 'react';
import {
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { EmptyState, LoadingState } from '../components/ui/StateView';
import { Star } from '../components/ui/icons';

const TestimonialsScreen = ({ navigation }: any) => {
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader
        title="Testimonials"
        subtitle={
          testimonials.length > 0
            ? `${testimonials.length} from the community`
            : undefined
        }
        onBack={() => navigation.goBack()}
      />

      {isLoading ? (
        <LoadingState label="Loading testimonials" />
      ) : (
        <FlatList
          data={testimonials}
          keyExtractor={(item: any, i) => String(item?.id ?? i)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={Star}
              title="No testimonials yet"
              body="Stories from Phil's students will appear here."
            />
          }
          renderItem={({ item }: any) => {
            const name = item?.name ?? item?.author ?? 'Student';
            const quote = item?.message ?? item?.text ?? '';
            const photo = item?.photo_url ?? item?.avatar;

            return (
              <View style={styles.card}>
                {/* Oversized quote mark, set behind the text — the page is
                    entirely words, so it needs one piece of visual furniture. */}
                <Text style={styles.quoteMark}>&ldquo;</Text>

                <Text style={styles.quote}>{quote}</Text>

                <View style={styles.person}>
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarLetter} allowFontScaling={false}>
                        {String(name).trim().charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  list: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
    gap: theme.space.md,
  },
  card: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.xl,
    paddingTop: theme.space.lg,
    overflow: 'hidden',
  },
  quoteMark: {
    fontFamily: theme.font.bold,
    fontSize: 56,
    lineHeight: 56,
    color: theme.color.brand.subtle,
    marginBottom: -theme.space['2xl'],
  },
  quote: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 22,
    color: theme.color.text.primary,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    marginTop: theme.space.xl,
    paddingTop: theme.space.lg,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFallback: {
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  name: {
    flex: 1,
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
  },
});

export default TestimonialsScreen;
