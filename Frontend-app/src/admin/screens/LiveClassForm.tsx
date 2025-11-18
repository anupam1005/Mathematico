// src/admin/screens/LiveClassForm.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  Platform,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { adminService } from '../../services/adminService';
import { CustomTextInput } from '../../components/CustomTextInput';
import { Button } from 'react-native-paper';
import { colors } from '../../styles/colors';
import { formatDateTime, validateTimeRange } from '../../utils/dateTimeUtils';

// Form validation types
interface FormErrors {
  title?: string;
  description?: string;
  category?: string;
  subject?: string;
  grade?: string;
  level?: string;
  duration?: string;
  maxStudents?: string;
  startTime?: string;
  endTime?: string;
  scheduledAt?: string;
  meetingLink?: string;
  general?: string;
}

// Default form values
const DEFAULT_FORM_VALUES = {
  title: '',
  description: '',
  category: '',
  subject: '',
  grade: '',
  level: 'beginner',
  duration: '60', // Default to 60 minutes
  maxStudents: '50', // Default to 50 students
  startTime: new Date(),
  endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
  scheduledAt: new Date(),
  status: 'scheduled',
  meetingLink: '',
  image: null as any,
};

interface LiveClassFormProps {
  liveClassId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  navigation?: any;
  route?: any;
}

