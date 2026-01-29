import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Title, Paragraph, Chip, Searchbar } from 'react-native-paper';
import { Search, X, UserCircle, BookOpen, Calendar, Clock, PlayCircle, GraduationCap, Book as BookIcon, Video, Users } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { courseService } from '../services/courseService';
import { bookService } from '../services/bookService';
import { liveClassService } from '../services/liveClassService';
import { theme } from '../styles/theme';
import { designSystem, layoutStyles, textStyles } from '../styles/designSystem';
import { UnifiedCard } from '../components/UnifiedCard';
import { StatsCard } from '../components/StatsCard';
import { EmptyState } from '../components/EmptyState';
import { safeCatch } from '../utils/safeCatch';

const { width } = Dimensions.get('window');

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  price: number;
  original_price?: number;
  level: string;
  category: string;
  is_featured: boolean;
  students: number;
}

interface Book {
  id: string;
  title: string;
  description: string;
  cover_image_url?: string;
  author: string;
  category: string;
  level: string;
  is_featured: boolean;
}

interface LiveClass {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  scheduled_at: string;
  duration: number;
  price: number;
  level: string;
  category: string;
  is_featured: boolean;
}

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalBooks: 0,
    totalLiveClasses: 0,
    totalStudents: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setDataLoaded(false);
      await Promise.all([
        loadFeaturedCourses(),
        loadFeaturedBooks(),
        loadUpcomingClasses(),
        loadStats(),
      ]);
      setDataLoaded(true);
    } catch (error) {
      safeCatch('HomeScreen.loadData')(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [courses, books, liveClasses] = await Promise.all([
        courseService.getCourses(1, 1000).catch((error) => {
          safeCatch('HomeScreen.loadStats.courses')(error);
          return { data: [] };
        }),
        bookService.getBooks(1, 1000).catch((error) => {
          safeCatch('HomeScreen.loadStats.books')(error);
          return { data: [] };
        }),
        liveClassService.getLiveClasses(1, 1000).catch((error) => {
          safeCatch('HomeScreen.loadStats.liveClasses')(error);
          return { data: [] };
        }),
      ]);

      setStats({
        totalCourses: courses.data ? courses.data.length : 0,
        totalBooks: books.data ? books.data.length : 0,
        totalLiveClasses: liveClasses.data ? liveClasses.data.length : 0,
        totalStudents: 0,
      });
    } catch (error) {
      safeCatch('HomeScreen.loadStats')(error);
      // Don't set empty data on error
    }
  };

  const loadFeaturedCourses = async () => {
    try {
      const response = await courseService.getCourses(1, 4, { status: 'published' });
      if (response && response.data && Array.isArray(response.data)) {
        setFeaturedCourses(response.data);
      } else {
        setFeaturedCourses([]);
      }
    } catch (error) {
      safeCatch('HomeScreen.loadFeaturedCourses', () => {
        setFeaturedCourses([]);
      })(error);
    }
  };

  const loadFeaturedBooks = async () => {
    try {
      const response = await bookService.getBooks(1, 4);
      if (response && response.data && Array.isArray(response.data)) {
        setFeaturedBooks(response.data);
      } else {
        setFeaturedBooks([]);
      }
    } catch (error) {
      safeCatch('HomeScreen.loadFeaturedBooks', () => {
        setFeaturedBooks([]);
      })(error);
    }
  };

  const loadUpcomingClasses = async () => {
    try {
      const response = await liveClassService.getLiveClasses(1, 3, { status: 'upcoming' });
      if (response && response.data && Array.isArray(response.data)) {
        setUpcomingClasses(response.data);
      } else {
        setUpcomingClasses([]);
      }
    } catch (error) {
      safeCatch('HomeScreen.loadUpcomingClasses', () => {
        setUpcomingClasses([]);
      })(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    // Navigate to search results
    navigation.navigate('Courses', { search: searchQuery });
  };

  const renderCourseCard = (course: Course, index: number) => (
    <UnifiedCard
      key={course.id || index}
      variant="elevated"
      onPress={() => navigation.navigate('CourseDetail', { courseId: course.id || (course as any)._id })}
      style={styles.cardContainer}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={
            course.thumbnail_url
              ? { uri: course.thumbnail_url }
              : require('../../assets/icon.png')
          }
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <Text numberOfLines={2} style={textStyles.subheading}>
          {course.title}
        </Text>
        <Text numberOfLines={2} style={[textStyles.bodySecondary, { marginVertical: designSystem.spacing.sm }]}>
          {course.description}
        </Text>
        <View style={styles.cardFooter}>
          <Chip
            mode="outlined"
            compact
            style={[styles.levelChip, { backgroundColor: getLevelColor(course.level) }]}
            textStyle={styles.levelChipText}
          >
            {course.level}
          </Chip>
          <View style={styles.priceContainer}>
            {course.original_price && course.original_price > course.price && (
              <Text style={textStyles.caption}>₹{course.original_price}</Text>
            )}
            <Text style={textStyles.body}>₹{course.price}</Text>
          </View>
        </View>
      </View>
    </UnifiedCard>
  );

  const renderBookCard = (book: Book, index: number) => (
    <UnifiedCard
      key={book.id || index}
      variant="elevated"
      onPress={() => navigation.navigate('BookDetail', { bookId: book.id || (book as any)._id })}
      style={styles.cardContainer}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={
            book.cover_image_url
              ? { uri: book.cover_image_url }
              : require('../../assets/icon.png')
          }
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <Text numberOfLines={2} style={textStyles.subheading}>
          {book.title}
        </Text>
        <Text numberOfLines={1} style={[textStyles.bodySecondary, { marginVertical: designSystem.spacing.sm }]}>
          by {book.author}
        </Text>
        <Chip
          mode="outlined"
          compact
          style={[styles.levelChip, { backgroundColor: getLevelColor(book.level) }]}
          textStyle={styles.levelChipText}
        >
          {book.level}
        </Chip>
      </View>
    </UnifiedCard>
  );

  const renderLiveClassCard = (liveClass: LiveClass, index: number) => (
    <UnifiedCard
      key={liveClass.id || index}
      variant="elevated"
      onPress={() => navigation.navigate('LiveClassDetail', { liveClassId: liveClass.id || (liveClass as any)._id })}
      style={styles.liveClassCard}
    >
      <View style={styles.cardImageContainer}>
        <Image
          source={
            liveClass.thumbnail_url
              ? { uri: liveClass.thumbnail_url }
              : require('../../assets/icon.png')
          }
          style={styles.cardImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.cardContent}>
        <Text numberOfLines={2} style={textStyles.subheading}>
          {liveClass.title}
        </Text>
          <View style={styles.liveClassInfo}>
            <View style={styles.liveClassMeta}>
              <Calendar size={16} color={designSystem.colors.textSecondary} />
              <Text style={textStyles.caption}>
                {new Date(liveClass.scheduled_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.liveClassMeta}>
              <Clock size={16} color={designSystem.colors.textSecondary} />
              <Text style={textStyles.caption}>{liveClass.duration} min</Text>
            </View>
          </View>
        <View style={styles.cardFooter}>
          <Chip
            mode="outlined"
            compact
            style={[styles.levelChip, { backgroundColor: getLevelColor(liveClass.level) }]}
            textStyle={styles.levelChipText}
          >
            {liveClass.level}
          </Chip>
          <Text style={textStyles.body}>FREE</Text>
        </View>
      </View>
    </UnifiedCard>
  );

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

  return (
    <ScrollView
      style={layoutStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.greetingContainer}>
            <Text style={textStyles.bodySecondary}>Welcome back!</Text>
            <Text style={textStyles.heading}>{user?.name || 'Student'}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.avatarContainer}
        >
          <UserCircle size={40} color={designSystem.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Searchbar
          placeholder="Search courses, books, or classes..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchBar}
          icon={() => <Search size={24} color={designSystem.colors.textSecondary} />}
          clearIcon={searchQuery ? () => <X size={24} color={designSystem.colors.textSecondary} /> : undefined}
          onClearIconPress={() => setSearchQuery('')}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <X size={24} color={designSystem.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Statistics Section */}
      <StatsCard
        title="Platform Statistics"
        stats={[
          {
            icon: 'GraduationCap',
            value: `${stats.totalCourses}+`,
            label: 'Courses',
            color: designSystem.colors.primary,
          },
          {
            icon: 'BookOpen',
            value: `${stats.totalBooks}+`,
            label: 'Books',
            color: designSystem.colors.secondary,
          },
          {
            icon: 'Video',
            value: `${stats.totalLiveClasses}+`,
            label: 'Live Classes',
            color: designSystem.colors.accent,
          },
          {
            icon: 'Users',
            value: `${stats.totalStudents}+`,
            label: 'Students',
            color: designSystem.colors.info,
          },
        ]}
        columns={4}
      />

      {/* Why Choose Our Platform */}
      <UnifiedCard variant="elevated" style={styles.featuresCard}>
        <Title style={textStyles.heading}>Why Choose Our Platform</Title>
        <Text style={[textStyles.bodySecondary, { textAlign: 'center', marginBottom: designSystem.spacing.lg }]}>
          We provide the best learning experience for mathematics students
        </Text>
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: designSystem.colors.primary + '20' }]}>
              <BookOpen size={24} color={designSystem.colors.primary} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[textStyles.subheading, { marginBottom: designSystem.spacing.xs }]}>Comprehensive Courses</Text>
              <Text style={textStyles.bodySecondary}>
                Structured learning paths from basic to advanced mathematics concepts.
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: designSystem.colors.secondary + '20' }]}>
              <Calendar size={24} color={designSystem.colors.secondary} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[textStyles.subheading, { marginBottom: designSystem.spacing.xs }]}>Live Interactive Classes</Text>
              <Text style={textStyles.bodySecondary}>
                Real-time classes with expert educators and peer interaction.
              </Text>
            </View>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: designSystem.colors.accent + '20' }]}>
              <GraduationCap size={24} color={designSystem.colors.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={[textStyles.subheading, { marginBottom: designSystem.spacing.xs }]}>Expert Educators</Text>
              <Text style={textStyles.bodySecondary}>
                Learn from experienced teachers with proven track records.
              </Text>
            </View>
          </View>
        </View>
      </UnifiedCard>

      {/* Featured Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Featured Courses</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Courses')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {loading && !dataLoaded ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          ) : (
            featuredCourses.map((course, index) => (
              <View key={course.id || index}>
                {renderCourseCard(course, index)}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Featured Books */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Featured Books</Title>
          <TouchableOpacity onPress={() => navigation.navigate('Books')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {loading && !dataLoaded ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading books...</Text>
            </View>
          ) : (
            featuredBooks.map((book, index) => (
              <View key={book.id || index}>
                {renderBookCard(book, index)}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Upcoming Live Classes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Title style={styles.sectionTitle}>Upcoming Live Classes</Title>
          <TouchableOpacity onPress={() => navigation.navigate('LiveClasses')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.liveClassesContainer}>
          {loading && !dataLoaded ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading live classes...</Text>
            </View>
          ) : (
            upcomingClasses.map((liveClass, index) => (
              <View key={liveClass.id || index}>
                {renderLiveClassCard(liveClass, index)}
              </View>
            ))
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Title style={styles.sectionTitle}>Quick Actions</Title>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <GraduationCap size={24} color={designSystem.colors.primary} />
            <Text style={styles.quickActionText}>Browse Courses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Books')}
          >
            <BookIcon size={24} color={designSystem.colors.primary} />
            <Text style={styles.quickActionText}>Browse Books</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('LiveClasses')}
            >
              <PlayCircle size={24} color={designSystem.colors.primary} />
              <Text style={styles.quickActionText}>Live Classes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    position: 'relative',
    marginHorizontal: designSystem.spacing.md,
    marginBottom: designSystem.spacing.md,
    marginTop: designSystem.spacing.sm,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.surface,
    ...designSystem.shadows.lg,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: designSystem.spacing.md,
  },
  greetingContainer: {
    flex: 1,
  },
  avatarContainer: {
    padding: designSystem.spacing.sm,
  },
  searchBar: {
    marginHorizontal: 0,
    marginVertical: 0,
    elevation: 2,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
  },
  section: {
    marginBottom: designSystem.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.lg,
    gap: designSystem.spacing.md,
  },
  sectionTitle: {
    ...textStyles.heading,
  },
  seeAllText: {
    color: designSystem.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  cardContainer: {
    width: width * 0.75,
    marginRight: designSystem.spacing.lg,
    ...designSystem.shadows.sm,
  },
  liveClassCard: {
    marginBottom: designSystem.spacing.lg,
    ...designSystem.shadows.sm,
    borderRadius: designSystem.borderRadius.lg,
  },
  cardImageContainer: {
    height: 140,
    borderTopLeftRadius: designSystem.borderRadius.lg,
    borderTopRightRadius: designSystem.borderRadius.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: designSystem.spacing.lg,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: designSystem.spacing.md,
    paddingTop: designSystem.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.borderLight,
  },
  levelChip: {
    height: 28,
    borderRadius: designSystem.borderRadius.md,
  },
  levelChipText: {
    color: designSystem.colors.surface,
    fontWeight: '600',
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveClassesContainer: {
    paddingHorizontal: designSystem.spacing.lg,
  },
  liveClassInfo: {
    flexDirection: 'row',
    marginBottom: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.sm,
  },
  liveClassMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: designSystem.spacing.lg,
    gap: designSystem.spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.lg,
  },
  quickActionButton: {
    alignItems: 'center',
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.lg,
    ...designSystem.shadows.md,
    minWidth: 90,
    flex: 1,
    marginHorizontal: designSystem.spacing.xs,
  },
  quickActionText: {
    ...textStyles.caption,
    marginTop: designSystem.spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: designSystem.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  loadingText: {
    ...textStyles.body,
    color: designSystem.colors.textSecondary,
    fontStyle: 'italic',
  },
  featuresCard: {
    margin: designSystem.spacing.lg,
    marginTop: 0,
    ...designSystem.shadows.sm,
  },
  featuresContainer: {
    flexDirection: 'column',
    gap: designSystem.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.md,
    paddingHorizontal: designSystem.spacing.md,
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: designSystem.spacing.md,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.md,
  },
});
