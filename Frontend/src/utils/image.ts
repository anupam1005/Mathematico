/**
 * Image utility functions for handling uploaded file URLs
 */

// Get the backend base URL from environment or use default
const getBackendBaseUrl = (): string => {
  // Use VITE_BACKEND_URL if available, otherwise construct from VITE_API_URL
  return import.meta.env.VITE_BACKEND_URL || 
         import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 
         'http://localhost:5000';
};

/**
 * Constructs the full URL for an uploaded image
 * @param imagePath - The image path from the backend (e.g., /uploads/filename.jpg)
 * @returns The full URL to access the image
 */
export const getImageUrl = (imagePath?: string): string | null => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('🖼️ Image utility: Already full URL:', imagePath);
    return imagePath;
  }
  
  // If it's a relative path starting with /uploads, construct full URL
  if (imagePath.startsWith('/uploads/')) {
    const fullUrl = `${getBackendBaseUrl()}${imagePath}`;
    console.log('🖼️ Image utility: Constructed full URL:', {
      input: imagePath,
      backendBase: getBackendBaseUrl(),
      fullUrl: fullUrl
    });
    return fullUrl;
  }
  
  // If it's just a filename, assume it's in uploads folder
  if (!imagePath.includes('/')) {
    const fullUrl = `${getBackendBaseUrl()}/uploads/${imagePath}`;
    console.log('🖼️ Image utility: Filename to full URL:', {
      input: imagePath,
      fullUrl: fullUrl
    });
    return fullUrl;
  }
  
  // Return as is if we can't determine the format
  console.log('🖼️ Image utility: Unknown format, returning as-is:', imagePath);
  return imagePath;
};

/**
 * Gets the backend base URL for direct use
 */
export const getBackendUrl = (): string => {
  return getBackendBaseUrl();
};
