/**
 * Icon set — solid fills on a 24px grid.
 *
 * Filled rather than stroked: outline icons go weak at small sizes and on
 * coloured badges, where a solid shape holds its weight and reads instantly.
 * Every glyph is one closed path in a single colour so it works equally as a
 * white knockout on a saturated badge or as a tinted mark on a light surface.
 *
 * All icons share one signature, so they are interchangeable:
 *   <Icons.Play size={18} color="#FFFFFF" />
 *
 * `weight` is accepted for API compatibility and ignored by filled glyphs.
 */

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { theme } from '../../theme';

export interface IconProps {
  size?: number;
  color?: string;
  /** Kept for call-site compatibility; filled glyphs ignore it. */
  weight?: number;
  /** Knockout colour for the *Circle variants. Defaults to white. */
  glyphColor?: string;
}

type Icon = React.FC<IconProps>;

const SIZE = 22;
const INK = theme.color.text.primary;

const Base: React.FC<{ size?: number; children: React.ReactNode }> = ({
  size = SIZE,
  children,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {children}
  </Svg>
);

/* ── Navigation ─────────────────────────────────────────────────────────── */

export const Menu: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Rect x="3" y="5.4" width="18" height="2.5" rx="1.25" fill={color} />
    <Rect x="3" y="10.75" width="18" height="2.5" rx="1.25" fill={color} />
    <Rect x="3" y="16.1" width="12" height="2.5" rx="1.25" fill={color} />
  </Base>
);

export const ChevronRight: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M9.3 4.3a1.5 1.5 0 000 2.1l5.6 5.6-5.6 5.6a1.5 1.5 0 102.1 2.1l6.7-6.6a1.5 1.5 0 000-2.2L11.4 4.3a1.5 1.5 0 00-2.1 0z"
      fill={color}
    />
  </Base>
);

export const Bell: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M12 2.2a6.6 6.6 0 00-6.6 6.6c0 3.9-1.2 5.4-1.9 6.1a1.2 1.2 0 00.85 2.1h15.3a1.2 1.2 0 00.85-2.1c-.7-.7-1.9-2.2-1.9-6.1A6.6 6.6 0 0012 2.2z"
      fill={color}
    />
    <Path d="M9.6 18.8a2.6 2.6 0 004.8 0H9.6z" fill={color} />
  </Base>
);

/* ── Content ────────────────────────────────────────────────────────────── */

export const Play: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M7.6 4.9c0-1.4 1.5-2.2 2.7-1.5l9.1 5.9a1.8 1.8 0 010 3l-9.1 5.9c-1.2.8-2.7-.1-2.7-1.5V4.9z"
      fill={color}
    />
  </Base>
);

export const Courses: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M11.3 3.2a1.8 1.8 0 011.4 0l8.5 3.8a1 1 0 010 1.8l-8.5 3.8a1.8 1.8 0 01-1.4 0L2.8 8.8a1 1 0 010-1.8l8.5-3.8z"
      fill={color}
    />
    <Path
      d="M6.2 11.4l4.6 2a3 3 0 002.4 0l4.6-2v3.9c0 .7-.35 1.3-.95 1.7-1.3.85-3 1.3-4.85 1.3s-3.55-.45-4.85-1.3c-.6-.4-.95-1-.95-1.7v-3.9z"
      fill={color}
    />
    <Rect x="20.5" y="8.4" width="1.9" height="7" rx=".95" fill={color} />
  </Base>
);

export const Coach: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Rect x="1.6" y="9.4" width="2.3" height="5.2" rx="1.15" fill={color} />
    <Rect x="20.1" y="9.4" width="2.3" height="5.2" rx="1.15" fill={color} />
    <Rect x="4.9" y="6.6" width="3.9" height="10.8" rx="1.7" fill={color} />
    <Rect x="15.2" y="6.6" width="3.9" height="10.8" rx="1.7" fill={color} />
    <Rect x="8.4" y="10.7" width="7.2" height="2.6" rx="1.3" fill={color} />
  </Base>
);

