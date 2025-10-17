import { useState, useCallback } from 'react';
import { pdfService, SecurePdfViewerResponse, BookDetailsResponse } from '../services/pdfService';

interface UseSecurePdfReturn {
  viewerUrl: string | null;
  bookDetails: BookDetailsResponse['data'] | null;
  loading: boolean;
  error: string | null;
  restrictions: SecurePdfViewerResponse['data']['restrictions'] | null;
  loadPdfViewer: (bookId: string) => Promise<void>;
  loadBookDetails: (bookId: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const useSecurePdf = (): UseSecurePdfReturn => {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [bookDetails, setBookDetails] = useState<BookDetailsResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restrictions, setRestrictions] = useState<SecurePdfViewerResponse['data']['restrictions'] | null>(null);

  const loadPdfViewer = useCallback(async (bookId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pdfService.getSecurePdfViewer(bookId);
      
      if (response.success) {
        setViewerUrl(response.data.viewerUrl);
        setRestrictions(response.data.restrictions);
      } else {
        setError(response.message || 'Failed to load PDF viewer');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load PDF viewer';
      setError(errorMessage);
      console.error('Error loading PDF viewer:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBookDetails = useCallback(async (bookId: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await pdfService.getBookDetails(bookId);
      
      if (response.success) {
        setBookDetails(response.data);
      } else {
        setError(response.message || 'Failed to load book details');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load book details';
      setError(errorMessage);
      console.error('Error loading book details:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setViewerUrl(null);
    setBookDetails(null);
    setLoading(false);
    setError(null);
    setRestrictions(null);
  }, []);

  return {
    viewerUrl,
    bookDetails,
    loading,
    error,
    restrictions,
    loadPdfViewer,
    loadBookDetails,
    clearError,
    reset,
  };
};
