// src/admin/screens/LiveClassForm.tsx
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { adminService } from "../../services/adminService";
import { CustomTextInput } from "../../components/CustomTextInput";

interface LiveClassFormProps {
  liveClassId?: string;
  onSuccess?: () => void;
}

export default function LiveClassForm({ liveClassId, onSuccess }: LiveClassFormProps) {
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    category: "",
    subject: "",
    grade: "",
    level: "",
    duration: "",
    maxStudents: "",
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    scheduledAt: new Date(),
    status: "scheduled",
    meetingLink: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showScheduledPicker, setShowScheduledPicker] = useState(false);

  // Function to safely close pickers
  const closeAllPickers = () => {
    setShowStartTimePicker(false);
    setShowEndTimePicker(false);
    setShowScheduledPicker(false);
  };

  // Function to safely open picker with timeout
  const openPicker = (pickerType: 'start' | 'end' | 'scheduled') => {
    closeAllPickers(); // Close any open pickers first
    
    setTimeout(() => {
      switch (pickerType) {
        case 'start':
          setShowStartTimePicker(true);
          break;
        case 'end':
          setShowEndTimePicker(true);
          break;
        case 'scheduled':
          setShowScheduledPicker(true);
          break;
      }
    }, 100);
  };

  useEffect(() => {
    if (liveClassId) {
      setLoading(true);
      adminService.getAllLiveClasses().then((res: any) => {
        const liveClass = res.data?.find((c: any) => c.id === liveClassId);
        if (liveClass) {
          setFormData({
            ...liveClass,
            duration: liveClass.duration?.toString(),
            maxStudents: liveClass.maxStudents?.toString(),
            scheduledAt: liveClass.scheduledAt ? new Date(liveClass.scheduledAt) : new Date(),
            image: null,
          });
        }
      }).finally(() => setLoading(false));
    }
  }, [liveClassId]);

  // Cleanup effect to close any open pickers
  useEffect(() => {
    return () => {
      closeAllPickers();
    };
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setFormData({ ...formData, image: result.assets[0] });
  };

  const handleStartTimeChange = (event: any, date?: Date) => {
    try {
      setShowStartTimePicker(false);
      
      if (event.type === 'dismissed' || event.type === 'cancel') {
        return;
      }
      
      if (date) {
        const newFormData = { ...formData, startTime: date };
        // Calculate end time based on start time + duration
        if (formData.duration) {
          const endTime = new Date(date.getTime() + (Number(formData.duration) * 60000));
          newFormData.endTime = endTime;
        }
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error in handleStartTimeChange:', error);
      setShowStartTimePicker(false);
    }
  };

  const handleEndTimeChange = (event: any, date?: Date) => {
    try {
      setShowEndTimePicker(false);
      
      if (event.type === 'dismissed' || event.type === 'cancel') {
        return;
      }
      
      if (date) {
        setFormData({ ...formData, endTime: date });
      }
    } catch (error) {
      console.error('Error in handleEndTimeChange:', error);
      setShowEndTimePicker(false);
    }
  };

  const handleScheduledChange = (event: any, date?: Date) => {
    try {
      setShowScheduledPicker(false);
      
      if (event.type === 'dismissed' || event.type === 'cancel') {
        return;
      }
      
      if (date) {
        setFormData({ ...formData, scheduledAt: date });
      }
    } catch (error) {
      console.error('Error in handleScheduledChange:', error);
      setShowScheduledPicker(false);
    }
  };

  const handleDurationChange = (duration: string) => {
    setFormData({ ...formData, duration });
    // Recalculate end time when duration changes
    if (formData.startTime && duration) {
      const endTime = new Date(formData.startTime.getTime() + (Number(duration) * 60000));
      setFormData((prev: typeof formData) => ({ ...prev, duration, endTime }));
    }
  };

  const handleSubmit = async () => {
    console.log('LiveClassForm: Submit button clicked');
    console.log('LiveClassForm: Form data:', formData);
    
    // Enhanced validation
    const requiredFields = ['title', 'description', 'category', 'subject', 'grade', 'level', 'duration', 'maxStudents', 'meetingLink'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
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

    // Validate start and end times
    if (formData.endTime <= formData.startTime) {
      return Alert.alert("Error", "End time must be after start time");
    }

    setLoading(true);
    try {
      console.log('LiveClassForm: Creating FormData...');
      const data = new FormData();
      
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
        endTime: formData.endTime.toISOString(),
        scheduledAt: formData.scheduledAt.toISOString(),
        meetingLink: formData.meetingLink.trim(),
        status: formData.status || 'scheduled',
        isAvailable: true
      };
      
      console.log('LiveClassForm: Processed data:', processedData);
      
      // Add all fields to FormData
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }
      });
      
      // Handle image upload
      if (formData.image && typeof formData.image === 'object' && 'uri' in formData.image) {
        if (formData.image.uri) {
          data.append("image", { uri: formData.image.uri, type: "image/jpeg", name: "liveclass.jpg" } as any);
        }
      }

      console.log('LiveClassForm: FormData created, submitting...');
      
      if (liveClassId) {
        console.log('LiveClassForm: Updating live class with ID:', liveClassId);
        const result = await adminService.updateLiveClass(liveClassId, data);
        console.log('LiveClassForm: Update result:', result);
        if (result.success) {
          Alert.alert("Success", "Live class updated successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to update live class");
        }
      } else {
        console.log('LiveClassForm: Creating new live class...');
        const result = await adminService.createLiveClass(data);
        console.log('LiveClassForm: Create result:', result);
        if (result.success) {
          Alert.alert("Success", "Live class created successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to create live class");
        }
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('LiveClassForm: Error during submission:', err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
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

      <Text style={styles.label}>Start Time</Text>
      <TouchableOpacity onPress={() => openPicker('start')} style={styles.input}>
        <Text style={styles.dateText}>
          {formData.startTime ? formData.startTime.toLocaleString() : 'Select Start Time'}
        </Text>
      </TouchableOpacity>
      {showStartTimePicker && (
        <DateTimePicker 
          value={formData.startTime || new Date()} 
          mode="datetime" 
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
          onChange={handleStartTimeChange}
          minimumDate={new Date()}
        />
      )}

      <Text style={styles.label}>End Time</Text>
      <TouchableOpacity onPress={() => openPicker('end')} style={styles.input}>
        <Text style={styles.dateText}>
          {formData.endTime ? formData.endTime.toLocaleString() : 'Select End Time'}
        </Text>
      </TouchableOpacity>
      {showEndTimePicker && (
        <DateTimePicker 
          value={formData.endTime || new Date()} 
          mode="datetime" 
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
          onChange={handleEndTimeChange}
          minimumDate={formData.startTime || new Date()}
        />
      )}

      <CustomTextInput
        label="Max Students"
        value={formData.maxStudents}
        onChangeText={t => setFormData({ ...formData, maxStudents: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="people"
      />

      <Text style={styles.label}>Scheduled At</Text>
      <TouchableOpacity onPress={() => openPicker('scheduled')} style={styles.input}>
        <Text style={styles.dateText}>
          {formData.scheduledAt ? formData.scheduledAt.toLocaleString() : 'Select Scheduled Time'}
        </Text>
      </TouchableOpacity>
      {showScheduledPicker && (
        <DateTimePicker 
          value={formData.scheduledAt || new Date()} 
          mode="datetime" 
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
          onChange={handleScheduledChange}
          minimumDate={new Date()}
        />
      )}

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

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{liveClassId ? "Update Live Class" : "Create Live Class"}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  label: { fontSize: 16, fontWeight: "bold", marginTop: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 5, marginTop: 5 },
  button: { backgroundColor: "#007bff", padding: 10, marginTop: 15, borderRadius: 5, alignItems: "center" },
  buttonText: { color: "#fff" },
  submitButton: { backgroundColor: "green", padding: 15, marginTop: 20, borderRadius: 5, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "bold" },
  pickerContainer: { marginTop: 10 },
  pickerLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  pickerWrapper: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, backgroundColor: "#f9f9f9" },
  pickerButton: { padding: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerText: { fontSize: 16, color: "#333" },
  pickerArrow: { fontSize: 12, color: "#666" },
  dateText: { fontSize: 16, color: "#333", paddingVertical: 5 },
});
