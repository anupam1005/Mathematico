// src/admin/screens/LiveClassForm.tsx
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
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
    endTime: new Date(),
    scheduledAt: new Date(),
    status: "scheduled",
    meetingLink: "",
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setFormData({ ...formData, image: result.assets[0] });
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) setFormData({ ...formData, scheduledAt: date });
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
    
    // Validate duration and maxStudents are numbers
    if (isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
      return Alert.alert("Error", "Duration must be a positive number");
    }
    
    if (isNaN(Number(formData.maxStudents)) || Number(formData.maxStudents) <= 0) {
      return Alert.alert("Error", "Max Students must be a positive number");
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
        startTime: formData.scheduledAt.toISOString(),
        endTime: new Date(formData.scheduledAt.getTime() + (Number(formData.duration) * 60000)).toISOString(),
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

      <CustomTextInput
        label="Category"
        value={formData.category}
        onChangeText={t => setFormData({ ...formData, category: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="folder"
      />

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

      <CustomTextInput
        label="Level"
        value={formData.level}
        onChangeText={t => setFormData({ ...formData, level: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="grade"
      />

      <CustomTextInput
        label="Duration (minutes)"
        value={formData.duration}
        onChangeText={t => setFormData({ ...formData, duration: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="access-time"
      />

      <Text style={styles.label}>Start Time</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{formData.startTime.toLocaleString()}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>End Time</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{formData.endTime.toLocaleString()}</Text>
      </TouchableOpacity>

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
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{formData.scheduledAt.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDatePicker && <DateTimePicker value={formData.scheduledAt} mode="datetime" display="default" onChange={handleDateChange} />}

      <CustomTextInput
        label="Meeting Link"
        value={formData.meetingLink}
        onChangeText={t => setFormData({ ...formData, meetingLink: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="link"
      />

      <CustomTextInput
        label="Status"
        value={formData.status}
        onChangeText={t => setFormData({ ...formData, status: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="info"
      />

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
});
