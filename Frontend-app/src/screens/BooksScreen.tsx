import { useState, useEffect } from 'react';
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
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { bookService, Book } from '../services/bookService';
import { theme } from '../styles/theme';
import { safeCatch } from '../utils/safeCatch';

export default function BooksScreen({ navigation }: any) {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
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
    loadBooks();
  }, [selectedCategory, selectedLevel, searchQuery]);

  const loadBooks = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      
      const filters = {
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        level: selectedLevel || undefined,
      };

      const response = await bookService.getBooks(pageNum, 10, filters);
      
      if (response && response.data) {
        const newBooks = Array.isArray(response.data) ? response.data : [response.data];
        
        if (reset) {
          setBooks(newBooks);
        } else {
          setBooks(prev => [...prev, ...newBooks]);
        }
        
        setHasMore(newBooks.length === 10);
        setPage(pageNum);
      }
    } catch (error) {
      safeCatch('BooksScreen.loadBooks')(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooks(1, true);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadBooks(page + 1, false);
    }
  };

  const handleSearch = () => {
    loadBooks(1, true);
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

  const renderBookCard = ({ item: book }: { item: Book }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('BookDetail', { bookId: book._id || book.id || book.Id })}
      style={styles.cardContainer}
    >
      <Card style={styles.card}>
        <Card.Cover
          source={
            book.cover_image_url
              ? { uri: book.cover_image_url }
              : require('../../assets/icon.png')
          }
          style={styles.cardImage}
        />
        <Card.Content style={styles.cardContent}>
          <Title numberOfLines={2} style={styles.cardTitle}>
            {book.title || 'Untitled Book'}
          </Title>
          <Paragraph numberOfLines={2} style={styles.cardDescription}>
            by {book.author || 'Unknown Author'}
          </Paragraph>
          <View style={styles.cardFooter}>
            <Chip
              mode="outlined"
              compact
              style={[styles.levelChip, { backgroundColor: getLevelColor(book.level || '') }]}
            >
              {book.level || 'Unknown Level'}
            </Chip>
            <View style={styles.bookMeta}>
              <View style={styles.metaItem}>
                <Icon name="book-open-variant" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>{book.pages || 0} pages</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Icon name="download" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{book.downloads || book.downloadCount || 0} downloads</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="tag" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>{book.category || 'Uncategorized'}</Text>
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
          color: theme.colors.surface,
          fontWeight: '600',
          fontSize: 14,
        } : { 
          color: theme.colors.primary,
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
        placeholder="Search books..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        placeholderTextColor={theme.colors.textSecondary}
        icon={() => <Icon name="magnify" size={24} color={theme.colors.primary} />}
        clearIcon={() => <Icon name="close" size={24} color={theme.colors.textSecondary} />}
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

      {/* Books List */}
      <FlatList
        style={styles.list}
        data={books}
        renderItem={renderBookCard}
        keyExtractor={(item, index) => item.id || item._id || item.Id || `book-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Icon name="book-open-variant" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>No books found</Text>
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
          onPress={() => navigation.navigate('Admin', { screen: 'AdminBooks' })}
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
    margin: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    paddingHorizontal: theme.spacing.lg,
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
  clearFiltersContainer: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  clearFiltersText: {
    color: theme.colors.primary,
  },
  list: {
    flex: 1,
  },
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  cardContainer: {
    marginBottom: theme.spacing.lg,
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
    marginBottom: 4,
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
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  levelChip: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
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
    margin: theme.spacing.lg,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.roundness,
    elevation: 4,
  },
});
