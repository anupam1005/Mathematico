// src/admin/screens/CourseForm.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { adminService } from "../../services/adminService";
import { designSystem, formStyles, layoutStyles } from "../../styles/designSystem";

interface CourseFormProps {
  courseId?: string;
  onSuccess?: () => void;
}

export default function CourseForm({ courseId, onSuccess }: CourseFormProps) {
  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    level: "",
    category: "",
    subject: "",
    grade: "",
    status: "draft",
    students: "",
    image: null,
    pdf: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseId) {
      setLoading(true);
      adminService.getAllCourses().then((res: any) => {
        const course = res.data?.find((c: any) => c.id === courseId);
        if (course) {
          setFormData({
            ...course,
            price: course.price?.toString(),
            originalPrice: course.originalPrice?.toString(),
            students: course.students?.toString(),
            image: null,
            pdf: null,
          });
        }
      }).finally(() => setLoading(false));
    }
  }, [courseId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setFormData({ ...formData, image: result.assets[0] });
  };

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, pdf: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    console.log('CourseForm: Submit button clicked');
    console.log('CourseForm: Form data:', formData);
    
    // Enhanced validation
    const requiredFields = ['title', 'description', 'price', 'level', 'category', 'subject', 'grade'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      console.log('CourseForm: Validation failed - missing required fields:', missingFields);
      return Alert.alert("Error", `Please fill all required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate price is a number
    if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      return Alert.alert("Error", "Price must be a valid number");
    }
    
    // Validate students is a number if provided
    if (formData.students && (isNaN(Number(formData.students)) || Number(formData.students) < 0)) {
      return Alert.alert("Error", "Students count must be a valid number");
    }

    setLoading(true);
    try {
      console.log('CourseForm: Creating FormData...');
      const data = new FormData();
      
      // Prepare the data object with proper formatting
      const processedData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
        level: formData.level,
        category: formData.category,
        subject: formData.subject.trim(),
        grade: formData.grade.trim(),
        status: formData.status || 'draft',
        students: formData.students ? Number(formData.students) : 0,
        isAvailable: true
      };
      
      console.log('CourseForm: Processed data:', processedData);
      
      // Add all fields to FormData
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value.toString());
        }
      });
      
      // Handle image upload
      if (formData.image && typeof formData.image === 'object' && 'uri' in formData.image) {
        if (formData.image.uri) {
          data.append("image", { uri: formData.image.uri, type: "image/jpeg", name: "course.jpg" } as any);
        }
      }
      
      // Handle PDF upload
      if (formData.pdf && typeof formData.pdf === 'object' && 'uri' in formData.pdf) {
        if (formData.pdf.uri) {
          data.append("pdf", { uri: formData.pdf.uri, type: "application/pdf", name: ('name' in formData.pdf ? formData.pdf.name : "course.pdf") || "course.pdf" } as any);
        }
      }

      console.log('CourseForm: FormData created, submitting...');
      
      if (courseId) {
        console.log('CourseForm: Updating course with ID:', courseId);
        const result = await adminService.updateCourse(courseId, data);
        console.log('CourseForm: Update result:', result);
        if (result.success) {
          Alert.alert("Success", "Course updated successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to update course");
        }
      } else {
        console.log('CourseForm: Creating new course...');
        const result = await adminService.createCourse(data);
        console.log('CourseForm: Create result:', result);
        if (result.success) {
          Alert.alert("Success", "Course created successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to create course");
        }
      }
      onSuccess?.();
    } catch (err: any) {
      console.error('CourseForm: Error during submission:', err);
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

      <Text style={styles.label}>Price</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={formData.price} onChangeText={t => setFormData({ ...formData, price: t })} />

      <Text style={styles.label}>Original Price</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={formData.originalPrice} onChangeText={t => setFormData({ ...formData, originalPrice: t })} />

      <Text style={styles.label}>Level</Text>
      <TextInput style={styles.input} value={formData.level} onChangeText={t => setFormData({ ...formData, level: t })} />

      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={formData.category} onChangeText={t => setFormData({ ...formData, category: t })} />

      <Text style={styles.label}>Subject</Text>
      <TextInput style={styles.input} value={formData.subject} onChangeText={t => setFormData({ ...formData, subject: t })} />

      <Text style={styles.label}>Grade</Text>
      <TextInput style={styles.input} value={formData.grade} onChangeText={t => setFormData({ ...formData, grade: t })} />

      <Text style={styles.label}>Status</Text>
      <TextInput style={styles.input} value={formData.status} onChangeText={t => setFormData({ ...formData, status: t })} />

      <Text style={styles.label}>Students</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={formData.students} onChangeText={t => setFormData({ ...formData, students: t })} />

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>{formData.image ? "Change Image" : "Upload Image"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={pickPDF}>
        <Text style={styles.buttonText}>{formData.pdf ? "Change PDF" : "Upload PDF"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{courseId ? "Update Course" : "Create Course"}</Text>}
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
