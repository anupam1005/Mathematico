import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from '../services/apiClient';
import { safeCatch } from '../utils/safeCatch';

interface SecurePdfViewerProps {
  bookId: string;
  onClose: () => void;
}

const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({ bookId, onClose }) => {
  const [viewerUrl, setViewerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const mobileApi = withBasePath(API_PATHS.mobile);

  useEffect(() => {
    fetchSecureViewerUrl();
  }, [bookId]);

  const fetchSecureViewerUrl = async () => {
    try {
      setLoading(true);
      setError('');

      const { Storage } = await import('../utils/storage');
      
      // Get auth token for authenticated requests
      const token = await Storage.getItem('authToken');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Add authentication header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await mobileApi.get(`/books/${bookId}/viewer`, { headers });
      const data = response.data;

      if (data.success && data.data?.viewerUrl) {
        setViewerUrl(data.data.viewerUrl);
      } else {
        setError(data.message || 'Failed to load PDF viewer');
      }
    } catch (err) {
      safeCatch('SecurePdfViewer.fetchSecureViewerUrl', () => {
        setError('Network error. Please check your connection.');
      })(err);
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

  // Custom HTML for full-screen PDF viewing
  // Uses Google PDF Viewer for better mobile compatibility
  const securePdfHtml = viewerUrl ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>PDF Viewer</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: white;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        body {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .pdf-container {
          width: 100vw;
          height: 100vh;
          position: relative;
          background: white;
        }
        
        .pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
          background: white;
        }
        
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #666;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="loading" id="loading">Loading PDF...</div>
        <iframe 
          class="pdf-viewer" 
          id="pdfFrame"
          src="https://docs.google.com/viewer?url=${encodeURIComponent(viewerUrl)}&embedded=true"
          frameborder="0"
          scrolling="auto"
          onload="document.getElementById('loading').style.display='none';"
          onerror="document.getElementById('loading').innerHTML='Failed to load PDF. Please try again.';"
        ></iframe>
      </div>
      
      <script>
        // Disable right-click
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          return false;
        }, true);
        
        // Disable keyboard shortcuts for save/print
        document.addEventListener('keydown', function(e) {
          if ((e.ctrlKey && (e.keyCode === 83 || e.keyCode === 80)) || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }, true);
        
        // Hide loading after 5 seconds even if onload doesn't fire
        setTimeout(function() {
          var loading = document.getElementById('loading');
          if (loading) {
            loading.style.display = 'none';
          }
        }, 5000);
      </script>
    </body>
    </html>
  ` : '';

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

  if (!viewerUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>PDF URL not available</Text>
        <Button mode="contained" onPress={fetchSecureViewerUrl} style={styles.retryButton}>
          Retry
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
        onLoadEnd={handleWebViewLoad}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowFileAccess={false}
        allowUniversalAccessFromFileURLs={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(request: any) => {
          // Allow only known-good viewer hosts/URLs used by our embedded HTML
          const url = request.url.toLowerCase();

          // Our iframe uses Google Docs Viewer; allow it (and its common supporting hosts).
          if (
            url.includes('docs.google.com') ||
            url.includes('googleusercontent.com') ||
            url.includes('gstatic.com')
          ) {
            return true;
          }

          // Allow Cloudinary PDFs and data URLs
          if (
            url.includes('cloudinary.com') ||
            url.includes('res.cloudinary.com') ||
            url.startsWith('data:') ||
            url.startsWith('about:blank') ||
            url.startsWith('file://')
          ) {
            return true;
          }
          // Block other URLs for security
          return false;
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          safeCatch('SecurePdfViewer.onHttpError')(new Error(`WebView HTTP error (${nativeEvent.statusCode})`));
          if (nativeEvent.statusCode >= 400) {
            setError(`Failed to load PDF (Error ${nativeEvent.statusCode})`);
          }
        }}
        renderError={(errorDomain?: string, errorCode?: number, errorDesc?: string) => {
          const errorMessage = errorDesc || errorDomain || 'Unknown error';
          safeCatch('SecurePdfViewer.renderError')(new Error(errorMessage));
          return (
            <View style={styles.container}>
              <Text style={styles.errorText}>Failed to render PDF: {errorMessage}</Text>
              <Button mode="contained" onPress={fetchSecureViewerUrl} style={styles.retryButton}>
                Retry
              </Button>
            </View>
          );
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
