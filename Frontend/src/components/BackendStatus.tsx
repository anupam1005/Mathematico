import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface BackendStatusProps {
  showInAdmin?: boolean;
}

export const BackendStatus: React.FC<BackendStatusProps> = ({ showInAdmin = false }) => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const checkBackendStatus = async () => {
    setStatus('checking');
    setErrorMessage('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus('online');
        setLastCheck(new Date());
        console.log('Backend health check successful:', data);
      } else {
        setStatus('error');
        setErrorMessage(`HTTP ${response.status}: ${response.statusText}`);
        setLastCheck(new Date());
      }
    } catch (error: any) {
      setStatus('offline');
      setErrorMessage(error.message || 'Network error');
      setLastCheck(new Date());
      console.error('Backend health check failed:', error);
    }
  };

  useEffect(() => {
    checkBackendStatus();
    
    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-red-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'checking':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Wifi className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Error</Badge>;
      case 'checking':
        return <Badge variant="outline">Checking...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'online':
        return 'Backend server is running and responding';
      case 'offline':
        return 'Cannot connect to backend server';
      case 'error':
        return 'Backend server responded with an error';
      case 'checking':
        return 'Checking backend status...';
      default:
        return 'Unknown status';
    }
  };

  if (!showInAdmin && status === 'online') {
    return null; // Don't show the component on public pages if backend is online
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Backend Status
        </CardTitle>
        <CardDescription>
          Real-time connection status to the backend server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>
        
        <div className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </div>
        
        {errorMessage && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
        
        {lastCheck && (
          <div className="text-xs text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}
        
        <Button 
          onClick={checkBackendStatus} 
          variant="outline" 
          size="sm"
          disabled={status === 'checking'}
          className="w-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${status === 'checking' ? 'animate-spin' : ''}`} />
          Check Status
        </Button>
        
        {status === 'offline' && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
            <strong>💡 Tip:</strong> Make sure the backend server is running on port 5000
          </div>
        )}
      </CardContent>
    </Card>
  );
};
