import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast configuration
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Notification interface
export interface Notification {
  message: string;
  type: NotificationType;
  options?: ToastOptions;
}

/**
 * Notification service for showing toast notifications
 */
class NotificationService {
  /**
   * Show a notification
   * @param message The message to display
   * @param type The notification type
   * @param options Additional toast options
   */
  static notify(message: string, type: NotificationType = 'info', options: ToastOptions = {}): void {
    const toastOptions = { ...defaultOptions, ...options };
    
    switch (type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
      default:
        toast.info(message, toastOptions);
        break;
    }
  }

  /**
   * Show a success notification
   * @param message The success message
   * @param options Additional toast options
   */
  static success(message: string, options: ToastOptions = {}): void {
    this.notify(message, 'success', options);
  }

  /**
   * Show an error notification
   * @param message The error message
   * @param options Additional toast options
   */
  static error(message: string, options: ToastOptions = {}): void {
    this.notify(message, 'error', options);
  }

  /**
   * Show a warning notification
   * @param message The warning message
   * @param options Additional toast options
   */
  static warning(message: string, options: ToastOptions = {}): void {
    this.notify(message, 'warning', options);
  }

  /**
   * Show an info notification
   * @param message The info message
   * @param options Additional toast options
   */
  static info(message: string, options: ToastOptions = {}): void {
    this.notify(message, 'info', options);
  }

  /**
   * Show a promise notification
   * @param promise The promise to track
   * @param messages Messages for different states
   * @param options Additional toast options
   * @returns The original promise
   */
  static async promise<T>(
    promise: Promise<T>,
    messages: {
      pending?: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
    options: ToastOptions = {}
  ): Promise<T> {
    const toastId = toast.info(messages.pending || 'Processing...', {
      ...defaultOptions,
      ...options,
    });

    try {
      const result = await promise;
      
      const successMessage = typeof messages.success === 'function'
        ? messages.success(result)
        : messages.success;
      
      toast.update(toastId, {
        render: successMessage,
        type: 'success',
        autoClose: defaultOptions.autoClose,
      });
      
      return result;
    } catch (error) {
      const errorMessage = typeof messages.error === 'function'
        ? messages.error(error)
        : messages.error;
      
      toast.update(toastId, {
        render: errorMessage,
        type: 'error',
        autoClose: defaultOptions.autoClose,
      });
      
      throw error;
    }
  }
}

export { NotificationService };
