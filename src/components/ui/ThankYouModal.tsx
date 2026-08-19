/**
 * ThankYouModal — the confirmation that appears the instant a form is sent.
 *
 * The coaching application used to answer with a full screen replacement
 * (`navigation.replace('ApplicationConfirmation')`). That works, but it reads
 * as having been moved somewhere rather than having finished something, and it
 * takes the form off the stack before the person has registered that anything
 * happened. A dialog over the form they just filled in is unambiguous: the
 * thing they were doing is done.
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../theme';
import { Check } from './icons';

export interface ThankYouModalProps {
  visible: boolean;
  title?: string;
  body?: string;
  actionLabel?: string;
  onAction: () => void;
}

export const ThankYouModal: React.FC<ThankYouModalProps> = ({
  visible,
  title = 'Thank you',
  body,
  actionLabel = 'Done',
  onAction,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    // Android's back button must go where the button goes. Letting it dismiss
    // the dialog on its own would leave the person back on a form they have
    // already submitted, with a Submit button that would send it twice.
    onRequestClose={onAction}
  >
    {/* Not dismissible by tapping outside, for the same reason. */}
    <Pressable style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Check size={30} color={theme.color.text.inverse} />
        </View>

        <Text style={styles.title}>{title}</Text>
        {!!body && <Text style={styles.body}>{body}</Text>}

        <TouchableOpacity
          style={styles.cta}
          onPress={onAction}
          activeOpacity={0.9}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.space['3xl'],
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: theme.space['2xl'],
    borderRadius: theme.radius['2xl'],
    backgroundColor: theme.color.surface.card,
    ...theme.shadow.lg,
  },
  badge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.color.status.success,
    marginBottom: theme.space.xl,
  },
  title: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.h1.fontSize,
    lineHeight: theme.type.h1.lineHeight,
    letterSpacing: theme.type.h1.letterSpacing,
    color: theme.color.text.primary,
    textAlign: 'center',
  },
  body: {
    fontFamily: theme.font.regular,
    fontSize: theme.type.bodySm.fontSize,
    lineHeight: theme.type.bodySm.lineHeight + 4,
    color: theme.color.text.secondary,
    textAlign: 'center',
    marginTop: theme.space.md,
  },
  cta: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.brand.base,
    marginTop: theme.space['2xl'],
  },
  ctaText: {
    fontFamily: theme.font.bold,
    fontSize: theme.type.body.fontSize,
    color: theme.color.text.onBrand,
    includeFontPadding: false,
  },
});

export default ThankYouModal;
