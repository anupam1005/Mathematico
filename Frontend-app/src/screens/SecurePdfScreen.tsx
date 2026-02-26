import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSecurePdf } from '../hooks/useSecurePdf';

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
  const { bookId } = route.params;

  const {
    viewerUrl,
    loading,
    error,
    loadPdfViewer,
    loadBookDetails,
    clearError,
    reset,
  } = useSecurePdf();

    useEffect(() => {
      (async () => {
        try {
          await Promise.all([
            loadBookDetails(bookId),
            loadPdfViewer(bookId),
          ]);
        } catch {
          // handled internally by hook
        }
      })();

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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.closeButtonContainer}>
        <Button
          mode="contained"
          onPress={handleClose}
          style={styles.closeButton}
          icon="close"
        >
          Close
        </Button>
      </View>

      <View style={styles.viewerContainer}>
        {loading ? (
          <View style={styles.center}>
            <Text>Loading PDF…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={handleRetry}>
              Retry
            </Button>
          </View>
        ) : viewerUrl ? (
          (() => {
            const SecurePdfViewer = require('../components/SecurePdfViewer').default;
            return <SecurePdfViewer bookId={bookId} onClose={handleClose} />;
          })()
        ) : (
          <View style={styles.center}>
            <Text>PDF not available</Text>
            <Button mode="outlined" onPress={handleClose}>
              Close
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

export default SecurePdfScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  viewerContainer: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#d32f2f', marginBottom: 16 },
  closeButtonContainer: { position: 'absolute', top: 40, right: 16, zIndex: 1000 },
  closeButton: { borderRadius: 24 },
});
