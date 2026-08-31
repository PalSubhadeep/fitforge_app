import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

// Caps content at a comfortable reading width on tablets/large screens and
// centers it, while staying full-width (no visual change at all) on normal
// phone widths. This is the same idea as the web app's max-width:460px
// centered layout, just computed live instead of hardcoded.
export const MAX_CONTENT_WIDTH = 480;

export default function ResponsiveContainer({ children, style }) {
  const { width } = useWindowDimensions();
  const isWide = width > MAX_CONTENT_WIDTH;

  // Pull `flex` out of the caller's style so it can be applied to BOTH the
  // outer and inner wrapping Views. Screens that need to fill available
  // height (e.g. a FlatList-based screen passing style={{flex:1}}) would
  // otherwise collapse to zero height, since only the inner View used to
  // receive the caller's style — the outer View had no flex of its own and
  // wouldn't grow to fill its flex:1 parent, so nothing below it could
  // render any visible height either.
  const flatStyle = StyleSheet.flatten(style) || {};
  const { flex, ...restStyle } = flatStyle;

  return (
    <View style={{ width: '100%', alignItems: isWide ? 'center' : 'stretch', flex }}>
      <View style={[{ width: '100%', maxWidth: isWide ? MAX_CONTENT_WIDTH : '100%', flex }, restStyle]}>
        {children}
      </View>
    </View>
  );
}