export const Calendar: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M7.4 2.2c.6 0 1.1.5 1.1 1.1v1.2h7v-1.2a1.1 1.1 0 112.2 0v1.25A4 4 0 0121.6 8.5v.6H2.4v-.6a4 4 0 013.9-3.95V3.3c0-.6.5-1.1 1.1-1.1z"
      fill={color}
    />
    <Path
      d="M2.4 11.1h19.2v6.5a4 4 0 01-4 4H6.4a4 4 0 01-4-4v-6.5zm4.8 3.1a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zm4.8 0a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6zm4.8 0a1.3 1.3 0 100 2.6 1.3 1.3 0 000-2.6z"
      fill={color}
    />
  </Base>
);

export const Shop: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M8.3 7.3V6.9a3.7 3.7 0 117.4 0v.4h2.1a1.6 1.6 0 011.6 1.45l.85 9.2a3.2 3.2 0 01-3.2 3.5H6.95a3.2 3.2 0 01-3.2-3.5l.85-9.2A1.6 1.6 0 016.2 7.3h2.1zm2.2 0h3v-.4a1.5 1.5 0 10-3 0v.4z"
      fill={color}
    />
  </Base>
);

export const Info: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M12 2.1a9.9 9.9 0 100 19.8 9.9 9.9 0 000-19.8zm0 4.1a1.35 1.35 0 110 2.7 1.35 1.35 0 010-2.7zm1.15 11.2a1.15 1.15 0 01-2.3 0v-5.6a1.15 1.15 0 012.3 0v5.6z"
      fill={color}
    />
  </Base>
);

/* ── State ──────────────────────────────────────────────────────────────── */

export const Check: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M20.2 5.6a1.5 1.5 0 010 2.15L10.4 17.6a1.5 1.5 0 01-2.15 0L3.8 13.15a1.5 1.5 0 012.15-2.15l3.35 3.4 8.75-8.8a1.5 1.5 0 012.15 0z"
      fill={color}
    />
  </Base>
);

export const Lock: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M7.1 9.5V7.8a4.9 4.9 0 019.8 0v1.7a3.6 3.6 0 013 3.55v4.4a3.6 3.6 0 01-3.6 3.6H7.7a3.6 3.6 0 01-3.6-3.6v-4.4a3.6 3.6 0 013-3.55zm2.2-.05h5.4V7.8a2.7 2.7 0 10-5.4 0v1.65z"
      fill={color}
    />
  </Base>
);

export const Clock: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M12 2.1a9.9 9.9 0 100 19.8 9.9 9.9 0 000-19.8zm1.1 9.35l3.05 1.85a1.1 1.1 0 11-1.15 1.9l-3.6-2.2a1.1 1.1 0 01-.5-.95V6.9a1.1 1.1 0 112.2 0v4.55z"
      fill={color}
    />
  </Base>
);

/**
 * Gift — box, lid and a bow.
 *
 * The first attempt drew a plain box bisected by a ribbon, which at 16px read
 * as four squares rather than a present. The bow loops are now wide and sit
 * clearly above the lid, which is what makes the shape legible small.
 */
export const Gift: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    {/* bow: two loops meeting at the centre knot */}
    <Path
      d="M11.05 6.55H8.1a2.28 2.28 0 01-1.63-3.88c.44-.44 1.03-.67 1.63-.67 1.05 0 1.93.6 2.53 1.4.42.56.75 1.24.99 1.94a.9.9 0 01-.57 1.21zm1.9 0h2.95a2.28 2.28 0 001.63-3.88 2.3 2.3 0 00-1.63-.67c-1.05 0-1.93.6-2.53 1.4-.42.56-.75 1.24-.99 1.94a.9.9 0 00.57 1.21z"
      fill={color}
    />
    {/* lid */}
    <Path
      d="M3.15 9.35c0-1 .81-1.8 1.8-1.8h5.9v3.95H3.15V9.35zm9.95-1.8H19c1 0 1.8.81 1.8 1.8v2.15h-7.7V7.55z"
      fill={color}
    />
    {/* body, split by the ribbon */}
    <Path
      d="M4.5 13.15h6.35v8.35H7.85a3.35 3.35 0 01-3.35-3.35v-5zm8.6 0h6.35v5a3.35 3.35 0 01-3.35 3.35H13.1v-8.35z"
      fill={color}
    />
  </Base>
);

