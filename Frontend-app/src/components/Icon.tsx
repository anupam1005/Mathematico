import React from 'react';
import { ViewStyle } from 'react-native';
import { getLucideIcon } from '../utils/iconMapping';
import { FallbackIcon } from './FallbackIcon';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon = ({ name, size = 24, color = '#000', style, ...props }: IconProps) => {
  try {
    const IconComponent = getLucideIcon(name);
    
    return (
      <IconComponent
        size={size}
        color={color}
        style={style}
        {...props}
      />
    );
  } catch (error) {
    console.warn(`Icon '${name}' failed to render, using fallback:`, error);
    // Use fallback icon when Lucide fails
    return (
      <FallbackIcon
        name={name}
        size={size}
        color={color}
        style={style}
      />
    );
  }
};

export default Icon;