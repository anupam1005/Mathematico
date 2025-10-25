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

interface Course {
  id?: string;
  Id?: string;
  _id?: string;
  title: string;
  category: string;
  class: string;
  subject: string;
  level: string;
  students: number;
  price: number;
  status: string;
  createdAt: string;
}

export default function AdminCourses({ navigation }: any) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [searchQuery, filterStatus]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
    }, [searchQuery, filterStatus])
  );

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllCourses();

      console.log('Courses response:', response);

      // Handle the response structure correctly
      if (response && response.success && response.data) {
        setCourses(Array.isArray(response.data) ? response.data : []);
      } else if (response && Array.isArray(response)) {
        setCourses(response);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses();
    setRefreshing(false);
  };

  const handleDelete = (course: Course) => {
    const id = getCourseId(course);
    console.log('AdminCourses: Delete button clicked for course ID:', id);
    if (!id) {
      Alert.alert('Error', 'Invalid course ID');
      return;
    }
    
    Alert.alert(
      'Delete Course',
      'Are you sure you want to delete this course?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('AdminCourses: Attempting to delete course with ID:', id);
              const result = await adminService.deleteCourse(id);
              console.log('AdminCourses: Delete result:', result);
              
              if (result.success) {
                await loadCourses();
                Alert.alert('Success', 'Course deleted successfully');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete course');
              }
            } catch (error) {
              console.error('AdminCourses: Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (course: Course) => {
    const id = getCourseId(course);
    if (!id) {
      Alert.alert('Error', 'Invalid course ID');
      return;
    }
    
    try {
      // Simple publish/unpublish: draft -> published; anything else -> draft
      let newStatus = 'published';
      if (course.status === 'draft') {
        newStatus = 'published';
      } else {
        newStatus = 'draft';
      }
      
      await adminService.updateCourseStatus(id, newStatus);
      await loadCourses();
      Alert.alert('Success', newStatus === 'published' ? 'Course published successfully' : 'Course unpublished');
    } catch (error) {
      console.error('Error updating course status:', error);
      Alert.alert('Error', 'Failed to update course status');
    }
  };

  const handleBulkDelete = () => {
    if (selectedCourses.size === 0) {
      Alert.alert('No Selection', 'Please select courses to delete');
      return;
    }

    Alert.alert(
      'Delete Selected Courses',
      `Are you sure you want to delete ${selectedCourses.size} courses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedCourses) {
                await adminService.deleteCourse(id);
              }
              setSelectedCourses(new Set());
              await loadCourses();
              Alert.alert('Success', 'Courses deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some courses');
            }
          },
        },
      ]
    );
  };

  const toggleCourseSelection = (course: Course) => {
    const id = getCourseId(course);
    if (!id) return;
    
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCourses(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCourses.size === courses.length) {
      setSelectedCourses(new Set());
    } else {
      setSelectedCourses(new Set(Array.isArray(courses) ? courses.map(course => getCourseId(course)) : []));
    }
  };

  // Helper function to get the correct ID field
  const getCourseId = (course: Course): string => {
    return course.id || course.Id || course._id || '';
  };


  const formatPrice = (price: number) => {
    return `₹${(price ?? 0).toLocaleString()}`;
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <UnifiedCard variant="elevated" style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View style={styles.courseInfo}>
          <Text style={textStyles.subheading} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={textStyles.bodySecondary}>
            {item.category} • {item.class} • {item.subject}
          </Text>
          <View style={styles.courseMeta}>
            <Chip
              mode="outlined"
              style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {item.status}
            </Chip>
            <Chip
              mode="outlined"
              style={[styles.levelChip, { borderColor: getLevelColor(item.level) }]}
              textStyle={{ color: getLevelColor(item.level) }}
            >
              {item.level}
            </Chip>
          </View>
          <View style={styles.courseStats}>
            <Text style={textStyles.caption}>{item.students} students</Text>
            <Text style={textStyles.caption}>{formatPrice(item.price)}</Text>
            <Text style={textStyles.caption}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Checkbox
          status={selectedCourses.has(getCourseId(item)) ? 'checked' : 'unchecked'}
          onPress={() => toggleCourseSelection(item)}
        />
      </View>
      <View style={styles.courseActions}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('CourseForm', { course: item, isEditing: true })}
          style={styles.actionButton}
        >
          Edit
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleTogglePublish(item)}
          style={styles.actionButton}
          textColor={item.status === 'draft' ? designSystem.colors.success : designSystem.colors.warning}
        >
          {item.status === 'draft' ? 'Publish' : 'Unpublish'}
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
        <Text style={styles.loadingText}>Loading courses...</Text>
      </View>
    );
  }

  return (
    <View style={[layoutStyles.container, styles.mainContainer]}>
      {/* Header */}
      <UnifiedCard variant="elevated" style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={textStyles.heading}>Courses Management</Text>
            <Text style={textStyles.bodySecondary}>
              Manage your course catalog
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
              title={selectedCourses.size === courses.length ? 'Deselect All' : 'Select All'}
              leadingIcon="select-all"
            />
          </Menu>
        </View>
      </UnifiedCard>

      {/* Search and Filters */}
      <UnifiedCard variant="outlined" style={styles.searchCard}>
        <Searchbar
          placeholder="Search courses..."
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
            mode={filterStatus === 'published' ? 'flat' : 'outlined'}
            onPress={() => setFilterStatus('published')}
            style={styles.filterChip}
          >
            Published
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

      {/* Courses List */}
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item, index) => getCourseId(item) || `course-${index}`}
        contentContainerStyle={styles.listContainer}
        style={styles.flatListStyle}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[designSystem.colors.primary]}
            tintColor={designSystem.colors.primary}
          />
        }
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
        nestedScrollEnabled={false}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <EmptyState
            icon="school"
            title="No courses found"
            description={searchQuery ? 'Try adjusting your search' : 'Create your first course'}
            actionText="Add Course"
            onAction={() => navigation.navigate('CourseForm', { isEditing: false })}
          />
        }
      />

      {/* FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('CourseForm', { isEditing: false })}
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
    paddingBottom: 100, // Add bottom padding for FAB
  },
  flatListStyle: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  courseCard: {
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  courseInfo: {
    flex: 1,
    marginRight: designSystem.spacing.sm,
  },
  courseMeta: {
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
  courseStats: {
    flexDirection: 'row',
    gap: designSystem.spacing.md,
    marginTop: designSystem.spacing.xs,
  },
  courseActions: {
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
