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
  TouchableOpacity,
  Alert,
<<<<<<< HEAD
  Linking,
=======
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
<<<<<<< HEAD
import { Calendar, Clock, Users, Tag, GraduationCap, PlayCircle, Square, Video, AlertCircle, CheckCircle } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { liveClassService, LiveClass } from '../services/liveClassService';
import { designSystem } from '../styles/designSystem';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Logger } from '../utils/errorHandler';
=======
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { liveClassService, LiveClass } from '../services/liveClassService';
import { designSystem } from '../styles/designSystem';
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

export default function LiveClassDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { liveClassId } = route.params;
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
  const [enrolling, setEnrolling] = useState(false);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686

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
<<<<<<< HEAD
        console.log('Live class data received:', liveClassData);
        
        // Ensure all required properties exist with fallbacks
        const safeLiveClassData = {
          _id: liveClassData._id || liveClassData.id || '',
          title: liveClassData.title || 'Untitled Live Class',
          description: liveClassData.description || '',
          status: liveClassData.status || 'unknown',
          level: liveClassData.level || 'All Levels',
          category: liveClassData.category || 'General',
          thumbnail_url: liveClassData.thumbnail_url || null,
          scheduled_at: liveClassData.scheduled_at || liveClassData.startTime || null,
          duration: liveClassData.duration || 0,
          enrolled_students: liveClassData.enrolled_students || 0,
          max_students: liveClassData.max_students || 0,
          subject: liveClassData.subject || 'General',
          class: liveClassData.class || 'All Classes',
          topics: liveClassData.topics || [],
          prerequisites: liveClassData.prerequisites || null,
          materials: liveClassData.materials || null,
          notes: liveClassData.notes || null,
          recording_url: liveClassData.recording_url || null,
          ...liveClassData // Spread any additional properties
        };
        
        setLiveClass(safeLiveClassData);
      } else {
        Logger.error('Failed to load live class:', response.message);
=======
        setLiveClass(liveClassData);
      } else {
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        Alert.alert('Error', response.message || 'Failed to load live class');
        navigation.goBack();
      }
    } catch (error) {
<<<<<<< HEAD
      Logger.error('Error loading live class:', error);
=======
      console.error('Error loading live class:', error);
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      Alert.alert('Error', 'Failed to load live class');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD

  const handleStartLiveClass = async () => {
    if (!liveClass) return;

    Alert.alert(
      'Start Live Class',
      `Are you sure you want to start "${liveClass.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: startLiveClass },
=======
  const handleEnroll = async () => {
    if (!liveClass) return;

    Alert.alert(
      'Enroll in Live Class',
      `Are you sure you want to enroll in "${liveClass.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enroll', onPress: enrollInLiveClass },
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
      ]
    );
  };

