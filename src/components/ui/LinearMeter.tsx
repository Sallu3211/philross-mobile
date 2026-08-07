/**
 * LinearMeter — a thin horizontal ratio meter for list and card rows.
 *
 * Same rules as ProgressRing: one hue at two depths, rounded data-ends,
 * text in text tokens. Used on "Continue watching" cards where a ring would
 * be too heavy for the row height.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';

export interface LinearMeterProps {
  /** 0–100, clamped. */
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  /** Show "42%" to the right of the bar. */
  showValue?: boolean;
  valueColor?: string;
  animate?: boolean;
  style?: ViewStyle;
}

export const LinearMeter: React.FC<LinearMeterProps> = ({
  progress,
  height = 6,
  color = theme.color.brand.base,
  trackColor = theme.color.brand.track,
  showValue = false,
  valueColor = theme.color.text.secondary,
  animate = true,
  style,
}) => {
  const clamped = Math.min(Math.max(Number.isFinite(progress) ? progress : 0, 0), 100);
  const anim = useRef(new Animated.Value(animate ? 0 : clamped)).current;

  useEffect(() => {
    if (!animate) {
      anim.setValue(clamped);
      return;
    }
    const animation = Animated.timing(anim, {
      toValue: clamped,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [clamped, animate, anim]);

  const width = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.track,
          { height, borderRadius: height / 2, backgroundColor: trackColor },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            { width, height, borderRadius: height / 2, backgroundColor: color },
          ]}
        />
      </View>
      {showValue && (
        <Text style={[styles.value, { color: valueColor }]} allowFontScaling={false}>
          {Math.round(clamped)}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  track: {
    flex: 1,
    overflow: 'hidden',
  },
  fill: {
    // Rounded data-end, anchored to the baseline at 0.
  },
  value: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.caption.fontSize,
    minWidth: 34,
    textAlign: 'right',
  },
});

export default LinearMeter;
