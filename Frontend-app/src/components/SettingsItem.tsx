import React from 'react';
import { List } from 'react-native-paper';
import { Icon } from './Icon';

interface SettingsItemProps {
  title: string;
  icon: string;
  onPress: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ title, icon, onPress }) => {
  return (
    <List.Item
      title={title}
      left={(props) => <Icon name={icon} size={24} color={props.color} />}
      right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
      onPress={onPress}
    />
  );
};

export default SettingsItem;