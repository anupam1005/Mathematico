import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, Text, Button } from 'react-native-paper';
import { API_PATHS } from '../constants/apiPaths';
import { withBasePath } from '../services/apiClient';
import { safeCatch } from '../utils/safeCatch';

interface SecurePdfViewerProps {
  bookId: string;
  viewerUrl: string;
  onClose: () => void;
}

const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({ bookId, viewerUrl, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const handleWebViewError = () => {
    setError('Failed to load PDF. Please try again.');
    setLoading(false);
  };

  const handleWebViewLoad = () => {
    setLoading(false);
  };

  // Custom HTML for full-screen PDF viewing
  // Uses Google PDF Viewer for better mobile compatibility
  // Custom HTML for full-screen PDF viewing
  // Uses Google PDF Viewer for better mobile compatibility
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
          background: #f0f0f0;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
        }
        
        body {
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .pdf-container {
          width: 100%;
          height: 100%;
          position: relative;
          background: #525659;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        /* Attempt to hide Google GView toolbar/popout */
        .pdf-viewer-wrapper {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
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
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          z-index: 5;
        }

        /* Overlay to block clicks on the iframe controls */
        .click-shield {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 50px; /* Block top toolbar */
          z-index: 10;
          background: transparent;
        }

        .click-shield-bottom {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 60px;
          height: 60px; /* Block bottom-right popout icon */
          z-index: 10;
          background: transparent;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="loading" id="loading">Preparing secure viewer...</div>
        <div class="pdf-viewer-wrapper">
          <div class="click-shield"></div>
          <div class="click-shield-bottom"></div>
          <iframe 
            class="pdf-viewer" 
            id="pdfFrame"
            src="https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(viewerUrl)}"
            frameborder="0"
            scrolling="auto"
            onload="document.getElementById('loading').style.display='none';"
            onerror="document.getElementById('loading').innerHTML='Failed to load PDF. Please try again.';"
          ></iframe>
        </div>
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
        
        // Hide loading after 10 seconds anyway
        setTimeout(function() {
          var loading = document.getElementById('loading');
          if (loading) loading.style.display = 'none';
        }, 10000);
      </script>
    </body>
    </html>
  ` : '';



  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.container, { zIndex: 10 }]}>
          <ActivityIndicator size="large" color="#6200ea" />
          <Text style={styles.loadingText}>Loading secure PDF viewer...</Text>
        </View>
      )}
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
        mixedContentMode="never"
        originWhitelist={['https://*', 'about:blank', 'data:*']}
        onShouldStartLoadWithRequest={(request: any) => {
          const url = request.url.toLowerCase();
          
          // Allow standard web protocols and data URIs
          if (
            url.startsWith('http://') ||
            url.startsWith('https://') ||
            url.startsWith('data:') ||
            url.startsWith('about:') ||
            url.startsWith('file://')
          ) {
            return true;
          }
          
          return false;
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          safeCatch('SecurePdfViewer.onHttpError')(new Error(`WebView HTTP error (${nativeEvent.statusCode})`));
          if (nativeEvent.statusCode >= 400) {
            setError(`Failed to load PDF (Error ${nativeEvent.statusCode})`);
          }
        }}
        renderError={(errorDomain?: string, _errorCode?: number, errorDesc?: string) => {
          const errorMessage = errorDesc || errorDomain || 'Unknown error';
          safeCatch('SecurePdfViewer.renderError')(new Error(errorMessage));
          return (
            <View style={styles.container}>
              <Text style={styles.errorText}>Failed to render PDF: {errorMessage}</Text>
              <Button mode="outlined" onPress={onClose} style={styles.closeButton}>
                Close
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
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
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
