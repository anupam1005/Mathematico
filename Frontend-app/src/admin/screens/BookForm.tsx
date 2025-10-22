// src/admin/screens/BookForm.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { adminService } from "../../services/adminService";
import authService from "../../services/authService";
import { designSystem, formStyles, layoutStyles } from "../../styles/designSystem";
import { API_CONFIG } from "../../config";

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
          console.error('Error loading book:', error);
        }).finally(() => setLoading(false));
      } catch (error) {
        console.error('Error in useEffect:', error);
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
    // No validation - admin can input anything they want

    setLoading(true);
    setUploadProgress(0);
    
    try {
      console.log('📚 BookForm: Starting book creation process...');
      
      // Check network connectivity first
      console.log('📚 BookForm: Checking network connectivity...');
      console.log('📚 BookForm: API Config:', {
        admin: API_CONFIG.admin,
        baseUrl: API_CONFIG.baseUrl,
        isDev: API_CONFIG.isDev
      });
      
      // Test basic network connectivity
      try {
        console.log('📚 BookForm: Testing basic network connectivity...');
        const basicTest = await fetch('https://httpbin.org/get', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        console.log('📚 BookForm: Basic network test response:', basicTest.status);
      } catch (basicError) {
        console.error('📚 BookForm: Basic network test failed:', basicError);
        throw new Error('No internet connection available. Please check your network settings.');
      }
      
      // Test network connectivity with a simple request
      try {
        console.log('📚 BookForm: Testing network connectivity...');
        console.log('📚 BookForm: Testing URL:', `${API_CONFIG.admin}/info`);
        
        const testResponse = await fetch(`${API_CONFIG.admin}/info`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('📚 BookForm: Network test response:', testResponse.status);
        if (!testResponse.ok) {
          throw new Error(`Network test failed with status: ${testResponse.status}`);
        }
        
        const testData = await testResponse.json();
        console.log('📚 BookForm: Network test data:', testData);
        
        // Test the exact URL that will be used for book creation
        console.log('📚 BookForm: Testing book creation URL:', `${API_CONFIG.admin}/books`);
        const booksTestResponse = await fetch(`${API_CONFIG.admin}/books`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${await authService.getToken()}`,
          },
        });
        
        console.log('📚 BookForm: Books endpoint test response:', booksTestResponse.status);
        if (!booksTestResponse.ok) {
          console.log('📚 BookForm: Books endpoint test failed, but continuing...');
        } else {
          const booksTestData = await booksTestResponse.json();
          console.log('📚 BookForm: Books endpoint test data:', booksTestData);
        }
        
        
      } catch (networkError) {
        console.error('📚 BookForm: Network test failed:', networkError);
        console.log('📚 BookForm: Network test failed, but continuing with book creation...');
      }
      
      const data = new FormData();
      
      // Add basic fields
      data.append("title", formData.title);
      data.append("author", formData.author);
      data.append("description", formData.description || "");
      data.append("category", formData.category || "general"); // Use valid enum value
      data.append("subject", formData.subject || "Mathematics");
      data.append("grade", formData.grade || "Class 9");
      data.append("pages", Math.max(1, parseInt(formData.pages) || 1).toString()); // Ensure at least 1 page
      data.append("isbn", formData.isbn || "");
      data.append("status", formData.status || "draft");
      data.append("level", "Foundation"); // Default level
      
      console.log('📚 BookForm: Basic fields added to FormData');
      
      // Handle file uploads more carefully
      if (formData.coverImage && typeof formData.coverImage === 'object' && 'uri' in formData.coverImage) {
        console.log('📚 BookForm: Adding cover image to FormData');
        data.append("coverImage", {
          uri: formData.coverImage.uri,
          type: "image/jpeg",
          name: "cover.jpg"
        } as any);
      }
      
      if (formData.pdfFile && typeof formData.pdfFile === 'object' && 'uri' in formData.pdfFile) {
        console.log('📚 BookForm: Adding PDF file to FormData');
        // Check file size (1GB = 1024 * 1024 * 1024 bytes)
        const fileSize = formData.pdfFile.size || 0;
        if (fileSize > 1024 * 1024 * 1024) {
          Alert.alert("Error", "PDF file size cannot exceed 1GB");
          setLoading(false);
          return;
        }
        
        data.append("pdfFile", {
          uri: formData.pdfFile.uri,
          type: "application/pdf",
          name: formData.pdfFile.name || "book.pdf"
        } as any);
      }

      setUploadProgress(50);
      console.log('📚 BookForm: FormData prepared, making API call...');
      console.log('📚 BookForm: FormData prepared with fields:', {
        title: formData.title,
        author: formData.author,
        hasCoverImage: !!formData.coverImage,
        hasPdfFile: !!formData.pdfFile,
        coverImageUri: formData.coverImage?.uri,
        pdfFileUri: formData.pdfFile?.uri
      });

      // Test with a simple JSON request first
      try {
        console.log('📚 BookForm: Testing simple JSON request...');
        const testBookData = {
          title: formData.title,
          author: formData.author,
          description: formData.description || "",
          category: formData.category || "general", // Use valid enum value
          subject: formData.subject || "Mathematics",
          grade: formData.grade || "Class 9",
          pages: Math.max(1, parseInt(formData.pages) || 1), // Ensure at least 1 page
          isbn: formData.isbn || "",
          status: formData.status || "draft",
          level: "Foundation"
        };
        
        console.log('📚 BookForm: Test data:', testBookData);
        
        // Try a simple JSON request first
        const token = await authService.getToken();
        const testResponse = await fetch(`${API_CONFIG.admin}/books`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(testBookData)
        });
        
        console.log('📚 BookForm: Test JSON request response:', testResponse.status);
        
        if (testResponse.ok) {
          const result = await testResponse.json();
          console.log('📚 BookForm: Test JSON request successful:', result);
          Alert.alert("Success", "Book created successfully (JSON test)", [
            {
              text: "OK",
              onPress: () => {
                setUploadProgress(100);
                // Call onSuccess first to trigger any refresh callbacks
                onSuccess?.();
                // Navigate back to refresh the book list
                navigation?.goBack();
              }
            }
          ]);
          return;
        } else {
          console.log('📚 BookForm: Test JSON request failed, trying FormData...');
        }
      } catch (testError) {
        console.error('📚 BookForm: Test JSON request failed:', testError);
        console.log('📚 BookForm: Test JSON request failed, trying FormData...');
      }

      // Try the original FormData approach first
      try {
        if (bookId && isEditing) {
          console.log('📚 BookForm: Updating existing book...');
          await adminService.updateBook(bookId, data);
          Alert.alert("Success", "Book updated successfully", [
            {
              text: "OK",
              onPress: () => {
                setUploadProgress(100);
                // Call onSuccess first to trigger any refresh callbacks
                onSuccess?.();
                // Navigate back to refresh the book list
                navigation?.goBack();
              }
            }
          ]);
        } else {
          console.log('📚 BookForm: Creating new book...');
          await adminService.createBook(data);
          Alert.alert("Success", "Book created successfully", [
            {
              text: "OK",
              onPress: () => {
                setUploadProgress(100);
                // Call onSuccess first to trigger any refresh callbacks
                onSuccess?.();
                // Navigate back to refresh the book list
                navigation?.goBack();
              }
            }
          ]);
        }
      } catch (formDataError) {
        console.error('📚 BookForm: FormData approach failed:', formDataError);
        console.log('📚 BookForm: Trying fallback JSON approach...');
        
        // Fallback: Try with JSON data only (no files)
        try {
          const jsonData = {
            title: formData.title,
            author: formData.author,
            description: formData.description || "",
            category: formData.category || "General",
            subject: formData.subject || "Mathematics",
            grade: formData.grade || "Class 9",
            pages: formData.pages || "0",
            isbn: formData.isbn || "",
            status: formData.status || "draft",
            level: "Foundation"
          };
          
          const token = await authService.getToken();
          const response = await fetch(`${API_CONFIG.admin}/books`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(jsonData)
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('📚 BookForm: Fallback JSON approach successful:', result);
            Alert.alert("Success", "Book created successfully (without files)", [
              {
                text: "OK",
                onPress: () => {
                  setUploadProgress(100);
                  // Call onSuccess first to trigger any refresh callbacks
                  onSuccess?.();
                  // Navigate back to refresh the book list
                  navigation?.goBack();
                }
              }
            ]);
          } else {
            const errorData = await response.json();
            throw new Error(`Fallback failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
          }
        } catch (fallbackError) {
          console.error('📚 BookForm: Fallback approach also failed:', fallbackError);
          throw formDataError; // Throw the original error
        }
      }
      
      setUploadProgress(100);
      onSuccess?.();
    } catch (err: any) {
      console.error('BookForm error:', err);
      let errorMessage = "Something went wrong";
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = "Upload timeout. Please try again with a smaller file or check your connection.";
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = "Network connection failed. Please check your internet connection.";
      } else if (err.response?.status === 413) {
        errorMessage = "File too large. Please try with a smaller file.";
      } else if (err.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      }
      
      console.log('📚 BookForm: Error details:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        response: err.response?.data
      });
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={formData.title} onChangeText={t => setFormData({ ...formData, title: t })} />

      <Text style={styles.label}>Author</Text>
      <TextInput style={styles.input} value={formData.author} onChangeText={t => setFormData({ ...formData, author: t })} />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 80 }]} multiline value={formData.description} onChangeText={t => setFormData({ ...formData, description: t })} />

      <Text style={styles.label}>Category</Text>
      <TextInput style={styles.input} value={formData.category} onChangeText={t => setFormData({ ...formData, category: t })} />

      <Text style={styles.label}>Subject</Text>
      <TextInput style={styles.input} value={formData.subject} onChangeText={t => setFormData({ ...formData, subject: t })} />

      <Text style={styles.label}>Grade</Text>
      <TextInput style={styles.input} value={formData.grade} onChangeText={t => setFormData({ ...formData, grade: t })} />

      <Text style={styles.label}>Pages</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={formData.pages} onChangeText={t => setFormData({ ...formData, pages: t })} />

      <Text style={styles.label}>ISBN</Text>
      <TextInput style={styles.input} value={formData.isbn} onChangeText={t => setFormData({ ...formData, isbn: t })} />

      <Text style={styles.label}>Status</Text>
      <TextInput style={styles.input} value={formData.status} onChangeText={t => setFormData({ ...formData, status: t })} />

      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>{formData.coverImage ? "Change Cover Image" : "Upload Cover Image"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={pickPDF}>
        <Text style={styles.buttonText}>{formData.pdfFile ? "Change PDF File" : "Upload PDF File"}</Text>
      </TouchableOpacity>
      
      {formData.pdfFile && (
        <Text style={[styles.label, { marginTop: 5, fontSize: 12, color: designSystem.colors.textSecondary }]}>
          PDF File: {formData.pdfFile.name || 'book.pdf'} 
          {formData.pdfFile.size && ` (${(formData.pdfFile.size / (1024 * 1024)).toFixed(1)} MB)`}
        </Text>
      )}

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
});
