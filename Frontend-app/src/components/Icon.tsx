import React from 'react';
import { TextInput } from 'react-native-paper';
import type { ViewStyle } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

/**
 * Uses react-native-paper's built-in icon system
 * ✔ No SVG
 * ✔ No frozen enums
 * ✔ No Android crashes
 */
export const Icon = ({ name, size = 24, color }: IconProps) => {
  return (
    <TextInput.Icon
      icon={name}
      size={size}
      color={color}
    />
  );
};

export default Icon;
