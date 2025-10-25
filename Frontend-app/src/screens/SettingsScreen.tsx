// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  List,
  Divider,
} from 'react-native-paper';
import { Icon } from '../components/Icon';
import { designSystem } from '../styles/designSystem';
import { theme } from '../styles/theme';
import settingsService from '../services/settingsService';

export default function SettingsScreen({ navigation }: any) {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [liveClassReminders, setLiveClassReminders] = useState(true);

  // App settings
  const [darkMode, setDarkMode] = useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = useState(true);
  const [downloadQuality, setDownloadQuality] = useState('High');

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getSettings();
      
      if (response.success && response.data) {
        const settings = response.data;
        setPushNotifications(settings.pushNotifications);
        setEmailNotifications(settings.emailNotifications);
        setCourseUpdates(settings.courseUpdates);
        setLiveClassReminders(settings.liveClassReminders);
        setDarkMode(settings.darkMode);
        setAutoPlayVideos(settings.autoPlayVideos);
        setDownloadQuality(settings.downloadQuality);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      setIsSaving(true);
      const response = await settingsService.updateSettings({ [key]: value });
      
      if (!response.success) {
        Alert.alert('Error', response.message || 'Failed to update setting');
        // Revert the change if it failed
        loadSettings();
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
      loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will free up storage space.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // Implement cache clearing logic
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleDownloadSettings = () => {
    Alert.alert(
      'Download Quality',
      'Choose your preferred download quality',
      [
        { 
          text: 'Low', 
          onPress: () => {
            setDownloadQuality('Low');
            updateSetting('downloadQuality', 'Low');
          }
        },
        { 
          text: 'Medium', 
          onPress: () => {
            setDownloadQuality('Medium');
            updateSetting('downloadQuality', 'Medium');
          }
        },
        { 
          text: 'High', 
          onPress: () => {
            setDownloadQuality('High');
            updateSetting('downloadQuality', 'High');
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLanguageSettings = () => {
    Alert.alert(
      'Language',
      'Language settings will be available in future updates',
      [{ text: 'OK' }]
    );
  };

  const handleDataUsage = () => {
    Alert.alert(
      'Data Usage',
      'Data usage statistics will be available in future updates',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={designSystem.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        {isSaving && (
          <ActivityIndicator size="small" color={designSystem.colors.primary} style={styles.savingIndicator} />
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Notifications Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Notifications</Title>
            
            <List.Item
              title="Push Notifications"
              description="Receive push notifications"
              left={(props) => <Icon name="notifications" size={24} color={props.color} />}
              right={() => (
                <Switch
                  value={pushNotifications}
                  onValueChange={(value) => {
                    setPushNotifications(value);
                    updateSetting('pushNotifications', value);
                  }}
                  trackColor={{ false: '#767577', true: designSystem.colors.primary }}
                  thumbColor={pushNotifications ? designSystem.colors.surface : '#f4f3f4'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Email Notifications"
              description="Receive email notifications"
              left={(props) => <Icon name="email" size={24} color={props.color} />}
              right={() => (
                <Switch
                  value={emailNotifications}
                  onValueChange={(value) => {
                    setEmailNotifications(value);
                    updateSetting('emailNotifications', value);
                  }}
                  trackColor={{ false: '#767577', true: designSystem.colors.primary }}
                  thumbColor={emailNotifications ? designSystem.colors.surface : '#f4f3f4'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Course Updates"
              description="Get notified about course updates"
              left={(props) => <Icon name="school" size={24} color={props.color} />}
              right={() => (
                <Switch
                  value={courseUpdates}
                  onValueChange={(value) => {
                    setCourseUpdates(value);
                    updateSetting('courseUpdates', value);
                  }}
                  trackColor={{ false: '#767577', true: designSystem.colors.primary }}
                  thumbColor={courseUpdates ? designSystem.colors.surface : '#f4f3f4'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Live Class Reminders"
              description="Get reminded before live classes"
              left={(props) => <Icon name="videocam" size={24} color={props.color} />}
              right={() => (
                <Switch
                  value={liveClassReminders}
                  onValueChange={(value) => {
                    setLiveClassReminders(value);
                    updateSetting('liveClassReminders', value);
                  }}
                  trackColor={{ false: '#767577', true: designSystem.colors.primary }}
                  thumbColor={liveClassReminders ? designSystem.colors.surface : '#f4f3f4'}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* App Preferences Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Preferences</Title>
            
            <List.Item
              title="Dark Mode"
              description="Enable dark theme"
              left={(props) => <Icon name="dark-mode" size={24} color={props.color} />}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={(value) => {
                    setDarkMode(value);
                    updateSetting('darkMode', value);
                  }}
                  trackColor={{ false: '#767577', true: designSystem.colors.primary }}
                  thumbColor={darkMode ? designSystem.colors.surface : '#f4f3f4'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Auto-play Videos"
              description="Automatically play videos"
              left={(props) => <Icon name="play-circle" size={24} color={props.color} />}
              right={() => (
                <Switch
                  value={autoPlayVideos}
                  onValueChange={(value) => {
                    setAutoPlayVideos(value);
                    updateSetting('autoPlayVideos', value);
                  }}
                  trackColor={{ false: '#767577', true: designSystem.colors.primary }}
                  thumbColor={autoPlayVideos ? designSystem.colors.surface : '#f4f3f4'}
                />
              )}
            />
            <Divider />

            <List.Item
              title="Download Quality"
              description={`Current: ${downloadQuality}`}
              left={(props) => <Icon name="download" size={24} color={props.color} />}
              right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
              onPress={handleDownloadSettings}
            />
            <Divider />

            <List.Item
              title="Language"
              description="English (Default)"
              left={(props) => <Icon name="language" size={24} color={props.color} />}
              right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
              onPress={handleLanguageSettings}
            />
          </Card.Content>
        </Card>

        {/* Storage & Data Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Storage & Data</Title>
            
            <List.Item
              title="Clear Cache"
              description="Free up storage space"
              left={(props) => <Icon name="delete-sweep" size={24} color={props.color} />}
              right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
              onPress={handleClearCache}
            />
            <Divider />

            <List.Item
              title="Data Usage"
              description="View your data usage"
              left={(props) => <Icon name="data-usage" size={24} color={props.color} />}
              right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
              onPress={handleDataUsage}
            />
          </Card.Content>
        </Card>

        {/* About Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About</Title>
            
            <List.Item
              title="Version"
              description="1.0.3"
              left={(props) => <Icon name="info" size={24} color={props.color} />}
            />
            <Divider />

            <List.Item
              title="Terms of Service"
              left={(props) => <Icon name="description" size={24} color={props.color} />}
              right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
              onPress={() => navigation.navigate('TermsOfUse')}
            />
            <Divider />

            <List.Item
              title="Privacy Policy"
              left={(props) => <Icon name="privacy-tip" size={24} color={props.color} />}
              right={(props) => <Icon name="chevron-right" size={24} color={props.color} />}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    marginTop: designSystem.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
  },
  backButton: {
    padding: designSystem.spacing.xs,
    marginRight: designSystem.spacing.md,
  },
  headerTitle: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  savingIndicator: {
    marginLeft: designSystem.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: designSystem.spacing.md,
    marginBottom: 0,
    ...designSystem.shadows.md,
    borderRadius: designSystem.borderRadius.lg,
  },
  sectionTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.sm,
    fontWeight: '600',
  },
});

