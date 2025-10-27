import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Searchbar,
  Card,
  Title,
  Button,
  Switch,
  Chip,
  ActivityIndicator,
  FAB,
  Portal,
  Modal,

  HelperText,
} from 'react-native-paper';
import { Icon } from '../../components/Icon';
import { CustomTextInput } from '../../components/CustomTextInput';
import { adminService } from '../../services/adminService';
import { designSystem, layoutStyles, textStyles } from '../../styles/designSystem';
import { UnifiedCard } from '../../components/UnifiedCard';
import { EmptyState } from '../../components/EmptyState';
import { Logger } from '../utils/errorHandler';

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsers({ navigation }: { navigation: any }) {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, filterStatus, filterRole]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllUsers();
      console.log('Users response:', response);
      
      // Handle the response structure correctly
      let users = [];
      if (response && Array.isArray(response)) {
        users = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        users = response.data;
      } else {
        users = [];
      }
      
      setUsers(users);
    } catch (error) {
      Logger.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const searchTerm = searchQuery?.toLowerCase() ?? '';
      filtered = filtered.filter(user => 
        (user.name && user.name?.toLowerCase()?.includes(searchTerm)) ||
        (user.email && user.email?.toLowerCase()?.includes(searchTerm))
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(user => user.isActive);
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(user => !user.isActive);
      }
    }

    // Apply role filter
    if (filterRole !== 'all') {
      if (filterRole === 'admin') {
        filtered = filtered.filter(user => user.isAdmin);
      } else if (filterRole === 'student') {
        filtered = filtered.filter(user => !user.isAdmin);
      }
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteUser(id);
              await loadUsers();
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(id, !currentStatus);
      await loadUsers();
      Alert.alert('Success', 'User status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleToggleAdmin = async (id: string, currentAdminStatus: boolean) => {
    try {
      await adminService.updateUser(id, {
        isAdmin: !currentAdminStatus,
      });
      await loadUsers();
      Alert.alert('Success', 'User admin status updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user admin status');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    });
    setIsEditModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.updateUser(selectedUser.id, {
        ...editForm,
      });
      await loadUsers();
      setIsEditModalVisible(false);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const renderUserItem = ({ item: user }: { item: User }) => (
    <UnifiedCard key={user.id} style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={textStyles.heading}>{user.name}</Text>
          <Text style={textStyles.caption}>{user.email}</Text>
        </View>
        <View style={styles.userBadges}>
          <Chip
            mode="outlined"
            icon={user.isAdmin ? 'shield' : 'account'}
            style={[
              styles.badge,
              { backgroundColor: user.isAdmin ? designSystem.colors.primary : designSystem.colors.secondary }
            ]}
            textStyle={{ color: 'white' }}
          >
            {user.isAdmin ? 'Admin' : 'Student'}
          </Chip>
          <Chip
            mode="outlined"
            style={[
              styles.badge,
              { backgroundColor: user.isActive ? designSystem.colors.success : designSystem.colors.error }
            ]}
            textStyle={{ color: 'white' }}
          >
            {user.isActive ? 'Active' : 'Inactive'}
          </Chip>
        </View>
      </View>

      <View style={styles.userDetails}>
        <Text style={textStyles.caption}>
          Joined: {new Date(user.createdAt).toLocaleDateString()}
        </Text>
        {user.lastLogin && (
          <Text style={textStyles.caption}>
            Last Login: {new Date(user.lastLogin).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.userActions}>
        <View style={styles.toggleContainer}>
          <Text style={textStyles.caption}>Active:</Text>
          <Switch
            value={user.isActive}
            onValueChange={() => handleToggleStatus(user.id, user.isActive)}
            color={designSystem.colors.primary}
          />
        </View>
        <View style={styles.toggleContainer}>
          <Text style={textStyles.caption}>Admin:</Text>
          <Switch
            value={user.isAdmin}
            onValueChange={() => handleToggleAdmin(user.id, user.isAdmin)}
            color={designSystem.colors.primary}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => {
            setSelectedUser(user);
            setIsViewModalVisible(true);
          }}
          style={styles.actionButton}
          icon="eye"
        >
          View
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleEditUser(user)}
          style={styles.actionButton}
          icon="pencil"
        >
          Edit
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDelete(user.id)}
          style={[styles.actionButton, { borderColor: designSystem.colors.error }]}
          textColor={designSystem.colors.error}
          icon="delete"
        >
          Delete
        </Button>
      </View>
    </UnifiedCard>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={textStyles.body}>Loading users...</Text>
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
            <Icon name="arrow-back" size={24} color={designSystem.colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={textStyles.heading}>User Management</Text>
            <Text style={textStyles.caption}>
              Manage all users in the system ({filteredUsers.length} users)
            </Text>
          </View>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        <View style={styles.filterRow}>
          <View style={styles.filterChip}>
            <Chip
              selected={filterStatus === 'all'}
              onPress={() => setFilterStatus('all')}
              style={styles.chip}
            >
              All Status
            </Chip>
            <Chip
              selected={filterStatus === 'active'}
              onPress={() => setFilterStatus('active')}
              style={styles.chip}
            >
              Active
            </Chip>
            <Chip
              selected={filterStatus === 'inactive'}
              onPress={() => setFilterStatus('inactive')}
              style={styles.chip}
            >
              Inactive
            </Chip>
          </View>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.filterChip}>
            <Chip
              selected={filterRole === 'all'}
              onPress={() => setFilterRole('all')}
              style={styles.chip}
            >
              All Roles
            </Chip>
            <Chip
              selected={filterRole === 'admin'}
              onPress={() => setFilterRole('admin')}
              style={styles.chip}
            >
              Admin
            </Chip>
            <Chip
              selected={filterRole === 'student'}
              onPress={() => setFilterRole('student')}
              style={styles.chip}
            >
              Student
            </Chip>
          </View>
        </View>
      </View>

      {/* Users List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon="group"
            title="No users found"
            description={searchQuery ? 'Try adjusting your search' : 'No users registered yet'}
          />
        ) : (
          filteredUsers.map((user) => (
            <View key={user.id || user._id || `user-${user.email}`}>
              {renderUserItem({ item: user })}
            </View>
          ))
        )}
      </ScrollView>

      {/* View User Modal */}
      <Portal>
        <Modal
          visible={isViewModalVisible}
          onDismiss={() => setIsViewModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          {selectedUser && (
            <View>
              <Title>User Details</Title>
              <View style={styles.modalDetails}>
                <Text style={textStyles.body}>Name: {selectedUser.name}</Text>
                <Text style={textStyles.body}>Email: {selectedUser.email}</Text>
                <Text style={textStyles.body}>
                  Role: {selectedUser.isAdmin ? 'Admin' : 'Student'}
                </Text>
                <Text style={textStyles.body}>
                  Status: {selectedUser.isActive ? 'Active' : 'Inactive'}
                </Text>
                <Text style={textStyles.body}>
                  Joined: {new Date(selectedUser.createdAt).toLocaleDateString()}
                </Text>
                {selectedUser.lastLogin && (
                  <Text style={textStyles.body}>
                    Last Login: {new Date(selectedUser.lastLogin).toLocaleDateString()}
                  </Text>
                )}
              </View>
              <Button onPress={() => setIsViewModalVisible(false)}>
                Close
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Edit User Modal */}
      <Portal>
        <Modal
          visible={isEditModalVisible}
          onDismiss={() => setIsEditModalVisible(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Title>Edit User</Title>
          <View style={styles.editForm}>
            <CustomTextInput
              label="Name"
              value={editForm.name || ''}
              onChangeText={(text) => setEditForm({ ...editForm, name: text })}
              style={styles.input}
              leftIcon="person"
            />
            <CustomTextInput
              label="Email"
              value={editForm.email || ''}
              onChangeText={(text) => setEditForm({ ...editForm, email: text })}
              style={styles.input}
              keyboardType="email-address"
              leftIcon="email"
            />
            <View style={styles.switchContainer}>
              <Text style={textStyles.body}>Admin privileges</Text>
              <Switch
                value={editForm.isAdmin || false}
                onValueChange={(value) => setEditForm({ ...editForm, isAdmin: value })}
              />
            </View>
            <View style={styles.switchContainer}>
              <Text style={textStyles.body}>Active account</Text>
              <Switch
                value={editForm.isActive || false}
                onValueChange={(value) => setEditForm({ ...editForm, isActive: value })}
              />
            </View>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setIsEditModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                onPress={handleSaveUser}
                style={styles.modalButton}
              >
                Save Changes
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
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
  filtersContainer: {
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.borderLight,
    ...designSystem.shadows.sm,
  },
  searchbar: {
    marginBottom: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
  },
  filterRow: {
    marginBottom: designSystem.spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.sm,
  },
  chip: {
    marginRight: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.md,
  },
  scrollView: {
    flex: 1,
    padding: designSystem.spacing.md,
  },
  userCard: {
    marginBottom: designSystem.spacing.md,
    padding: designSystem.spacing.lg,
    ...designSystem.shadows.sm,
    borderRadius: designSystem.borderRadius.lg,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userBadges: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
  },
  badge: {
    marginLeft: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.md,
  },
  userDetails: {
    marginBottom: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.borderLight,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: designSystem.spacing.sm,
    marginTop: designSystem.spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: designSystem.borderRadius.md,
    minHeight: 40,
  },
  modalContent: {
    backgroundColor: designSystem.colors.surface,
    padding: designSystem.spacing.xl,
    margin: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.lg,
  },
  modalDetails: {
    marginVertical: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.md,
  },
  editForm: {
    marginVertical: designSystem.spacing.lg,
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
  modalButtons: {
    flexDirection: 'row',
    gap: designSystem.spacing.md,
    marginTop: designSystem.spacing.lg,
  },
  modalButton: {
    flex: 1,
    borderRadius: designSystem.borderRadius.md,
    minHeight: 48,
  },
});
