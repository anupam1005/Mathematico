import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { TextInput as PaperTextInput, TextInputProps } from 'react-native-paper';
import { Icon } from './Icon';

interface CustomTextInputProps extends Omit<TextInputProps, 'left' | 'right'> {
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  leftIconColor?: string;
  rightIconColor?: string;
  leftIconSize?: number;
  rightIconSize?: number;
}

export const CustomTextInput: React.FC<CustomTextInputProps> = ({
  leftIcon,
  rightIcon,
  onRightIconPress,
  leftIconColor = '#666',
  rightIconColor = '#666',
  leftIconSize = 24,
  rightIconSize = 24,
  ...props
}) => {
  const leftIconComponent = leftIcon ? (
    <PaperTextInput.Icon 
      icon={() => <Icon name={leftIcon} size={leftIconSize} color={leftIconColor} />}
    />
  ) : undefined;

  const rightIconComponent = rightIcon ? (
    <PaperTextInput.Icon 
      icon={() => <Icon name={rightIcon} size={rightIconSize} color={rightIconColor} />}
      onPress={onRightIconPress}
    />
  ) : undefined;

  return (
    <PaperTextInput
      {...props}
      left={leftIconComponent}
      right={rightIconComponent}
    />
  );
};

export default CustomTextInput;