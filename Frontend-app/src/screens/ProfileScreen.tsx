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
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Avatar,
  Dialog,
  Portal,

  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { User, Mail, Phone, Calendar, MapPin, Award, Settings, LifeBuoy, ShieldCheck, ChevronRight, Circle, FileText } from 'lucide-react-native';

// Create icons object for dynamic lookup
const icons = {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  Settings,
  LifeBuoy,
  ShieldCheck,
  ChevronRight,
  Circle,
  FileText
};
import { useAuth } from '../contexts/AuthContext';
import { CustomTextInput } from '../components/CustomTextInput';
import { designSystem } from '../styles/designSystem';
import { theme } from '../styles/theme';
import { Logger } from '../utils/errorHandler';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync editName with user name when user changes
  useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user?.name]);

  const handleLogout = () => {
    console.log('ProfileScreen: Logout button pressed');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            console.log('ProfileScreen: Logout confirmed, calling logout function');
            try {
              await logout();
              console.log('ProfileScreen: Logout completed successfully');
            } catch (error) {
              Logger.error('ProfileScreen: Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    const trimmedName = editName.trim();
    const success = await updateProfile({ name: trimmedName });
    if (success) {
      // The user state will be updated by AuthContext, which will trigger the useEffect
      // to update editName automatically
      setShowEditDialog(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      // If update failed, reset editName to current user name
      setEditName(user?.name || '');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    // Note: This would need to be implemented in authService
    Alert.alert('Info', 'Password change functionality needs to be implemented');
    setShowPasswordDialog(false);
  };

  const menuItems = [
    {
      title: 'My Courses',
      icon: 'GraduationCap',
      onPress: () => navigation.navigate('Courses'),
    },
    {
      title: 'My Books',
      icon: 'BookOpen',
      onPress: () => navigation.navigate('Books'),
    },
    {
      title: 'Live Classes',
      icon: 'Video',
      onPress: () => navigation.navigate('LiveClasses'),
    },
    {
      title: 'About Us',
      icon: 'Info',
      onPress: () => navigation.navigate('About'),
    },
    {
      title: 'Privacy Policy',
      icon: 'ShieldQuestion',
      onPress: () => navigation.navigate('PrivacyPolicy'),
    },
    {
      title: 'Terms of Use',
      icon: 'Scale',
      onPress: () => navigation.navigate('TermsOfUse'),
    },
    {
      title: 'Settings',
      icon: 'Settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      title: 'Help & Support',
      icon: 'LifeBuoy',
      onPress: () => Alert.alert('Support', 'Contact us at support@mathematico.com'),
    },
  ];

  if (user?.isAdmin) {
    menuItems.splice(3, 0, {
      title: 'Admin Panel',
      icon: 'ShieldCheck',
      onPress: () => navigation.navigate('Admin'),
    });
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={80}
              label={user?.name?.charAt(0)?.toUpperCase() || 'U'}
              style={styles.avatar}
            />
          </View>
          <Title style={styles.userName}>{user?.name || 'User'}</Title>
          <Paragraph style={styles.userEmail}>{user?.email}</Paragraph>
          <View style={styles.roleContainer}>
            <Chip
              mode="flat"
              style={[
                styles.roleChip,
                { backgroundColor: user?.isAdmin ? (theme?.colors?.primary || designSystem.colors.primary) : (theme?.colors?.secondary || designSystem.colors.secondary) }
              ]}
              textStyle={{ color: theme?.colors?.surface || designSystem.colors.surface }}
            >
              {user?.isAdmin ? 'Admin' : 'Student'}
            </Chip>
          </View>
          <Button
            mode="outlined"
            onPress={() => setShowEditDialog(true)}
            style={styles.editButton}
            icon="pencil"
          >
            Edit Profile
          </Button>
        </Card.Content>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        <Card.Content>
          <Title style={styles.menuTitle}>Menu</Title>
          {menuItems.map((item, index) => (
            <View key={index}>
              <List.Item
                title={item.title}
                left={(props) => {
                  const Key = item.icon as keyof typeof icons;
                  const IconCmp = icons[Key] || icons.Circle;
                  return (
                    <View style={{ justifyContent: 'center', alignItems: 'center', width: 24 }}>
                      <IconCmp size={20} color={props.color} />
                    </View>
                  );
                }}
                right={(props) => {
                  const Chevron = icons.ChevronRight;
                  return (
                    <View style={{ justifyContent: 'center', alignItems: 'center', width: 24 }}>
                      <Chevron size={20} color={props.color} />
                    </View>
                  );
                }}
                onPress={item.onPress}
                style={styles.menuItem}
              />
              {index < menuItems.length - 1 && <Divider />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Title style={styles.actionsTitle}>Account</Title>
          <Button
            mode="outlined"
            onPress={() => setShowPasswordDialog(true)}
            style={styles.actionButton}
            icon="lock"
          >
            Change Password
          </Button>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            icon="logout"
            textColor={theme?.colors?.error || designSystem.colors.error}
          >
            Logout
          </Button>
        </Card.Content>
      </Card>

      {/* Edit Profile Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <CustomTextInput
              label="Name"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              style={styles.dialogInput}
              leftIcon="person"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onPress={handleUpdateProfile} disabled={isLoading}>
              {isLoading ? <ActivityIndicator size="small" /> : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Change Password Dialog */}
      <Portal>
        <Dialog visible={showPasswordDialog} onDismiss={() => setShowPasswordDialog(false)}>
          <Dialog.Title>Change Password</Dialog.Title>
          <Dialog.Content>
            <CustomTextInput
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
              leftIcon="lock"
            />
            <CustomTextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
              leftIcon="lock"
            />
            <CustomTextInput
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry
              style={styles.dialogInput}
              leftIcon="lock"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onPress={handleChangePassword}>Change Password</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  profileCard: {
    margin: designSystem.spacing.md,
    ...designSystem.shadows.lg,
    borderRadius: designSystem.borderRadius.lg,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: designSystem.spacing.lg,
  },
  avatarContainer: {
    marginBottom: designSystem.spacing.md,
  },
  avatar: {
    backgroundColor: designSystem.colors.primary,
  },
  userName: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.xs,
  },
  userEmail: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    marginBottom: designSystem.spacing.md,
  },
  roleContainer: {
    marginBottom: designSystem.spacing.lg,
  },
  roleChip: {
    height: 32,
  },
  editButton: {
    borderColor: theme?.colors?.primary || designSystem.colors.primary,
  },
  menuCard: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    ...designSystem.shadows.md,
    borderRadius: designSystem.borderRadius.lg,
  },
  menuTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.md,
  },
  menuItem: {
    paddingVertical: designSystem.spacing.sm,
  },
  actionsCard: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    ...designSystem.shadows.md,
    borderRadius: designSystem.borderRadius.lg,
  },
  actionsTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.md,
  },
  actionButton: {
    marginBottom: designSystem.spacing.sm,
    borderColor: theme?.colors?.primary || designSystem.colors.primary,
  },
  logoutButton: {
    borderColor: theme?.colors?.error || designSystem.colors.error,
  },
  dialogInput: {
    marginBottom: designSystem.spacing.md,
  },
});
