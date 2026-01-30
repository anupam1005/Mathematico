import React from 'react';
import { TextInput as PaperTextInput, TextInputProps } from 'react-native-paper';

interface CustomTextInputProps extends Omit<TextInputProps, 'left' | 'right'> {
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export const CustomTextInput = ({
  leftIcon,
  rightIcon,
  onRightIconPress,
  ...props
}: CustomTextInputProps) => {
  return (
    <PaperTextInput
      {...props}
      left={leftIcon ? <PaperTextInput.Icon icon={leftIcon} /> : undefined}
      right={
        rightIcon ? (
          <PaperTextInput.Icon
            icon={rightIcon}
            onPress={onRightIconPress}
          />
        ) : undefined
      }
    />
  );
};

export default CustomTextInput;
