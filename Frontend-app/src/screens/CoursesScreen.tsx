<<<<<<< HEAD
=======
// @ts-nocheck
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, Searchbar, FAB } from 'react-native-paper';
<<<<<<< HEAD
import { Search, X, Users, Clock, GraduationCap } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course } from '../services/courseService';
import { theme } from '../styles/theme';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Logger } from '../utils/errorHandler';
=======
import { icons } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course, CourseFilters } from '../services/courseService';
import { theme } from '../styles/theme';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

export default function CoursesScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['Mathematics', 'Physics'];
  const levels = ['Foundation', 'Intermediate', 'Advanced', 'Expert'];

  useEffect(() => {
    loadCourses();
  }, [selectedCategory, selectedLevel, searchQuery]);

  useEffect(() => {
    if (route.params?.search) {
      setSearchQuery(route.params.search);
    }
  }, [route.params]);

  const loadCourses = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      
      const filters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        level: selectedLevel || undefined,
<<<<<<< HEAD
        status: 'published',
=======
        status: 'active',
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      };

      const response = await courseService.getCourses(pageNum, 10, filters);
      
      if (response && response.data) {
        const newCourses = Array.isArray(response.data) ? response.data : [response.data];
        
        if (reset) {
          setCourses(newCourses);
        } else {
          setCourses(prev => [...prev, ...newCourses]);
        }
        
        setHasMore(newCourses.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
<<<<<<< HEAD
      Logger.error('Error loading courses:', error);
=======
      console.error('Error loading courses:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourses(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadCourses(page + 1, false);
    }
  };

  const handleSearch = () => {
    loadCourses(1, true);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLevel('');
    setSearchQuery('');
  };

  const getLevelColor = (level: string) => {
    if (!level || typeof level !== 'string') {
      return theme.colors.primary;
    }
    switch (level?.toLowerCase() ?? '') {
      case 'foundation':
        return theme.colors.foundation;
      case 'intermediate':
        return theme.colors.intermediate;
      case 'advanced':
        return theme.colors.advanced;
      case 'expert':
        return theme.colors.expert;
      default:
        return theme.colors.primary;
    }
  };

  const renderCourseCard = ({ item: course }: { item: Course }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('CourseDetail', { courseId: course._id || course.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Cover
          source={
<<<<<<< HEAD
            course.thumbnail_url || course.thumbnailUrl
              ? { uri: course.thumbnail_url || course.thumbnailUrl }
=======
            course.thumbnail_url
              ? { uri: course.thumbnail_url }
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
              : require('../../assets/icon.png')
          }
          style={styles.cardImage}
        />
        <Card.Content style={styles.cardContent}>
          <Title numberOfLines={2} style={styles.cardTitle}>
            {course.title}
          </Title>
          <Paragraph numberOfLines={3} style={styles.cardDescription}>
            {course.description}
          </Paragraph>
          <View style={styles.cardFooter}>
            <Chip
              mode="outlined"
              compact
<<<<<<< HEAD
              style={[styles.levelChip, { backgroundColor: getLevelColor(course.level || '') }]}
              textStyle={styles.levelChipText}
            >
              {(course.level || 'Unknown').toUpperCase()}
            </Chip>
            <View style={styles.priceContainer}>
              {course.original_price && course.price && course.original_price > course.price && (
                <Text style={styles.originalPrice}>₹{course.original_price}</Text>
              )}
              <Text style={styles.price}>₹{course.price || 0}</Text>
=======
              style={[styles.levelChip, { backgroundColor: getLevelColor(course.level) }]}
            >
              {course.level}
            </Chip>
            <View style={styles.priceContainer}>
              {course.original_price && course.original_price > course.price && (
                <Text style={styles.originalPrice}>₹{course.original_price}</Text>
              )}
              <Text style={styles.price}>₹{course.price}</Text>
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
            </View>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
<<<<<<< HEAD
              <Users size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{course.students} students</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={theme.colors.textSecondary} />
=======
              <icons.Users size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{course.students} students</Text>
            </View>
            <View style={styles.metaItem}>
              <icons.Clock size={16} color={theme.colors.textSecondary} />
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
              <Text style={styles.metaText}>{course.duration}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderFilterChip = (label: string, value: string, onPress: () => void) => (
    <TouchableOpacity key={label} onPress={onPress} style={styles.filterChip}>
      <Chip
        mode={value ? 'flat' : 'outlined'}
        selected={!!value}
        style={[
          styles.chip,
          value ? { 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          } : { 
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.primary,
          }
        ]}
        textStyle={value ? { 
<<<<<<< HEAD
          color: '#FFFFFF',
=======
          color: theme.colors.surface,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
          fontWeight: '600',
          fontSize: 14,
        } : { 
          color: theme.colors.primary,
<<<<<<< HEAD
          fontWeight: '600',
=======
          fontWeight: '500',
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
          fontSize: 14,
        }}
      >
        {label}
      </Chip>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search courses..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        placeholderTextColor={theme.colors.textSecondary}
<<<<<<< HEAD
        icon={() => <Search size={20} color={theme.colors.primary} />}
        clearIcon={() => <X size={20} color={theme.colors.textSecondary} />}
=======
        icon={() => <icons.Search size={20} color={theme.colors.primary} />}
        clearIcon={() => <icons.X size={20} color={theme.colors.textSecondary} />}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      />

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <View style={styles.filters}>
            {renderFilterChip('All Categories', selectedCategory, () => setSelectedCategory(''))}
            {categories.map((category) => 
              <View key={`category-${category}`}>
                {renderFilterChip(category, selectedCategory === category ? category : '', () => 
                  setSelectedCategory(selectedCategory === category ? '' : category)
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <View style={styles.filters}>
            {renderFilterChip('All Levels', selectedLevel, () => setSelectedLevel(''))}
            {levels.map((level) => 
              <View key={`level-${level}`}>
                {renderFilterChip(level, selectedLevel === level ? level : '', () => 
                  setSelectedLevel(selectedLevel === level ? '' : level)
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Clear Filters */}
      {(selectedCategory || selectedLevel || searchQuery) && (
        <View style={styles.clearFiltersContainer}>
          <Button
            mode="text"
            onPress={clearFilters}
            icon="close"
            labelStyle={styles.clearFiltersText}
          >
            Clear Filters
          </Button>
        </View>
      )}

      {/* Courses List */}
      <FlatList
        data={courses}
        renderItem={renderCourseCard}
        keyExtractor={(item, index) => item.id || item._id || item.Id || `course-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
<<<<<<< HEAD
              <GraduationCap size={48} color={theme.colors.textSecondary} />
=======
              <icons.GraduationCap size={48} color={theme.colors.textSecondary} />
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
              <Text style={styles.emptyText}>No courses found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          ) : null
        }
      />

      {/* Admin FAB */}
      {user?.isAdmin && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('Admin', { screen: 'AdminCourses' })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBar: {
    margin: theme.spacing.md,
    elevation: 3,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInput: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  filtersSection: {
    marginBottom: theme.spacing.md,
  },
  filtersContainer: {
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  filterChip: {
    marginRight: theme.spacing.sm,
  },
  chip: {
    height: 36,
    borderRadius: theme.roundness,
    borderWidth: 1.5,
  },
<<<<<<< HEAD
  levelChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 0,
  },
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  clearFiltersContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  clearFiltersText: {
    color: theme.colors.primary,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  cardContainer: {
    marginBottom: theme.spacing.md,
  },
  card: {
<<<<<<< HEAD
    elevation: 3,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardImage: {
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#f5f5f5',
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
    paddingTop: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
=======
    elevation: 4,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardImage: {
    height: 200,
    borderTopLeftRadius: theme.roundness,
    borderTopRightRadius: theme.roundness,
  },
  cardContent: {
    padding: theme.spacing.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
<<<<<<< HEAD
    color: '#666666',
    marginBottom: 12,
=======
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    lineHeight: 20,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
<<<<<<< HEAD
  levelChipText: {
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 12,
=======
  levelChip: {
    height: 28,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: theme.spacing.sm,
  },
  price: {
    fontSize: 18,
<<<<<<< HEAD
    fontWeight: '700',
    color: '#2196F3',
=======
    fontWeight: 'bold',
    color: theme.colors.primary,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
<<<<<<< HEAD
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
=======
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});
