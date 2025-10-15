// @ts-nocheck
import authService from './authService';
import { API_CONFIG } from '../config';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'course' | 'live_class' | 'book' | 'welcome' | 'general';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

class NotificationService {
  private async getAuthHeaders() {
    const token = await authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${API_CONFIG.student}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(await this.getAuthHeaders()),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await this.makeRequest('/notifications');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await this.makeRequest(`/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    try {
      const notifications = await this.getNotifications();
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      await Promise.all(
        unreadNotifications.map(notification => 
          this.markNotificationAsRead(notification.id)
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
