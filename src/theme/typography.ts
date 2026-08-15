/**
 * Device-aware type sizing.
 *
 * THE PROBLEM
 * The scale was a fixed set of numbers. An iPhone SE at 375pt wide and an
 * iPhone 15 Pro Max at 430pt both got 14pt body text — so type that sits right
 * on a small phone reads small and thin on a large one, which is exactly what
 * the newer iPhones were showing.
 *
 * THE BASELINE
 * 390pt, the width of an iPhone 13/14/15 and close to most modern Android
 * handsets. Everything is expressed relative to that, then clamped: phones
 * are not that different in width, and unclamped scaling makes small screens
 * cramped and large ones cartoonish. Ranges are deliberately narrow —
 * ±6% down, ±12% up.
 *
 * THE PLATFORM DIFFERENCE
 * Two real ones, both compensated here rather than screen by screen:
 *
 * 1. Android adds `includeFontPadding` to every Text by default — extra space
 *    above the ascender and below the descender. The same nominal line height
 *    therefore renders taller on Android than on iOS. `textBase` turns it off
 *    so a line box means the same thing on both.
 *
 * 2. iOS applies `letterSpacing` in raw points and renders Montserrat a shade
 *    tighter than Android does. Our display sizes carry negative tracking, so
 *    on iOS that compounds and headings close up. iOS gets a little of it
 *    back — never past zero, since the tightening is intentional.
 *
 * WHAT THIS IS NOT
 * Not a replacement for `allowFontScaling`. System font-size settings still
 * apply, as they should; this only fixes the *device*, not the *preference*.
 * Numeric read-outs that must not reflow (meter values, tile counts) opt out
 * individually with `allowFontScaling={false}`.
 */

import { Dimensions, PixelRatio, Platform, TextStyle } from 'react-native';

/** iPhone 13/14/15 width. Most Android handsets land within a few points. */
const BASELINE_WIDTH = 390;

const { width, height } = Dimensions.get('window');

/** Short edge, so a landscape rotation does not blow the type up. */
const shortEdge = Math.min(width, height);

/**
 * How far this device is from the baseline, clamped hard.
 *
 * Down to 0.94 keeps an SE readable without cramping; up to 1.12 gives a Pro
 * Max the weight it needs without the layout starting to look like a tablet.
 */
export const deviceScale = Math.min(
  Math.max(shortEdge / BASELINE_WIDTH, 0.94),
  1.12,
);

/** True on the phones the client named as looking thin — 6.1" and wider. */
export const isLargePhone = shortEdge >= 400;

/** True on an SE-class screen, where every point of width counts. */
export const isSmallPhone = shortEdge <= 375;

/**
 * Scales a point value for this device and snaps it to the pixel grid.
 *
 * Snapping matters: a 14.37pt font renders blurry on a 3x screen, and blur is
 * read as "thin", which is half of what the client was seeing.
 */
export function scaleFont(size: number): number {
  return PixelRatio.roundToNearestPixel(size * deviceScale);
}

/** Same scaling for spacing that must track the type — line heights, mostly. */
export function scaleSize(size: number): number {
  return Math.round(size * deviceScale);
}

/**
 * iOS closes up negative tracking more than Android does. Give a third of it
 * back there, but never cross zero — the tightening is a design decision, not
 * an accident.
 */
function trackingFor(letterSpacing: number): number {
  if (Platform.OS !== 'ios' || letterSpacing >= 0) return letterSpacing;
  return Math.min(letterSpacing * 0.66, 0);
}

export interface TypeStep {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

/**
 * Turns one step of the design scale into real values for this device.
 *
 * Line height is scaled with the size rather than recomputed, so the ratio the
 * scale was designed with survives — the relationship between size and leading
 * is what makes a scale feel like one.
 */
export function step(
  fontSize: number,
  lineHeight: number,
  letterSpacing: number,
): TypeStep {
  return {
    fontSize: scaleFont(fontSize),
    lineHeight: scaleSize(lineHeight),
    letterSpacing: trackingFor(letterSpacing),
  };
}

/**
 * Spread onto any Text style to make a line box mean the same thing on both
 * platforms.
 *
 * `includeFontPadding` is Android-only and on by default; leaving it on is why
 * the same card is taller on Android than on iOS.
 */
export const textBase: TextStyle = Platform.select({
  android: { includeFontPadding: false },
  default: {},
}) as TextStyle;
