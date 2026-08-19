/**
 * MyCoachScreen — the one-to-one coaching offer.
 *
 * The previous version was a stack of paragraphs with an "Apply" button at the
 * end. It never said what coaching actually *is* here, or what happens after
 * you apply, which is the one thing somebody weighing a personal programme
 * needs to know. That gap is why it read as thin rather than as an offer.
 *
 * So the page now answers, in order:
 *   who    a cinematic hero — Phil's face, his headline over it
 *   what   his description, then what you get, as ticked rows
 *   how    three numbered steps: apply, he reviews, you get your plan
 *   who    the coach card, so it is a person and not a product
 *   act    a pinned CTA that stays reachable however long the copy runs
 *
 * The "how it works" steps are written here rather than fetched: the API has
 * no field for them, and a promise about response time belongs somewhere a
 * human reviews it.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import SideMenu from '../components/SideMenu';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { ErrorState, LoadingState } from '../components/ui/StateView';
import { Check, Coach, Mail, User } from '../components/ui/icons';
import { getCoachList } from '../../app/helpers/ApiHelper';

/** What happens after you tap apply. The API carries none of this. */
const STEPS = [
  {
    n: '1',
    title: 'Tell us about your training',
    body: 'A short form — your goals, your schedule, anything we should train around.',
  },
  {
    n: '2',
    title: 'Phil’s team reviews it',
    body: 'You hear back within 24 to 48 hours, from a person, not an autoresponder.',
  },
  {
    n: '3',
    title: 'You get your plan',
    body: 'Built around what you actually have — your kit, your time, your body.',
  },
];

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

const MyCoachScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [showSideMenu, setShowSideMenu] = useState(false);
  const [coachData, setCoachData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoachData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await getCoachList(navigation);

      if (response?.status || response?.success) {
        setCoachData(response.data);
      } else {
        setError('We could not load coaching details.');
      }
    } catch (e) {
      setError('We could not load coaching details.');
    } finally {
      setIsLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchCoachData();
  }, [fetchCoachData]);

  const handleStartIntakeForm = () => {
    if (!coachData?.id) {
      Alert.alert('Unavailable', 'Coaching applications are not open yet.');
      return;
    }
    navigation.navigate('IntakeForm', {
      coachId: coachData.id,
      coachSlug: coachData.slug,
      instructorEmail: coachData?.instructor_email ?? '',
      instructorName: coachData?.instructor_name,
    });
  };

  /**
   * key_benefits arrives three ways depending on who entered it: an array of
   * objects with a name, an array of strings, or one blob of bullet-separated
   * prose. All three end up as a list of lines.
   */
  const benefits: string[] = (() => {
    const raw = coachData?.key_benefits;
    if (Array.isArray(raw)) {
      return raw.map((b: any) => plain(b?.name ?? b)).filter(Boolean);
    }
    return plain(raw)
      .split('\n')
      .map(s => s.replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  })();

  const hero = coachData?.cropped_image_url;
  // Stripped: the CMS wraps rich-text fields in tags, which is how the
  // About page ended up printing '<h2 style=…>' across its own title.
  const headline =
    plain(coachData?.headline) || 'Train one to one with Master Phil';
  const description = plain(coachData?.description);
  const coachName = coachData?.instructor_name || 'Master Phil Ross';
  const coachPhoto = coachData?.cropped_instructor_image_url;

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
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Headline sits *in* the image, not under it. A programme this
                personal should lead with the person, and stacking the two
                left the page opening on a floating picture. */}
            <View style={styles.hero}>
              {hero ? (
                <Image source={{ uri: hero }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.heroEmpty]}>
                  <Coach size={44} color="rgba(255,255,255,0.35)" />
                </View>
              )}

              {/* Scrim, bottom-weighted, so the text has something to sit on
                  whatever the photo happens to be. */}
              <LinearGradient
                colors={['transparent', 'rgba(10,10,11,0.35)', 'rgba(10,10,11,0.92)']}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.heroText}>
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>ONE TO ONE COACHING</Text>
                </View>
                <Text style={styles.heroTitle}>{headline}</Text>
              </View>
            </View>

            {!!description && <Text style={styles.body}>{description}</Text>}

            {benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>What you get</Text>
                <View style={styles.benefitCard}>
                  {benefits.map((b, i) => (
                    <View
                      key={b}
                      style={[styles.benefitRow, i > 0 && styles.benefitDivided]}
                    >
                      <View style={styles.tick}>
                        <Check size={11} color={theme.color.text.inverse} />
                      </View>
                      <Text style={styles.benefitText}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How it works</Text>
              {STEPS.map((step, i) => (
                <View key={step.n} style={styles.step}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepDot}>
                      <Text style={styles.stepNum} allowFontScaling={false}>
                        {step.n}
                      </Text>
                    </View>
                    {/* Line connects to the next dot, so the three read as a
                        sequence rather than three unrelated cards. */}
                    {i < STEPS.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepBody}>{step.body}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Your coach</Text>
              <View style={styles.coachCard}>
                {coachPhoto ? (
                  <Image source={{ uri: coachPhoto }} style={styles.coachAvatar} />
                ) : (
                  <View style={[styles.coachAvatar, styles.coachAvatarFallback]}>
                    <User size={22} color={theme.color.text.inverse} />
                  </View>
                )}
                <View style={styles.coachText}>
                  <Text style={styles.coachName} numberOfLines={1}>
                    {coachName}
                  </Text>
                  <Text style={styles.coachRole}>
                    BodyBell Method® · Kettlebell &amp; combat arts
                  </Text>
                </View>
              </View>

              {!!coachData?.instructor_email && (
                <View style={styles.contactRow}>
                  <Mail size={14} color={theme.color.text.muted} />
                  <Text style={styles.contactText} numberOfLines={1}>
                    {coachData.instructor_email}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View
            style={[
              styles.bar,
              { paddingBottom: Math.max(insets.bottom, theme.space.lg) },
            ]}
          >
            <TouchableOpacity
              style={styles.cta}
              onPress={handleStartIntakeForm}
              activeOpacity={0.9}
              accessibilityRole="button"
            >
              <Text style={styles.ctaText}>Apply for coaching</Text>
            </TouchableOpacity>
            <Text style={styles.fine}>
              Takes about two minutes. No payment at this stage.
            </Text>
          </View>
        </>
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
    paddingBottom: theme.space['4xl'],
  },

  /**
   * 3:2, not 4:5.
   *
   * The frame was portrait while the source image is cropped 16:9 landscape on
   * the server (`main_image_crop = "800x450"`). A portrait frame with `cover`
   * therefore threw away most of the width and enlarged what was left — which
   * is both why it filled the screen and why it read as too big. 3:2 is close
   * enough to the real crop to keep the subject, and drops the frame from
   * roughly 415pt tall to 220pt on a 360dp phone.
   */
  hero: {
    width: '100%',
    aspectRatio: 3 / 2,
    maxHeight: 280,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.color.surface.hero,
    justifyContent: 'flex-end',
  },
  heroEmpty: {
    backgroundColor: theme.color.surface.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { padding: theme.space.xl },
  heroTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.color.brand.base,
    marginBottom: theme.space.md,
  },
  heroTagText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: 0.8,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  heroTitle: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.display.fontSize,
    lineHeight: theme.type.display.lineHeight,
    letterSpacing: theme.type.display.letterSpacing,
    color: theme.color.text.inverse,
  },

  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.body.fontSize,
    lineHeight: 24,
    color: theme.color.text.secondary,
    marginTop: theme.space.xl,
  },

  section: { marginTop: theme.space['2xl'] },
  sectionLabel: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.overline.fontSize,
    letterSpacing: theme.type.overline.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.text.muted,
    marginBottom: theme.space.md,
  },

  benefitCard: {
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    paddingHorizontal: theme.space.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.md,
    paddingVertical: theme.space.lg,
  },
  benefitDivided: {
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  tick: {
    width: 20,
    height: 20,
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
    lineHeight: 21,
    color: theme.color.text.secondary,
  },

  step: { flexDirection: 'row', gap: theme.space.lg },
  /** Fixed-width rail keeps the dots on one axis and carries the line. */
  stepRail: { width: 30, alignItems: 'center' },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.color.border.subtle,
    marginVertical: 4,
  },
  stepText: { flex: 1, paddingBottom: theme.space.xl },
  stepTitle: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
    marginTop: 5,
  },
  stepBody: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 19,
    color: theme.color.text.muted,
    marginTop: 3,
  },

  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.lg,
    backgroundColor: theme.color.surface.card,
    borderRadius: 16,
    padding: theme.space.lg,
  },
  coachAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.color.neutral[200],
  },
  coachAvatarFallback: {
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coachText: { flex: 1, minWidth: 0 },
  coachName: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.primary,
  },
  coachRole: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 17,
    color: theme.color.text.muted,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    marginTop: theme.space.md,
    paddingHorizontal: theme.space.xs,
  },
  contactText: {
    flex: 1,
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },

  bar: {
    paddingHorizontal: theme.space.screen,
    paddingTop: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderTopWidth: 1,
    borderTopColor: theme.color.border.subtle,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
  },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },
  fine: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
    textAlign: 'center',
    marginTop: theme.space.sm,
  },
});

export default MyCoachScreen;
