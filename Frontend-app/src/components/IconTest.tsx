import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from './Icon';

export const IconTest: React.FC = () => {
  const testIcons = ['home', 'book', 'school', 'videocam', 'person'];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Icon Test</Text>
      <View style={styles.iconRow}>
        {testIcons.map((iconName) => (
          <View key={iconName} style={styles.iconContainer}>
            <Icon name={iconName} size={32} color="#007AFF" />
            <Text style={styles.iconLabel}>{iconName}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  iconContainer: {
    alignItems: 'center',
    margin: 10,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default IconTest;