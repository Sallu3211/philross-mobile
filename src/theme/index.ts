/**
 * Master Phil — Design System
 * ---------------------------------------------------------------------------
 * Single source of truth for colour, type, spacing, radius and elevation.
 * Import from here instead of hardcoding hex values in screens.
 *
 *   import { theme } from '../theme';
 *   <View style={{ backgroundColor: theme.color.surface.card }} />
 *
 * COLOUR NOTES
 * The accent + status set was validated for colour-vision deficiency using the
 * dataviz palette validator. The original success green (#15803D) failed
 * against the brand red at ΔE 3.9 under deuteranopia — red/green colourblind
 * users could not tell "brand" from "completed" apart. It was replaced with a
 * teal (#0D9488), which passes at ΔE 12.5.
 *
 * Light surface — all six checks PASS
 *   #B62020, #0D9488, #C2851A, #2563EB
 * Dark surface — all six checks PASS
 *   #DC5A5A, #0FA396, #BE8A22, #4A8FE8
 *
 * Do not add a status colour without re-running the validator.
 */

import { Platform } from 'react-native';

/* ── Brand ramp ─────────────────────────────────────────────────────────────
 * Single hue, light → dark. Used for meters (track = 100, fill = 600) so a
 * progress ring reads as one hue at two depths rather than two competing hues.
 */
const red = {
  50: '#FDF3F3',
  100: '#F7E0E0',
  200: '#EFC0C0',
  300: '#E09292',
  400: '#CC5A5A',
  500: '#C13232',
  600: '#B62020', // brand
  700: '#8E1818',
  800: '#661111',
  900: '#3D0A0A',
} as const;

/* ── Neutral ramp ─────────────────────────────────────────────────────────── */
const neutral = {
  0: '#FFFFFF',
  25: '#FCFCFD',
  50: '#F7F7F8',
  100: '#F0F0F2',
  200: '#E4E4E7',
  300: '#D1D1D6',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#0F0F11',
} as const;

export const theme = {
  color: {
    /** Brand accent — primary actions, meters, active states. */
    brand: {
      ramp: red,
      base: red[600],
      pressed: red[700],
      subtle: red[50],
      border: red[200],
      /** Meter track: same hue as the fill, light step. Never grey. */
      track: red[100],
      onBrand: neutral[0],
    },

    /** Reserved status colours. Always ship with an icon + label — never colour alone. */
    status: {
      success: '#0D9488',
      successSubtle: '#ECFDF9',
      successOnDark: '#0FA396',

      warning: '#C2851A',
      warningSubtle: '#FDF6E7',
      warningOnDark: '#BE8A22',

      info: '#2563EB',
      infoSubtle: '#EFF4FF',
      infoOnDark: '#4A8FE8',

      /** Locked / paywalled content. Neutral on purpose — locking is not an error. */
      locked: neutral[400],
      lockedSubtle: neutral[100],
    },

    /** Surfaces, lightest → darkest. */
    surface: {
      app: neutral[50],
      card: neutral[0],
      raised: neutral[25],
      sunken: neutral[100],
      /** Dark hero card — makes the brand red pop without shouting. */
      hero: '#1A1A19',
      heroRaised: '#242427',
      overlay: 'rgba(15,15,17,0.55)',
    },

    /** Text tokens. Values and labels wear these, never a series colour. */
    text: {
      primary: neutral[900],
      secondary: neutral[600],
      muted: neutral[500],
      disabled: neutral[400],
      inverse: neutral[0],
      inverseSecondary: 'rgba(255,255,255,0.72)',
      inverseMuted: 'rgba(255,255,255,0.52)',
      onBrand: neutral[0],
    },

    border: {
      subtle: neutral[200],
      default: neutral[300],
      strong: neutral[400],
      onDark: 'rgba(255,255,255,0.12)',
    },

    neutral,
  },

  /** Type scale. Playfair for headings (already bundled), Open Sans for body. */
  font: {
    heading: 'PlayfairDisplay-SemiBold',
    body: 'OpenSans-Regular',
    bold: 'OpenSans-Bold',
  },

  type: {
    /** Dashboard hero figure — the one number the screen leads with. */
    hero: { fontSize: 48, lineHeight: 52, letterSpacing: -1.2 },
    display: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
    h1: { fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
    h2: { fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
    h3: { fontSize: 17, lineHeight: 22 },
    body: { fontSize: 15, lineHeight: 21 },
    bodySm: { fontSize: 13, lineHeight: 18 },
    caption: { fontSize: 12, lineHeight: 16 },
    overline: { fontSize: 11, lineHeight: 14, letterSpacing: 0.9 },
  },

  /** 4pt spacing scale. */
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 56,
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 28,
    pill: 999,
  },

  /** Cross-platform elevation. iOS gets shadows, Android gets elevation. */
  shadow: {
    sm: Platform.select({
      ios: {
        shadowColor: '#0F0F11',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#0F0F11',
        shadowOpacity: 0.09,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 5 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#0F0F11',
        shadowOpacity: 0.14,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },

  /** Minimum touch target — hit areas must never fall below this. */
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  minTouch: 44,
} as const;

export type Theme = typeof theme;
export default theme;
