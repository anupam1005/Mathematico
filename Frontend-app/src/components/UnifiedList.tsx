import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Icon } from './Icon';
import { listStyles, textStyles, designSystem } from '../styles/designSystem';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: any;
  rightIcon?: any;
  onPress?: () => void;
  style?: ViewStyle;
  isLast?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  style,
  isLast = false,
}) => {
  const itemStyle = [
    isLast ? listStyles.itemLast : listStyles.item,
    style,
  ];

  const content = (
    <View style={listStyles.itemContent}>
      {leftIcon && (
        <View style={{ marginRight: designSystem.spacing.sm }}>
          <Icon
            name={leftIcon}
            size={24}
            color={designSystem.colors.primary}
          />
        </View>
      )}
      <View style={listStyles.itemText}>
        <Text style={textStyles.body}>{title}</Text>
        {subtitle && (
          <Text style={textStyles.bodySecondary}>{subtitle}</Text>
        )}
      </View>
      {rightIcon && (
        <Icon
          name={rightIcon}
          size={20}
          color={designSystem.colors.textSecondary}
        />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={itemStyle} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={itemStyle}>{content}</View>;
};

interface UnifiedListProps {
  items: ListItemProps[];
  containerStyle?: ViewStyle;
}

export const UnifiedList: React.FC<UnifiedListProps> = ({
  items,
  containerStyle,
}) => {
  return (
    <View style={[listStyles.container, containerStyle]}>
      {items.map((item, index) => (
        <ListItem
          key={index}
          {...item}
          isLast={index === items.length - 1}
        />
      ))}
    </View>
  );
};
