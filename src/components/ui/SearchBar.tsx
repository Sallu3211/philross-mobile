/**
 * SearchBar — one search field for every list screen.
 *
 * Shows a clear button only once there is something to clear, so the control
 * never occupies space it has no use for.
 */

import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, ViewStyle } from 'react-native';
import { theme } from '../../theme';
import { Close, Search } from './icons';

export interface SearchBarProps {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search',
  onSubmit,
  style,
}) => (
  <View style={[styles.wrap, style]}>
    <Search size={17} color={theme.color.text.disabled} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.color.text.disabled}
      returnKeyType="search"
      onSubmitEditing={onSubmit}
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="never"
    />
    {value.length > 0 && (
      <TouchableOpacity
        onPress={() => onChangeText('')}
        hitSlop={theme.hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Clear search"
      >
        <View style={styles.clear}>
          <Close size={11} color={theme.color.text.inverse} />
        </View>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
    backgroundColor: theme.color.surface.card,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space.lg,
    minHeight: 46,
  },
  input: {
    flex: 1,
    fontFamily: theme.font.medium,
    fontSize: theme.type.bodySm.fontSize,
    color: theme.color.text.primary,
    paddingVertical: theme.space.md,
  },
  clear: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: theme.color.neutral[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchBar;
