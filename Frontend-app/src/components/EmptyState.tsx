import React from 'react';
import { View, Text } from 'react-native';
<<<<<<< HEAD
import { Icon } from './Icon';
=======
import { MaterialIcons as Icon } from '@expo/vector-icons';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import { UnifiedButton } from './UnifiedButton';
import { emptyStateStyles, textStyles, designSystem } from '../styles/designSystem';

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  iconSize?: number;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  iconSize = 64,
  iconColor = designSystem.colors.textTertiary,
}) => {
  return (
    <View style={emptyStateStyles.container}>
      <Icon
        name={icon}
        size={iconSize}
        color={iconColor}
        style={emptyStateStyles.icon}
      />
      <Text style={emptyStateStyles.title}>
        {title}
      </Text>
      <Text style={emptyStateStyles.description}>
        {description}
      </Text>
      {actionText && onAction && (
        <UnifiedButton
          variant="primary"
          onPress={onAction}
          style={emptyStateStyles.button}
        >
          {actionText}
        </UnifiedButton>
      )}
    </View>
  );
};
