import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Button,
  Switch,
  ActivityIndicator,
  Divider,
  Card,
  Title,
  SegmentedButtons,
} from 'react-native-paper';
import { Icon } from '../../components/Icon';
import { CustomTextInput } from '../../components/CustomTextInput';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import { designSystem, layoutStyles, textStyles } from '../../styles/designSystem';
import { UnifiedCard } from '../../components/UnifiedCard';
import { safeCatch } from '../../utils/safeCatch';

interface AdminSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  require_email_verification: boolean;
  max_file_size: number;
  supported_file_types: string;
}

export default function AdminSettings({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>({
    site_name: 'Mathematico',
    site_description: 'Learn Mathematics Online',
    contact_email: 'support@mathematico.com',
    maintenance_mode: false,
    allow_registration: true,
    require_email_verification: false,
    max_file_size: 10,
    supported_file_types: 'jpg,jpeg,png,pdf,doc,docx',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getSettings();
      if (response && response.success && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      safeCatch('AdminSettings.loadSettings')(error);
      // Use default settings if API fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof AdminSettings, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await adminService.updateSettings(settings);
      if (response && response.success) {
        Alert.alert('Success', 'Settings saved successfully');
        setHasChanges(false);
      } else {
        Alert.alert('Error', 'Failed to save settings');
      }
    } catch (error) {
      safeCatch('AdminSettings.handleSave', () => {
        Alert.alert('Error', 'Failed to save settings');
      })(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              site_name: 'Mathematico',
              site_description: 'Learn Mathematics Online',
              contact_email: 'support@mathematico.com',
              maintenance_mode: false,
              allow_registration: true,
              require_email_verification: false,
              max_file_size: 10,
              supported_file_types: 'jpg,jpeg,png,pdf,doc,docx',
            });
            setHasChanges(true);
          },
        },
      ]
    );
  };

  const renderGeneralSettings = () => (
    <View style={styles.section}>
      <UnifiedCard style={styles.card}>
        <Title style={textStyles.subheading}>General Settings</Title>
        
        <CustomTextInput
          label="Site Name"
          value={settings.site_name}
          onChangeText={(text) => handleSettingChange('site_name', text)}
          style={styles.input}
          mode="outlined"
          leftIcon="home"
        />
        
        <CustomTextInput
          label="Site Description"
          value={settings.site_description}
          onChangeText={(text) => handleSettingChange('site_description', text)}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          leftIcon="description"
        />
        
        <CustomTextInput
          label="Contact Email"
          value={settings.contact_email}
          onChangeText={(text) => handleSettingChange('contact_email', text)}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          leftIcon="email"
        />
        
        <View style={styles.switchContainer}>
          <Text style={textStyles.body}>Maintenance Mode</Text>
          <Switch
            value={settings.maintenance_mode}
            onValueChange={(value) => handleSettingChange('maintenance_mode', value)}
            color={designSystem.colors.primary}
          />
        </View>
      </UnifiedCard>
    </View>
  );

  const renderSecuritySettings = () => (
    <View style={styles.section}>
      <UnifiedCard style={styles.card}>
        <Title style={textStyles.subheading}>Security Settings</Title>
        
        <View style={styles.switchContainer}>
          <Text style={textStyles.body}>Allow User Registration</Text>
          <Switch
            value={settings.allow_registration}
            onValueChange={(value) => handleSettingChange('allow_registration', value)}
            color={designSystem.colors.primary}
          />
        </View>
        
        <View style={styles.switchContainer}>
          <Text style={textStyles.body}>Require Email Verification</Text>
          <Switch
            value={settings.require_email_verification}
            onValueChange={(value) => handleSettingChange('require_email_verification', value)}
            color={designSystem.colors.primary}
          />
        </View>
      </UnifiedCard>
    </View>
  );

  const renderEmailSettings = () => (
    <View style={styles.section}>
      <UnifiedCard style={styles.card}>
        <Title style={textStyles.subheading}>Email Settings</Title>
        
        <CustomTextInput
          label="Contact Email"
          value={settings.contact_email}
          onChangeText={(text) => handleSettingChange('contact_email', text)}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          leftIcon="email"
        />
        
        <View style={styles.switchContainer}>
          <Text style={textStyles.body}>Require Email Verification</Text>
          <Switch
            value={settings.require_email_verification}
            onValueChange={(value) => handleSettingChange('require_email_verification', value)}
            color={designSystem.colors.primary}
          />
        </View>
      </UnifiedCard>
    </View>
  );

  const renderFileSettings = () => (
    <View style={styles.section}>
      <UnifiedCard style={styles.card}>
        <Title style={textStyles.subheading}>File Upload Settings</Title>
        
        <CustomTextInput
          label="Maximum File Size (MB)"
          value={settings.max_file_size.toString()}
          onChangeText={(text) => handleSettingChange('max_file_size', parseInt(text) || 10)}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
          leftIcon="folder"
        />
        
        <CustomTextInput
          label="Supported File Types"
          value={settings.supported_file_types}
          onChangeText={(text) => handleSettingChange('supported_file_types', text)}
          style={styles.input}
          mode="outlined"
          placeholder="jpg,jpeg,png,pdf,doc,docx"
          leftIcon="description"
        />
        <Text style={textStyles.caption}>
          Comma-separated list of file extensions
        </Text>
      </UnifiedCard>
    </View>
  );

  const renderDatabaseSettings = () => (
    <View style={styles.section}>
      <UnifiedCard style={styles.card}>
        <Title style={textStyles.subheading}>Database Settings</Title>
        
        <View style={styles.infoContainer}>
          <Icon name="information" size={20} color={designSystem.colors.info} />
          <Text style={textStyles.body}>
            Database connection is managed automatically by the platform.
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Icon name="check-circle" size={20} color={designSystem.colors.success} />
          <Text style={textStyles.body}>
            Status: Connected to Railway MySQL
          </Text>
        </View>
      </UnifiedCard>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={textStyles.body}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={designSystem.colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={textStyles.heading}>Settings</Text>
            <Text style={textStyles.caption}>
              Manage system settings and configuration
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'general', label: 'General', icon: 'earth' },
            { value: 'security', label: 'Security', icon: 'shield' },
            { value: 'email', label: 'Email', icon: 'email' },
            { value: 'files', label: 'Files', icon: 'file' },
            { value: 'database', label: 'Database', icon: 'database' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {activeTab === 'general' && renderGeneralSettings()}
        {activeTab === 'security' && renderSecuritySettings()}
        {activeTab === 'email' && renderEmailSettings()}
        {activeTab === 'files' && renderFileSettings()}
        {activeTab === 'database' && renderDatabaseSettings()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          mode="outlined"
          onPress={handleReset}
          style={styles.actionButton}
          icon="refresh"
        >
          Reset
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          style={styles.actionButton}
          icon="content-save"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.xl,
  },
  header: {
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
    ...designSystem.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xs,
  },
  backButton: {
    marginRight: designSystem.spacing.sm,
    padding: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.md,
  },
  headerText: {
    flex: 1,
  },
  tabContainer: {
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.borderLight,
  },
  segmentedButtons: {
    marginBottom: designSystem.spacing.sm,
  },
  scrollView: {
    flex: 1,
    padding: designSystem.spacing.md,
  },
  section: {
    marginBottom: designSystem.spacing.lg,
  },
  card: {
    padding: designSystem.spacing.lg,
    ...designSystem.shadows.sm,
    borderRadius: designSystem.borderRadius.lg,
  },
  input: {
    marginBottom: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.xs,
    backgroundColor: designSystem.colors.surfaceVariant,
    borderRadius: designSystem.borderRadius.md,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    gap: designSystem.spacing.sm,
    padding: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surfaceVariant,
    borderRadius: designSystem.borderRadius.md,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.surface,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.border,
    gap: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: designSystem.borderRadius.md,
    minHeight: 48,
  },
});
