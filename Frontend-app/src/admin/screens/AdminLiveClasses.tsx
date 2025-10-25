import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Button,
  Searchbar,
  Chip,
  FAB,
  ActivityIndicator,
  Checkbox,
  Menu,
} from 'react-native-paper';
import { Icon } from '../../components/Icon';
import { adminService } from '../../services/adminService';
import { getStatusColor, getLevelColor } from '../../utils/colorHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { designSystem, layoutStyles, textStyles } from '../../styles/designSystem';
import { UnifiedCard } from '../../components/UnifiedCard';
import { EmptyState } from '../../components/EmptyState';

interface LiveClass {
  id?: string;
  Id?: string;
  _id?: string;
  title: string;
  category?: string;
  subject?: string;
  level?: string;
  status: string;
  scheduledAt?: string;
  duration: number;
  maxStudents: number;
  isPublished: boolean;
  createdAt: string;
}

export default function AdminLiveClasses({ navigation }: any) {
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLiveClasses, setSelectedLiveClasses] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadLiveClasses();
  }, [searchQuery, filterStatus]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadLiveClasses();
    }, [searchQuery, filterStatus])
  );

  const loadLiveClasses = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllLiveClasses();

      console.log('Live classes response:', response);

      // Handle the response structure correctly
      if (response && response.success && response.data) {
        setLiveClasses(Array.isArray(response.data) ? response.data : []);
      } else if (response && Array.isArray(response)) {
        setLiveClasses(response);
      } else {
        setLiveClasses([]);
      }
    } catch (error) {
      console.error('Error loading live classes:', error);
      setLiveClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveClasses();
    setRefreshing(false);
  };

  const handleDelete = (liveClass: LiveClass) => {
    const id = getLiveClassId(liveClass);
    console.log('AdminLiveClasses: Delete button clicked for live class ID:', id);
    if (!id) {
      Alert.alert('Error', 'Invalid live class ID');
      return;
    }
    
    Alert.alert(
      'Delete Live Class',
      'Are you sure you want to delete this live class?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('AdminLiveClasses: Attempting to delete live class with ID:', id);
              const result = await adminService.deleteLiveClass(id);
              console.log('AdminLiveClasses: Delete result:', result);
              
              if (result.success) {
                await loadLiveClasses();
                Alert.alert('Success', 'Live class deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete live class');
              }
            } catch (error) {
              console.error('AdminLiveClasses: Error deleting live class:', error);
              Alert.alert('Error', 'Failed to delete live class');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (liveClass: LiveClass) => {
    const id = getLiveClassId(liveClass);
    if (!id) {
      Alert.alert('Error', 'Invalid live class ID');
      return;
    }
    
    try {
      // Map frontend status to backend status
      let newStatus = 'scheduled'; // Default to scheduled (published)
      
      // If currently scheduled/live/completed, cancel it (unpublish)
      if (liveClass.status === 'scheduled' || liveClass.status === 'live' || liveClass.status === 'completed') {
        newStatus = 'cancelled';
      } else if (liveClass.status === 'cancelled' || liveClass.status === 'postponed') {
        // If cancelled/postponed, make it scheduled (publish)
        newStatus = 'scheduled';
      }
      
      await adminService.updateLiveClassStatus(id, newStatus);
      await loadLiveClasses();
      Alert.alert('Success', newStatus === 'scheduled' ? 'Live class published successfully' : 'Live class unpublished');
    } catch (error) {
      console.error('Error updating live class status:', error);
      Alert.alert('Error', 'Failed to update live class status');
    }
  };

  const handleStartLiveClass = async (liveClass: LiveClass) => {
    const id = getLiveClassId(liveClass);
    if (!id) {
      Alert.alert('Error', 'Invalid live class ID');
      return;
    }
    
    try {
      await adminService.updateLiveClassStatus(id, 'live');
      await loadLiveClasses();
      Alert.alert('Success', 'Live class started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start live class');
    }
  };

  const handleEndLiveClass = async (liveClass: LiveClass) => {
    const id = getLiveClassId(liveClass);
    if (!id) {
      Alert.alert('Error', 'Invalid live class ID');
      return;
    }
    
    try {
      await adminService.updateLiveClassStatus(id, 'completed');
      await loadLiveClasses();
      Alert.alert('Success', 'Live class ended successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to end live class');
    }
  };

  const handleBulkDelete = () => {
    if (selectedLiveClasses.size === 0) {
      Alert.alert('No Selection', 'Please select live classes to delete');
      return;
    }

    Alert.alert(
      'Delete Selected Live Classes',
      `Are you sure you want to delete ${selectedLiveClasses.size} live classes?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedLiveClasses) {
                await adminService.deleteLiveClass(id);
              }
              setSelectedLiveClasses(new Set());
              await loadLiveClasses();
              Alert.alert('Success', 'Live classes deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some live classes');
            }
          },
        },
      ]
    );
  };

  const toggleLiveClassSelection = (liveClass: LiveClass) => {
    const id = getLiveClassId(liveClass);
    if (!id) return;
    
    const newSelected = new Set(selectedLiveClasses);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedLiveClasses(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedLiveClasses.size === liveClasses.length) {
      setSelectedLiveClasses(new Set());
    } else {
      setSelectedLiveClasses(new Set(Array.isArray(liveClasses) ? liveClasses.map(liveClass => getLiveClassId(liveClass)) : []));
    }
  };

  // Helper function to get the correct ID field
  const getLiveClassId = (liveClass: LiveClass): string => {
    return liveClass.id || liveClass.Id || liveClass._id || '';
  };


  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString ?? new Date()).toLocaleString();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const renderLiveClassItem = ({ item }: { item: LiveClass }) => (
    <UnifiedCard variant="elevated" style={styles.liveClassCard}>
      <View style={styles.liveClassHeader}>
        <View style={styles.liveClassInfo}>
          <Text style={textStyles.subheading} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={textStyles.bodySecondary}>
            {item.category} • {item.subject} • {formatDuration(item.duration)}
          </Text>
          <View style={styles.liveClassMeta}>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {item.status}
            </Chip>
            {item.level && (
              <Chip
                mode="outlined"
                style={[styles.levelChip, { borderColor: getLevelColor(item.level) }]}
                textStyle={{ color: getLevelColor(item.level) }}
              >
                {item.level}
              </Chip>
            )}
          </View>
          <View style={styles.liveClassStats}>
            <Text style={textStyles.caption}>
              {item.scheduledAt ? formatDateTime(item.scheduledAt) : 'Not scheduled'}
            </Text>
            <Text style={textStyles.caption}>Max {item.maxStudents} students</Text>
          </View>
        </View>
        <Checkbox
          status={selectedLiveClasses.has(getLiveClassId(item)) ? 'checked' : 'unchecked'}
          onPress={() => toggleLiveClassSelection(item)}
        />
      </View>
      <View style={styles.liveClassActions}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('LiveClassForm', { liveClass: item, isEditing: true })}
          style={styles.actionButton}
        >
          Edit
        </Button>
        {item.status === 'scheduled' && (
          <Button
            mode="outlined"
            onPress={() => handleStartLiveClass(item)}
            style={[styles.actionButton, styles.startButton]}
            textColor={designSystem.colors.success}
          >
            Start
          </Button>
        )}
        {item.status === 'live' && (
          <Button
            mode="outlined"
            onPress={() => handleEndLiveClass(item)}
            style={[styles.actionButton, styles.endButton]}
            textColor={designSystem.colors.error}
          >
            End
          </Button>
        )}
        <Button
          mode="outlined"
          onPress={() => handleTogglePublish(item)}
          style={styles.actionButton}
          textColor={item.status === 'cancelled' || item.status === 'postponed' ? designSystem.colors.success : designSystem.colors.warning}
        >
          {item.status === 'cancelled' || item.status === 'postponed' ? 'Publish' : 'Unpublish'}
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleDelete(item)}
          style={[styles.actionButton, styles.deleteButton]}
          textColor={designSystem.colors.error}
        >
          Delete
        </Button>
      </View>
    </UnifiedCard>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading live classes...</Text>
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      {/* Header */}
      <UnifiedCard variant="elevated" style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={textStyles.heading}>Live Classes Management</Text>
            <Text style={textStyles.bodySecondary}>
              Manage your live class sessions
            </Text>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <Icon name="more-vert" size={24} color={designSystem.colors.textSecondary} />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                handleBulkDelete();
              }}
              title="Delete Selected"
              leadingIcon="delete"
            />
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                toggleSelectAll();
              }}
              title={selectedLiveClasses.size === liveClasses.length ? 'Deselect All' : 'Select All'}
              leadingIcon="select-all"
            />
          </Menu>
        </View>
      </UnifiedCard>

      {/* Search and Filters */}
      <UnifiedCard variant="outlined" style={styles.searchCard}>
        <Searchbar
          placeholder="Search live classes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.filters}>
          <Chip
            mode={filterStatus === 'all' ? 'flat' : 'outlined'}
            onPress={() => setFilterStatus('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            mode={filterStatus === 'upcoming' ? 'flat' : 'outlined'}
            onPress={() => setFilterStatus('upcoming')}
            style={styles.filterChip}
          >
            Upcoming
          </Chip>
          <Chip
            mode={filterStatus === 'live' ? 'flat' : 'outlined'}
            onPress={() => setFilterStatus('live')}
            style={styles.filterChip}
          >
            Live
          </Chip>
          <Chip
            mode={filterStatus === 'completed' ? 'flat' : 'outlined'}
            onPress={() => setFilterStatus('completed')}
            style={styles.filterChip}
          >
            Completed
          </Chip>
          <Chip
            mode={filterStatus === 'draft' ? 'flat' : 'outlined'}
            onPress={() => setFilterStatus('draft')}
            style={styles.filterChip}
          >
            Draft
          </Chip>
        </View>
      </UnifiedCard>

      {/* Live Classes List */}
      <FlatList
        data={liveClasses}
        renderItem={renderLiveClassItem}
        keyExtractor={(item, index) => getLiveClassId(item) || `liveclass-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        ListEmptyComponent={
          <EmptyState
            icon="play-circle"
            title="No live classes found"
            description={searchQuery ? 'Try adjusting your search' : 'Create your first live class'}
            actionText="Add Live Class"
            onAction={() => navigation.navigate('LiveClassForm', { isEditing: false })}
          />
        }
      />

      {/* FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('LiveClassForm', { isEditing: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.xl,
  },
  loadingText: {
    marginTop: designSystem.spacing.md,
    ...textStyles.body,
    color: designSystem.colors.textSecondary,
  },
  headerCard: {
    margin: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xs,
  },
  searchCard: {
    margin: designSystem.spacing.md,
    marginTop: designSystem.spacing.sm,
    ...designSystem.shadows.sm,
  },
  searchBar: {
    marginBottom: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.surface,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.sm,
    marginTop: designSystem.spacing.sm,
  },
  filterChip: {
    marginRight: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.xs,
  },
  listContainer: {
    padding: designSystem.spacing.md,
    paddingTop: 0,
    flex: 1,
  },
  liveClassCard: {
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  liveClassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  liveClassInfo: {
    flex: 1,
    marginRight: designSystem.spacing.sm,
  },
  liveClassMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.sm,
    marginTop: designSystem.spacing.xs,
  },
  statusChip: {
    height: 32,
    borderRadius: designSystem.borderRadius.md,
  },
  levelChip: {
    height: 32,
    borderRadius: designSystem.borderRadius.md,
  },
  liveClassStats: {
    flexDirection: 'row',
    gap: designSystem.spacing.md,
    marginTop: designSystem.spacing.xs,
  },
  liveClassActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: designSystem.spacing.md,
    paddingTop: designSystem.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.borderLight,
    gap: designSystem.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: designSystem.borderRadius.md,
    minHeight: 40,
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    borderColor: designSystem.colors.success,
  },
  endButton: {
    borderColor: designSystem.colors.error,
  },
  deleteButton: {
    borderColor: designSystem.colors.error,
  },
  fab: {
    position: 'absolute',
    margin: designSystem.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.full,
    ...designSystem.shadows.lg,
  },
});
