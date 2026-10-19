import apiClient from '@/shared/lib/api-client';
import type { Notification } from '@/features/notifications/types';

interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unread_count: number;
}

interface NotificationResponse {
  success: boolean;
  message: string;
}

class NotificationService {
  async getAll(): Promise<NotificationsResponse> {
    const response = await apiClient.get<NotificationsResponse>("/notifications");
    return response;
  }

  async markAsRead(id: string): Promise<void> {
    await apiClient.post<NotificationResponse>(`/notifications/${id}/read`);
  }

  async markAllAsRead(): Promise<void> {
    await apiClient.post<NotificationResponse>("/notifications/read-all");
  }
}

export default new NotificationService();

