import React from 'react';
import { ViewStyle } from 'react-native';
import { getLucideIcon } from '../utils/iconMapping';
import { FallbackIcon } from './FallbackIcon';
import { safeCatch } from '../utils/safeCatch';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const Icon = ({ name, size = 24, color = '#000', style, ...props }: IconProps) => {
  try {
    const IconComponent = getLucideIcon(name);
    if (!IconComponent) {
      return (
        <FallbackIcon
          name={name}
          size={size}
          color={color}
          style={style}
        />
      );
    }
    return React.createElement(IconComponent, {
      size,
      color,
      style,
      ...props
    });
  } catch (error) {
    safeCatch('Icon.render')(error);
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