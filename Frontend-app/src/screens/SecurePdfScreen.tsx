import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Appbar, Text, Button, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSecurePdf } from '../hooks/useSecurePdf';
import SecurePdfViewer from '../components/SecurePdfViewer';

console.log('[SecurePdfScreen] module loaded');

interface SecurePdfScreenProps {
  route: {
    params: {
      bookId: string;
      bookTitle?: string;
    };
  };
  navigation: any;
}

const SecurePdfScreen: React.FC<SecurePdfScreenProps> = ({ route, navigation }) => {
  console.log('[SecurePdfScreen] component mounting');
  const { bookId, bookTitle } = route.params;
  const {
    viewerUrl,
    bookDetails,
    loading,
    error,
    restrictions,
    loadPdfViewer,
    loadBookDetails,
    clearError,
    reset,
  } = useSecurePdf();

  useEffect(() => {
    console.log('[SecurePdfScreen] useEffect -> loading data for bookId:', bookId);
    // Load both book details and PDF viewer
    const loadData = async () => {
      await Promise.all([
        loadBookDetails(bookId),
        loadPdfViewer(bookId),
      ]);
    };

    loadData();

    // Cleanup on unmount
    return () => {
      console.log('[SecurePdfScreen] cleanup for bookId:', bookId);
      reset();
    };
  }, [bookId, loadBookDetails, loadPdfViewer, reset]);

  const handleRetry = () => {
    clearError();
    loadPdfViewer(bookId);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const displayTitle = bookDetails?.title || bookTitle || 'PDF Viewer';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Floating Close Button */}
      <View style={styles.closeButtonContainer}>
        <Button
          mode="contained"
          onPress={handleClose}
          style={styles.floatingCloseButton}
          labelStyle={styles.closeButtonLabel}
          icon="close"
          contentStyle={styles.closeButtonContent}
        >
          Close
        </Button>
      </View>

      {/* PDF Viewer or Error State */}
      <View style={styles.viewerContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button 
              mode="contained" 
              onPress={handleRetry}
              style={styles.retryButton}
              icon="refresh"
            >
              Retry
            </Button>
            <Button 
              mode="outlined" 
              onPress={handleClose}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        ) : viewerUrl ? (
          <SecurePdfViewer bookId={bookId} onClose={handleClose} />
        ) : (
          <View style={styles.noPdfContainer}>
            <Text style={styles.noPdfIcon}>📄</Text>
            <Text style={styles.noPdfText}>PDF not available</Text>
            <Button 
              mode="outlined" 
              onPress={handleClose}
              style={styles.closeButton}
            >
              Close
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  floatingCloseButton: {
    backgroundColor: '#6200ea',
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButtonContent: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButtonLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    marginBottom: 12,
    minWidth: 120,
  },
  closeButton: {
    minWidth: 120,
  },
  noPdfContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPdfIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noPdfText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
});

export default SecurePdfScreen;
