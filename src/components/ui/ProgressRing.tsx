/**
 * ProgressRing — a meter for a single ratio against a limit.
 *
 * Design rules baked in:
 *  - Track and fill are the SAME hue at two depths (brand[100] / brand[600]),
 *    never two competing hues.
 *  - Rounded data-ends (strokeLinecap="round").
 *  - The centre label wears text tokens, not the meter colour.
 *  - Animates from 0 on mount so progress reads as motion, not a static arc.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /** 0–100. Values outside the range are clamped. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  /** Fill colour. Defaults to the brand accent. */
  color?: string;
  /** Track colour. Defaults to the light step of the same hue. */
  trackColor?: string;
  /** Big number in the middle. Pass null to render the ring bare. */
  label?: string | null;
  /** Small caption under the label. */
  caption?: string;
  labelColor?: string;
  captionColor?: string;
  labelSize?: number;
  animate?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 132,
  strokeWidth = 12,
  color = theme.color.brand.base,
  trackColor = theme.color.brand.track,
  label,
  caption,
  labelColor = theme.color.text.primary,
  captionColor = theme.color.text.muted,
  labelSize,
  animate = true,
  style,
  children,
}) => {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const anim = useRef(new Animated.Value(animate ? 0 : clamped)).current;

  useEffect(() => {
    if (!animate) {
      anim.setValue(clamped);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      // strokeDashoffset is not supported by the native driver.
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, animate, anim]);

  const strokeDashoffset = anim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const resolvedLabelSize = labelSize ?? Math.round(size * 0.26);

  return (
    <View style={[{ width: size, height: size }, styles.wrap, style]}>
      <Svg width={size} height={size}>
        {/* -90° so the meter starts at 12 o'clock and fills clockwise. */}
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      <View style={styles.center} pointerEvents="none">
        {children ?? (
          <>
            {label !== null && (
              <Text
                style={[
                  styles.label,
                  { fontSize: resolvedLabelSize, color: labelColor },
                ]}
                allowFontScaling={false}
              >
                {label ?? `${Math.round(clamped)}%`}
              </Text>
            )}
            {!!caption && (
              <Text style={[styles.caption, { color: captionColor }]} numberOfLines={1}>
                {caption}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.font.bold,
    letterSpacing: -0.8,
    includeFontPadding: false,
  },
  caption: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    marginTop: 2,
  },
});

export default ProgressRing;
