/**
 * StateView — loading, empty and error states for list screens.
 *
 * These three were previously ad-hoc per screen, so a list could show a bare
 * spinner, nothing at all, or an alert depending on which page you were on.
 * An empty list should say why it is empty and what to do next.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../../theme';
import { IconProps } from './icons';

export const LoadingState: React.FC<{ label?: string; style?: ViewStyle }> = ({
  label = 'Loading',
  style,
}) => (
  <View style={[styles.wrap, style]}>
    <ActivityIndicator color={theme.color.brand.base} size="large" />
    <Text style={styles.body}>{label}</Text>
  </View>
);

export interface EmptyStateProps {
  icon?: React.FC<IconProps>;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconCmp,
  title,
  body,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.wrap, style]}>
    {!!IconCmp && (
      <View style={styles.badge}>
        <IconCmp size={24} color={theme.color.text.disabled} />
      </View>
    )}
    <Text style={styles.title}>{title}</Text>
    {!!body && <Text style={styles.body}>{body}</Text>}
    {!!actionLabel && !!onAction && (
      <TouchableOpacity
        style={styles.action}
        onPress={onAction}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}> = ({ message = 'Something went wrong.', onRetry, style }) => (
  <EmptyState
    title="We hit a problem"
    body={message}
    actionLabel={onRetry ? 'Try again' : undefined}
    onAction={onRetry}
    style={style}
  />
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space['3xl'],
    paddingVertical: theme.space['5xl'],
    gap: theme.space.md,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.color.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.space.xs,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h3.fontSize,
    color: theme.color.text.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: 20,
    color: theme.color.text.muted,
    textAlign: 'center',
  },
  action: {
    marginTop: theme.space.md,
    paddingHorizontal: theme.space['2xl'],
    minHeight: 46,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: theme.font.semibold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.onBrand,
  },
});

export default EmptyState;
