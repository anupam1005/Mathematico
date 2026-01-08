import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';

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
    console.error('[ErrorBoundary] Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[ErrorBoundary] Component error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    this.setState({ errorInfo });
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
            <Text style={styles.error}>{this.state.error?.toString()}</Text>
            {this.state.error?.message && (
              <>
                <Text style={styles.errorLabel}>Message:</Text>
                <Text style={styles.error}>{this.state.error.message}</Text>
              </>
            )}
            {this.state.error?.stack && (
              <>
                <Text style={styles.errorLabel}>Stack:</Text>
                <Text style={styles.stackTrace}>{this.state.error.stack}</Text>
              </>
            )}
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
