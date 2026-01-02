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
import { Search, X, Calendar, Clock, Users, Tag, PlayCircle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { liveClassService, LiveClass } from '../services/liveClassService';
import { designSystem } from '../styles/designSystem';
import { Logger } from '../utils/errorHandler';
=======
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { liveClassService, LiveClass, LiveClassFilters } from '../services/liveClassService';
import { designSystem } from '../styles/designSystem';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

export default function LiveClassesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['Mathematics', 'Physics'];
  const levels = ['Foundation', 'Intermediate', 'Advanced', 'Expert'];
  const statuses = ['scheduled', 'live', 'completed'];

  useEffect(() => {
    loadLiveClasses();
  }, [selectedCategory, selectedLevel, selectedStatus, searchQuery]);

  const loadLiveClasses = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);

<<<<<<< HEAD
      const filters: any = {};
      
      // Only add filters if they have values
      if (searchQuery) filters.search = searchQuery;
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedLevel) filters.level = selectedLevel;
      if (selectedStatus) filters.status = selectedStatus;
=======
      const filters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        level: selectedLevel || undefined,
        status: selectedStatus || undefined,
      };
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

      const response = await liveClassService.getLiveClasses(pageNum, 10, filters);

      if (response && response.data) {
        const newLiveClasses = Array.isArray(response.data) ? response.data : [response.data];

        if (reset) {
          setLiveClasses(newLiveClasses);
        } else {
          setLiveClasses((prev: LiveClass[]) => [...prev, ...newLiveClasses]);
        }

        setHasMore(newLiveClasses.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
<<<<<<< HEAD
      Logger.error('Error loading live classes:', error);
=======
      console.error('Error loading live classes:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveClasses(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadLiveClasses(page + 1, false);
    }
  };

  const handleSearch = () => {
    loadLiveClasses(1, true);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLevel('');
    setSelectedStatus('');
    setSearchQuery('');
  };

  const getLevelColor = (level: string) => {
    if (!level || typeof level !== 'string') {
      return designSystem.colors.primary;
    }
    switch (level?.toLowerCase() ?? '') {
      case 'foundation':
        return designSystem.colors.foundation;
      case 'intermediate':
        return designSystem.colors.intermediate;
      case 'advanced':
        return designSystem.colors.advanced;
      case 'expert':
        return designSystem.colors.expert;
      default:
        return designSystem.colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status || typeof status !== 'string') {
      return designSystem.colors.primary;
    }
    switch (status?.toLowerCase() ?? '') {
      case 'scheduled':
        return designSystem.colors.info;
      case 'live':
        return designSystem.colors.success;
      case 'completed':
        return designSystem.colors.textSecondary;
      case 'cancelled':
        return designSystem.colors.error;
      default:
        return designSystem.colors.primary;
    }
  };

<<<<<<< HEAD
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
=======
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  // ✅ Use icon.png for missing thumbnails
  const renderLiveClassCard = ({ item: liveClass }: { item: LiveClass }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('LiveClassDetail', { liveClassId: liveClass._id || liveClass.id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Cover
          source={
            liveClass.thumbnail_url
              ? { uri: liveClass.thumbnail_url }
              : require('../../assets/icon.png') // ✅ local icon for missing thumbnails
          }
          style={styles.cardImage}
        />
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Title numberOfLines={2} style={styles.cardTitle}>
              {liveClass.title}
            </Title>
            <Chip
              mode="flat"
              compact
              style={[
                styles.statusChip, 
                { 
<<<<<<< HEAD
                  backgroundColor: getStatusColor(liveClass.status || ''),
                  borderColor: getStatusColor(liveClass.status || ''),
=======
                  backgroundColor: getStatusColor(liveClass.status),
                  borderColor: getStatusColor(liveClass.status),
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
                }
              ]}
              textStyle={{ 
                color: designSystem.colors.surface,
                fontWeight: '600',
                fontSize: 12,
              }}
            >
<<<<<<< HEAD
              {(liveClass.status || 'unknown').toUpperCase()}
            </Chip>
          </View>
          <Paragraph numberOfLines={3} style={styles.cardDescription}>
            {liveClass.description || ''}
=======
              {liveClass.status.toUpperCase()}
            </Chip>
          </View>
          <Paragraph numberOfLines={3} style={styles.cardDescription} as any>
            {liveClass.description}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
          </Paragraph>
          <View style={styles.cardFooter}>
            <Chip
              mode="outlined"
              compact
<<<<<<< HEAD
              style={[styles.levelChip, { backgroundColor: getLevelColor(liveClass.level || '') }]}
              textStyle={styles.levelChipText}
            >
              {(liveClass.level || 'unknown').toUpperCase()}
            </Chip>
            <Text style={styles.price}>FREE</Text>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={designSystem.colors.textSecondary} />
              <Text style={styles.metaText}>{liveClass.scheduled_at ? formatDate(liveClass.scheduled_at) : 'TBD'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={16} color={designSystem.colors.textSecondary} />
=======
              style={[styles.levelChip, { backgroundColor: getLevelColor(liveClass.level) }]}
            >
              {liveClass.level}
            </Chip>
            <Text style={styles.price}>₹{liveClass.price}</Text>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Icon name="schedule" size={16} color={designSystem.colors.textSecondary} />
              <Text style={styles.metaText}>{formatDate(liveClass.scheduled_at)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="access-time" size={16} color={designSystem.colors.textSecondary} />
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
              <Text style={styles.metaText}>{liveClass.duration} min</Text>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
<<<<<<< HEAD
              <Users size={16} color={designSystem.colors.textSecondary} />
=======
              <Icon name="group" size={16} color={designSystem.colors.textSecondary} />
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
              <Text style={styles.metaText}>
                {liveClass.enrolled_students}/{liveClass.max_students} enrolled
              </Text>
            </View>
            <View style={styles.metaItem}>
<<<<<<< HEAD
              <Tag size={16} color={designSystem.colors.textSecondary} />
              <Text style={styles.metaText}>{liveClass.category || 'General'}</Text>
=======
              <Icon name="category" size={16} color={designSystem.colors.textSecondary} />
              <Text style={styles.metaText}>{liveClass.category}</Text>
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
            backgroundColor: designSystem.colors.primary,
            borderColor: designSystem.colors.primary,
          } : { 
            backgroundColor: designSystem.colors.surface,
            borderColor: designSystem.colors.primary,
          }
        ]}
        textStyle={value ? { 
          color: designSystem.colors.surface,
          fontWeight: '600',
          fontSize: 14,
        } : { 
          color: designSystem.colors.primary,
          fontWeight: '500',
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
        placeholder="Search live classes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        placeholderTextColor={designSystem.colors.textSecondary}
<<<<<<< HEAD
        icon={() => <Search size={24} color={designSystem.colors.primary} />}
        clearIcon={() => <X size={24} color={designSystem.colors.textSecondary} />}
=======
        icon={() => <Icon name="search" size={24} color={designSystem.colors.primary} />}
        clearIcon={() => <Icon name="close" size={24} color={designSystem.colors.textSecondary} />}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      />

      {/* Filters */}
      <View style={styles.filtersSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <View style={styles.filters}>
            {renderFilterChip('All Categories', selectedCategory, () => setSelectedCategory(''))}
            {categories.map((category) =>
              <View key={`category-${category}`}>
                {renderFilterChip(
                  category,
                  selectedCategory === category ? category : '',
                  () => setSelectedCategory(selectedCategory === category ? '' : category)
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
                {renderFilterChip(
                  level,
                  selectedLevel === level ? level : '',
                  () => setSelectedLevel(selectedLevel === level ? '' : level)
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <View style={styles.filters}>
            {renderFilterChip('All Status', selectedStatus, () => setSelectedStatus(''))}
            {statuses.map((status) =>
              <View key={`status-${status}`}>
                {renderFilterChip(
                  status,
                  selectedStatus === status ? status : '',
                  () => setSelectedStatus(selectedStatus === status ? '' : status)
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Clear Filters */}
      {(selectedCategory || selectedLevel || selectedStatus || searchQuery) && (
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

      {/* Live Classes List */}
      <FlatList
        data={liveClasses}
        renderItem={renderLiveClassCard}
        keyExtractor={(item: LiveClass, index) => item.id || item._id || item.Id || `liveclass-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
<<<<<<< HEAD
              <PlayCircle size={64} color={designSystem.colors.textSecondary} />
=======
              <Icon name="play-circle" size={64} color={designSystem.colors.textSecondary} />
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
              <Text style={styles.emptyText}>No live classes found</Text>
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
          onPress={() => navigation.navigate('Admin', { screen: 'AdminLiveClasses' })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  searchBar: {
    margin: designSystem.spacing.md,
    ...designSystem.shadows.md,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.surface,
    elevation: 3,
  },
  searchInput: {
    fontSize: 16,
    color: designSystem.colors.textPrimary,
    fontWeight: '500',
  },
  filtersSection: {
    marginBottom: designSystem.spacing.md,
  },
  filtersContainer: {
    marginBottom: designSystem.spacing.sm,
    paddingHorizontal: designSystem.spacing.md,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    alignItems: 'center',
  },
  filterChip: {
    marginRight: designSystem.spacing.sm,
  },
  chip: {
    height: 36,
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1.5,
  },
<<<<<<< HEAD
  levelChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 0,
  },
  levelChipText: {
    color: designSystem.colors.surface,
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  clearFiltersContainer: {
    paddingHorizontal: designSystem.spacing.md,
    marginBottom: designSystem.spacing.sm,
  },
  clearFiltersText: {
    color: designSystem.colors.primary,
  },
  listContainer: {
    padding: designSystem.spacing.md,
  },
  cardContainer: {
    marginBottom: designSystem.spacing.md,
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
=======
    ...designSystem.shadows.md,
    borderRadius: designSystem.borderRadius.lg,
    backgroundColor: designSystem.colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardImage: {
    height: 200,
    borderTopLeftRadius: designSystem.borderRadius.lg,
    borderTopRightRadius: designSystem.borderRadius.lg,
  },
  cardContent: {
    padding: designSystem.spacing.lg,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  cardTitle: {
<<<<<<< HEAD
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
=======
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    flex: 1,
    marginRight: designSystem.spacing.sm,
  },
  statusChip: {
    height: 28,
    borderRadius: designSystem.borderRadius.sm,
    borderWidth: 1,
  },
  cardDescription: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    marginBottom: designSystem.spacing.md,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
    lineHeight: 20,
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
<<<<<<< HEAD
  statusChip: {
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 10,
=======
  levelChip: {
    height: 28,
  },
  price: {
    ...designSystem.typography.h3,
    color: designSystem.colors.primary,
    fontWeight: 'bold',
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
<<<<<<< HEAD
    marginTop: designSystem.spacing.sm,
=======
    marginBottom: designSystem.spacing.xs,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
<<<<<<< HEAD
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
=======
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    marginLeft: designSystem.spacing.xs,
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xxl,
  },
  emptyText: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginTop: designSystem.spacing.md,
  },
  emptySubtext: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    marginTop: designSystem.spacing.sm,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: designSystem.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: designSystem.colors.primary,
    ...designSystem.shadows.lg,
  },
});