<<<<<<< HEAD
  const handleEndLiveClass = async () => {
    if (!liveClass) return;

    Alert.alert(
      'End Live Class',
      `Are you sure you want to end "${liveClass.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End', onPress: endLiveClass },
      ]
    );
  };

  const startLiveClass = async () => {
    try {
      console.log('Starting live class with ID:', liveClassId);
      const response = await liveClassService.startLiveClass(liveClassId);
      
      if (response.success) {
        Alert.alert('Success', 'Live class started successfully!');
        // Reload the live class data to update the status
        await loadLiveClass();
      } else {
        Alert.alert('Error', response.message || 'Failed to start live class');
      }
    } catch (error) {
      Logger.error('Error starting live class:', error);
      Alert.alert('Error', 'Failed to start live class');
    }
  };

  const endLiveClass = async () => {
    try {
      console.log('Ending live class with ID:', liveClassId);
      const response = await liveClassService.endLiveClass(liveClassId);
      
      if (response.success) {
        Alert.alert('Success', 'Live class ended successfully!');
        // Reload the live class data to update the status
        await loadLiveClass();
      } else {
        Alert.alert('Error', response.message || 'Failed to end live class');
      }
    } catch (error) {
      Logger.error('Error ending live class:', error);
      Alert.alert('Error', 'Failed to end live class');
    }
  };

  const handleJoinLiveClass = async () => {
    if (!liveClass) return;

    try {
      const response = await liveClassService.joinLiveClass(liveClassId);
      const joinLink = response?.joinLink || response?.meetingLink;

      if (!joinLink) {
        Alert.alert('Error', 'Join link is unavailable. Please contact support.');
        return;
      }

      Alert.alert(
        'Join Live Class',
        `You are about to join "${liveClass.title}".`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join Now',
            onPress: () => {
              Linking.openURL(joinLink).catch(err => {
                Logger.error('Failed to open meeting link:', err);
                Alert.alert('Error', 'Could not open the meeting link.');
              });
            },
          },
        ],
      );
    } catch (error) {
      Logger.error('Error joining live class:', error);
      Alert.alert('Error', 'Failed to join live class. Please try again.');
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      Logger.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const isUpcoming = (dateString: string) => {
    if (!dateString) return false;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return false;
      return date > new Date();
    } catch (error) {
      Logger.error('Error checking if date is upcoming:', error);
      return false;
    }
=======
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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

<<<<<<< HEAD
  if (!liveClass || typeof liveClass !== 'object') {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={designSystem.colors.error} />
=======
  if (!liveClass) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error" size={64} color={designSystem.colors.error} />
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        <Text style={styles.errorText}>Live class not found</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }

<<<<<<< HEAD
  try {
    return (
      <ScrollView style={styles.container}>
=======
  return (
    <ScrollView style={styles.container}>
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
            <Title style={styles.title}>{liveClass.title || 'Untitled Live Class'}</Title>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(liveClass.status || '') }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {(liveClass.status || 'unknown').toUpperCase()}
=======
            <Title style={styles.title}>{liveClass.title}</Title>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(liveClass.status) }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {liveClass.status.toUpperCase()}
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
            </Chip>
          </View>
          <View style={styles.metaContainer}>
            <Chip
              mode="flat"
<<<<<<< HEAD
              style={[styles.levelChip, { backgroundColor: getLevelColor(liveClass.level || '') }]}
              textStyle={{ color: designSystem.colors.surface }}
            >
              {liveClass.level || 'All Levels'}
            </Chip>
            <Chip mode="outlined" style={styles.categoryChip}>
              {liveClass.category || 'General'}
            </Chip>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>FREE</Text>
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
          </View>
        </Card.Content>
      </Card>

      {/* Live Class Description */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Description</Title>
<<<<<<< HEAD
          <Paragraph style={styles.description}>
            {liveClass.description && typeof liveClass.description === 'string' 
              ? liveClass.description 
              : 'No description available.'}
          </Paragraph>
=======
          <Paragraph style={styles.description}>{liveClass.description}</Paragraph>
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        </Card.Content>
      </Card>

      {/* Live Class Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Class Details</Title>
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
<<<<<<< HEAD
              <Calendar size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Scheduled:</Text>
              <Text style={styles.detailValue}>{liveClass.scheduled_at ? formatDate(liveClass.scheduled_at) : 'TBD'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Clock size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{liveClass.duration || 0} minutes</Text>
            </View>
            <View style={styles.detailItem}>
              <Users size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Enrolled:</Text>
              <Text style={styles.detailValue}>{liveClass.enrolled_students || 0}/{liveClass.max_students || 0}</Text>
            </View>
            <View style={styles.detailItem}>
              <Tag size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Subject:</Text>
              <Text style={styles.detailValue}>{liveClass.subject || 'General'}</Text>
            </View>
            <View style={styles.detailItem}>
              <GraduationCap size={20} color={designSystem.colors.primary} />
              <Text style={styles.detailLabel}>Class:</Text>
              <Text style={styles.detailValue}>{liveClass.class || 'All Classes'}</Text>
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
      {liveClass.prerequisites && typeof liveClass.prerequisites === 'string' && liveClass.prerequisites.trim() && (
=======
      {liveClass.prerequisites && (
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Prerequisites</Title>
            <Paragraph style={styles.prerequisites}>{liveClass.prerequisites}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Materials */}
<<<<<<< HEAD
      {liveClass.materials && typeof liveClass.materials === 'string' && liveClass.materials.trim() && (
=======
      {liveClass.materials && (
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Materials Required</Title>
            <Paragraph style={styles.materials}>{liveClass.materials}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Notes */}
<<<<<<< HEAD
      {liveClass.notes && typeof liveClass.notes === 'string' && liveClass.notes.trim() && (
=======
      {liveClass.notes && (
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Additional Notes</Title>
            <Paragraph style={styles.notes}>{liveClass.notes}</Paragraph>
          </Card.Content>
        </Card>
      )}

      {/* Recording */}
<<<<<<< HEAD
      {isCompleted(liveClass.status || '') && liveClass.recording_url && (
=======
      {isCompleted(liveClass.status) && liveClass.recording_url && (
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
        {/* Admin Controls - Only show for admin users */}
        {user?.isAdmin && (
          <>
            {/* Start Live Class Button */}
            {liveClass.status === 'scheduled' && (
              <Button
                mode="contained"
                onPress={handleStartLiveClass}
                style={styles.startButton}
                contentStyle={styles.startButtonContent}
                icon={() => <PlayCircle size={20} color={designSystem.colors.surface} />}
              >
                Start Live Class
              </Button>
            )}
            
            {/* End Live Class Button */}
            {liveClass.status === 'live' && (
              <Button
                mode="contained"
                onPress={handleEndLiveClass}
                style={styles.endButton}
                contentStyle={styles.endButtonContent}
                icon={() => <Square size={20} color={designSystem.colors.surface} />}
              >
                End Live Class
              </Button>
            )}
          </>
        )}
        
        {/* Student Controls - Only show Join button for students */}
        {!user?.isAdmin && (
          <>
            {/* Join Live Class Button - Only show when class is live */}
            {isLive(liveClass.status || '') && (
              <Button
                mode="contained"
                onPress={() => handleJoinLiveClass()}
                style={styles.joinButton}
                contentStyle={styles.joinButtonContent}
                icon={() => <Video size={20} color={designSystem.colors.surface} />}
              >
                Join Live Class
              </Button>
            )}
            
            {/* Show message for scheduled classes */}
            {liveClass.status === 'scheduled' && (
              <View style={styles.messageContainer}>
                <Calendar size={24} color={designSystem.colors.info} />
                <Text style={styles.messageText}>
                  Class will start at {liveClass.scheduled_at ? formatDate(liveClass.scheduled_at) : 'TBD'}
                </Text>
              </View>
            )}
            
            {/* Show message for completed classes */}
            {isCompleted(liveClass.status || '') && (
              <View style={styles.messageContainer}>
                <CheckCircle size={24} color={designSystem.colors.success} />
                <Text style={styles.messageText}>
                  This class has been completed
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
    );
  } catch (error) {
    Logger.error('Error rendering LiveClassDetailScreen:', error);
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={64} color={designSystem.colors.error} />
        <Text style={styles.errorText}>Error loading live class details</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }
=======
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
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
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
<<<<<<< HEAD
  startButton: {
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.success,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.md,
  },
  startButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  endButton: {
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.error,
    marginBottom: designSystem.spacing.sm,
    ...designSystem.shadows.md,
  },
  endButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  recordingButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface,
    borderRadius: designSystem.borderRadius.md,
    marginTop: designSystem.spacing.sm,
  },
  messageText: {
    ...designSystem.typography.body,
    color: designSystem.colors.textPrimary,
    marginLeft: designSystem.spacing.sm,
    textAlign: 'center',
  },
=======
  recordingButtonContent: {
    paddingVertical: designSystem.spacing.md,
  },
>>>>>>> origin/cursor/install-mathematico-project-dependencies-1686
});
