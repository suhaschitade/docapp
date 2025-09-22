import { authService } from '../auth';
import { getApiBaseUrl } from '../api-config';

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T> {
  data: T;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface Notification {
  id: number;
  patientId?: number;
  patientName?: string;
  patientIdCode?: string;
  notificationType: string;
  title: string;
  message: string;
  priority: string;
  isRead: boolean;
  sentVia?: string;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationType {
  value: string;
  label: string;
  description: string;
}

export interface CreateNotificationRequest {
  patientId?: number;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  priority?: string;
  scheduledFor?: string;
}

class NotificationService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`🔄 Notification API Response: ${response.status} ${response.statusText} for ${response.url}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Notification API Error: ${response.status} - ${errorText}`);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    if (response.status === 204) {
      console.log('✅ Notification API Success: No content (204)');
      return {} as T;
    }
    
    const data = await response.json();
    console.log('✅ Notification API Success: Data received', data);
    return data;
  }

  // Get all notifications for current user
  async getNotifications(params?: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    notificationType?: string;
  }): Promise<ApiResponse<Notification[]>> {
    console.log('🔍 Getting notifications with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.notificationType) queryParams.append('notificationType', params.notificationType);

    const url = `${API_BASE_URL}/notifications?${queryParams}`;
    console.log('🌐 GET request to:', url);

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<ApiResponse<Notification[]>>(response);
  }

  // Get specific notification
  async getNotification(id: number): Promise<Notification> {
    console.log('🔍 Getting notification:', id);

    const response = await fetch(
      `${API_BASE_URL}/notifications/${id}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<Notification>(response);
  }

  // Mark notification as read
  async markAsRead(id: number): Promise<{ message: string }> {
    console.log('✅ Marking notification as read:', id);

    const response = await fetch(
      `${API_BASE_URL}/notifications/${id}/read`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<{ message: string }>(response);
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string }> {
    console.log('✅ Marking all notifications as read');

    const response = await fetch(
      `${API_BASE_URL}/notifications/mark-all-read`,
      {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<{ message: string }>(response);
  }

  // Get unread count
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await fetch(
      `${API_BASE_URL}/notifications/unread-count`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<{ unreadCount: number }>(response);
  }

  // Create new notification (Admin/Doctor only)
  async createNotification(notificationData: CreateNotificationRequest): Promise<{ id: number; message: string }> {
    console.log('➕ Creating notification with data:', notificationData);

    const response = await fetch(
      `${API_BASE_URL}/notifications`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(notificationData),
      }
    );

    return this.handleResponse<{ id: number; message: string }>(response);
  }

  // Delete notification
  async deleteNotification(id: number): Promise<{ message: string }> {
    console.log('🗑️ Deleting notification:', id);

    const response = await fetch(
      `${API_BASE_URL}/notifications/${id}`,
      {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<{ message: string }>(response);
  }

  // Get notification types
  async getNotificationTypes(): Promise<NotificationType[]> {
    const response = await fetch(
      `${API_BASE_URL}/notifications/types`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return this.handleResponse<NotificationType[]>(response);
  }

  // Get priority badge color
  getPriorityColor(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  // Get notification type badge color
  getTypeColor(type: string): string {
    switch (type) {
      case 'missed_appointment':
        return 'bg-red-100 text-red-800';
      case 'followup_due':
        return 'bg-blue-100 text-blue-800';
      case 'investigation_due':
        return 'bg-orange-100 text-orange-800';
      case 'treatment_reminder':
        return 'bg-purple-100 text-purple-800';
      case 'medication_reminder':
        return 'bg-green-100 text-green-800';
      case 'appointment_confirmed':
        return 'bg-green-100 text-green-800';
      case 'appointment_cancelled':
        return 'bg-red-100 text-red-800';
      case 'test_result_ready':
        return 'bg-blue-100 text-blue-800';
      case 'system_alert':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // Format notification type for display
  formatNotificationType(type: string): string {
    return type.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Get notification icon
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'missed_appointment':
        return '⚠️';
      case 'followup_due':
        return '📅';
      case 'investigation_due':
        return '🔬';
      case 'treatment_reminder':
        return '💊';
      case 'medication_reminder':
        return '💉';
      case 'appointment_confirmed':
        return '✅';
      case 'appointment_cancelled':
        return '❌';
      case 'test_result_ready':
        return '📋';
      case 'system_alert':
        return '🔔';
      default:
        return '📢';
    }
  }
}

export const notificationService = new NotificationService();
