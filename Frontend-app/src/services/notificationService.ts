// Notification Service - Handles push notifications and in-app notifications (No Database Version)

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

class NotificationService {
  async getNotifications(_userId?: string): Promise<NotificationResponse> {
    return {
      success: true,
      data: [],
      message: 'Database functionality has been removed'
    };
  }

  async markAsRead(_notificationId: string): Promise<NotificationResponse> {
    throw new Error('Notification marking is not available. Database functionality has been removed.');
  }

  async markAllAsRead(_userId: string): Promise<NotificationResponse> {
    throw new Error('Notification marking is not available. Database functionality has been removed.');
  }

  async deleteNotification(_notificationId: string): Promise<NotificationResponse> {
    throw new Error('Notification deletion is not available. Database functionality has been removed.');
  }

  async sendNotification(_userId: string, _notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>): Promise<NotificationResponse> {
    throw new Error('Notification sending is not available. Database functionality has been removed.');
  }

  async getUnreadCount(_userId: string): Promise<NotificationResponse> {
    return {
      success: true,
      data: { count: 0 },
      message: 'Database functionality has been removed'
    };
  }

  // Push notification methods
  async registerForPushNotifications(): Promise<NotificationResponse> {
    return {
      success: true,
      data: { registered: false },
      message: 'Push notifications are not available. Database functionality has been removed.'
    };
  }

  async unregisterFromPushNotifications(): Promise<NotificationResponse> {
    return {
      success: true,
      data: { unregistered: true },
      message: 'Push notifications are not available. Database functionality has been removed.'
    };
  }

  async updatePushToken(_token: string): Promise<NotificationResponse> {
    throw new Error('Push token update is not available. Database functionality has been removed.');
  }
}

export const notificationService = new NotificationService();
export default notificationService;