import {
  deviceScale,
  isLargePhone,
  scaleFont,
  scaleSize,
  step,
  textBase,
} from './typography';

/**
 * Master Phil — Design System
 * ---------------------------------------------------------------------------
 * Single source of truth for colour, type, spacing, radius and elevation.
 * Import from here instead of hardcoding hex values in screens.
 *
 *   import { theme } from '../theme';
 *   <View style={{ backgroundColor: theme.color.surface.card }} />
 *
 * TYPE — Montserrat across the whole app (four weights bundled).
 *
 * COLOUR — the accent + status set was validated for colour-vision deficiency.
 * The original success green (#15803D) failed against the brand red at ΔE 3.9
 * under deuteranopia, so red/green colourblind users could not tell "brand"
 * from "completed" apart. Replaced with teal (#0D9488), which passes at 12.5.
 *   Light surface — all six checks PASS: #B62020, #0D9488, #C2851A, #2563EB
 *   Dark surface  — all six checks PASS: #DC5A5A, #0FA396, #BE8A22, #4A8FE8
 * Do not add a status colour without re-running the validator.
 *
 * PROGRESS — meters fill amber/gold, not brand red. Red reads as an error
 * state next to a number that is meant to feel like an achievement. The track
 * is a light step of the same hue so a meter is one colour at two depths.
 */

import { Platform } from 'react-native';

/* ── Brand ramp ─────────────────────────────────────────────────────────── */
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

/* ── Progress ramp (amber → gold) ───────────────────────────────────────── */
const amber = {
  50: '#FEFAF0',
  100: '#FBF0D6',
  200: '#F5DFA8',
  300: '#EDC96D',
  400: '#E0AC33',
  500: '#D0961F',
  600: '#C2851A', // progress fill
  700: '#9A6813',
  800: '#704B0E',
  900: '#432D08',
} as const;

