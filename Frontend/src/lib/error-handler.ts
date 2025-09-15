import { AxiosError } from 'axios';
import { toast } from 'sonner';

export class ApiError extends Error {
  constructor(
    public message: string,
    public status?: number,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiErrorHandler {
  public static handleError(error: unknown): ApiError {
    const axiosError = error as AxiosError<{
      message?: string;
      error?: string;
      statusCode?: number;
      code?: string;
      details?: Record<string, string[]>;
    }>;

    // Default error message
    let errorMessage = 'An unexpected error occurred';
    let status: number | undefined;
    let code: string | undefined;
    let details: Record<string, string[]> | undefined;

    if (axiosError.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { data, status: responseStatus } = axiosError.response;
      status = responseStatus;
      code = data?.code || axiosError.code;
      details = data?.details;

      // Get error message from response
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      } else if (status === 401) {
        errorMessage = 'You are not authorized to access this resource';
      } else if (status === 403) {
        errorMessage = 'You do not have permission to perform this action';
      } else if (status === 404) {
        errorMessage = 'The requested resource was not found';
      } else if (status >= 500) {
        errorMessage = 'A server error occurred. Please try again later.';
      }
    } else if (axiosError.request) {
      // The request was made but no response was received
      errorMessage = 'No response received from the server. Please check your connection.';
      code = 'NO_RESPONSE';
    } else if (axiosError.message) {
      // Something happened in setting up the request that triggered an Error
      errorMessage = axiosError.message;
      code = axiosError.code;
    }

    // Log the error in development
    if (import.meta.env.VITE_APP_ENV === 'development') {
      console.error('API Error:', {
        message: errorMessage,
        status,
        code,
        details,
        originalError: error,
      });
    }

    // Return the error object
    return new ApiError(errorMessage, status, code, details);
  }

  public static showErrorToast(error: unknown): void {
    const { message } = this.handleError(error);
    toast.error(message);
  }

  public static getErrorMessage(error: unknown): string {
    return this.handleError(error).message;
  }
}

// Helper function to handle API errors in async functions
export async function handleApiCall<T>(
  promise: Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
    showErrorToast?: boolean;
  }
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const data = await promise;
    if (options?.onSuccess) {
      options.onSuccess(data);
    }
    return { data, error: null };
  } catch (error) {
    const apiError = ApiErrorHandler.handleError(error);
    
    if (options?.onError) {
      options.onError(apiError);
    } else if (options?.showErrorToast !== false) {
      ApiErrorHandler.showErrorToast(apiError);
    }
    
    return { data: null, error: apiError };
  }
}

// Example usage:
/*
const { data, error } = await handleApiCall(
  api.get('/some/endpoint'),
  {
    onSuccess: (data) => console.log('Success!', data),
    onError: (error) => console.error('Error!', error),
    showErrorToast: true,
  }
);
*/
