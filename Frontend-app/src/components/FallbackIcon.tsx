import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface FallbackIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

// Simple fallback icons using text/symbols
const iconSymbols: Record<string, string> = {
  'home': '🏠',
  'book': '📚',
  'school': '🎓',
  'videocam': '📹',
  'person': '👤',
  'settings': '⚙️',
  'admin-panel-settings': '🛡️',
  'search': '🔍',
  'close': '✕',
  'menu': '☰',
  'arrow-back': '←',
  'add': '+',
  'edit': '✏️',
  'delete': '🗑️',
  'check': '✓',
  'error': '⚠️',
  'info': 'ℹ️',
  'help': '?',
  'default': '•',
};

export const FallbackIcon = ({ 
  name, 
  size = 24, 
  color = '#000', 
  style 
}: FallbackIconProps) => {
  const symbol = iconSymbols[name] || iconSymbols['default'];
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text style={[styles.icon, { fontSize: size * 0.8, color }]}>
        {symbol}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});

export default FallbackIcon;