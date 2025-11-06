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
import { 
  ArrowLeft, 
  Bell, 
  Mail, 
  GraduationCap, 
  Video, 
  Moon, 
  PlayCircle, 
  Download, 
  Languages, 
  Trash2, 
  BarChart3, 
  Info, 
  FileText, 
  Shield,
  CheckCircle
} from 'lucide-react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { designSystem } from '../styles/designSystem';
import { theme } from '../styles/theme';
import settingsService from '../services/settingsService';
import { ErrorHandler } from '../utils/errorHandler';


const DATA_USAGE_KEY = 'mathematico_data_usage';
const LANGUAGE_KEY = 'mathematico_language';

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
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [dataUsage, setDataUsage] = useState({ totalMB: 0, lastReset: new Date().toISOString() });

  // Get app version from expo-constants
  const appVersion = Constants.expoConfig?.version || (Constants.manifest as any)?.version || '7.0.0';
  const buildNumber = Constants.expoConfig?.android?.versionCode || (Constants.manifest as any)?.android?.versionCode || '7';

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    loadLanguage();
    loadDataUsage();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await settingsService.getSettings();
      
      if (response.success && response.data) {
        const settings = response.data;
        setPushNotifications(settings.pushNotifications ?? true);
        setEmailNotifications(settings.emailNotifications ?? true);
        setCourseUpdates(settings.courseUpdates ?? true);
        setLiveClassReminders(settings.liveClassReminders ?? true);
        setDarkMode(settings.darkMode ?? false);
        setAutoPlayVideos(settings.autoPlayVideos ?? true);
        setDownloadQuality(settings.downloadQuality ?? 'High');
        console.log('📱 Settings loaded successfully:', settings);
      } else {
        console.warn('Failed to load settings:', response.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Notice', 'Settings loaded with default values');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      setIsSaving(true);
      console.log(`📱 Updating setting: ${key} = ${value}`);
      const response = await settingsService.updateSettings({ [key]: value });
      
      if (response.success) {
        console.log('📱 Setting updated successfully:', response.message);
        // Show success feedback briefly
        setTimeout(() => {
          // Could show a toast or brief success indicator here
        }, 100);
      } else {
        Alert.alert('Error', response.message || 'Failed to update setting');
        // Revert the change if it failed
        await loadSettings();
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
      // Revert the change if it failed
      await loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will reset all settings to default values and clear cached data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              // Clear settings from storage
              await settingsService.clearSettings();
              
              // Clear additional cache data
              try {
                await AsyncStorage.removeItem('mathematico_data_usage');
                // Reset data usage state
                const resetData = {
                  totalMB: 0,
                  lastReset: new Date().toISOString(),
                  sessions: []
                };
                setDataUsage(resetData);
              } catch (error) {
                console.warn('Error clearing data usage cache:', error);
              }
              
              // Reload settings with defaults
              await loadSettings();
              Alert.alert('Success', 'Cache and settings cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            } finally {
              setIsSaving(false);
            }
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

  const loadLanguage = async () => {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (language) {
        setSelectedLanguage(language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const handleLanguageSettings = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { 
          text: 'English', 
          onPress: async () => {
            setSelectedLanguage('English');
            await AsyncStorage.setItem(LANGUAGE_KEY, 'English');
            Alert.alert('Success', 'Language changed to English');
          }
        },
        { 
          text: 'Hindi', 
          onPress: async () => {
            setSelectedLanguage('Hindi');
            await AsyncStorage.setItem(LANGUAGE_KEY, 'Hindi');
            Alert.alert('Success', 'Language changed to Hindi');
          }
        },
        { 
          text: 'Bengali', 
          onPress: async () => {
            setSelectedLanguage('Bengali');
            await AsyncStorage.setItem(LANGUAGE_KEY, 'Bengali');
            Alert.alert('Success', 'Language changed to Bengali');
          }
        },
        { 
          text: 'Tamil', 
          onPress: async () => {
            setSelectedLanguage('Tamil');
            await AsyncStorage.setItem(LANGUAGE_KEY, 'Tamil');
            Alert.alert('Success', 'Language changed to Tamil');
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const loadDataUsage = async () => {
    try {
      const usageData = await AsyncStorage.getItem(DATA_USAGE_KEY);
      if (usageData) {
        setDataUsage(JSON.parse(usageData));
      } else {
        // Initialize data usage tracking
        const initialData = {
          totalMB: 0,
          lastReset: new Date().toISOString(),
          sessions: []
        };
        await AsyncStorage.setItem(DATA_USAGE_KEY, JSON.stringify(initialData));
        setDataUsage(initialData);
      }
    } catch (error) {
      console.error('Error loading data usage:', error);
    }
  };

  const handleDataUsage = () => {
    const totalMB = dataUsage.totalMB || 0;
    const lastReset = dataUsage.lastReset ? new Date(dataUsage.lastReset).toLocaleDateString() : 'Never';
    
    Alert.alert(
      'Data Usage Statistics',
      `Total Data Used: ${totalMB.toFixed(2)} MB\nLast Reset: ${lastReset}`,
      [
        {
          text: 'Reset Statistics',
          onPress: async () => {
            try {
              const resetData = {
                totalMB: 0,
                lastReset: new Date().toISOString(),
                sessions: []
              };
              await AsyncStorage.setItem(DATA_USAGE_KEY, JSON.stringify(resetData));
              setDataUsage(resetData);
              Alert.alert('Success', 'Data usage statistics have been reset');
            } catch (error) {
              console.error('Error resetting data usage:', error);
              Alert.alert('Error', 'Failed to reset data usage statistics');
            }
          }
        },
        { text: 'OK' }
      ]
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
          <ArrowLeft size={24} color={designSystem.colors.textPrimary} />
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
              left={(props) => <Bell size={24} color={props.color} />}
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
              left={(props) => <Mail size={24} color={props.color} />}
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
              left={(props) => <GraduationCap size={24} color={props.color} />}
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
              left={(props) => <Video size={24} color={props.color} />}
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
              left={(props) => <Moon size={24} color={props.color} />}
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
              left={(props) => <PlayCircle size={24} color={props.color} />}
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
              left={(props) => <Download size={24} color={props.color} />}
              right={() => <CheckCircle size={20} color={designSystem.colors.primary} />}
              onPress={handleDownloadSettings}
            />
            <Divider />

            <List.Item
              title="Language"
              description={selectedLanguage}
              left={(props) => <Languages size={24} color={props.color} />}
              right={() => <CheckCircle size={20} color={designSystem.colors.primary} />}
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
              left={(props) => <Trash2 size={24} color={props.color} />}
              right={() => <CheckCircle size={20} color={designSystem.colors.primary} />}
              onPress={handleClearCache}
            />
            <Divider />

            <List.Item
              title="Data Usage"
              description={`${(dataUsage.totalMB || 0).toFixed(2)} MB used`}
              left={(props) => <BarChart3 size={24} color={props.color} />}
              right={() => <CheckCircle size={20} color={designSystem.colors.primary} />}
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
              description={`${appVersion} (Build ${buildNumber})`}
              left={(props) => <Info size={24} color={props.color} />}
            />
            <Divider />

            <List.Item
              title="Terms of Use"
              left={(props) => <FileText size={24} color={props.color} />}
              right={() => <CheckCircle size={20} color={designSystem.colors.primary} />}
              onPress={() => navigation.navigate('TermsOfUse')}
            />
            <Divider />
            <List.Item
              title="Privacy Policy"
              left={(props) => <Shield size={24} color={props.color} />}
              right={() => <CheckCircle size={20} color={designSystem.colors.primary} />}
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

