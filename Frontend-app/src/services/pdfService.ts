import { API_CONFIG } from '../config';
import { createServiceErrorHandler } from '../utils/serviceErrorHandler';

// Create a service error handler for pdfService
const errorHandler = createServiceErrorHandler('pdfService');

export interface SecurePdfViewerResponse {
  success: boolean;
  data: {
    viewerUrl: string;
    title: string;
    restrictions: {
      download: boolean;
      print: boolean;
      copy: boolean;
      screenshot: boolean;
    };
  };
  message?: string;
}

export interface BookDetailsResponse {
  success: boolean;
  data: {
    _id: string;
    title: string;
    description: string;
    author: string;
    category: string;
    subject: string;
    grade: string;
    coverImage?: string;
    price: number;
    currency: string;
    isFree: boolean;
    status: string;
    isAvailable: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
}

class PdfService {
  /**
   * Get secure PDF viewer URL for a book
   */
  async getSecurePdfViewer(bookId: string): Promise<SecurePdfViewerResponse> {
    try {
      const response = await fetch(`${API_CONFIG.mobile}/books/${bookId}/viewer`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      errorHandler.handleError('Error fetching secure PDF viewer:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to load PDF viewer. Please check your connection.'
      );
    }
  }

  /**
   * Get book details (without PDF URL)
   */
  async getBookDetails(bookId: string): Promise<BookDetailsResponse> {
    try {
      const response = await fetch(`${API_CONFIG.mobile}/books/${bookId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      errorHandler.handleError('Error fetching book details:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to load book details. Please check your connection.'
      );
    }
  }

  /**
   * Check if PDF is available for a book
   */
  async isPdfAvailable(bookId: string): Promise<boolean> {
    try {
      const response = await this.getSecurePdfViewer(bookId);
      return response.success && !!response.data.viewerUrl;
    } catch (error) {
      errorHandler.handleError('Error checking PDF availability:', error);
      return false;
    }
  }

  /**
   * Get PDF restrictions info
   */
  async getPdfRestrictions(bookId: string): Promise<SecurePdfViewerResponse['data']['restrictions'] | null> {
    try {
      const response = await this.getSecurePdfViewer(bookId);
      return response.success ? response.data.restrictions : null;
    } catch (error) {
      errorHandler.handleError('Error fetching PDF restrictions:', error);
      return null;
    }
  }
}

export const pdfService = new PdfService();
export default pdfService;
