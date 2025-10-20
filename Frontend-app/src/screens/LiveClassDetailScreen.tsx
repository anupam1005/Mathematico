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
import { liveClassService, LiveClass } from '../services/liveClassService';
import { designSystem } from '../styles/designSystem';

export default function LiveClassDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { liveClassId } = route.params;
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadLiveClass();
  }, [liveClassId]);

  const loadLiveClass = async () => {
    try {
      setLoading(true);
      const response = await liveClassService.getLiveClassById(liveClassId);
      
      if (response.success && response.data) {
        // Handle both single object and array responses
        const liveClassData = Array.isArray(response.data) ? response.data[0] : response.data;
        setLiveClass(liveClassData);
      } else {
        Alert.alert('Error', response.message || 'Failed to load live class');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading live class:', error);
      Alert.alert('Error', 'Failed to load live class');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!liveClass) return;

    Alert.alert(
      'Enroll in Live Class',
      `Are you sure you want to enroll in "${liveClass.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enroll', onPress: enrollInLiveClass },
      ]
    );
  };

  const enrollInLiveClass = async () => {
    try {
      setEnrolling(true);
      const response = await liveClassService.enrollInLiveClass(liveClassId);
      
      if (response.success) {
        Alert.alert('Success', 'Successfully enrolled in live class!');
        // You might want to update UI or navigate somewhere
      } else {
        Alert.alert('Error', response.message || 'Failed to enroll in live class');
      }
    } catch (error) {
      console.error('Error enrolling in live class:', error);
      Alert.alert('Error', 'Failed to enroll in live class');
    } finally {
      setEnrolling(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  const isLive = (status: string) => {
    return status && typeof status === 'string' && status?.toLowerCase() === 'live';
  };

  const isCompleted = (status: string) => {
    return status && typeof status === 'string' && status?.toLowerCase() === 'completed';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Text style={styles.loadingText}>Loading live class...</Text>
      </View>
    );
  }

  if (!liveClass) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={designSystem.colors.error} />
        <Text style={styles.errorText}>Live class not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Live Class Header */}
      <Card style={styles.headerCard}>
        <Card.Cover
          source={
            liveClass.thumbnail_url
              ? { uri: liveClass.thumbnail_url }
              : require('../../assets/icon.png')
          }
          style={styles.thumbnail}
        />
        <Card.Content style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>{liveClass.title}</Title>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(liveClass.status) }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {liveClass.status.toUpperCase()}
            </Chip>
          </View>
          <View style={styles.metaContainer}>
            <Chip
              mode="flat"
              style={[styles.levelChip, { backgroundColor: getLevelColor(liveClass.level) }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {liveClass.level}
            </Chip>
            <Chip mode="outlined" style={styles.categoryChip}>
              {liveClass.category}
            </Chip>
          </View>
          <View style={styles.priceContainer}>
            {liveClass.original_price && liveClass.original_price > liveClass.price && (
              <Text style={styles.originalPrice}>₹{liveClass.original_price}</Text>
            )}
            <Text style={styles.price}>₹{liveClass.price}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Live Class Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Description</Title>
          <Paragraph style={styles.description}>{liveClass.description}</Paragraph>
        </Card.Content>
      </Card>

      {/* Live Class Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Class Details</Title>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Icon name="schedule" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Scheduled:</Text>
              <Text style={styles.detailValue}>{formatDate(liveClass.scheduled_at)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="access-time" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{liveClass.duration} minutes</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="group" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Enrolled:</Text>
              <Text style={styles.detailValue}>{liveClass.enrolled_students}/{liveClass.max_students}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="category" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Subject:</Text>
              <Text style={styles.detailValue}>{liveClass.subject}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="school" size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Class:</Text>
              <Text style={styles.detailValue}>{liveClass.class}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Topics */}
      {liveClass.topics && liveClass.topics.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Topics Covered</Title>
            <View style={styles.topicsContainer}>
              {liveClass.topics.map((topic, index) => (
                <Chip key={index} mode="outlined" style={styles.topicChip}>
                  {topic}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Prerequisites */}
      {liveClass.prerequisites && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Prerequisites</Title>
            <Paragraph style={styles.prerequisites}>{liveClass.prerequisites}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Materials */}
      {liveClass.materials && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Materials Required</Title>
            <Paragraph style={styles.materials}>{liveClass.materials}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Notes */}
      {liveClass.notes && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Additional Notes</Title>
            <Paragraph style={styles.notes}>{liveClass.notes}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Recording */}
      {isCompleted(liveClass.status) && liveClass.recording_url && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Class Recording</Title>
            <Button
              mode="outlined"
              onPress={() => Alert.alert('Info', 'Recording playback would be implemented here')}
              icon="play-circle"
              style={styles.recordingButton}
            >
              Watch Recording
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {isUpcoming(liveClass.scheduled_at) && !isCompleted(liveClass.status) && (
          <Button
            mode="contained"
            onPress={handleEnroll}
            style={styles.enrollButton}
            contentStyle={styles.enrollButtonContent}
            disabled={enrolling}
            icon="school"
          >
            {enrolling ? (
              <ActivityIndicator color={designSystem.colors.surface} />
            ) : (
              `Enroll Now - ₹${liveClass.price}`
            )}
          </Button>
        )}
        
        {isLive(liveClass.status) && (
          <Button
            mode="contained"
            onPress={() => Alert.alert('Info', 'Join live class functionality would be implemented here')}
            style={styles.joinButton}
            contentStyle={styles.joinButtonContent}
            icon="videocam"
          >
            Join Live Class
          </Button>
        )}
        
        {isCompleted(liveClass.status) && (
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Info', 'View recording functionality would be implemented here')}
            style={styles.recordingButton}
            contentStyle={styles.recordingButtonContent}
            icon="play-circle"
          >
            View Recording
          </Button>
        )}
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designSystem.spacing.md,
  },
  title: {
    ...designSystem.typography.h2,
    color: designSystem.colors.textPrimary,
    flex: 1,
    marginRight: designSystem.spacing.sm,
  },
  statusChip: {
    height: 28,
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
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  topicChip: {
    marginRight: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.sm,
  },
  prerequisites: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  materials: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  notes: {
    ...designSystem.typography.body,
    color: designSystem.colors.textSecondary,
    lineHeight: 24,
  },
  recordingButton: {
    borderColor: designSystem.colors.primary,
  },
  actionContainer: {
    padding: designSystem.spacing.lg,
    paddingBottom: designSystem.spacing.xl,
  },
  enrollButton: {
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.md,
  },
  enrollButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  joinButton: {
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.success,
    ...designSystem.shadows.md,
  },
  joinButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  recordingButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
});
