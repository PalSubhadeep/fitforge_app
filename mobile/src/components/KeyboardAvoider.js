import React from 'react';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

// Wrap any screen containing TextInputs with this so the keyboard doesn't cover
// whatever the user is typing or the button below it.
//
// This intentionally does NOT use core React Native's own KeyboardAvoidingView.
// With Android edge-to-edge display forced on (as of Expo SDK 54 / RN 0.81, with
// no way to opt out), the OS no longer resizes the app's window when the keyboard
// appears, which is what core RN's 'height'/'padding' behaviors rely on — so on a
// real device they either do nothing or fight with the system and cover the input
// anyway. react-native-keyboard-controller measures the actual keyboard height
// directly instead of depending on that window-resize behavior, so 'padding'
// works correctly on both platforms here.
export default function KeyboardAvoider({ children, style }) {
  return (
    <KeyboardAvoidingView
      style={[{ flex: 1 }, style]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