/* ── Neutral ramp ───────────────────────────────────────────────────────── */
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
    /** Brand accent — primary actions, active states, identity. */
    brand: {
      ramp: red,
      base: red[600],
      pressed: red[700],
      subtle: red[50],
      border: red[200],
      onBrand: neutral[0],
    },

    /**
     * Amber accent — the app's third colour, after brand red and the meter fill.
     *
     * Everything that is *not* a bar or a ring lives here: the Events and
     * Testimonials marks in the drawer, the trial banner, the filter-count
     * badge, the "In progress" tile.
     *
     * These used to read `progress.fill`, so changing the meter colour turned
     * eight unrelated icons green in one edit. A meter and a menu icon are not
     * the same idea and no longer share a token.
     */
    accent: {
      base: amber[600],
      subtle: amber[50],
      border: 'rgba(194,133,26,0.30)',
      onDark: '#E0AC33',
    },

    /**
     * Progress meters — rings and bars, and nothing else.
     *
     * ⚠️ #00FF00 was chosen by the client. It is spectacular on the dark hero
     * card (12.5:1) and close to invisible on the white cards (1.4:1, where
     * 3:1 is the floor for a UI component). `fill` therefore keeps the pure
     * value on request; if a meter ever reads as an empty track on a light
     * surface, that ratio is why, and #16A34A is the nearest green that clears
     * the floor while still reading as the same colour.
     */
    progress: {
      ramp: amber,
      fill: '#00FF00',
      /** Fill used on the dark hero card, where the pure green is at its best. */
      fillOnDark: '#00FF00',
      track: '#E4F7E4',
      trackOnDark: 'rgba(255,255,255,0.14)',
      subtle: '#EFFCEF',
      border: 'rgba(0,180,0,0.30)',
    },

    /** Reserved status colours. Always ship with an icon + label — never colour alone. */
    status: {
      /**
       * A true green for "completed", chosen by validator rather than by eye.
       * The obvious greens fail against the brand red or the amber progress
       * fill under colour-vision deficiency: #15803D sits at ΔE 3.9 vs the red,
       * #16A34A at 4.6 vs the amber. #0BA06E is the greenest step that clears
       * both the CVD floor (8.2) and 3:1 contrast on white.
       */
      success: '#0BA06E',
      successSubtle: '#E9FBF4',
      successOnDark: '#12C88A',

      warning: amber[600],
      warningSubtle: amber[50],
      warningOnDark: '#BE8A22',

      info: '#2563EB',
      infoSubtle: '#EFF4FF',
      infoOnDark: '#4A8FE8',

      /** Locked / paywalled content. Neutral on purpose — locking is not an error. */
      locked: neutral[400],
      lockedSubtle: neutral[100],
    },

    surface: {
      app: neutral[50],
      card: neutral[0],
      raised: neutral[25],
      sunken: neutral[100],
      hero: '#1A1A19',
      heroRaised: '#242427',
      /**
       * Pure black, matching assets/bootsplash/manifest.json.
       * Every current logo asset (splash PNG, launcher webp) bakes in a black
       * background with no alpha channel, so a logo only sits cleanly on an
       * exactly-black ground — anything else shows its corners as a box.
       */
      logoGround: '#000000',
      overlay: 'rgba(15,15,17,0.55)',
    },

    /** Text tokens. Values and labels wear these, never a series colour. */
    text: {
      primary: neutral[900],
      secondary: neutral[600],
      muted: neutral[500],
      disabled: neutral[400],
      inverse: neutral[0],
      inverseSecondary: 'rgba(255,255,255,0.74)',
      inverseMuted: 'rgba(255,255,255,0.54)',
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

  /** Montserrat, four weights. Every text style in the app resolves through here. */
  font: {
    regular: 'Montserrat-Regular',
    medium: 'Montserrat-Medium',
    semibold: 'Montserrat-SemiBold',
    bold: 'Montserrat-Bold',
    /** Legacy aliases so older screens keep compiling while they migrate. */
    heading: 'Montserrat-SemiBold',
    body: 'Montserrat-Regular',
  },

  /**
   * Type scale. Montserrat runs optically large and wide, so sizes are a shade
   * smaller and line-heights tighter than the previous Playfair/Open Sans pair.
   *
   * ⚠️ These are the *design* numbers, expressed at a 390pt baseline. Every
   * step goes through `step()`, which scales it for the device and corrects
   * the platform difference in letter tracking — so an iPhone 15 Pro Max no
   * longer renders the same 14pt body as an SE. Never hard-code a fontSize in
   * a screen; take it from here and it stays right on every handset.
   *
   * See src/theme/typography.ts for what the scaling actually does and why.
   */
  type: {
    hero: step(44, 46, -1.4),
    display: step(30, 34, -0.8),
    h1: step(22, 27, -0.5),
    h2: step(18, 23, -0.35),
    h3: step(16, 21, -0.2),
    body: step(14, 20, -0.1),
    bodySm: step(13, 18, -0.05),
    caption: step(11.5, 15, 0),
    overline: step(10.5, 13, 0.8),
  },

  /**
   * Spread onto a Text style so a line box measures the same on both
   * platforms. Android's `includeFontPadding` is on by default and adds space
   * the design never asked for.
   */
  textBase,

  /** Exposed so a screen can make a considered exception. Prefer `type`. */
  scale: { font: scaleFont, size: scaleSize, factor: deviceScale, isLargePhone },

  /** 4pt scale, tightened. `screen` is the horizontal page gutter. */
  space: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 12,
    xl: 16,
    '2xl': 20,
    '3xl': 26,
    '4xl': 34,
    '5xl': 48,
    /** Side margin for the dashboard. Deliberately tight so cards read wide. */
    screen: 14,
    /** Vertical rhythm between major sections. */
    section: 20,
  },

  radius: {
    sm: 8,
    md: 10,
    lg: 14,
    xl: 18,
    '2xl': 22,
    pill: 999,
  },

  shadow: {
    sm: Platform.select({
      ios: {
        shadowColor: '#0F0F11',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#0F0F11',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#0F0F11',
        shadowOpacity: 0.13,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 9 },
      },
      android: { elevation: 8 },
      default: {},
    }),
  },

  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  minTouch: 44,
} as const;

export type Theme = typeof theme;
export default theme;
