// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { bookService, Book } from '../services/bookService';
import { designSystem } from '../styles/designSystem';

export default function BookDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { bookId } = route.params;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      console.log('Loading book with ID:', bookId);
      if (!bookId) {
        throw new Error('Book ID is required');
      }
      const response = await bookService.getBookById(bookId);
      
      if (response.success && response.data) {
        // Handle both single object and array responses
        const bookData = Array.isArray(response.data) ? response.data[0] : response.data;
        setBook(bookData);
      } else {
        Alert.alert('Error', response.message || 'Failed to load book');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading book...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={designSystem.colors.error} />
        <Text style={styles.errorText}>Book not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Book Header */}
      <Card style={styles.headerCard}>
        <Card.Cover
          source={
            book.cover_image_url
              ? { uri: book.cover_image_url }
              : require('../../assets/icon.png')
          }
          style={styles.cover}
        />
        <Card.Content style={styles.headerContent}>
          <Title style={styles.title}>{book.title}</Title>
          <Paragraph style={styles.author}>by {book.author}</Paragraph>
          <View style={styles.metaContainer}>
            <Chip
              mode="flat"
              style={[styles.levelChip, { backgroundColor: getLevelColor(book.level) }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {book.level}
            </Chip>
            <Chip mode="outlined" style={styles.categoryChip}>
              {book.category}
            </Chip>
          </View>
          <View style={styles.bookMeta}>
            <View style={styles.metaItem}>
              <Icon name="book" size={20} color={designSystem.colors.primary} />
              <Text style={styles.metaText}>{book.pages} pages</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="download" size={20} color={designSystem.colors.primary} />
              <Text style={styles.metaText}>{book.downloads} downloads</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Book Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Description</Title>
          <Paragraph style={styles.description}>{book.description}</Paragraph>
        </Card.Content>
      </Card>

      {/* Book Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Book Details</Title>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="person" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Author:</Text>
              <Text style={styles.detailValue}>{book.author}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="business" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Publisher:</Text>
              <Text style={styles.detailValue}>{book.publisher}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="category" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Subject:</Text>
              <Text style={styles.detailValue}>{book.subject}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="school" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Class:</Text>
              <Text style={styles.detailValue}>{book.class}</Text>
            </View>
            {book.isbn && (
              <View style={styles.detailItem}>
                <Icon name="barcode" size={20} color={designSystem.colors.primary} />
                <Text style={styles.detailLabel}>ISBN:</Text>
                <Text style={styles.detailValue}>{book.isbn}</Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Summary */}
      {book.summary && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Summary</Title>
            <Paragraph style={styles.summary}>{book.summary}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Table of Contents */}
      {book.table_of_contents && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Table of Contents</Title>
            <Paragraph style={styles.tableOfContents}>{book.table_of_contents}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Tags */}
      {book.tags && book.tags.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Tags</Title>
            <View style={styles.tagsContainer}>
              {book.tags.map((tag, index) => (
                <Chip key={index} mode="outlined" style={styles.tagChip}>
                  {tag}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Read Book Button */}
      <View style={styles.readContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SecurePdf', { bookId, bookTitle: book.title })}
          style={styles.readButton}
          contentStyle={styles.readButtonContent}
          icon="book-open"
        >
          Read Book
        </Button>
      </View>
    </ScrollView>
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
  loadingText: {
    marginTop: designSystem.spacing.md,
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
    padding: designSystem.spacing.xl,
  },
  errorText: {
    ...designSystem.typography.h3,
    color: designSystem.colors.error,
    marginVertical: designSystem.spacing.md,
    textAlign: 'center',
  },
  headerCard: {
    margin: designSystem.spacing.md,
    ...designSystem.shadows.lg,
    borderRadius: designSystem.borderRadius.lg,
  },
  cover: {
    height: 300,
    borderTopLeftRadius: designSystem.borderRadius.lg,
    borderTopRightRadius: designSystem.borderRadius.lg,
  },
  headerContent: {
    padding: designSystem.spacing.lg,
  },
  title: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.sm,
  },
  author: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    marginBottom: designSystem.spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    marginBottom: designSystem.spacing.md,
  },
  levelChip: {
    marginRight: designSystem.spacing.sm,
  },
  categoryChip: {
    marginRight: designSystem.spacing.sm,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...designSystem.typography.caption,
    color: designSystem.colors.textSecondary,
    marginLeft: designSystem.spacing.xs,
  },
  card: {
    margin: designSystem.spacing.md,
    marginTop: 0,
    ...designSystem.shadows.md,
    borderRadius: designSystem.borderRadius.lg,
  },
  sectionTitle: {
    ...designSystem.typography.h3,
    color: designSystem.colors.textPrimary,
    marginBottom: designSystem.spacing.md,
  },
  description: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  detailsContainer: {
    marginTop: designSystem.spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.sm,
  },
  detailLabel: {
    ...designSystem.typography.label,
    color: designSystem.colors.textPrimary,
    marginLeft: designSystem.spacing.sm,
    marginRight: designSystem.spacing.sm,
  },
  detailValue: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
  },
  summary: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  tableOfContents: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    marginRight: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.sm,
  },
  readContainer: {
    padding: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing.xl,
  },
  readButton: {
    borderRadius: designSystem.borderRadius.md,
    ...designSystem.shadows.md,
  },
  readButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
});
