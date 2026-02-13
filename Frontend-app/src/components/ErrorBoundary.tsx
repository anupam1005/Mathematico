import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import { safeCatch } from '../utils/safeCatch';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: any;
  errorInfo: any;
};

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    safeCatch('ErrorBoundary.getDerivedStateFromError')(error);
    // Store error safely
    let errorMessage = 'An unexpected error occurred';
    try {
      if (error && typeof error === 'object') {
        if (error.message) errorMessage = String(error.message);
        else if (error.toString) errorMessage = String(error.toString());
      } else if (error) {
        errorMessage = String(error);
      }
    } catch {
      // Keep default message if extraction fails
    }
    return { hasError: true, error: errorMessage };
  }

  componentDidCatch(error: any, errorInfo: any) {
    safeCatch('ErrorBoundary.componentDidCatch')(error);
    // Store error info safely
    let errorInfoStr = '';
    try {
      if (errorInfo && errorInfo.componentStack) {
        errorInfoStr = String(errorInfo.componentStack).substring(0, 500);
      }
    } catch {
      // Ignore if extraction fails
    }
    this.setState({ errorInfo: errorInfoStr });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>App Error</Text>
          <Text style={styles.subtitle}>The app encountered an error</Text>
          <ScrollView style={styles.errorContainer}>
            <Text style={styles.errorLabel}>Error:</Text>
            <Text style={styles.error}>
              {this.state.error || 'An unexpected error occurred'}
            </Text>
            {this.state.errorInfo && (
              <>
                <Text style={styles.errorLabel}>Details:</Text>
                <Text style={styles.stackTrace}>{this.state.errorInfo}</Text>
              </>
            )}
            <Text style={styles.errorLabel}>What to do:</Text>
            <Text style={styles.error}>
              Please try again or restart the app. If the problem persists, contact support.
            </Text>
          </ScrollView>
          <Button mode="contained" onPress={this.handleReload} style={styles.button}>
            Try Again
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#d32f2f' },
  subtitle: { fontSize: 16, marginBottom: 20, color: '#666' },
  errorContainer: { maxHeight: 300, width: '100%', marginBottom: 20, padding: 10, backgroundColor: '#fff', borderRadius: 8 },
  errorLabel: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 5, color: '#333' },
  error: { color: '#d32f2f', fontSize: 14, marginBottom: 10 },
  stackTrace: { color: '#666', fontSize: 12, fontFamily: 'monospace' },
  button: { marginTop: 10, minWidth: 150 },
});

export default ErrorBoundary;
