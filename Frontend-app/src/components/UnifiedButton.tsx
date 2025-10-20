import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { Button as PaperButton, ButtonProps } from 'react-native-paper';
import { buttonStyles, textStyles, designSystem } from '../styles/designSystem';

interface UnifiedButtonProps extends Omit<ButtonProps, 'style' | 'labelStyle'> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  children: React.ReactNode;
}

export const UnifiedButton: React.FC<UnifiedButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  style,
  labelStyle,
  children,
  ...props
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: designSystem.spacing.xs,
          paddingHorizontal: designSystem.spacing.sm,
        };
      case 'large':
        return {
          paddingVertical: designSystem.spacing.md,
          paddingHorizontal: designSystem.spacing.lg,
        };
      default:
        return {
          paddingVertical: designSystem.spacing.sm,
          paddingHorizontal: designSystem.spacing.md,
        };
    }
  };

  const buttonStyle = [
    buttonStyles[variant],
    getSizeStyles(),
    fullWidth && { width: '100%' as any },
    style,
  ];

  const textColor = variant === 'primary' ? designSystem.colors.textInverse : designSystem.colors.primary;

  return (
    <PaperButton
      style={buttonStyle}
      labelStyle={[
        textStyles.label,
        { color: textColor },
        labelStyle,
      ]}
      {...props}
    >
      {children}
    </PaperButton>
  );
};