const LiveClassForm: React.FC<LiveClassFormProps> = ({ 
  liveClassId, 
  onSuccess, 
  onCancel,
  navigation,
  route
}) => {
  // State
  const [formData, setFormData] = useState<typeof DEFAULT_FORM_VALUES>({ ...DEFAULT_FORM_VALUES });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!liveClassId);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);
  const [showScheduledTimePicker, setShowScheduledTimePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const isMounted = useRef(true);

  // Set isMounted to false on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle keyboard visibility for better UX
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Load live class data if in edit mode
  const loadLiveClassData = useCallback(async () => {
    if (!liveClassId) return;

    try {
      const response = await adminService.getLiveClassById(liveClassId);
      if (response.success && response.data) {
        const liveClass = response.data;
        
        // Format dates properly
        const formattedData = {
          ...liveClass,
          startTime: liveClass.startTime ? new Date(liveClass.startTime) : new Date(),
          endTime: liveClass.endTime ? new Date(liveClass.endTime) : new Date(Date.now() + 60 * 60 * 1000),
          scheduledAt: liveClass.scheduledAt ? new Date(liveClass.scheduledAt) : new Date(),
          duration: liveClass.duration?.toString() || '60',
          maxStudents: liveClass.maxStudents?.toString() || '50',
        };

        if (isMounted.current) {
          setFormData(formattedData);
        }
      } else {
        throw new Error(response.error || 'Failed to load live class data');
      }
    } catch (error) {
      console.error('Error loading live class:', error);
      Alert.alert('Error', 'Failed to load live class data. Please try again.');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [liveClassId]);

  // Load data when component mounts or liveClassId changes
  useFocusEffect(
    useCallback(() => {
      if (liveClassId) {
        loadLiveClassData();
      } else {
        // Reset form for new class
        setFormData({ ...DEFAULT_FORM_VALUES });
        setErrors({});
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [liveClassId, loadLiveClassData])
  );

  // Handle loading state from route params (if coming from deep link)
  useEffect(() => {
    if (route.params?.isLoading !== undefined) {
      setIsLoading(route.params.isLoading);
    }
  }, [route?.params]);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Required fields validation
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
      isValid = false;
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
      isValid = false;
    } else if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      newErrors.duration = 'Please enter a valid duration in minutes';
      isValid = false;
    }

    if (!formData.maxStudents) {
      newErrors.maxStudents = 'Maximum students is required';
      isValid = false;
    } else if (isNaN(Number(formData.maxStudents)) || Number(formData.maxStudents) <= 0) {
      newErrors.maxStudents = 'Please enter a valid number of students';
      isValid = false;
    }

    // Validate time ranges
    if (formData.startTime && formData.endTime) {
      if (!validateTimeRange(formData.startTime, formData.endTime)) {
        newErrors.endTime = 'End time must be after start time';
        isValid = false;
      }
    }

    if (formData.scheduledAt && formData.startTime) {
      if (formData.scheduledAt > formData.startTime) {
        newErrors.scheduledAt = 'Scheduled time must be before the class starts';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for the field being edited
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle date/time changes
  const handleDateTimeChange = (field: string, date: Date) => {
    handleChange(field, date);
    
    // If start time changes, update end time to maintain duration
    if (field === 'startTime') {
      const duration = Number(formData.duration) || 60;
      const endTime = new Date(date.getTime() + duration * 60000);
      handleChange('endTime', endTime);
    }
  };

  // Helper function to close all date/time pickers
  const closeAllPickers = () => {
    setShowScheduledDatePicker(false);
    setShowScheduledTimePicker(false);
    setShowStartDatePicker(false);
    setShowStartTimePicker(false);
    setShowEndDatePicker(false);
    setShowEndTimePicker(false);
  };

  // Handle image picker
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        handleChange('image', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'class-image.jpg',
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    console.log('LiveClassForm: Submit button clicked');
    console.log('LiveClassForm: Form data:', formData);
    
    // Dismiss keyboard if open
    Keyboard.dismiss();
    
    // Enhanced validation
    const requiredFields = ['title', 'description', 'category', 'subject', 'grade', 'level', 'duration', 'maxStudents', 'meetingLink'];
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    if (missingFields.length > 0) {
      console.log('LiveClassForm: Validation failed - missing required fields:', missingFields);
      return Alert.alert("Error", `Please fill all required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate enum values
    const validCategories = ['mathematics', 'physics'];
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const validStatuses = ['scheduled', 'live', 'completed', 'cancelled', 'postponed'];
    
    if (!validCategories.includes(formData.category)) {
      return Alert.alert("Error", "Please select a valid category from the dropdown");
    }
    
    if (!validLevels.includes(formData.level)) {
      return Alert.alert("Error", "Please select a valid level from the dropdown");
    }
    
    if (formData.status && !validStatuses.includes(formData.status)) {
      return Alert.alert("Error", "Please select a valid status from the dropdown");
    }
    
    // Validate duration and maxStudents are numbers
    if (isNaN(Number(formData.duration)) || Number(formData.duration) < 15 || Number(formData.duration) > 480) {
      return Alert.alert("Error", "Duration must be between 15 and 480 minutes");
    }
    
    if (isNaN(Number(formData.maxStudents)) || Number(formData.maxStudents) <= 0) {
      return Alert.alert("Error", "Max Students must be a positive number");
    }

    // Compute an effective end time based on duration if necessary
    const start = formData.startTime;
    const effectiveEnd = (formData.endTime && formData.endTime.getTime() > start.getTime())
      ? formData.endTime
      : (formData.duration ? new Date(start.getTime() + Number(formData.duration) * 60000) : formData.endTime);
    if (!effectiveEnd || effectiveEnd.getTime() <= start.getTime()) {
      return Alert.alert("Error", "End time must be after start time");
    }

    setLoading(true);
    try {
      console.log('LiveClassForm: Creating FormData...');
      const formDataToSend = new FormData();
      
      // Prepare the data object with proper formatting
      const processedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        subject: formData.subject.trim(),
        grade: formData.grade.trim(),
        level: formData.level,
        duration: Number(formData.duration),
        maxStudents: Number(formData.maxStudents),
        startTime: formData.startTime.toISOString(),
        endTime: effectiveEnd.toISOString(),
        scheduledAt: formData.scheduledAt.toISOString(),
        meetingLink: formData.meetingLink.trim(),
        status: formData.status || 'scheduled',
        isAvailable: true
      };
      
      console.log('LiveClassForm: Processed data:', processedData);
      
      // Add all fields to FormData with proper formatting
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, String(value));
        }
      });
      
      // Handle image upload
      if (formData.image) {
        // If it's a new image (has uri)
        if (typeof formData.image === 'object' && 'uri' in formData.image && formData.image.uri) {
          // Extract filename and type from URI if available
          const uriParts = formData.image.uri.split('.');
          const fileType = uriParts[uriParts.length - 1];
          
          formDataToSend.append('image', {
            uri: formData.image.uri,
            name: `liveclass_${Date.now()}.${fileType}`,
            type: `image/${fileType}`
          } as any);
        } 
        // If it's an existing image URL (string)
        else if (typeof formData.image === 'string') {
          formDataToSend.append('image', formData.image);
        }
      }

      console.log('LiveClassForm: FormData created, submitting...');
      
      if (liveClassId) {
        console.log('LiveClassForm: Updating live class with ID:', liveClassId);
        const result = await adminService.updateLiveClass(liveClassId, formDataToSend);
        console.log('LiveClassForm: Update result:', result);
        if (result.success) {
          Alert.alert("Success", "Live class updated successfully");
          onSuccess?.();
        } else {
          Alert.alert("Error", result.error || "Failed to update live class");
        }
      } else {
        console.log('LiveClassForm: Creating new live class...');
        const result = await adminService.createLiveClass(formDataToSend);
        console.log('LiveClassForm: Create result:', result);
        if (result.success) {
          Alert.alert("Success", "Live class created successfully");
          onSuccess?.();
        } else {
          Alert.alert("Error", result.error || "Failed to create live class");
        }
      }
    } catch (err: any) {
      console.error('LiveClassForm: Error during submission:', err);
      Alert.alert("Error", err.message || "Something went wrong while processing your request");
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading live class data...</Text>
      </View>
    );
  }

  // Helper function to combine date and time
  const combineDateAndTime = (date: Date, time: Date): Date => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  };

  // Scheduled Date and Time handlers
  const handleScheduledDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowScheduledDatePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'cancel' || !selectedDate) {
      if (Platform.OS === 'android') return;
    }
    
    if (selectedDate) {
      const currentTime = formData.scheduledAt || new Date();
      const combined = combineDateAndTime(selectedDate, currentTime);
      setFormData({ ...formData, scheduledAt: combined });
      
      if (Platform.OS === 'ios') {
        setShowScheduledTimePicker(true);
      }
    }
  };

  const handleScheduledTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowScheduledTimePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'cancel' || !selectedTime) {
      return;
    }
    
    if (selectedTime) {
      const currentDate = formData.scheduledAt || new Date();
      const combined = combineDateAndTime(currentDate, selectedTime);
      setFormData({ ...formData, scheduledAt: combined });
    }
  };

  // Start Date and Time handlers
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'cancel' || !selectedDate) {
      if (Platform.OS === 'android') return;
    }
    
    if (selectedDate) {
      const currentTime = formData.startTime || new Date();
      const combined = combineDateAndTime(selectedDate, currentTime);
      const newFormData = { ...formData, startTime: combined };
      
      // Calculate end time based on start time + duration
      if (formData.duration) {
        const endTime = new Date(combined.getTime() + (Number(formData.duration) * 60000));
        newFormData.endTime = endTime;
      }
      
      setFormData(newFormData);
      
      if (Platform.OS === 'ios') {
        setShowStartTimePicker(true);
      }
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'cancel' || !selectedTime) {
      return;
    }
    
    if (selectedTime) {
      const currentDate = formData.startTime || new Date();
      const combined = combineDateAndTime(currentDate, selectedTime);
      const newFormData = { ...formData, startTime: combined };
      
      // Calculate end time based on start time + duration
      if (formData.duration) {
        const endTime = new Date(combined.getTime() + (Number(formData.duration) * 60000));
        newFormData.endTime = endTime;
      }
      
      setFormData(newFormData);
    }
  };

  // End Date and Time handlers
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'cancel' || !selectedDate) {
      if (Platform.OS === 'android') return;
    }
    
    if (selectedDate) {
      const currentTime = formData.endTime || new Date();
      const combined = combineDateAndTime(selectedDate, currentTime);
      setFormData({ ...formData, endTime: combined });
      
      if (Platform.OS === 'ios') {
        setShowEndTimePicker(true);
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    
    if (event.type === 'dismissed' || event.type === 'cancel' || !selectedTime) {
      return;
    }
    
    if (selectedTime) {
      const currentDate = formData.endTime || new Date();
      const combined = combineDateAndTime(currentDate, selectedTime);
      setFormData({ ...formData, endTime: combined });
    }
  };

  const handleDurationChange = (duration: string) => {
    setFormData({ ...formData, duration });
    // Recalculate end time when duration changes
    if (formData.startTime && duration) {
      const endTime = new Date(formData.startTime.getTime() + (Number(duration) * 60000));
      setFormData((prev: any) => ({ ...prev, duration, endTime }));
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <CustomTextInput
        label="Title"
        value={formData.title}
        onChangeText={t => setFormData({ ...formData, title: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="videocam"
      />

      <CustomTextInput
        label="Description"
        value={formData.description}
        onChangeText={t => setFormData({ ...formData, description: t })}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={3}
        leftIcon="description"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Category</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert(
                'Select Category',
                'Choose the live class category',
                [
                  { text: 'Mathematics', onPress: () => setFormData({ ...formData, category: 'mathematics' }) },
                  { text: 'Physics', onPress: () => setFormData({ ...formData, category: 'physics' }) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.pickerText}>{formData.category || 'Select Category'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomTextInput
        label="Subject"
        value={formData.subject}
        onChangeText={t => setFormData({ ...formData, subject: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="menu-book"
      />

      <CustomTextInput
        label="Grade"
        value={formData.grade}
        onChangeText={t => setFormData({ ...formData, grade: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="grade"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Level</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert(
                'Select Level',
                'Choose the live class level',
                [
                  { text: 'Beginner', onPress: () => setFormData({ ...formData, level: 'beginner' }) },
                  { text: 'Intermediate', onPress: () => setFormData({ ...formData, level: 'intermediate' }) },
                  { text: 'Advanced', onPress: () => setFormData({ ...formData, level: 'advanced' }) },
                  { text: 'Expert', onPress: () => setFormData({ ...formData, level: 'expert' }) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.pickerText}>{formData.level || 'Select Level'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      <CustomTextInput
        label="Duration (minutes)"
        value={formData.duration}
        onChangeText={handleDurationChange}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="access-time"
      />

      {/* Scheduled Date and Time - Separate Sections */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Scheduled Date & Time</Text>
        
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              onPress={() => {
                closeAllPickers();
                setShowScheduledDatePicker(true);
              }} 
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateText}>
                {formData.scheduledAt ? formData.scheduledAt.toLocaleDateString() : 'Select Date'}
              </Text>
            </TouchableOpacity>
            {showScheduledDatePicker && (
              <DateTimePicker 
                value={formData.scheduledAt || new Date()} 
                mode="date" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={handleScheduledDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity 
              onPress={() => {
                closeAllPickers();
                setShowScheduledTimePicker(true);
              }} 
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateText}>
                {formData.scheduledAt ? formData.scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
              </Text>
            </TouchableOpacity>
            {showScheduledTimePicker && (
              <DateTimePicker 
                value={formData.scheduledAt || new Date()} 
                mode="time" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={handleScheduledTimeChange}
              />
            )}
          </View>
        </View>
      </View>

      {/* Start Date and Time - Separate Sections */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Start Date & Time</Text>
        
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              onPress={() => {
                closeAllPickers();
                setShowStartDatePicker(true);
              }} 
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateText}>
                {formData.startTime ? formData.startTime.toLocaleDateString() : 'Select Date'}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker 
                value={formData.startTime || new Date()} 
                mode="date" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity 
              onPress={() => {
                closeAllPickers();
                setShowStartTimePicker(true);
              }} 
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateText}>
                {formData.startTime ? formData.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
              </Text>
            </TouchableOpacity>
            {showStartTimePicker && (
              <DateTimePicker 
                value={formData.startTime || new Date()} 
                mode="time" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={handleStartTimeChange}
              />
            )}
          </View>
        </View>
      </View>

      {/* End Date and Time - Separate Sections */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>End Date & Time</Text>
        
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity 
              onPress={() => {
                closeAllPickers();
                setShowEndDatePicker(true);
              }} 
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateText}>
                {formData.endTime ? formData.endTime.toLocaleDateString() : 'Select Date'}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker 
                value={formData.endTime || new Date()} 
                mode="date" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={handleEndDateChange}
                minimumDate={formData.startTime || new Date()}
              />
            )}
          </View>

          <View style={styles.dateTimeColumn}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity 
              onPress={() => {
                closeAllPickers();
                setShowEndTimePicker(true);
              }} 
              style={styles.dateTimeButton}
            >
              <Text style={styles.dateText}>
                {formData.endTime ? formData.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
              </Text>
            </TouchableOpacity>
            {showEndTimePicker && (
              <DateTimePicker 
                value={formData.endTime || new Date()} 
                mode="time" 
                display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                onChange={handleEndTimeChange}
              />
            )}
          </View>
        </View>
      </View>

      <CustomTextInput
        label="Max Students"
        value={formData.maxStudents}
        onChangeText={t => setFormData({ ...formData, maxStudents: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="people"
      />

      <CustomTextInput
        label="Meeting Link"
        value={formData.meetingLink}
        onChangeText={t => setFormData({ ...formData, meetingLink: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="link"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Status</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert(
                'Select Status',
                'Choose the live class status',
                [
                  { text: 'Scheduled', onPress: () => setFormData({ ...formData, status: 'scheduled' }) },
                  { text: 'Live', onPress: () => setFormData({ ...formData, status: 'live' }) },
                  { text: 'Completed', onPress: () => setFormData({ ...formData, status: 'completed' }) },
                  { text: 'Cancelled', onPress: () => setFormData({ ...formData, status: 'cancelled' }) },
                  { text: 'Postponed', onPress: () => setFormData({ ...formData, status: 'postponed' }) },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.pickerText}>{formData.status || 'Select Status'}</Text>
            <Text style={styles.pickerArrow}>▼</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>{formData.image ? "Change Image" : "Upload Image"}</Text>
      </TouchableOpacity>

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity 
            style={[styles.cancelButton, { marginRight: 10 }]} 
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { flex: onCancel ? 1 : undefined }
          ]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {liveClassId ? "Update Live Class" : "Create Live Class"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginTop: 5 },
  button: { backgroundColor: "#007bff", padding: 10, marginTop: 15, borderRadius: 5, alignItems: "center" },
  buttonText: { color: "#fff" },
  buttonRow: { 
    flexDirection: 'row', 
    marginTop: 20,
    justifyContent: 'space-between'
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    flex: 1
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "bold"
  },
  submitButton: { 
    backgroundColor: "green", 
    padding: 15, 
    borderRadius: 5, 
    alignItems: "center",
    flex: 1
  },
  submitText: { color: "#fff", fontWeight: "bold" },
  pickerContainer: { marginTop: 10 },
  pickerLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  pickerWrapper: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, backgroundColor: "#f9f9f9" },
  pickerButton: { padding: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText: { fontSize: 16, color: "#333" },
  pickerArrow: { fontSize: 12, color: "#666" },
  dateText: { fontSize: 16, color: "#333", paddingVertical: 5 },
  sectionContainer: {
    marginTop: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  dateTimeColumn: {
    flex: 1,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 5,
    backgroundColor: "#fff",
    minHeight: 45,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default LiveClassForm;
