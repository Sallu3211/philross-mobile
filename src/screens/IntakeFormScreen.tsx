import React, { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import ScreenHeader from '../components/ui/ScreenHeader';
import { Check } from '../components/ui/icons';
import { submitIntakeForm } from '../../app/helpers/ApiHelper';
import { countryCodes, phoneLengthRules } from '../data/countryCodes';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MODES = ['In-person', 'Virtual'];

type Errors = Partial<
  Record<'fitnessGoals' | 'availability' | 'city' | 'state' | 'phoneNumber', string>
>;

/** Longest matching dial code wins, so +1 does not shadow +12xx. */
const detectCountryCode = (phone: string): string => {
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.startsWith('+')) {
    const sorted = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
    for (const country of sorted) {
      if (clean.startsWith(country.code)) return country.code;
    }
  }
  return '+1';
};

const extractPhoneNumber = (phone: string): string => {
  const code = detectCountryCode(phone);
  const clean = phone.replace(/[^\d+]/g, '');
  return clean.startsWith('+') ? clean.substring(code.length) : clean;
};

const validatePhoneNumber = (phone: string): boolean => {
  const digits = extractPhoneNumber(phone);
  const rules = phoneLengthRules[detectCountryCode(phone)];
  if (!rules) return digits.length >= 7 && digits.length <= 15;
  return digits.length >= rules.min && digits.length <= rules.max;
};

const IntakeFormScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [fitnessGoals, setFitnessGoals] = useState('');
  const [availability, setAvailability] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trainingPreference, setTrainingPreference] = useState('In-person');
  const [injuries, setInjuries] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: keyof Errors) =>
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const toggleDay = (day: string) => {
    clearError('availability');
    setAvailability(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = async () => {
    // Every problem at once, marked at the field. The old screen fired one
    // Alert per rule, so a form with three gaps took three round-trips.
    const next: Errors = {};
    if (!fitnessGoals.trim()) next.fitnessGoals = 'Tell us what you are working towards.';
    if (availability.length === 0) next.availability = 'Pick at least one day.';
    if (!city.trim()) next.city = 'Required';
    if (!state.trim()) next.state = 'Required';
    if (!phoneNumber.trim()) {
      next.phoneNumber = 'We need a number to reach you on.';
    } else if (!validatePhoneNumber(phoneNumber)) {
      const code = detectCountryCode(phoneNumber);
      next.phoneNumber = `That does not look like a valid ${code} number.`;
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await submitIntakeForm(
        {
          phone_number: `${detectCountryCode(phoneNumber)}${extractPhoneNumber(phoneNumber)}`,
          training_days: availability,
          city: city.trim(),
          state: state.trim(),
          training_mode:
            trainingPreference === 'In-person' ? 'in_person' : 'virtual',
          additional_info: additionalInfo || 'None',
          medical_conditions: injuries || 'None',
          primary_fitness_goals: fitnessGoals,
        },
        navigation,
      );

      if (response?.status || response?.success) {
        // The confirmation screen says the same thing with more room, so
        // there is no Alert in between.
        navigation.replace('ApplicationConfirmation');
      } else {
        Alert.alert(
          'Not sent',
          response?.message || 'We could not send your application. Please try again.',
        );
      }
    } catch (e) {
      Alert.alert('Not sent', 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (
    n: number,
    label: string,
    node: React.ReactNode,
    error?: string,
    hint?: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        <Text style={styles.num}>{n}. </Text>
        {label}
      </Text>
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
      {node}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.color.surface.app} />

      <ScreenHeader title="Apply" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Help us tailor your training. Your answers guide Master Phil in
            building your plan.
          </Text>

          {field(
            1,
            'What are your primary fitness goals?',
            <TextInput
              style={[styles.input, styles.area, !!errors.fitnessGoals && styles.inputBad]}
              value={fitnessGoals}
              onChangeText={t => {
                setFitnessGoals(t);
                clearError('fitnessGoals');
              }}
              placeholder="Strength, weight loss, endurance, a specific skill…"
              placeholderTextColor={theme.color.text.disabled}
              multiline
              textAlignVertical="top"
            />,
            errors.fitnessGoals,
          )}

          {field(
            2,
            'Which days are you usually free to train?',
            <View style={styles.days}>
              {DAYS.map(day => {
                const on = availability.includes(day);
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.day, on && styles.dayOn]}
                    onPress={() => toggleDay(day)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    {/* Tick as well as fill — selection should not rest on
                        colour alone. */}
                    {on && <Check size={10} color={theme.color.text.onBrand} />}
                    <Text
                      style={[styles.dayText, on && styles.dayTextOn]}
                      allowFontScaling={false}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>,
            errors.availability,
          )}

          {field(
            3,
            'Where are you based?',
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.half, !!errors.city && styles.inputBad]}
                value={city}
                onChangeText={t => {
                  setCity(t);
                  clearError('city');
                }}
                placeholder="City"
                placeholderTextColor={theme.color.text.disabled}
              />
              <TextInput
                style={[styles.input, styles.half, !!errors.state && styles.inputBad]}
                value={state}
                onChangeText={t => {
                  setState(t);
                  clearError('state');
                }}
                placeholder="State"
                placeholderTextColor={theme.color.text.disabled}
              />
            </View>,
            errors.city || errors.state,
          )}

          {field(
            4,
            'What is your phone number?',
            <TextInput
              style={[styles.input, !!errors.phoneNumber && styles.inputBad]}
              value={phoneNumber}
              onChangeText={t => {
                setPhoneNumber(t);
                clearError('phoneNumber');
              }}
              placeholder="+1 5551234567"
              placeholderTextColor={theme.color.text.disabled}
              keyboardType="phone-pad"
              maxLength={20}
            />,
            errors.phoneNumber,
            'Include your country code — +1, +44, +91 and so on.',
          )}

          {field(
            5,
            'How do you prefer to train?',
            <View style={styles.modes}>
              {MODES.map(mode => {
                const on = trainingPreference === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.mode, on && styles.modeOn]}
                    onPress={() => setTrainingPreference(mode)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    {on && <Check size={12} color={theme.color.text.onBrand} />}
                    <Text style={[styles.modeText, on && styles.modeTextOn]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>,
          )}

          {field(
            6,
            'Any injuries or medical conditions we should know about?',
            <TextInput
              style={[styles.input, styles.area]}
              value={injuries}
              onChangeText={setInjuries}
              placeholder="Optional"
              placeholderTextColor={theme.color.text.disabled}
              multiline
              textAlignVertical="top"
            />,
          )}

          {field(
            7,
            'Anything else about your training so far?',
            <TextInput
              style={[styles.input, styles.area]}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="Optional"
              placeholderTextColor={theme.color.text.disabled}
              multiline
              textAlignVertical="top"
            />,
          )}
        </ScrollView>

        <View
          style={[
            styles.bar,
            { paddingBottom: Math.max(insets.bottom, theme.space.lg) },
          ]}
        >
          <TouchableOpacity
            style={[styles.cta, isSubmitting && styles.ctaBusy]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.9}
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <ActivityIndicator color={theme.color.text.onBrand} />
            ) : (
              <Text style={styles.ctaText}>Send application</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.surface.app },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: theme.space.screen,
    paddingBottom: theme.space['3xl'],
  },

  intro: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.secondary,
    marginBottom: theme.space.xl,
  },

  field: { marginBottom: theme.space['2xl'] },
  label: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.primary,
    marginBottom: theme.space.sm,
  },
  num: { color: theme.color.brand.base },
  hint: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: 17,
    color: theme.color.text.muted,
    marginBottom: theme.space.sm,
  },
  error: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.brand.base,
    marginTop: theme.space.xs,
  },

  input: {
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: 48,
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
  },
  inputBad: { borderColor: theme.color.brand.base },
  area: { minHeight: 104, paddingTop: theme.space.md },

  row: { flexDirection: 'row', gap: theme.space.md },
  half: { flex: 1 },

  days: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
  day: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.space.md,
    minHeight: 38,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  dayOn: {
    backgroundColor: theme.color.brand.base,
    borderColor: theme.color.brand.base,
  },
  dayText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.secondary,
    includeFontPadding: false,
  },
  dayTextOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.onBrand,
  },

  modes: { flexDirection: 'row', gap: theme.space.md },
  mode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.space.xs,
    minHeight: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surface.card,
    borderWidth: 1,
    borderColor: theme.color.border.subtle,
  },
  modeOn: {
    backgroundColor: theme.color.brand.base,
    borderColor: theme.color.brand.base,
  },
  modeText: {
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.secondary,
  },
  modeTextOn: {
    fontFamily: theme.font.semibold,
    color: theme.color.text.onBrand,
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
  ctaBusy: { opacity: 0.7 },
  ctaText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.onBrand,
  },
});

export default IntakeFormScreen;
