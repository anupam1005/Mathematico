import axios, { AxiosProgressEvent, AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ApiError, ApiErrorHandler } from '../error-handler';
import API_ENDPOINTS from '@/config/api-endpoints';
import type { ApiResponse } from '@/hooks/useApi';

interface UploadOptions {
  onProgress?: (progress: number) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

interface UploadResult {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Utility class for handling file uploads
 */
class FileUploader {
  /**
   * Upload a file to the server
   * @param file The file to upload
   * @param options Upload options
   * @returns Promise with the upload result
   */
  static async uploadFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      // Validate file size
      if (options.maxFileSize && file.size > options.maxFileSize) {
        throw new Error(`File size exceeds the maximum allowed size of ${options.maxFileSize / 1024 / 1024}MB`);
      }

      // Validate file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      // Create form data
      const formData = new FormData();
      const fileId = uuidv4();
      const fileName = `${fileId}-${file.name}`;
      
      formData.append('file', file, fileName);

      // Upload the file
      const response: AxiosResponse<ApiResponse<UploadResult>> = await axios.post(
        API_ENDPOINTS.UPLOADS.UPLOAD,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total && options.onProgress) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              options.onProgress(progress);
            }
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload file');
      }

      return response.data.data;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiErrorHandler.handleError(error);
    }
  }

  /**
   * Upload multiple files
   * @param files Array of files to upload
   * @param options Upload options
   * @returns Promise with the upload results
   */
  static async uploadFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Get a file URL by ID
   * @param fileId The file ID
   * @returns The file URL
   */
  static getFileUrl(fileId: string | undefined | null): string {
    if (!fileId) return '';
    return `${API_ENDPOINTS.UPLOADS.BY_ID(fileId)}`;
  }

  /**
   * Format file size to human-readable format
   * @param bytes File size in bytes
   * @param decimals Number of decimal places
   * @returns Formatted file size string
   */
  static formatFileSize(bytes: number | undefined, decimals = 2): string {
    if (bytes === undefined || bytes === null) return '0 Bytes';
    if (isNaN(bytes)) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export { FileUploader };
export type { UploadOptions, UploadResult };
