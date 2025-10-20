import React, { useState, useEffect } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
  Title,
  Paragraph,
  Button,
  Searchbar,
  Chip,
  FAB,
  ActivityIndicator,
  Checkbox,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';
import { getStatusColor, getLevelColor } from '../../utils/colorHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { designSystem, layoutStyles, textStyles } from '../../styles/designSystem';
import { UnifiedCard } from '../../components/UnifiedCard';
import { EmptyState } from '../../components/EmptyState';

interface Book {
  id: string | number;
  _id?: string | number;
  Id?: string | number;
  title: string;
  author?: string;
  category?: string;
  subject?: string;
  level?: string;
  status: string;
  downloads?: number;
  downloadCount?: number;
  isPublished: boolean | number;
  createdAt: string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  pages?: number;
  isbn?: string;
  is_published?: number;
}

export default function AdminBooks({ navigation }: any) {
  const { user } = useAuth();
  const nav = useNavigation();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [searchQuery, filterStatus]);

  // Add navigation listener for when returning from BookForm
  useEffect(() => {
    const unsubscribe = nav.addListener('focus', () => {
      console.log('📚 AdminBooks: Navigation focus event, refreshing books...');
      loadBooks();
    });

    return unsubscribe;
  }, [nav]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('📚 AdminBooks: Screen focused, refreshing books...');
      // Add a small delay to ensure the previous screen has fully unmounted
      const timer = setTimeout(() => {
        loadBooks();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  const loadBooks = async () => {
    try {
      console.log('📚 AdminBooks: Loading books...');
      setIsLoading(true);
      const response = await adminService.getAllBooks();
      
      console.log('📚 AdminBooks: Books response:', response);
      
      // Handle the response structure correctly
      if (response && response.success && response.data) {
        console.log('📚 AdminBooks: Setting books from API response:', response.data);
        const booksArray = Array.isArray(response.data) ? response.data : [];
        setBooks(booksArray);
        console.log('📚 AdminBooks: Books loaded successfully:', booksArray.length, 'books');
      } else if (response && Array.isArray(response)) {
        console.log('📚 AdminBooks: Setting books from direct array response:', response);
        setBooks(response);
        console.log('📚 AdminBooks: Books loaded successfully:', response.length, 'books');
      } else {
        console.log('📚 AdminBooks: No valid data found, setting empty array');
        setBooks([]);
      }
    } catch (error) {
      console.error('📚 AdminBooks: Error loading books:', error);
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteBook(id);
              // Remove the book from local state immediately
              setBooks(prevBooks => prevBooks.filter(book => {
                const bookId = book.id || book._id || book.Id;
                return bookId !== id;
              }));
              Alert.alert('Success', 'Book deleted successfully');
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete book');
            }
          },
        },
      ]
    );
  };

  const handleTogglePublish = async (id: string, currentStatus: string) => {
    try {
      // Simple publish/unpublish: draft -> published; anything else -> draft
      let newStatus = 'published';
      if (currentStatus === 'draft') {
        newStatus = 'published';
      } else {
        newStatus = 'draft';
      }
      
      await adminService.updateBookStatus(id, newStatus);
      
      // Update the book status in local state immediately
      setBooks(prevBooks => prevBooks.map(book => {
        const bookId = book.id || book._id || book.Id;
        if (bookId === id) {
          return { ...book, status: newStatus };
        }
        return book;
      }));
      
      Alert.alert('Success', newStatus === 'published' ? 'Book published successfully' : 'Book unpublished');
    } catch (error) {
      console.error('Error updating book status:', error);
      Alert.alert('Error', 'Failed to update book status');
    }
  };

  const handleBulkDelete = () => {
    if (selectedBooks.size === 0) {
      Alert.alert('No Selection', 'Please select books to delete');
      return;
    }

    Alert.alert(
      'Delete Selected Books',
      `Are you sure you want to delete ${selectedBooks.size} books?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const id of selectedBooks) {
                await adminService.deleteBook(id);
              }
              setSelectedBooks(new Set());
              await loadBooks();
              Alert.alert('Success', 'Books deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some books');
            }
          },
        },
      ]
    );
  };

  const toggleBookSelection = (id: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBooks(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedBooks.size === books.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(Array.isArray(books) ? books.map(book => book.id.toString()) : []));
    }
  };


  const renderBookItem = ({ item }: { item: Book }) => {
    // Normalize data from different backend formats
    const normalizedItem = {
      id: (item.id || item._id || item.Id || '').toString(),
      title: item.title || 'Untitled Book',
      author: item.author || 'Unknown Author',
      category: item.category || 'General',
      level: item.level || 'Intermediate',
      status: item.status || 'draft',
      isPublished: typeof item.isPublished === 'number' ? item.isPublished === 1 : item.isPublished,
      downloads: item.downloads || item.downloadCount || 0,
      createdAt: item.createdAt || item.created_at || new Date().toISOString(),
      description: item.description || '',
      pages: item.pages || 0,
      isbn: item.isbn || ''
    };

    return (
      <UnifiedCard variant="elevated" style={styles.bookCard}>
        <View style={styles.bookHeader}>
          <View style={styles.bookInfo}>
            <Text style={textStyles.subheading} numberOfLines={2}>
              {normalizedItem.title}
            </Text>
            {normalizedItem.author && (
              <Text style={textStyles.bodySecondary}>by {normalizedItem.author}</Text>
            )}
            <View style={styles.bookMeta}>
              <Chip
                mode="outlined"
                style={[styles.statusChip, { borderColor: getStatusColor(normalizedItem.status) }]}
                textStyle={{ color: getStatusColor(normalizedItem.status) }}
              >
                {normalizedItem.status}
              </Chip>
              {normalizedItem.level && (
                <Chip
                  mode="outlined"
                  style={[styles.levelChip, { borderColor: getLevelColor(normalizedItem.level) }]}
                  textStyle={{ color: getLevelColor(normalizedItem.level) }}
                >
                  {normalizedItem.level}
                </Chip>
              )}
              {normalizedItem.category && (
                <Chip mode="outlined" style={styles.categoryChip}>
                  {normalizedItem.category}
                </Chip>
              )}
            </View>
            <View style={styles.bookStats}>
              <Text style={textStyles.caption}>{normalizedItem.downloads} downloads</Text>
              <Text style={textStyles.caption}>
                {new Date(normalizedItem.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          <Checkbox
            status={selectedBooks.has(normalizedItem.id) ? 'checked' : 'unchecked'}
            onPress={() => toggleBookSelection(normalizedItem.id)}
          />
        </View>
        <View style={styles.bookActions}>
          <Button
            mode="outlined"
            onPress={() => {
              console.log('📚 AdminBooks: Navigating to BookForm for editing...');
              navigation.navigate('BookForm', { 
                book: normalizedItem, 
                isEditing: true,
                onSuccess: () => {
                  console.log('📚 AdminBooks: BookForm onSuccess callback triggered (edit)');
                  // Force refresh when returning from BookForm
                  setTimeout(() => {
                    loadBooks();
                  }, 500);
                }
              });
            }}
            style={styles.actionButton}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleTogglePublish(normalizedItem.id, normalizedItem.status)}
            style={styles.actionButton}
            textColor={normalizedItem.status === 'draft' ? designSystem.colors.success : designSystem.colors.warning}
          >
            {normalizedItem.status === 'draft' ? 'Publish' : 'Unpublish'}
          </Button>
          <Button
            mode="outlined"
            onPress={() => handleDelete(normalizedItem.id)}
            style={[styles.actionButton, styles.deleteButton]}
            textColor={designSystem.colors.error}
          >
            Delete
          </Button>
        </View>
      </UnifiedCard>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={[layoutStyles.container, styles.mainContainer]}>
      {/* Header */}
      <UnifiedCard variant="elevated" style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View>
            <Text style={textStyles.heading}>Books Management</Text>
            <Text style={textStyles.bodySecondary}>
              Manage your digital library
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={loadBooks}
              style={styles.refreshButton}
            >
              <Icon name="refresh" size={24} color={designSystem.colors.primary} />
            </TouchableOpacity>
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
                title={selectedBooks.size === books.length ? 'Deselect All' : 'Select All'}
                leadingIcon="select-all"
              />
            </Menu>
          </View>
        </View>
      </UnifiedCard>

      {/* Search and Filters */}
      <UnifiedCard variant="outlined" style={styles.searchCard}>
        <Searchbar
          placeholder="Search books..."
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

      {/* Books List */}
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={(item, index) => {
          const id = item.id || item._id || item.Id || `book-${index}`;
          console.log('📚 AdminBooks: Rendering book with ID:', id);
          return id.toString();
        }}
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
            icon="book"
            title="No books found"
            description={searchQuery ? 'Try adjusting your search' : 'Create your first book'}
            actionText="Add Book"
            onAction={() => navigation.navigate('BookForm', { isEditing: false })}
          />
        }
      />

      {/* FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          console.log('📚 AdminBooks: Navigating to BookForm...');
          navigation.navigate('BookForm', { 
            isEditing: false,
            onSuccess: () => {
              console.log('📚 AdminBooks: BookForm onSuccess callback triggered');
              // Force refresh when returning from BookForm
              setTimeout(() => {
                loadBooks();
              }, 500);
            }
          });
        }}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.sm,
  },
  refreshButton: {
    padding: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.sm,
    backgroundColor: designSystem.colors.surface,
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
  bookCard: {
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  bookInfo: {
    flex: 1,
    marginRight: designSystem.spacing.sm,
  },
  bookMeta: {
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
  categoryChip: {
    height: 32,
    borderRadius: designSystem.borderRadius.md,
  },
  bookStats: {
    flexDirection: 'row',
    gap: designSystem.spacing.md,
    marginTop: designSystem.spacing.xs,
  },
  bookActions: {
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