/** Half-filled disc — "in progress". */
export const InProgress: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Circle cx="12" cy="12" r="8.6" stroke={color} strokeWidth="2.2" />
    <Path d="M12 3.4a8.6 8.6 0 010 17.2V3.4z" fill={color} />
  </Base>
);

export const Flame: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M13.9 2.2c-.55 3.1.6 4.6 1.9 6.2 1.35 1.7 2.9 3.6 2.9 6.6a6.7 6.7 0 01-13.4 0c0-1.55.5-3.2 1.5-4.5.35 1.1 1.1 1.85 2 1.85 1 0 1.75-.8 1.75-1.95 0-.85-.45-1.8-.45-3.15 0-2.6 1.9-4.6 3.8-5.05z"
      fill={color}
    />
  </Base>
);

export const Search: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M10.8 2.4a8.4 8.4 0 105.15 15.04l4.3 4.3a1.2 1.2 0 001.7-1.7l-4.3-4.3A8.4 8.4 0 0010.8 2.4zm0 2.4a6 6 0 110 12 6 6 0 010-12z"
      fill={color}
    />
  </Base>
);

export const Filter: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M3.4 5.6c0-.83.67-1.5 1.5-1.5h14.2a1.5 1.5 0 010 3H4.9c-.83 0-1.5-.67-1.5-1.5zm2.4 6.4c0-.83.67-1.5 1.5-1.5h9.4a1.5 1.5 0 010 3H7.3c-.83 0-1.5-.67-1.5-1.5zm2.4 6.4c0-.83.67-1.5 1.5-1.5h4.6a1.5 1.5 0 010 3H9.7c-.83 0-1.5-.67-1.5-1.5z"
      fill={color}
    />
  </Base>
);

export const MapPin: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M12 2.2a7.8 7.8 0 00-7.8 7.8c0 5.4 6.36 11.1 7 11.66a1.2 1.2 0 001.6 0c.64-.56 7-6.26 7-11.66A7.8 7.8 0 0012 2.2zm0 10.6a2.9 2.9 0 110-5.8 2.9 2.9 0 010 5.8z"
      fill={color}
    />
  </Base>
);

export const Tag: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M11.05 2.6H5.4A2.8 2.8 0 002.6 5.4v5.65c0 .74.3 1.45.82 1.98l8.2 8.2a2.8 2.8 0 003.96 0l6.05-6.05a2.8 2.8 0 000-3.96l-8.2-8.2a2.8 2.8 0 00-1.98-.82zM7.6 9.4a1.8 1.8 0 110-3.6 1.8 1.8 0 010 3.6z"
      fill={color}
    />
  </Base>
);

export const Close: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M5.3 3.6a1.2 1.2 0 00-1.7 1.7L10.3 12l-6.7 6.7a1.2 1.2 0 101.7 1.7L12 13.7l6.7 6.7a1.2 1.2 0 001.7-1.7L13.7 12l6.7-6.7a1.2 1.2 0 00-1.7-1.7L12 10.3 5.3 3.6z"
      fill={color}
    />
  </Base>
);

