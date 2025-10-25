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
  Divider,
} from 'react-native-paper';
import { Icon } from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { courseService, Course } from '../services/courseService';
import { designSystem } from '../styles/designSystem';

export default function CourseDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { courseId } = route.params;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourseById(courseId);
      
      if (response.success && response.data) {
        // Handle both single object and array responses
        const courseData = Array.isArray(response.data) ? response.data[0] : response.data;
        setCourse(courseData);
      } else {
        Alert.alert('Error', response.message || 'Failed to load course');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading course:', error);
      Alert.alert('Error', 'Failed to load course');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    // Navigate to checkout screen for payment
    navigation.navigate('Checkout', {
      type: 'course',
      itemId: courseId,
      itemData: course
    });
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
        <Text style={styles.loadingText}>Loading course...</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={designSystem.colors.error} />
        <Text style={styles.errorText}>Course not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Course Header */}
      <Card style={styles.headerCard}>
        <Card.Cover
          source={
            course.thumbnail_url
              ? { uri: course.thumbnail_url }
              : require('../../assets/icon.png')
          }
          style={styles.thumbnail}
        />
        <Card.Content style={styles.headerContent}>
          <Title style={styles.title}>{course.title}</Title>
          <View style={styles.metaContainer}>
            <Chip
              mode="flat"
              style={[styles.levelChip, { backgroundColor: getLevelColor(course.level) }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {course.level}
            </Chip>
            <Chip mode="outlined" style={styles.categoryChip}>
              {course.category}
            </Chip>
          </View>
          <View style={styles.priceContainer}>
            {course.original_price && course.original_price > course.price && (
              <Text style={styles.originalPrice}>₹{course.original_price}</Text>
            )}
            <Text style={styles.price}>₹{course.price}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Course Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Description</Title>
          <Paragraph style={styles.description}>{course.description}</Paragraph>
        </Card.Content>
      </Card>

      {/* Course Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Course Details</Title>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{course.duration}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="group" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Students:</Text>
              <Text style={styles.detailValue}>{course.students}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="category" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Subject:</Text>
              <Text style={styles.detailValue}>{course.subject}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="school" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Class:</Text>
              <Text style={styles.detailValue}>{course.class}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* What You Will Learn */}
      {course.what_you_will_learn && course.what_you_will_learn.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>What You Will Learn</Title>
            {course.what_you_will_learn.map((item, index) => (
              <View key={index} style={styles.learningItem}>
                <Icon name="check-circle" size={16} color={designSystem.colors.success} />
                <Text style={styles.learningText}>{item}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Who Is This For */}
      {course.who_is_this_for && course.who_is_this_for.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Who Is This For</Title>
            {course.who_is_this_for.map((item, index) => (
              <View key={index} style={styles.learningItem}>
                <Icon name="person" size={16} color={designSystem.colors.primary} />
                <Text style={styles.learningText}>{item}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Requirements */}
      {course.requirements && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Requirements</Title>
            <Paragraph style={styles.requirements}>{course.requirements}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Topics */}
      {course.topics && course.topics.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Topics Covered</Title>
            <View style={styles.topicsContainer}>
              {course.topics.map((topic, index) => (
                <Chip key={index} mode="outlined" style={styles.topicChip}>
                  {topic}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Enroll Button */}
      <View style={styles.enrollContainer}>
        <Button
          mode="contained"
          onPress={handleEnroll}
          style={styles.enrollButton}
          contentStyle={styles.enrollButtonContent}
        >
          {`Enroll Now - ₹${course.price}`}
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
  thumbnail: {
    height: 200,
    borderTopLeftRadius: designSystem.borderRadius.lg,
    borderTopRightRadius: designSystem.borderRadius.lg,
  },
  headerContent: {
    padding: designSystem.spacing.lg,
  },
  title: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
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
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: designSystem.spacing.sm,
  },
  price: {
    ...designSystem.typography.h2,
    color: designSystem.colors.primary,
    fontWeight: 'bold',
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
  learningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.sm,
  },
  learningText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    marginLeft: designSystem.spacing.sm,
    flex: 1,
    lineHeight: 22,
  },
  requirements: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicChip: {
    marginRight: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.sm,
  },
  enrollContainer: {
    padding: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing.xl,
  },
  enrollButton: {
    borderRadius: designSystem.borderRadius.md,
    ...designSystem.shadows.md,
  },
  enrollButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
});
