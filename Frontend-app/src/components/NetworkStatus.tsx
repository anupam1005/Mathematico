import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, ActivityIndicator } from 'react-native-paper';
import { Icon } from './Icon';
import { NetworkUtils } from '../utils/networkUtils';
import { designSystem } from '../styles/designSystem';
import { testNetworkConnectivity } from '../utils/networkTest';
import { safeCatch } from '../utils/safeCatch';

interface NetworkStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export default function NetworkStatus({ onConnectionChange }: NetworkStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const result = await testNetworkConnectivity();
      setIsConnected(result.success);
      
      const { getBackendUrl } = await import('../config');
      const backendUrl = await getBackendUrl();
      
      setConnectionInfo({
        platform: 'React Native',
        baseURL: backendUrl,
        isDev: __DEV__
      });
      onConnectionChange?.(result.success);
    } catch (error) {
      safeCatch('NetworkStatus.testConnection', () => {
        setIsConnected(false);
      })(error);
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = () => {
    if (isConnected === null) return designSystem.colors.textSecondary;
    return isConnected ? designSystem.colors.success : designSystem.colors.error;
  };

  const getStatusText = () => {
    if (isConnected === null) return 'Unknown';
    return isConnected ? 'Connected' : 'Disconnected';
  };

  const getStatusIcon = () => {
    if (isTesting) return 'refresh';
    if (isConnected === null) return 'help';
    return isConnected ? 'check-circle' : 'error';
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <Icon 
              name={getStatusIcon()} 
              size={20} 
              color={getStatusColor()}
              style={isTesting ? styles.rotating : undefined}
            />
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
          <TouchableOpacity onPress={testConnection} disabled={isTesting}>
            <Icon name="refresh" size={20} color={designSystem.colors.primary} />
          </TouchableOpacity>
        </View>

        {connectionInfo && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Platform: {connectionInfo.platform}
            </Text>
            <Text style={styles.infoText}>
              API URL: {connectionInfo.baseURL}
            </Text>
            <Text style={styles.infoText}>
              Mode: {connectionInfo.isDev ? 'Development' : 'Production'}
            </Text>
          </View>
        )}

        {!isConnected && (
          <View style={styles.troubleshootContainer}>
            <Text style={styles.troubleshootText}>
              Having connection issues?
            </Text>
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => NetworkUtils.showIPInstructions()}
                style={styles.button}
                compact
              >
                Find IP
              </Button>
              <Button
                mode="outlined"
                onPress={() => NetworkUtils.showNetworkTroubleshooting()}
                style={styles.button}
                compact
              >
                Help
              </Button>
            </View>
          </View>
        )}

        {isTesting && (
          <View style={styles.testingContainer}>
            <ActivityIndicator size="small" color={designSystem.colors.primary} />
            <Text style={styles.testingText}>Testing connection...</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: designSystem.spacing.sm,
    fontWeight: '500',
  },
  infoContainer: {
    marginTop: designSystem.spacing.sm,
    padding: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.sm,
  },
  infoText: {
    fontSize: 12,
    color: designSystem.colors.textSecondary,
    marginBottom: designSystem.spacing.xs,
  },
  troubleshootContainer: {
    marginTop: designSystem.spacing.sm,
    padding: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.error + '10',
    borderRadius: designSystem.borderRadius.sm,
  },
  troubleshootText: {
    fontSize: 14,
    color: designSystem.colors.error,
    marginBottom: designSystem.spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
  },
  button: {
    flex: 1,
  },
  testingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: designSystem.spacing.sm,
  },
  testingText: {
    marginLeft: designSystem.spacing.sm,
    color: designSystem.colors.textSecondary,
  },
  rotating: {
    transform: [{ rotate: '0deg' }],
  },
});
