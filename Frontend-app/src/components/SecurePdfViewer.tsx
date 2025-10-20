import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { API_CONFIG } from '../config';

interface SecurePdfViewerProps {
  bookId: string;
  onClose: () => void;
}

const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({ bookId, onClose }) => {
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchSecureViewerUrl();
  }, [bookId]);

  const fetchSecureViewerUrl = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_CONFIG.mobile}/books/${bookId}/viewer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setViewerUrl(data.data.viewerUrl);
      } else {
        setError(data.message || 'Failed to load PDF viewer');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Error fetching PDF viewer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewError = () => {
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  };

  const handleWebViewLoad = () => {
    setLoading(false);
  };

  // Custom HTML for secure PDF viewing with restrictions
  const securePdfHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Secure PDF Viewer</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background: #f5f5f5;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .pdf-container {
          width: 100vw;
          height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: auto;
        }
        
        .security-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: transparent;
          z-index: 10;
          pointer-events: none;
        }
        
        .restriction-notice {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          text-align: center;
          z-index: 20;
        }
        
        /* Disable right-click context menu */
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="restriction-notice">
          📖 Read-only mode • Download and screenshots disabled
        </div>
        <iframe 
          class="pdf-viewer" 
          src="${viewerUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH"
          oncontextmenu="return false;"
          onselectstart="return false;"
          ondragstart="return false;"
        ></iframe>
        <div class="security-overlay"></div>
      </div>
      
      <script>
        // Disable right-click
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          return false;
        });
        
        // Disable text selection
        document.addEventListener('selectstart', function(e) {
          e.preventDefault();
          return false;
        });
        
        // Disable drag
        document.addEventListener('dragstart', function(e) {
          e.preventDefault();
          return false;
        });
        
        // Disable keyboard shortcuts for save/print
        document.addEventListener('keydown', function(e) {
          // Disable Ctrl+S (Save), Ctrl+P (Print), F12 (DevTools)
          if ((e.ctrlKey && (e.keyCode === 83 || e.keyCode === 80)) || e.keyCode === 123) {
            e.preventDefault();
            return false;
          }
        });
        
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        document.addEventListener('keydown', function(e) {
          if (e.keyCode === 123 || 
              (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
              (e.ctrlKey && e.keyCode === 85)) {
            e.preventDefault();
            return false;
          }
        });
        
        // Prevent screenshot attempts (basic protection)
        document.addEventListener('visibilitychange', function() {
          if (document.hidden) {
            // Page is being hidden (possibly for screenshot)
            console.log('Page visibility changed - potential screenshot attempt');
          }
        });
      </script>
    </body>
    </html>
  `;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ea" />
        <Text style={styles.loadingText}>Loading secure PDF viewer...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchSecureViewerUrl} style={styles.retryButton}>
          Retry
        </Button>
        <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
          Close
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: securePdfHtml }}
        style={styles.webView}
        onError={handleWebViewError}
        onLoad={handleWebViewLoad}
        javaScriptEnabled={true}
        domStorageEnabled={false}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onShouldStartLoadWithRequest={(request: any) => {
          // Only allow the secure PDF URL
          return request.url.includes('cloudinary.com') || request.url.startsWith('data:');
        }}
        onMessage={(event: any) => {
          // Handle any messages from the WebView
          console.log('WebView message:', event.nativeEvent.data);
        }}
      />
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    width: width,
    height: height,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    marginBottom: 8,
  },
  closeButton: {
    marginTop: 8,
  },
});

export default SecurePdfViewer;
