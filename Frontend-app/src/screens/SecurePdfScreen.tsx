import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Appbar, Text, Button, Card, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSecurePdf } from '../hooks/useSecurePdf';
import SecurePdfViewer from '../components/SecurePdfViewer';

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6200ea" />
      
      {/* Header */}
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={handleClose} color="white" />
        <Appbar.Content 
          title={displayTitle} 
          titleStyle={styles.headerTitle}
          subtitle="Secure Read-Only Mode"
          subtitleStyle={styles.headerSubtitle}
        />
      </Appbar.Header>

      {/* Security Notice */}
      <View style={styles.securityNotice}>
        <Card style={styles.noticeCard}>
          <Card.Content style={styles.noticeContent}>
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeIcon}>🔒</Text>
              <Text style={styles.noticeTitle}>Secure Reading Mode</Text>
            </View>
            <Text style={styles.noticeText}>
              This PDF is in read-only mode. Download, printing, and screenshots are disabled to protect content.
            </Text>
            {restrictions && (
              <View style={styles.restrictionsContainer}>
                <Chip 
                  icon="download-off" 
                  style={[styles.restrictionChip, !restrictions.download && styles.disabledChip]}
                >
                  Download Disabled
                </Chip>
                <Chip 
                  icon="printer-off" 
                  style={[styles.restrictionChip, !restrictions.print && styles.disabledChip]}
                >
                  Print Disabled
                </Chip>
                <Chip 
                  icon="content-copy" 
                  style={[styles.restrictionChip, !restrictions.copy && styles.disabledChip]}
                >
                  Copy Disabled
                </Chip>
                <Chip 
                  icon="camera-off" 
                  style={[styles.restrictionChip, !restrictions.screenshot && styles.disabledChip]}
                >
                  Screenshot Disabled
                </Chip>
              </View>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* PDF Viewer or Error State */}
      <View style={styles.viewerContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading secure PDF viewer...</Text>
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
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ea',
    elevation: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  securityNotice: {
    padding: 16,
    paddingBottom: 8,
  },
  noticeCard: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  noticeContent: {
    paddingVertical: 8,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
  },
  noticeText: {
    fontSize: 14,
    color: '#bf360c',
    lineHeight: 20,
    marginBottom: 12,
  },
  restrictionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restrictionChip: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  disabledChip: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  viewerContainer: {
    flex: 1,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 2,
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
