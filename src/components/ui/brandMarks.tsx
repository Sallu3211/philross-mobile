/**
 * Circular brand marks.
 *
 * Facebook, Instagram, WhatsApp, Telegram and X ship as full-colour PNG badges
 * that are already round. YouTube, TikTok and LinkedIn only existed here as
 * monochrome SVGs of their *wordmark-style* glyphs — YouTube's is a rounded
 * rectangle — so in a row of round badges they read as the odd one out.
 *
 * These draw the same three marks as filled circles on their brand colour, so
 * every logo in a social row is one shape at one size.
 *
 * The viewBox is 0 0 24 24 and the disc fills it edge to edge, matching how
 * the PNGs are cropped. Render every mark in a row at the same `size`.
 */

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export interface BrandMarkProps {
  size?: number;
}

const DISC = { cx: 12, cy: 12, r: 12 };

export const YouTubeRound: React.FC<BrandMarkProps> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle {...DISC} fill="#FF0000" />
    <Path d="M9.6 7.9v8.2L16.7 12 9.6 7.9z" fill="#FFFFFF" />
  </Svg>
);

export const TikTokRound: React.FC<BrandMarkProps> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle {...DISC} fill="#010101" />
    <Path
      d="M15.9 5.2c.35 1.6 1.4 2.75 2.95 2.95v2.2a5.6 5.6 0 01-2.95-.95v4.35a4.55 4.55 0 11-4.55-4.55c.2 0 .4.02.6.05v2.3a2.32 2.32 0 101.65 2.2V5.2h2.3z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const LinkedInRound: React.FC<BrandMarkProps> = ({ size = 32 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle {...DISC} fill="#0A66C2" />
    <Rect x="5.9" y="9.6" width="2.5" height="8.2" rx="0.4" fill="#FFFFFF" />
    <Circle cx="7.15" cy="7" r="1.5" fill="#FFFFFF" />
    <Path
      d="M10.4 9.6h2.4v1.1a2.8 2.8 0 012.4-1.25c1.9 0 3.1 1.2 3.1 3.4v4.95h-2.5v-4.5c0-1.1-.5-1.75-1.45-1.75-.9 0-1.45.6-1.45 1.75v4.5h-2.5V9.6z"
      fill="#FFFFFF"
    />
  </Svg>
);

export const BrandMarks = { YouTubeRound, TikTokRound, LinkedInRound };
