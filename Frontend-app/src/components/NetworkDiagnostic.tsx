import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { testNetworkConnectivity, testBackendEndpoints } from '../utils/networkTest';
import { API_CONFIG } from '../config';

export const NetworkDiagnostic: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Running network diagnostics...');
      
      const connectivityTest = await testNetworkConnectivity();
      const endpointsTest = await testBackendEndpoints();
      
      const results = {
        timestamp: new Date().toISOString(),
        config: {
          authUrl: API_CONFIG.auth,
          baseUrl: API_CONFIG.baseUrl,
          isDev: API_CONFIG.isDev
        },
        connectivity: connectivityTest,
        endpoints: endpointsTest
      };
      
      setTestResults(results);
      console.log('🔍 Diagnostics completed:', results);
    } catch (error) {
      console.error('🔍 Diagnostics failed:', error);
      setTestResults({
        error: error,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Network Diagnostic</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <Text style={styles.text}>Auth URL: {API_CONFIG.auth}</Text>
        <Text style={styles.text}>Base URL: {API_CONFIG.baseUrl}</Text>
        <Text style={styles.text}>Is Dev: {API_CONFIG.isDev ? 'Yes' : 'No'}</Text>
      </View>
      
      <Button
        title={isLoading ? "Running Diagnostics..." : "Run Network Diagnostics"}
        onPress={runDiagnostics}
        disabled={isLoading}
      />
      
      {testResults && (
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>Test Results</Text>
          <Text style={styles.text}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  results: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
  },
});
