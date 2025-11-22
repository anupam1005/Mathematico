import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { API_CONFIG } from '../config';
import { Logger } from '../utils/errorHandler';

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
      
      const response = await fetch(`${API_CONFIG.mobile}/books/${bookId}/viewer`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to load PDF viewer' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data?.viewerUrl) {
        setViewerUrl(data.data.viewerUrl);
      } else {
        setError(data.message || 'Failed to load PDF viewer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please check your connection.';
      setError(errorMessage);
      Logger.error('Error fetching PDF viewer:', err);
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
  // This ensures PDF text renders properly in production WebView
  const securePdfHtml = viewerUrl ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Secure PDF Viewer</title>
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
          background: #525252;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        body {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: pan-x pan-y;
        }
        
        .pdf-container {
          width: 100vw;
          height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #525252;
        }
        
        .pdf-viewer {
          width: 100%;
          height: 100%;
          border: none;
          pointer-events: auto;
          background: white;
        }
        
        .restriction-notice {
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.85);
          color: white;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12px;
          text-align: center;
          z-index: 20;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        /* Ensure PDF text is readable */
        @media screen {
          .pdf-viewer {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
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
          src="${viewerUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&zoom=page-width"
          allow="fullscreen"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          oncontextmenu="return false;"
          onselectstart="return false;"
          ondragstart="return false;"
          loading="eager"
          type="application/pdf"
        ></iframe>
      </div>
      
      <script>
        // Disable right-click
        document.addEventListener('contextmenu', function(e) {
          e.preventDefault();
          return false;
        }, true);
        
        // Disable text selection
        document.addEventListener('selectstart', function(e) {
          e.preventDefault();
          return false;
        }, true);
        
        // Disable drag
        document.addEventListener('dragstart', function(e) {
          e.preventDefault();
          return false;
        }, true);
        
        // Disable keyboard shortcuts for save/print
        document.addEventListener('keydown', function(e) {
          // Disable Ctrl+S (Save), Ctrl+P (Print), F12 (DevTools)
          if ((e.ctrlKey && (e.keyCode === 83 || e.keyCode === 80)) || e.keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }, true);
        
        // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        document.addEventListener('keydown', function(e) {
          if (e.keyCode === 123 || 
              (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) ||
              (e.ctrlKey && e.keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }, true);
        
        // Handle PDF load errors
        window.addEventListener('error', function(e) {
          console.error('PDF load error:', e);
        }, true);
        
        // Ensure PDF loads properly
        window.addEventListener('load', function() {
          console.log('PDF viewer loaded');
        });
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
          // Allow Cloudinary PDFs and data URLs
          const url = request.url.toLowerCase();
          if (url.includes('cloudinary.com') || 
              url.includes('res.cloudinary.com') ||
              url.startsWith('data:') ||
              url.startsWith('about:blank') ||
              url.startsWith('file://')) {
            return true;
          }
          // Block other URLs for security
          return false;
        }}
        onMessage={(event: any) => {
          // Handle any messages from the WebView
          Logger.info('WebView message:', event.nativeEvent.data);
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          Logger.error('WebView HTTP error:', nativeEvent);
          if (nativeEvent.statusCode >= 400) {
            setError(`Failed to load PDF (Error ${nativeEvent.statusCode})`);
          }
        }}
        renderError={(errorDomain?: string, errorCode?: number, errorDesc?: string) => {
          const errorMessage = errorDesc || errorDomain || 'Unknown error';
          Logger.error('WebView render error:', { errorDomain, errorCode, errorDesc });
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
