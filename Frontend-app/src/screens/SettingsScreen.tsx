import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Switch as RNSwitch,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  BackHandler,
} from 'react-native';
import {
  Card,
  Title,
  List,
  Divider,
  Button,
  useTheme,
  Portal,
  Dialog,
  TextInput,
  HelperText,
  Snackbar,
  Switch,
} from 'react-native-paper';
import {
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
  CheckCircle,
  ArrowLeft,
  WifiOff,
  Wifi,
  CloudUpload,
  Clock,
  AlertCircle,
  X,
  Check,
  RotateCw,
} from 'lucide-react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Updates from 'expo-updates';
import { debounce } from '../utils/debounce';
import { safeCatch } from '../utils/safeCatch';
import SettingsService, { Settings, PendingSetting, UserSettings } from '../services/settingsService';
import { designSystem } from '../styles/designSystem';
import { theme } from '../styles/theme';
import { formatBytes, formatDate } from '../utils/formatters';

const DATA_USAGE_KEY = 'mathematico_data_usage';
const LANGUAGE_KEY = 'mathematico_language';
const PENDING_SETTINGS_KEY = 'pending_settings';

interface DataUsage {
  totalMB: number;
  lastReset: string;
  sessions: Array<{
    date: string;
    dataUsed: number;
    type: 'video' | 'document' | 'other';
  }>;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
];

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [showDataUsageDialog, setShowDataUsageDialog] = useState(false);
  const [showOfflineSnackbar, setShowOfflineSnackbar] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingSetting[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');
  const [dataUsage, setDataUsage] = useState<DataUsage>({
    totalMB: 0,
    lastReset: new Date().toISOString(),
    sessions: [],
  });

  const settingsRef = useRef<Settings>({
    notifications: {
      push: true,
      email: true,
      sms: false,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: true,
      showPhone: false,
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    learning: {
      autoPlayVideos: true,
      downloadOverWifi: true,
    },
  });

  const [settings, setSettings] = useState<Settings>(settingsRef.current);
  const [hasChanges, setHasChanges] = useState(false);

  // Get app version from expo-constants
  const appVersion = Constants.expoConfig?.version || '7.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || 
                     Constants.expoConfig?.android?.versionCode?.toString() || '7';

  // Show snackbar message
  const showSnackbar = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarType(type);
    // Auto-hide after 3 seconds
    setTimeout(() => setSnackbarMessage(''), 3000);
  }, []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (newSettings: Settings) => {
      try {
        await SettingsService.updateSettings(newSettings);
        setHasChanges(false);
      } catch (error) {
        safeCatch('SettingsScreen.saveSettings', () => {
          showSnackbar('Failed to save settings', 'error');
        })(error);
      }
    }, 1000),
    []
  );

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const response = await SettingsService.getSettings();
      if (response.success && response.data) {
        const loadedSettings = response.data;
        settingsRef.current = loadedSettings;
        setSettings(loadedSettings);
      }
    } catch (error) {
      safeCatch('SettingsScreen.loadSettings', () => {
        showSnackbar('Failed to load settings', 'error');
      })(error);
    }
  }, [showSnackbar]);

  // Load pending settings
  const loadPendingSettings = useCallback(async () => {
    try {
      // syncPendingSettings returns a boolean indicating success/failure
      const success = await SettingsService.syncPendingSettings();
      if (success) {
        // If sync was successful, clear pending changes
        setPendingChanges([]);
      }
    } catch (error) {
      safeCatch('SettingsScreen.syncPendingSettings')(error);
      // If there was an error, we'll keep the existing pending changes
    }
  }, []);

  // Load data usage
  const loadDataUsage = useCallback(async () => {
    try {
      const usage = await AsyncStorage.getItem(DATA_USAGE_KEY);
      if (usage) {
        setDataUsage(JSON.parse(usage));
        return;
      }
      // Initialize data usage if not exists
      const initialData: DataUsage = {
        totalMB: 0,
        lastReset: new Date().toISOString(),
        sessions: [],
      };
      await AsyncStorage.setItem(DATA_USAGE_KEY, JSON.stringify(initialData));
      setDataUsage(initialData);
    } catch (error) {
      safeCatch('SettingsScreen.loadDataUsage')(error);
    }
  }, []);

  // Handle setting changes
  const handleSettingChange = useCallback(
    <T extends keyof UserSettings, K extends keyof UserSettings[T]>(
      section: T,
      key: K,
      value: UserSettings[T][K]
    ) => {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }));
      
      // Update ref for debounced save
      settingsRef.current = {
        ...settingsRef.current,
        [section]: {
          ...settingsRef.current[section],
          [key]: value,
        },
      };
      
      setHasChanges(true);
      debouncedSave(settingsRef.current);
    },
    [debouncedSave]
  );

  // Save settings
  const handleSaveSettings = useCallback(async () => {
    try {
      setIsSaving(true);
      await SettingsService.updateSettings(settingsRef.current);
      setHasChanges(false);
      showSnackbar('Settings saved successfully', 'success');
    } catch (error) {
      safeCatch('SettingsScreen.handleSaveSettings', () => {
        showSnackbar('Failed to save settings', 'error');
      })(error);
    } finally {
      setIsSaving(false);
    }
  }, [showSnackbar]);

  // Reset settings to default
  const handleResetSettings = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Clear all cached data
      await Promise.all([
        AsyncStorage.clear(),
        SettingsService.clearSettings(),
      ]);

      // Reset to default settings
      const defaultSettings: UserSettings = {
        notifications: {
          push: true,
          email: true,
          sms: false,
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: true,
          showPhone: false,
        },
        preferences: {
          theme: 'light',
          language: 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        learning: {
          autoPlayVideos: true,
          downloadOverWifi: true,
        },
      };

      // Update state with default settings
      settingsRef.current = defaultSettings;
      setSettings(defaultSettings);
      setHasChanges(false);
      
      showSnackbar('Settings reset to default', 'success');
    } catch (error) {
      safeCatch('SettingsScreen.resetSettings', () => {
        showSnackbar('Failed to reset settings', 'error');
      })(error);
    } finally {
      setIsSaving(false);
    }
  }, [showSnackbar]);

  // Clear cache
  const handleClearCache = useCallback(async () => {
    try {
      setIsSaving(true);
      await AsyncStorage.clear();
      await loadDataUsage();
      showSnackbar('Cache cleared successfully', 'success');
    } catch (error) {
      safeCatch('SettingsScreen.clearCache', () => {
        showSnackbar('Failed to clear cache', 'error');
      })(error);
    } finally {
      setIsSaving(false);
      setShowClearCacheDialog(false);
    }
  }, [loadDataUsage, showSnackbar]);

  // Network change handler
  const handleNetworkChange = useCallback((state: NetInfoState) => {
    const isNowOnline = state.isConnected ?? false;
    setIsOnline(isNowOnline);
    
    if (!isNowOnline) {
      setShowOfflineSnackbar(true);
    } else if (hasChanges) {
      handleSaveSettings();
    }
  }, [hasChanges, handleSaveSettings]);

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    let netInfoUnsubscribe: (() => void) | null = null;

    const loadInitialData = async () => {
      try {
        if (!isMounted) return;

        // Check network status first
        try {
          const netInfoState = await NetInfo.fetch();
          setIsOnline(netInfoState.isConnected ?? false);
        } catch (netError) {
          safeCatch('SettingsScreen.initialLoad.networkCheck')(netError);
          setIsOnline(false);
        }

        // Load settings with error handling
        try {
          await loadSettings();
        } catch (settingsError) {
          safeCatch('SettingsScreen.initialLoad.loadSettings')(settingsError);
          // Continue with default settings
        }

        // Load data usage with error handling
        try {
          await loadDataUsage();
        } catch (dataError) {
          safeCatch('SettingsScreen.initialLoad.loadDataUsage')(dataError);
          // Continue without data usage
        }

        // Load pending settings if online
        try {
          const netInfoState = await NetInfo.fetch();
          if (netInfoState.isConnected) {
            await loadPendingSettings();
          }
        } catch (pendingError) {
          safeCatch('SettingsScreen.initialLoad.loadPendingSettings')(pendingError);
          // Continue without pending settings
        }

        // Set up network listener with error handling
        try {
          netInfoUnsubscribe = NetInfo.addEventListener(handleNetworkChange);
        } catch (listenerError) {
          safeCatch('SettingsScreen.initialLoad.networkListener')(listenerError);
          // Continue without network listener
        }
      } catch (error) {
        safeCatch('SettingsScreen.initialLoad')(error);
        // Don't show snackbar during initial load to avoid crash
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    // Cleanup
    return () => {
      isMounted = false;
      if (netInfoUnsubscribe) {
        try {
          netInfoUnsubscribe();
        } catch (cleanupError) {
          safeCatch('SettingsScreen.cleanup')(cleanupError);
        }
      }
    };
  }, [handleNetworkChange, loadDataUsage, loadPendingSettings, loadSettings]);

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showLanguageDialog || showQualityDialog || showClearCacheDialog || showDataUsageDialog) {
        setShowLanguageDialog(false);
        setShowQualityDialog(false);
        setShowClearCacheDialog(false);
        setShowDataUsageDialog(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showLanguageDialog, showQualityDialog, showClearCacheDialog, showDataUsageDialog]);

  // Render loading state with error boundary
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
          Loading settings...
        </Text>
      </View>
    );
  }

  // Render error state if settings failed to load
  if (!settings) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={[styles.loadingText, { color: colors.onSurfaceVariant, marginTop: 16 }]}>
          Failed to load settings
        </Text>
        <Button 
          mode="contained" 
          onPress={() => {
            setIsLoading(true);
            loadSettings().finally(() => setIsLoading(false));
          }}
          style={{ marginTop: 16 }}
        >
          Retry
        </Button>
      </View>
    );
  }

  // Render switch component with consistent styling
  const renderSwitch = (value: boolean, onValueChange: (value: boolean) => void) => (
    <Switch
      value={value}
      onValueChange={onValueChange}
      color={colors.primary}
    />
  );

  // Render notification settings
  const renderNotificationSettings = () => (
    <Card style={styles.card}>
      <Card.Title
        title="Notifications"
        left={(props) => <Bell {...props} color={colors.primary} />}
      />
      <Card.Content>
        <List.Item
          title="Push Notifications"
          description="Receive push notifications"
          left={props => <List.Icon {...props} icon="bell" />}
          right={props => renderSwitch(
            settings.notifications.push, 
            (value) => handleSettingChange('notifications', 'push', value)
          )}
        />
        <Divider />
        <List.Item
          title="Email Notifications"
          description="Receive email notifications"
          left={props => <List.Icon {...props} icon="email" />}
          right={props => renderSwitch(
            settings.notifications.email, 
            (value) => handleSettingChange('notifications', 'email', value)
          )}
        />
        <Divider />
        <List.Item
          title="SMS Notifications"
          description="Receive SMS notifications"
          left={props => <List.Icon {...props} icon="message-text" />}
          right={props => renderSwitch(
            settings.notifications.sms, 
            (value) => handleSettingChange('notifications', 'sms', value)
          )}
        />
      </Card.Content>
    </Card>
  );

  // Render privacy settings
  const renderPrivacySettings = () => (
    <Card style={styles.card}>
      <Card.Title
        title="Privacy"
        left={(props) => <Shield {...props} color={colors.primary} />}
      />
      <Card.Content>
        <List.Item
          title="Profile Visibility"
          description="Who can see your profile"
          left={props => <List.Icon {...props} icon="account-eye" />}
          right={props => (
            <View style={styles.settingValueContainer}>
              <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
                {settings.privacy.profileVisibility === 'public' ? 'Public' : 'Private'}
              </Text>
              <List.Icon {...props} icon="chevron-right" />
            </View>
          )}
          onPress={() => {
            const newVisibility = settings.privacy.profileVisibility === 'public' ? 'private' : 'public';
            handleSettingChange('privacy', 'profileVisibility', newVisibility);
          }}
        />
        <Divider />
        <List.Item
          title="Show Email"
          description="Display your email on your profile"
          left={props => <List.Icon {...props} icon="email-outline" />}
          right={props => renderSwitch(
            settings.privacy.showEmail,
            (value) => handleSettingChange('privacy', 'showEmail', value)
          )}
        />
        <Divider />
        <List.Item
          title="Show Phone Number"
          description="Display your phone number on your profile"
          left={props => <List.Icon {...props} icon="phone" />}
          right={props => renderSwitch(
            settings.privacy.showPhone,
            (value) => handleSettingChange('privacy', 'showPhone', value)
          )}
        />
      </Card.Content>
    </Card>
  );

  // Render app preferences
  const renderPreferenceSettings = () => (
    <Card style={styles.card}>
      <Card.Title
        title="App Preferences"
        left={(props) => <Moon {...props} color={colors.primary} />}
      />
      <Card.Content>
        <List.Item
          title="Theme"
          description="Change the app's color scheme"
          left={props => <Moon size={24} color={colors.onSurface} />}
          onPress={() => {
            const newTheme = settings.preferences.theme === 'light' ? 'dark' : 'light';
            handleSettingChange('preferences', 'theme', newTheme);
          }}
          right={props => (
            <View style={styles.settingValueContainer}>
              <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
                {settings.preferences.theme === 'light' ? 'Light' : 'Dark'}
              </Text>
              <List.Icon {...props} icon="chevron-right" />
            </View>
          )}
        />
        <Divider />
        <List.Item
          title="Language"
          description="Change the app's language"
          left={props => <Languages size={24} color={colors.onSurface} />}
          onPress={() => setShowLanguageDialog(true)}
          right={props => (
            <View style={styles.settingValueContainer}>
              <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
                {SUPPORTED_LANGUAGES.find(lang => lang.code === settings.preferences.language)?.name || 'English'}
              </Text>
              <List.Icon {...props} icon="chevron-right" />
            </View>
          )}
        />
        <Divider />
        <List.Item
          title="Time Zone"
          description={settings.preferences.timezone}
          left={props => <Clock size={24} color={colors.onSurface} />}
          right={props => (
            <View style={styles.settingValueContainer}>
              <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
                {settings.preferences.timezone}
              </Text>
            </View>
          )}
        />
      </Card.Content>
    </Card>
  );

  // Render learning preferences
  const renderLearningSettings = () => (
    <Card style={styles.card}>
      <Card.Title
        title="Learning Preferences"
        left={(props) => <GraduationCap {...props} color={colors.primary} />}
      />
      <Card.Content>
        <List.Item
          title="Auto-play Videos"
          description="Automatically play video lessons"
          left={props => <PlayCircle size={24} color={colors.onSurface} />}
          right={props => renderSwitch(
            settings.learning.autoPlayVideos,
            (value) => handleSettingChange('learning', 'autoPlayVideos', value)
          )}
        />
        <Divider />
        <List.Item
          title="Download Over Wi-Fi Only"
          description="Only download content when connected to Wi-Fi"
          left={props => <Wifi size={24} color={colors.onSurface} />}
          right={props => renderSwitch(
            settings.learning.downloadOverWifi,
            (value) => handleSettingChange('learning', 'downloadOverWifi', value)
          )}
        />
      </Card.Content>
    </Card>
  );

  // Render data usage
  const renderDataUsage = () => (
    <Card style={styles.card}>
      <Card.Title
        title="Data Usage"
        left={(props) => <BarChart3 {...props} color={colors.primary} />}
      />
      <Card.Content>
        <List.Item
          title="Data Usage"
          description={`${formatBytes(dataUsage.totalMB * 1024 * 1024)} used this month`}
          left={props => <List.Icon {...props} icon="chart-bar" />}
          right={props => (
            <View style={styles.settingValueContainer}>
              <Text style={[styles.settingValue, { color: colors.onSurfaceVariant }]}>
                {formatBytes(dataUsage.totalMB * 1024 * 1024, true, 1)}
              </Text>
              <List.Icon {...props} icon="chevron-right" />
            </View>
          )}
          onPress={() => setShowDataUsageDialog(true)}
        />
        <Divider />
        <List.Item
          title="Clear Cache"
          description="Free up storage space"
          left={props => <Trash2 size={24} color={colors.onSurface} />}
          onPress={() => setShowClearCacheDialog(true)}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </Card.Content>
    </Card>
  );

  // Render about section
  const renderAboutSection = () => (
    <Card style={styles.card}>
      <Card.Title
        title="About"
        left={(props) => <Info {...props} color={colors.primary} />}
      />
      <Card.Content>
        <List.Item
          title="Version"
          description={`${appVersion} (${buildNumber})`}
          left={props => <List.Icon {...props} icon="information" />}
        />
        <Divider />
        <List.Item
          title="Terms of Service"
          left={props => <FileText size={24} color={colors.onSurface} />}
          onPress={() => navigation.navigate('TermsOfService')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Privacy Policy"
          left={props => <Shield size={24} color={colors.onSurface} />}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </Card.Content>
    </Card>
  );

  // Render sync status indicator
  const renderSyncStatus = () => {
    if (!isOnline) {
      return (
        <View style={[styles.offlineIndicator, { backgroundColor: colors.errorContainer }]}>
          <WifiOff size={16} color={colors.onErrorContainer} />
          <Text style={[styles.offlineText, { color: colors.onErrorContainer }]}>
            Offline - Changes will sync when online
          </Text>
        </View>
      );
    }

    if (pendingChanges.length > 0) {
      return (
        <View style={[styles.pendingChanges, { backgroundColor: colors.primaryContainer }]}>
          <CloudUpload size={16} color={colors.onPrimaryContainer} />
          <Text style={[styles.pendingText, { color: colors.onPrimaryContainer }]}>
            Syncing {pendingChanges.length} change{pendingChanges.length > 1 ? 's' : ''}...
          </Text>
        </View>
      );
    }

    return null;
  };

  // Render language dialog
  const renderLanguageDialog = () => (
    <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
      <Dialog.Title>Select Language</Dialog.Title>
      <Dialog.ScrollArea style={styles.dialogScrollView}>
        <ScrollView>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <React.Fragment key={lang.code}>
              <TouchableOpacity
                onPress={() => {
                  handleSettingChange('preferences', 'language', lang.code);
                  setShowLanguageDialog(false);
                }}
                style={styles.languageItem}
              >
                <Text style={[styles.languageName, { color: colors.onSurface }]}>
                  {lang.nativeName} ({lang.name})
                </Text>
                {settings.preferences.language === lang.code && (
                  <Check size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
              <Divider />
            </React.Fragment>
          ))}
        </ScrollView>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button onPress={() => setShowLanguageDialog(false)}>Cancel</Button>
      </Dialog.Actions>
    </Dialog>
  );

  // Render clear cache dialog
  const renderClearCacheDialog = () => (
    <Dialog visible={showClearCacheDialog} onDismiss={() => setShowClearCacheDialog(false)}>
      <Dialog.Title>Clear Cache</Dialog.Title>
      <Dialog.Content>
        <Text style={{ color: colors.onSurfaceVariant }}>
          This will clear all cached data, including offline content and temporary files. 
          Your settings and progress will not be affected.
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={() => setShowClearCacheDialog(false)}>Cancel</Button>
        <Button 
          onPress={handleClearCache}
          loading={isSaving}
          disabled={isSaving}
        >
          Clear Cache
        </Button>
      </Dialog.Actions>
    </Dialog>
  );

  // Render data usage dialog
  const renderDataUsageDialog = () => (
    <Dialog 
      visible={showDataUsageDialog} 
      onDismiss={() => setShowDataUsageDialog(false)}
      style={styles.dialog}
    >
      <Dialog.Title>Data Usage</Dialog.Title>
      <Dialog.ScrollArea style={styles.dialogScrollView}>
        <View style={styles.dataUsageContainer}>
          <View style={styles.dataUsageRow}>
            <Text style={[styles.dataUsageLabel, { color: colors.onSurfaceVariant }]}>
              Total Data Used:
            </Text>
            <Text style={[styles.dataUsageValue, { color: colors.onSurface }]}>
              {formatBytes(dataUsage.totalMB * 1024 * 1024, true, 1)}
            </Text>
          </View>
          <View style={styles.dataUsageRow}>
            <Text style={[styles.dataUsageLabel, { color: colors.onSurfaceVariant }]}>
              Last Reset:
            </Text>
            <Text style={[styles.dataUsageValue, { color: colors.onSurface }]}>
              {formatDate(dataUsage.lastReset, 'MMM D, YYYY')}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
            Usage by Session
          </Text>
          {dataUsage.sessions.length > 0 ? (
            dataUsage.sessions.map((session, index) => (
              <View key={index} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionDate, { color: colors.onSurface }]}>
                    {formatDate(session.date, 'MMM D, h:mm A')}
                  </Text>
                  <Text style={[styles.sessionType, { color: colors.onSurfaceVariant }]}>
                    {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                  </Text>
                </View>
                <Text style={[styles.sessionData, { color: colors.primary }]}>
                  {formatBytes(session.dataUsed * 1024 * 1024, true, 1)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.noDataText, { color: colors.onSurfaceVariant }]}>
              No session data available
            </Text>
          )}
        </View>
      </Dialog.ScrollArea>
      <Dialog.Actions>
        <Button 
          onPress={() => {
            // Reset data usage
            const resetData: DataUsage = {
              totalMB: 0,
              lastReset: new Date().toISOString(),
              sessions: [],
            };
            setDataUsage(resetData);
            AsyncStorage.setItem(DATA_USAGE_KEY, JSON.stringify(resetData));
            setShowDataUsageDialog(false);
            showSnackbar('Data usage reset', 'success');
          }}
        >
          Reset
        </Button>
        <Button onPress={() => setShowDataUsageDialog(false)}>Close</Button>
      </Dialog.Actions>
    </Dialog>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {renderSyncStatus()}
        
        {renderNotificationSettings()}
        {renderPrivacySettings()}
        {renderPreferenceSettings()}
        {renderLearningSettings()}
        {renderDataUsage()}
        {renderAboutSection()}

        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            onPress={handleResetSettings}
            style={[styles.resetButton, { backgroundColor: colors.errorContainer }]}
            labelStyle={{ color: colors.onErrorContainer }}
            icon={({ size, color }) => <RotateCw size={size} color={color} />}
            loading={isSaving}
            disabled={isSaving}
          >
            Reset to Defaults
          </Button>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.onSurfaceVariant }]}>
            Mathematico v{appVersion} (Build {buildNumber})
          </Text>
          <Text style={[styles.copyrightText, { color: colors.onSurfaceVariant }]}>
            © {new Date().getFullYear()} Mathematico. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <Portal>
        {renderLanguageDialog()}
        {renderClearCacheDialog()}
        {renderDataUsageDialog()}
      </Portal>

      {/* Snackbar for offline status */}
      <Snackbar
        visible={showOfflineSnackbar}
        onDismiss={() => setShowOfflineSnackbar(false)}
        duration={3000}
        style={[
          styles.snackbar,
          { 
            backgroundColor: colors.errorContainer,
            borderLeftColor: colors.error,
          }
        ]}
        theme={{
          colors: {
            surface: colors.errorContainer,
            onSurface: colors.onErrorContainer,
          },
        }}
      >
        <View style={styles.snackbarContent}>
          <WifiOff size={20} color={colors.onErrorContainer} style={styles.snackbarIcon} />
          <Text style={[styles.snackbarText, { color: colors.onErrorContainer }]}>
            You are currently offline. Some features may be limited.
          </Text>
        </View>
      </Snackbar>

      {/* Snackbar for messages */}
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage('')}
        duration={3000}
        style={[
          styles.snackbar,
          { 
            backgroundColor: 
              snackbarType === 'error' 
                ? colors.errorContainer 
                : snackbarType === 'success'
                ? colors.primaryContainer
                : colors.surfaceVariant,
            borderLeftColor: 
              snackbarType === 'error' 
                ? colors.error 
                : snackbarType === 'success'
                ? colors.primary
                : colors.onSurfaceVariant,
          }
        ]}
        theme={{
          colors: {
            surface: 
              snackbarType === 'error' 
                ? colors.errorContainer 
                : snackbarType === 'success'
                ? colors.primaryContainer
                : colors.surfaceVariant,
            onSurface: 
              snackbarType === 'error' 
                ? colors.onErrorContainer 
                : snackbarType === 'success'
                ? colors.onPrimaryContainer
                : colors.onSurfaceVariant,
          },
        }}
      >
        <View style={styles.snackbarContent}>
          {snackbarType === 'error' && (
            <AlertCircle size={20} color={colors.onErrorContainer} style={styles.snackbarIcon} />
          )}
          {snackbarType === 'success' && (
            <CheckCircle size={20} color={colors.onPrimaryContainer} style={styles.snackbarIcon} />
          )}
          {snackbarType === 'info' && (
            <Info size={20} color={colors.onSurfaceVariant} style={styles.snackbarIcon} />
          )}
          <Text 
            style={[
              styles.snackbarText, 
              { 
                color: 
                  snackbarType === 'error' 
                    ? colors.onErrorContainer 
                    : snackbarType === 'success'
                    ? colors.onPrimaryContainer
                    : colors.onSurfaceVariant,
              }
            ]}
          >
            {snackbarMessage}
          </Text>
        </View>
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    marginRight: 8,
    fontSize: 14,
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  resetButton: {
    marginTop: 16,
    borderRadius: 8,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  versionText: {
    fontSize: 12,
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 12,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pendingChanges: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  offlineText: {
    marginLeft: 8,
    fontSize: 14,
  },
  pendingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  dialog: {
    borderRadius: 12,
  },
  dialogScrollView: {
    maxHeight: 400,
    paddingHorizontal: 0,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  languageName: {
    fontSize: 16,
  },
  dataUsageContainer: {
    padding: 16,
  },
  dataUsageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dataUsageLabel: {
    fontSize: 14,
  },
  dataUsageValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    marginBottom: 2,
  },
  sessionType: {
    fontSize: 12,
    opacity: 0.7,
  },
  sessionData: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 16,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  snackbar: {
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    elevation: 4,
  },
  snackbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackbarIcon: {
    marginRight: 8,
  },
  snackbarText: {
    flex: 1,
    fontSize: 14,
  },
});