export const LogOut: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M13.4 2.6H8.2A4.2 4.2 0 004 6.8v10.4a4.2 4.2 0 004.2 4.2h5.2a1.15 1.15 0 000-2.3H8.2a1.9 1.9 0 01-1.9-1.9V6.8a1.9 1.9 0 011.9-1.9h5.2a1.15 1.15 0 000-2.3z"
      fill={color}
    />
    <Path
      d="M17.5 7.9a1.15 1.15 0 00-1.63 1.63l1.32 1.32h-6.34a1.15 1.15 0 000 2.3h6.34l-1.32 1.32a1.15 1.15 0 101.63 1.63l3.28-3.29a1.15 1.15 0 000-1.62L17.5 7.9z"
      fill={color}
    />
  </Base>
);

export const Star: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M12 2.4l2.72 5.86 6.42.79a1 1 0 01.56 1.73l-4.73 4.36 1.25 6.34a1 1 0 01-1.47 1.07L12 19.4l-5.75 3.15a1 1 0 01-1.47-1.07l1.25-6.34-4.73-4.36a1 1 0 01.56-1.73l6.42-.79L12 2.4z"
      fill={color}
    />
  </Base>
);

export const Phone: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M7.4 2.9c.86-.34 1.84.02 2.28.84l1.5 2.8c.4.75.23 1.68-.42 2.23l-1.2 1.02a.6.6 0 00-.16.68c.9 2.1 2.6 3.8 4.7 4.7a.6.6 0 00.68-.16l1.02-1.2c.55-.65 1.48-.82 2.23-.42l2.8 1.5c.82.44 1.18 1.42.84 2.28l-.6 1.5a3 3 0 01-3.3 1.84C10.9 19.5 4.5 13.1 3.46 6.03A3 3 0 015.3 2.73l2.1-.84z"
      fill={color}
    />
  </Base>
);

/** Three nodes joined by two links — the platform-neutral share mark. */
export const Share: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M15.5 8.2a3.6 3.6 0 10-2.9-1.45L9.1 8.9a3.6 3.6 0 100 6.2l3.5 2.15a3.6 3.6 0 10.83-1.5l-3.5-2.15a3.6 3.6 0 000-1.2l3.5-2.15c.6.55 1.4.9 2.27.9z"
      fill={color}
    />
  </Base>
);

/**
 * Two offset sheets. Drawn as one path with an even-odd hole so the back sheet
 * stays visible behind the front one at 18px, where a solid stack would blur
 * into a single rectangle.
 */
export const Copy: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M9.2 2.4h7.4a4.4 4.4 0 014.4 4.4v7.4a4.4 4.4 0 01-4.4 4.4H9.2a4.4 4.4 0 01-4.4-4.4V6.8A4.4 4.4 0 019.2 2.4z"
      fill={color}
    />
    <Path
      d="M3.4 6.55A4.4 4.4 0 001 10.5v6.7a4.4 4.4 0 004.4 4.4h6.7a4.4 4.4 0 003.95-2.4H9.2a5.8 5.8 0 01-5.8-5.8V6.55z"
      fill={color}
      opacity={0.55}
    />
  </Base>
);

/* ── Forms ──────────────────────────────────────────────────────────────── */

export const Mail: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M2.4 8.15v9.05a3.4 3.4 0 003.4 3.4h12.4a3.4 3.4 0 003.4-3.4V8.15l-8.63 5.3a1.85 1.85 0 01-1.94 0L2.4 8.15z"
      fill={color}
    />
    <Path
      d="M21.5 6.1a3.4 3.4 0 00-3.3-2.7H5.8a3.4 3.4 0 00-3.3 2.7l9.03 5.55c.29.18.65.18.94 0L21.5 6.1z"
      fill={color}
    />
  </Base>
);

export const User: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Circle cx="12" cy="7.6" r="4.6" fill={color} />
    <Path
      d="M12 14.2c-4.1 0-7.4 2.3-7.4 5.1 0 1.1.9 1.9 2 1.9h10.8c1.1 0 2-.8 2-1.9 0-2.8-3.3-5.1-7.4-5.1z"
      fill={color}
    />
  </Base>
);

