import React, { useState, useEffect } from 'react';
import {
  Alert,
  Image,
  ScrollView,
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
import { ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, ChevronRight, Coach } from '../components/ui/icons';
import { getCoachList } from '../../app/helpers/ApiHelper';

const MyCoachScreen = ({ navigation }: any) => {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [coachData, setCoachData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch coach data on component mount
  useEffect(() => {
    fetchCoachData();
    // Mount-only; fetchCoachData closes over state it also sets.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    } catch (e) {
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
      
    } catch (e) {
      console.error('Error starting intake form:', e);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const plain = (html: unknown): string =>
    String(html ?? '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;|&rsquo;/g, '’')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  /** key_benefits arrives as an array, or as newline/bullet separated prose. */
  const benefits: string[] = Array.isArray(coachData?.key_benefits)
    ? coachData.key_benefits.map((b: any) => plain(b)).filter(Boolean)
    : plain(coachData?.key_benefits)
        .split('\n')
        .map(s => s.replace(/^[-•*]\s*/, '').trim())
        .filter(Boolean);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader title="My Coach" onMenu={() => setShowSideMenu(true)} />

      {isLoading ? (
        <LoadingState label="Loading" />
      ) : error || !coachData ? (
        <ErrorState
          message={error ?? 'We could not load coaching details.'}
          onRetry={fetchCoachData}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {!!coachData?.cropped_image_url && (
            <Image
              source={{ uri: coachData.cropped_image_url }}
              style={styles.hero}
              resizeMode="cover"
            />
          )}

          <Text style={styles.headline}>
            {coachData?.headline || 'Train one to one with Master Phil'}
          </Text>

          {!!plain(coachData?.description) && (
            <Text style={styles.body}>{plain(coachData.description)}</Text>
          )}

          {benefits.length > 0 && (
            <View style={styles.benefits}>
              <Text style={styles.sectionLabel}>What you get</Text>
              {benefits.map(b => (
                <View key={b} style={styles.benefitRow}>
                  <View style={styles.tick}>
                    <Check size={11} color={theme.color.text.inverse} />
                  </View>
                  <Text style={styles.benefitText}>{b}</Text>
                </View>
              ))}
            </View>
          )}

          {/* The coach's own card — a name and face make a one-to-one
              programme feel like a person rather than a product. */}
          {(coachData?.instructor_name || coachData?.cropped_instructor_image_url) && (
            <View style={styles.coachCard}>
              {coachData?.cropped_instructor_image_url ? (
                <Image
                  source={{ uri: coachData.cropped_instructor_image_url }}
                  style={styles.coachAvatar}
                />
              ) : (
                <View style={[styles.coachAvatar, styles.coachAvatarFallback]}>
                  <Coach size={20} color={theme.color.text.inverse} />
                </View>
              )}
              <View style={styles.coachText}>
                <Text style={styles.coachName} numberOfLines={1}>
                  {coachData?.instructor_name ?? 'Master Phil Ross'}
                </Text>
                <Text style={styles.coachRole}>Your coach</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.cta}
            onPress={handleStartIntakeForm}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>Apply for coaching</Text>
            <ChevronRight size={16} color={theme.color.text.onBrand} />
          </TouchableOpacity>

          <Text style={styles.fine}>
            Tell us about your training and goals. Phil's team will get back to you.
          </Text>
        </ScrollView>
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
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['5xl'],
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: theme.color.neutral[200],
    marginBottom: theme.space.xl,
  },
  headline: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 23,
    color: theme.color.text.secondary,
    marginTop: theme.space.md,
  },

  benefits: { marginTop: theme.space['2xl'], gap: theme.space.md },
  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md },
  tick: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: theme.color.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  benefitText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
  },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.lg,
    marginTop: theme.space['2xl'],
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.color.neutral[200],
  },
  coachAvatarFallback: {
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachText: { flex: 1, minWidth: 0 },
  coachName: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.primary,
  },
  coachRole: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    marginTop: 1,
  },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.sm,
    backgroundColor: theme.color.brand.base,
    borderRadius: theme.radius.md,
    minHeight: 54,
    marginTop: theme.space['2xl'],
  },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },
  fine: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 18,
    color: theme.color.text.muted,
    textAlign: 'center',
    marginTop: theme.space.md,
  },
});

export default MyCoachScreen;
