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
import { Search, X, Users, Clock, GraduationCap } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course } from '../services/courseService';
import { theme } from '../styles/theme';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Logger } from '../utils/errorHandler';

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
        status: 'published',
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
      Logger.error('Error loading courses:', error);
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
            course.thumbnail_url || course.thumbnailUrl
              ? { uri: course.thumbnail_url || course.thumbnailUrl }
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
              style={[styles.levelChip, { backgroundColor: getLevelColor(course.level || '') }]}
              textStyle={styles.levelChipText}
            >
              {course.level}
            </Chip>
            <View style={styles.priceContainer}>
              {course.original_price && course.price && course.original_price > course.price && (
                <Text style={styles.originalPrice}>₹{course.original_price}</Text>
              )}
              <Text style={styles.price}>₹{course.price || 0}</Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Users size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{course.students} students</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={theme.colors.textSecondary} />
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
          color: '#FFFFFF',
          fontWeight: '600',
          fontSize: 14,
        } : { 
          color: theme.colors.primary,
          fontWeight: '600',
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
        icon={() => <Search size={20} color={theme.colors.primary} />}
        clearIcon={() => <X size={20} color={theme.colors.textSecondary} />}
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
              <GraduationCap size={48} color={theme.colors.textSecondary} />
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
  levelChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
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
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  levelChipText: {
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 12,
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
    fontWeight: '700',
    color: '#2196F3',
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
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
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
