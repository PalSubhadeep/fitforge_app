import React from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

// Wrap any screen containing TextInputs with this so the keyboard doesn't cover
// whatever the user is typing or the button below it. iOS needs 'padding',
// Android behaves correctly with 'height' (its own resize behavior otherwise
// fights with edge-to-edge display on SDK 54+).
export default function KeyboardAvoider({ children, style }) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
