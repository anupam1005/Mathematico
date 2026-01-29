import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useSecurePdf } from '../hooks/useSecurePdf';

interface Props {
  route: { params: { bookId: string; bookTitle?: string } };
  navigation: any;
}

const SecurePdfScreen: React.FC<Props> = ({ route, navigation }) => {
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
        // handled internally
      }
    })();

    return () => {
      reset();
    };
  }, [bookId]);

  const handleRetry = () => {
    clearError();
    loadPdfViewer(bookId);
  };

  const handleClose = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.topRight}>
        <Button mode="contained" onPress={handleClose}>
          Close
        </Button>
      </View>

      <View style={styles.content}>
        {loading && <Text>Loading PDF…</Text>}

        {!loading && error && (
          <>
            <Text style={styles.error}>{error}</Text>
            <Button onPress={handleRetry}>Retry</Button>
          </>
        )}

        {!loading && !error && viewerUrl && (() => {
          const SecurePdfViewer =
            require('../components/SecurePdfViewer').default;
          return <SecurePdfViewer bookId={bookId} onClose={handleClose} />;
        })()}
      </View>
    </View>
  );
};

export default SecurePdfScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topRight: { position: 'absolute', top: 40, right: 16, zIndex: 10 },
  error: { color: '#d32f2f', marginBottom: 16 },
});
