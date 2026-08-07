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

export const Gift: Icon = ({ size, color = INK }) => (
  <Base size={size}>
    <Path
      d="M10.9 7.3H8.4a2.15 2.15 0 110-4.3c1.35 0 2.25 1.55 2.5 4.3zm2.2 0h2.5c1.2 0 2.15-.95 2.15-2.15A2.15 2.15 0 0015.6 3c-1.35 0-2.25 1.55-2.5 4.3z"
      fill={color}
    />
    <Path
      d="M2.9 9.9c0-.9.7-1.6 1.6-1.6h6.4v4.5H2.9V9.9zm10.2-1.6h6.4c.9 0 1.6.7 1.6 1.6v2.9h-8V8.3z"
      fill={color}
    />
    <Path
      d="M4.4 15h6.5v6.1H7.9a3.5 3.5 0 01-3.5-3.5V15zm8.7 0h6.5v2.6a3.5 3.5 0 01-3.5 3.5h-3V15z"
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
};

export default Icons;
