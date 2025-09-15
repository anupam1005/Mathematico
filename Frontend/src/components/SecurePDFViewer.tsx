import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface SecurePDFViewerProps {
  pdfUrl: string;
  title: string;
  className?: string;
}

const SecurePDFViewer: React.FC<SecurePDFViewerProps> = ({ 
  pdfUrl, 
  title, 
  className = "" 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Prevent right-click, F12, Ctrl+Shift+I, etc.
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error('Right-click is disabled for security');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        toast.error('Developer tools are disabled for security');
      }
      
      // Disable Ctrl+S (save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        toast.error('Saving is disabled for security');
      }
      
      // Disable Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        toast.error('Screenshots are disabled for security');
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // CSS to prevent text selection and other security measures
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .secure-pdf-viewer {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      
      .secure-pdf-viewer * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      
      .secure-pdf-viewer iframe {
        pointer-events: auto;
        border: none;
        background: #f5f5f5;
      }
      
      /* Disable image dragging */
      .secure-pdf-viewer img {
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
        pointer-events: none;
      }
      
      /* Disable text selection */
      .secure-pdf-viewer::selection {
        background: transparent;
      }
      
      .secure-pdf-viewer::-moz-selection {
        background: transparent;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
    setIsBlocked(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load PDF. Check if the file exists and server is running.');
    setIsBlocked(true);
  };

  // Add timeout to detect if iframe is blocked
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('PDF failed to load. Check if the file exists and server is running.');
        setIsBlocked(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleOpenInNewTab = () => {
    // Open PDF directly without security parameters for better compatibility
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  // Check if PDF URL is accessible
  const checkPDFAccessibility = async () => {
    try {
      console.log('Checking PDF accessibility for:', pdfUrl);
      const response = await fetch(pdfUrl, { 
        method: 'HEAD',
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('PDF accessibility response:', response.status, response.statusText);
      
      if (!response.ok) {
        setError(`PDF not accessible (${response.status}). Check if the file exists.`);
        setIsBlocked(true);
        setIsLoading(false);
      } else {
        console.log('PDF is accessible, loading iframe...');
      }
    } catch (error) {
      console.error('PDF accessibility check failed:', error);
      setError('Cannot connect to PDF server. Make sure the backend is running.');
      setIsBlocked(true);
      setIsLoading(false);
    }
  };

  // Check PDF accessibility on component mount
  useEffect(() => {
    if (pdfUrl) {
      checkPDFAccessibility();
    }
  }, [pdfUrl]);

  // Construct the PDF URL with security parameters
  const securePdfUrl = `${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH&disableprint=1&disablesave=1&disablecopy=1&disableopenfile=1&disablebookmarks=1`;

  return (
    <div 
      ref={containerRef}
      className={`secure-pdf-viewer ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
      style={{
        transform: `scale(${scale}) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        transition: 'transform 0.3s ease'
      }}
    >
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={scale <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={scale >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full">
          <div className="relative h-[600px] w-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <EyeOff className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 mb-4">{error}</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={handleOpenInNewTab} variant="default">
                      Open in New Tab
                    </Button>
                    <Button onClick={() => {
                      setError(null);
                      setIsLoading(true);
                      setIsBlocked(false);
                      checkPDFAccessibility();
                    }} variant="outline">
                      Retry
                    </Button>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500 mb-2">
                      If the PDF doesn't load, try these options:
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open(pdfUrl, '_blank')}
                      >
                        Direct Link
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = pdfUrl;
                          link.download = title + '.pdf';
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      If the PDF doesn't load, try opening it in a new tab or check if your browser supports PDF viewing.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <iframe
              ref={iframeRef}
              src={securePdfUrl}
              className="w-full h-full"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              title={`PDF Viewer - ${title}`}
              allow="fullscreen"
              style={{
                filter: 'blur(0px)',
                WebkitFilter: 'blur(0px)'
              }}
            />
          </div>
          
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>🔒 Secure Viewing Mode</span>
                <span>•</span>
                <span>Download Disabled</span>
                <span>•</span>
                <span>Screenshot Protected</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Download not available</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurePDFViewer;