export const Eye: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M12 4.6c-4.6 0-8.5 3-10.2 6.7a1.6 1.6 0 000 1.4C3.5 16.4 7.4 19.4 12 19.4s8.5-3 10.2-6.7a1.6 1.6 0 000-1.4C20.5 7.6 16.6 4.6 12 4.6zm0 11.2a3.8 3.8 0 110-7.6 3.8 3.8 0 010 7.6z"
      fill={color}
    />
    <Circle cx="12" cy="12" r="1.9" fill={color} />
  </Base>
);

export const EyeOff: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M3.6 2.5a1.2 1.2 0 00-1.7 1.7l17.9 17.9a1.2 1.2 0 001.7-1.7L3.6 2.5z"
      fill={color}
    />
    <Path
      d="M12 4.6c-1.2 0-2.4.2-3.5.57l2.24 2.24A3.8 3.8 0 0115.4 12.9l3.24 3.24c1.55-1.1 2.8-2.58 3.56-4.14a1.6 1.6 0 000-1.4C20.5 7.6 16.6 4.6 12 4.6z"
      fill={color}
    />
    <Path
      d="M5.1 7.4C3.4 8.55 2.1 10.1 1.8 11.3a1.6 1.6 0 000 1.4c1.7 3.7 5.6 6.7 10.2 6.7 1.5 0 3-.32 4.3-.9l-2.7-2.7a3.8 3.8 0 01-4.7-4.7L5.1 7.4z"
      fill={color}
    />
  </Base>
);

/* ── Circular badge variants ────────────────────────────────────────────────
 * A filled disc with the glyph knocked out in white. Used on the dashboard KPI
 * row, where a bare glyph beside a large number looked weightless — the disc
 * gives each count a consistent visual anchor without a separate badge view.
 */

export const CheckCircle: Icon = ({ size, color = INK, glyphColor = '#FFFFFF' }) => (
  <Base size={size}>
    <Circle cx="12" cy="12" r="10.4" fill={color} />
    <Path
      d="M16.9 8.6a1.15 1.15 0 010 1.65l-5.5 5.5a1.15 1.15 0 01-1.65 0l-2.65-2.65a1.17 1.17 0 011.65-1.65l1.83 1.82 4.67-4.67a1.15 1.15 0 011.65 0z"
      fill={glyphColor}
    />
  </Base>
);

/** Filled disc with a white half — "in progress". */
export const ProgressCircle: Icon = ({ size, color = INK, glyphColor = '#FFFFFF' }) => (
  <Base size={size}>
    <Circle cx="12" cy="12" r="10.4" fill={color} />
    <Path d="M12 4.75a7.25 7.25 0 010 14.5v-14.5z" fill={glyphColor} />
  </Base>
);

export const LockCircle: Icon = ({ size, color = INK, glyphColor = '#FFFFFF' }) => (
  <Base size={size}>
    <Circle cx="12" cy="12" r="10.4" fill={color} />
    <Path
      d="M9.15 10.35V9.3a2.85 2.85 0 015.7 0v1.05c.83.16 1.45.89 1.45 1.76v3.4c0 .99-.8 1.79-1.79 1.79H9.49c-.99 0-1.79-.8-1.79-1.79v-3.4c0-.87.62-1.6 1.45-1.76zm1.5-.06h2.7V9.3a1.35 1.35 0 10-2.7 0v.99z"
      fill={glyphColor}
    />
  </Base>
);

export const Icons = {
  Menu,
  ChevronRight,
  Bell,
  Play,
  Courses,
  Coach,
  Calendar,
  Shop,
  Info,
  Check,
  Lock,
  Clock,
  Gift,
  InProgress,
  Flame,
  CheckCircle,
  ProgressCircle,
  LockCircle,
  Mail,
  User,
  Eye,
  EyeOff,
  Close,
  LogOut,
  Star,
  Phone,
  Copy,
  Share,
  Search,
  Filter,
  MapPin,
  Tag,
};

export default Icons;
