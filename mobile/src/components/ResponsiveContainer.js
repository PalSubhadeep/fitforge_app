import React from 'react';
import { View, useWindowDimensions } from 'react-native';

// Caps content at a comfortable reading width on tablets/large screens and
// centers it, while staying full-width (no visual change at all) on normal
// phone widths. This is the same idea as the web app's max-width:460px
// centered layout, just computed live instead of hardcoded.
export const MAX_CONTENT_WIDTH = 480;

export default function ResponsiveContainer({ children, style }) {
  const { width } = useWindowDimensions();
  const isWide = width > MAX_CONTENT_WIDTH;

  return (
    <View style={{ width: '100%', alignItems: isWide ? 'center' : 'stretch' }}>
      <View style={[{ width: '100%', maxWidth: isWide ? MAX_CONTENT_WIDTH : '100%' }, style]}>
        {children}
      </View>
    </View>
  );
}
