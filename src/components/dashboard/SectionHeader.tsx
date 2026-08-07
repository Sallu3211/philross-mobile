/**
 * SectionHeader — title row with an optional "See all" affordance.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

export interface SectionHeaderProps {
  title: string;
  /** Quiet supporting line under the title. */
  caption?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  caption,
  actionLabel = 'See all',
  onPressAction,
}) => (
  <View style={styles.row}>
    <View style={styles.textCol}>
      <Text style={styles.title}>{title}</Text>
      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </View>

    {!!onPressAction && (
      <TouchableOpacity
        onPress={onPressAction}
        hitSlop={theme.hitSlop}
        accessibilityRole="button"
      >
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  textCol: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: theme.font.heading,
    fontSize: theme.type.h2.fontSize,
    lineHeight: theme.type.h2.lineHeight,
    letterSpacing: theme.type.h2.letterSpacing,
    color: theme.color.text.primary,
  },
  caption: {
    fontFamily: theme.font.body,
    fontSize: theme.type.caption.fontSize,
    color: theme.color.text.muted,
  },
  action: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },
});

export default SectionHeader;
