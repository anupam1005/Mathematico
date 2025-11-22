// src/admin/screens/BookForm.tsx
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { adminService } from "../../services/adminService";
import authService from "../../services/authService";
import { CustomTextInput } from "../../components/CustomTextInput";
import { designSystem, formStyles, layoutStyles } from "../../styles/designSystem";
import { Logger } from '../../utils/errorHandler';

interface BookFormProps {
  bookId?: string;
  isEditing?: boolean;
  onSuccess?: () => void;
  navigation?: any;
}

export default function BookForm({ bookId, isEditing, onSuccess, navigation }: BookFormProps) {
  const [formData, setFormData] = useState<any>({
    title: "",
    author: "",
    description: "",
    category: "",
    subject: "",
    grade: "",
    pages: "",
    isbn: "",
    status: "draft",
    coverImage: null,
    pdfFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (bookId && isEditing) {
      setLoading(true);
      // For fallback mode, we'll use a simple approach
      // In a real app, you'd call getBookById
      try {
        adminService.getAllBooks().then((res: any) => {
          const book = res.data?.find((b: any) => {
            const currentBookId = b.id || b._id || b.Id;
            return currentBookId === bookId;
          });
          if (book) {
            setFormData({
              title: book.title || "",
              author: book.author || "",
              description: book.description || "",
              category: book.category || "",
              subject: book.subject || "",
              grade: book.grade || "",
              pages: book.pages?.toString() || "",
              isbn: book.isbn || "",
              status: book.status || "draft",
              coverImage: null,
              pdfFile: null,
            });
          }
        }).catch((error) => {
          Logger.error('Error loading book:', error);
        }).finally(() => setLoading(false));
      } catch (error) {
        Logger.error('Error in useEffect:', error);
        setLoading(false);
      }
    }
  }, [bookId, isEditing]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!result.canceled) setFormData({ ...formData, coverImage: result.assets[0] });
  };

  const pickPDF = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData({ ...formData, pdfFile: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    console.log('📚 BookForm: Submit button clicked');
    console.log('📚 BookForm: Form data:', formData);
    
    // Enhanced validation
    const requiredFields = ['title', 'author', 'category', 'subject', 'grade'];
    const missingFields = requiredFields.filter(field => !formData[field] || formData[field].toString().trim() === '');
    
    if (missingFields.length > 0) {
      console.log('📚 BookForm: Validation failed - missing required fields:', missingFields);
      return Alert.alert("Error", `Please fill all required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate pages is a number if provided
    if (formData.pages && (isNaN(Number(formData.pages)) || Number(formData.pages) <= 0)) {
      return Alert.alert("Error", "Pages must be a valid positive number");
    }

    setLoading(true);
    setUploadProgress(0);
    
    try {
      console.log('📚 BookForm: Starting book creation process...');
      
      console.log('📚 BookForm: Creating FormData...');
      const data = new FormData();
      
      // Prepare the data object with proper formatting
      const processedData: any = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        description: formData.description?.trim() || "",
        category: formData.category || "general",
        subject: formData.subject?.trim() || "Mathematics",
        grade: formData.grade?.trim() || "Class 9",
        pages: formData.pages ? Number(formData.pages) : 1,
        status: formData.status || "draft",
        level: formData.level || "Foundation",
        isAvailable: true
      };
      
      // Only include ISBN if it has a value (avoid duplicate key error with empty strings)
      const trimmedIsbn = formData.isbn?.trim() || "";
      if (trimmedIsbn) {
        processedData.isbn = trimmedIsbn;
      }
      
      console.log('📚 BookForm: Processed data:', processedData);
      
      // Add all fields to FormData
      Object.entries(processedData).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          data.append(key, value.toString());
        }
      });
      
      // Handle cover image upload
      if (formData.coverImage && typeof formData.coverImage === 'object' && 'uri' in formData.coverImage) {
        if (formData.coverImage.uri) {
          data.append("coverImage", { uri: formData.coverImage.uri, type: "image/jpeg", name: "cover.jpg" } as any);
        }
      }
      
      // Handle PDF file upload
      if (formData.pdfFile && typeof formData.pdfFile === 'object' && 'uri' in formData.pdfFile) {
        if (formData.pdfFile.uri) {
          data.append("pdfFile", { uri: formData.pdfFile.uri, type: "application/pdf", name: formData.pdfFile.name || "book.pdf" } as any);
        }
      }

      console.log('📚 BookForm: FormData created, submitting...');
      
      if (bookId && isEditing) {
        console.log('📚 BookForm: Updating existing book...');
        const result = await adminService.updateBook(bookId, data);
        console.log('📚 BookForm: Update result:', result);
        if (result.success) {
          Alert.alert("Success", "Book updated successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to update book");
        }
      } else {
        console.log('📚 BookForm: Creating new book...');
        const result = await adminService.createBook(data);
        console.log('📚 BookForm: Create result:', result);
        if (result.success) {
          Alert.alert("Success", "Book created successfully");
        } else {
          Alert.alert("Error", result.error || "Failed to create book");
        }
      }
      
      onSuccess?.();
    } catch (err: any) {
      Logger.error('📚 BookForm: Error during submission:', err);
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
        leftIcon="book"
      />

      <CustomTextInput
        label="Author"
        value={formData.author}
        onChangeText={t => setFormData({ ...formData, author: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="person"
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
        leftIcon="school"
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
        label="Pages"
        value={formData.pages}
        onChangeText={t => setFormData({ ...formData, pages: t })}
        style={styles.input}
        mode="outlined"
        keyboardType="numeric"
        leftIcon="description"
      />

      <CustomTextInput
        label="ISBN"
        value={formData.isbn}
        onChangeText={t => setFormData({ ...formData, isbn: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="tag"
      />

      <CustomTextInput
        label="Status"
        value={formData.status}
        onChangeText={t => setFormData({ ...formData, status: t })}
        style={styles.input}
        mode="outlined"
        leftIcon="info"
      />

      <View style={styles.imageSection}>
        <Text style={styles.sectionLabel}>Cover Image</Text>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>{formData.coverImage ? "Change Cover Image" : "Upload Cover Image"}</Text>
        </TouchableOpacity>
        
        {formData.coverImage && (
          <View style={styles.imagePreviewContainer}>
            <Text style={styles.imagePreviewLabel}>Preview:</Text>
            <Image 
              source={{ uri: typeof formData.coverImage === 'string' ? formData.coverImage : formData.coverImage.uri }} 
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setFormData({ ...formData, coverImage: null })}
            >
              <Text style={styles.removeImageText}>Remove Image</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.pdfSection}>
        <Text style={styles.sectionLabel}>Book PDF</Text>
        <TouchableOpacity style={styles.button} onPress={pickPDF}>
          <Text style={styles.buttonText}>{formData.pdfFile ? "Change PDF File" : "Upload PDF File"}</Text>
        </TouchableOpacity>
        
        {formData.pdfFile && (
          <View style={styles.pdfInfoContainer}>
            <Text style={styles.pdfInfoText}>
              ✓ PDF File: {formData.pdfFile.name || 'book.pdf'}
              {formData.pdfFile.size && ` (${(formData.pdfFile.size / (1024 * 1024)).toFixed(1)} MB)`}
            </Text>
            <TouchableOpacity 
              style={styles.removePdfButton}
              onPress={() => setFormData({ ...formData, pdfFile: null })}
            >
              <Text style={styles.removePdfText}>Remove PDF</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator color={designSystem.colors.textInverse} />
            <Text style={[styles.submitText, { fontSize: 12, marginTop: 5 }]}>
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Processing...'}
            </Text>
          </View>
        ) : (
          <Text style={styles.submitText}>{isEditing ? "Update Book" : "Create Book"}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...layoutStyles.container,
    padding: designSystem.spacing.lg,
  },
  label: {
    ...formStyles.label,
    marginTop: designSystem.spacing.sm,
  },
  input: {
    ...formStyles.input,
    marginTop: designSystem.spacing.xs,
  },
  button: {
    backgroundColor: designSystem.colors.primary,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.sm,
    marginTop: designSystem.spacing.md,
    alignItems: "center",
  },
  buttonText: { 
    color: designSystem.colors.textInverse,
    ...designSystem.typography.label,
  },
  submitButton: { 
    backgroundColor: designSystem.colors.success,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    marginTop: designSystem.spacing.lg,
    alignItems: "center",
  },
  submitText: { 
    color: designSystem.colors.textInverse,
    ...designSystem.typography.label,
    fontWeight: "bold",
  },
  imageSection: {
    marginTop: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.sm,
  },
  pdfSection: {
    marginTop: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.sm,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.xs,
    color: designSystem.colors.textPrimary,
  },
  imagePreviewContainer: {
    marginTop: designSystem.spacing.md,
    padding: designSystem.spacing.sm,
    backgroundColor: '#f5f5f5',
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  imagePreviewLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.sm,
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: '#e0e0e0',
  },
  removeImageButton: {
    marginTop: designSystem.spacing.sm,
    backgroundColor: designSystem.colors.error,
    padding: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.sm,
    alignItems: 'center',
  },
  removeImageText: {
    color: designSystem.colors.textInverse,
    fontWeight: 'bold',
  },
  pdfInfoContainer: {
    marginTop: designSystem.spacing.sm,
    padding: designSystem.spacing.sm,
    backgroundColor: '#e8f5e9',
    borderRadius: designSystem.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  pdfInfoText: {
    fontSize: 14,
    color: '#2e7d32',
    marginBottom: designSystem.spacing.xs,
  },
  removePdfButton: {
    marginTop: designSystem.spacing.xs,
    backgroundColor: designSystem.colors.error,
    padding: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.sm,
    alignItems: 'center',
  },
  removePdfText: {
    color: designSystem.colors.textInverse,
    fontWeight: 'bold',
    fontSize: 12,
  },
});
