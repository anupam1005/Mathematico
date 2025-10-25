import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { designSystem } from '../styles/designSystem';

interface CustomCheckboxProps {
  status: 'checked' | 'unchecked';
  onPress: () => void;
  testID?: string;
  accessibilityLabel?: string;
  color?: string;
  size?: number;
}

export const CustomCheckbox = ({
  status,
  onPress,
  testID,
  accessibilityLabel,
  color = designSystem.colors.primary,
  size = 24,
}: any) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: status === 'checked' }}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderColor: status === 'checked' ? color : designSystem.colors.border,
          backgroundColor: status === 'checked' ? color : 'transparent',
        },
      ]}
    >
      {status === 'checked' && (
        <Icon
          name="check"
          size={size * 0.7}
          color="white"
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});