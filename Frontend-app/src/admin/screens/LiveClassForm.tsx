// src/admin/screens/LiveClassForm.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { adminService } from "../../services/adminService";

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
    status: "draft",
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
    if (!formData.title || !formData.meetingLink || !formData.duration || !formData.maxStudents) {
      return Alert.alert("Error", "Please fill all required fields (Title, Meeting Link, Duration, Max Students).");
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value != null) {
          if (key === "image" && value && typeof value === 'object' && 'uri' in value) {
            if (value.uri) data.append("image", { uri: value.uri, type: "image/jpeg", name: "liveclass.jpg" } as any);
          } else if (key === "scheduledAt" && value instanceof Date) {
            data.append(key, value.toISOString());
          } else {
            data.append(key, value.toString());
          }
        }
      });

      if (liveClassId) {
        await adminService.updateLiveClass(liveClassId, data);
        Alert.alert("Success", "Live class updated successfully");
      } else {
        await adminService.createLiveClass(data);
        Alert.alert("Success", "Live class created successfully");
      }
      onSuccess?.();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData({ ...formData, title: t })} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 80 }]} multiline value={formData.description} onChangeText={t => setFormData({ ...formData, description: t })} />

      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={formData.category} onChangeText={t => setFormData({ ...formData, category: t })} />

      <Text style={styles.label}>Subject</Text>
      <TextInput style={styles.input} value={formData.subject} onChangeText={t => setFormData({ ...formData, subject: t })} />

      <Text style={styles.label}>Grade</Text>
      <TextInput style={styles.input} value={formData.grade} onChangeText={t => setFormData({ ...formData, grade: t })} />

      <Text style={styles.label}>Level</Text>
      <TextInput style={styles.input} value={formData.level} onChangeText={t => setFormData({ ...formData, level: t })} />

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={formData.duration} onChangeText={t => setFormData({ ...formData, duration: t })} />

      <Text style={styles.label}>Start Time</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{formData.startTime.toLocaleString()}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>End Time</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{formData.endTime.toLocaleString()}</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Max Students</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={formData.maxStudents} onChangeText={t => setFormData({ ...formData, maxStudents: t })} />

      <Text style={styles.label}>Scheduled At</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
        <Text>{formData.scheduledAt.toLocaleString()}</Text>
      </TouchableOpacity>
      {showDatePicker && <DateTimePicker value={formData.scheduledAt} mode="datetime" display="default" onChange={handleDateChange} />}

      <Text style={styles.label}>Meeting Link</Text>
      <TextInput style={styles.input} value={formData.meetingLink} onChangeText={t => setFormData({ ...formData, meetingLink: t })} />

      <Text style={styles.label}>Status</Text>
      <TextInput style={styles.input} value={formData.status} onChangeText={t => setFormData({ ...formData, status: t })} />

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
