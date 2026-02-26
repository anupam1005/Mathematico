import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Card as PaperCard, CardProps } from 'react-native-paper';
import { cardStyles } from '../styles/designSystem';

interface UnifiedCardProps extends Omit<CardProps, 'style' | 'mode' | 'elevation'> {
  variant?: 'base' | 'elevated' | 'outlined';
  onPress?: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const UnifiedCard: React.FC<UnifiedCardProps> = ({
  variant = 'base',
  onPress,
  style,
  children,
  ...props
}) => {
  const cardStyle = [
    cardStyles[variant],
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <PaperCard style={cardStyle} {...props}>
          {children}
        </PaperCard>
      </TouchableOpacity>
    );
  }

  return (
    <PaperCard style={cardStyle} {...props}>
      {children}
    </PaperCard>
  );
};
