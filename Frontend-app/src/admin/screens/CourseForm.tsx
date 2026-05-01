// src/admin/screens/CourseForm.tsx
import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { adminService } from "../../services/adminService";
import { CustomTextInput } from "../../components/CustomTextInput";
import { safeCatch } from '../../utils/safeCatch';

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
    maxStudents: "",
    duration: "",
    instructorName: "",
    image: null,
    pdf: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (courseId) {
      setLoading(true);
      adminService.getAllCourses().then((res: any) => {
        const coursesArray = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const course = coursesArray.find((c: any) => c.id === courseId || c._id === courseId || c.Id === courseId);
        if (course) {
          setFormData({
            ...course,
            price: course.price?.toString(),
            originalPrice: course.originalPrice?.toString(),
            maxStudents: course.maxStudents?.toString(),
            image: null,
            pdf: null,
          });
        }
      }).catch((error: any) => {
        safeCatch('CourseForm.loadCourse')(error);
      }).finally(() => setLoading(false));
    }
  }, [courseId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['image'] as any, quality: 0.7 });
    if (!result.canceled) setFormData({ ...formData, image: result.assets[0] });
  };

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, pdf: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    
    // Enhanced validation
    const requiredFields = ['title', 'description', 'price', 'level', 'category', 'subject', 'grade', 'duration', 'instructorName'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      return Alert.alert("Error", `Please fill all required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate enum values
    const validCategories = ['mathematics', 'physics'];
    const validLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const validStatuses = ['draft', 'published', 'archived', 'suspended'];
    
    if (!validCategories.includes(formData.category)) {
      return Alert.alert("Error", "Please select a valid category from the dropdown");
    }
    
    if (!validLevels.includes(formData.level)) {
      return Alert.alert("Error", "Please select a valid level from the dropdown");
    }
    
    if (formData.status && !validStatuses.includes(formData.status)) {
      return Alert.alert("Error", "Please select a valid status from the dropdown");
    }
    
    // Validate price is a number
    const price = Number(formData.price);
    if (isNaN(price) || price < 0) {
      return Alert.alert("Error", "Price must be a valid positive number");
    }
    
    // Validate original price is a number if provided
    if (formData.originalPrice && (isNaN(Number(formData.originalPrice)) || Number(formData.originalPrice) < 0)) {
      return Alert.alert("Error", "Original price must be a valid positive number");
    }
    
    // Validate maxStudents is a number if provided
    if (formData.maxStudents && (isNaN(Number(formData.maxStudents)) || Number(formData.maxStudents) < 0)) {
      return Alert.alert("Error", "Max students count must be a valid positive number");
    }
    
    // Validate duration is a number
    if (isNaN(Number(formData.duration)) || Number(formData.duration) < 1) {
      return Alert.alert("Error", "Duration must be at least 1 hour");
    }

    setLoading(true);
    try {
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
        maxStudents: formData.maxStudents ? Number(formData.maxStudents) : null,
        duration: Number(formData.duration),
        instructor: {
          name: formData.instructorName.trim()
        },
        isAvailable: true
      };
      
      
      // Add all fields to FormData
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (key === 'instructor' && typeof value === 'object') {
            // Handle instructor object specially
            data.append('instructorName', value.name);
          } else {
            data.append(key, value.toString());
          }
        }
      });
      
      // Handle image upload (as thumbnail)
      if (formData.image && typeof formData.image === 'object' && 'uri' in formData.image) {
        if (formData.image.uri) {
          let mimeType = formData.image.mimeType || formData.image.type || "image/jpeg";
          if (mimeType === "image" || mimeType === "success") mimeType = "image/jpeg";
          
          data.append("image", { 
            uri: formData.image.uri, 
            type: mimeType, 
            name: formData.image.fileName || formData.image.name || "course.jpg" 
          } as any);
        }
      }
      
      // Handle PDF upload
      if (formData.pdf && typeof formData.pdf === 'object' && 'uri' in formData.pdf) {
        if (formData.pdf.uri) {
          let mimeType = formData.pdf.mimeType || formData.pdf.type || "application/pdf";
          if (mimeType === "success") mimeType = "application/pdf";
          
          data.append("pdf", { 
            uri: formData.pdf.uri, 
            type: mimeType, 
            name: formData.pdf.fileName || formData.pdf.name || "course.pdf" 
          } as any);
        }
      }

      
      if (courseId) {
        const result = await adminService.updateCourse(courseId, data);
        if (result.success) {
          Alert.alert("Success", "Course updated successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to update course");
        }
      } else {
        const result = await adminService.createCourse(data);
        if (result.success) {
          Alert.alert("Success", "Course created successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to create course");
        }
      }
      onSuccess?.();
    } catch (err: any) {
      safeCatch('CourseForm.handleSubmit', (safeError) => {
        Alert.alert("Error", safeError.message || "Something went wrong");
      })(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <CustomTextInput
        label="Title"
        value={formData.title}
        onChangeText={t => setFormData({ ...formData, title: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="school"
      />

      <CustomTextInput
        label="Description"
        value={formData.description}
        onChangeText={t => setFormData({ ...formData, description: t })}
        style={styles.input}
        mode="outlined"
        multiline
        numberOfLines={3}
        leftIcon="text-box-outline"
      />

      <CustomTextInput
        label="Price"
        value={formData.price}
        onChangeText={t => setFormData({ ...formData, price: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="currency-usd"
      />

      <CustomTextInput
        label="Original Price"
        value={formData.originalPrice}
        onChangeText={t => setFormData({ ...formData, originalPrice: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="currency-usd"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Level</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert(
                'Select Level',
                'Choose the course level',
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

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Category</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert(
                'Select Category',
                'Choose the course category',
                [
                  { text: 'Mathematics', onPress: () => setFormData({ ...formData, category: 'mathematics' }) },
                  { text: 'Physics', onPress: () => setFormData({ ...formData, category: 'physics' }) },
                  { text: 'Chemistry', onPress: () => setFormData({ ...formData, category: 'chemistry' }) },
                  { text: 'Biology', onPress: () => setFormData({ ...formData, category: 'biology' }) },
                  { text: 'Computer Science', onPress: () => setFormData({ ...formData, category: 'computer_science' }) },
                  { text: 'Engineering', onPress: () => setFormData({ ...formData, category: 'engineering' }) },
                  { text: 'Science', onPress: () => setFormData({ ...formData, category: 'science' }) },
                  { text: 'General', onPress: () => setFormData({ ...formData, category: 'general' }) },
                  { text: 'Preparation', onPress: () => setFormData({ ...formData, category: 'preparation' }) },
                  { text: 'Remedial', onPress: () => setFormData({ ...formData, category: 'remedial' }) },
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
        leftIcon="book-open-variant"
      />

      <CustomTextInput
        label="Grade"
        value={formData.grade}
        onChangeText={t => setFormData({ ...formData, grade: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="star-outline"
      />

      <CustomTextInput
        label="Duration (hours)"
        value={formData.duration}
        onChangeText={t => setFormData({ ...formData, duration: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="clock-outline"
      />

      <CustomTextInput
        label="Instructor Name"
        value={formData.instructorName}
        onChangeText={t => setFormData({ ...formData, instructorName: t })}
        style={styles.input}
        mode="outlined"
        // Use a valid MaterialCommunityIcons icon name
        leftIcon="account"
      />

      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Status</Text>
        <View style={styles.pickerWrapper}>
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => {
              Alert.alert(
                'Select Status',
                'Choose the course status',
                [
                  { text: 'Draft', onPress: () => setFormData({ ...formData, status: 'draft' }) },
                  { text: 'Published', onPress: () => setFormData({ ...formData, status: 'published' }) },
                  { text: 'Archived', onPress: () => setFormData({ ...formData, status: 'archived' }) },
                  { text: 'Suspended', onPress: () => setFormData({ ...formData, status: 'suspended' }) },
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

      <CustomTextInput
        label="Max Students"
        value={formData.maxStudents}
        onChangeText={t => setFormData({ ...formData, maxStudents: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="account-group"
      />

      <View style={styles.imageSection}>
        <Text style={styles.pickerLabel}>Thumbnail Image</Text>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>{formData.image ? "Change Thumbnail" : "Upload Thumbnail"}</Text>
        </TouchableOpacity>
        
        {formData.image && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewLabel}>Preview:</Text>
            <Image 
              source={{ uri: typeof formData.image === 'string' ? formData.image : formData.image.uri }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setFormData({ ...formData, image: null })}
            >
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.pdfSection}>
        <Text style={styles.pickerLabel}>Course PDF</Text>
        <TouchableOpacity style={styles.button} onPress={pickPDF}>
          <Text style={styles.buttonText}>{formData.pdf ? "Change PDF" : "Upload PDF"}</Text>
        </TouchableOpacity>
        {formData.pdf && (
          <View style={styles.pdfInfoContainer}>
            <Text style={styles.pdfInfoText}>✓ PDF Selected: {typeof formData.pdf === 'object' && 'name' in formData.pdf ? formData.pdf.name : 'course.pdf'}</Text>
            <TouchableOpacity 
              style={styles.removePdfButton}
              onPress={() => setFormData({ ...formData, pdf: null })}
            >
              <Text style={styles.removePdfText}>Remove PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{courseId ? "Update Course" : "Create Course"}</Text>}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
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
  imageSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  imagePreviewContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePreviewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  removeImageButton: {
    marginTop: 10,
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pdfSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  pdfInfoContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  pdfInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: 8,
  },
  removePdfButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  removePdfText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
