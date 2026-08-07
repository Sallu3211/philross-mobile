/**
 * SectionHeader — title row with an optional "See all" affordance.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';
import { ChevronRight } from '../ui/icons';

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
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {!!caption && (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      )}
    </View>

    {!!onPressAction && (
      <TouchableOpacity
        onPress={onPressAction}
        hitSlop={theme.hitSlop}
        accessibilityRole="button"
        style={styles.action}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
        <ChevronRight size={13} color={theme.color.brand.base} weight={2.2} />
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
  },
  title: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.h2.fontSize,
    lineHeight: theme.type.h2.lineHeight,
    letterSpacing: theme.type.h2.letterSpacing,
    color: theme.color.text.primary,
  },
  caption: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.color.text.muted,
    marginTop: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.brand.base,
  },
});

export default SectionHeader;
