import { create } from 'zustand';
import { apiFetch } from '../lib/api';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  date: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  fetchNotifications: async (userId) => {
    set({ loading: true });
    try {
      const data = await apiFetch<any[]>(`/api/notifications/?user_id=${userId}`);
      set({ notifications: data });
    } finally {
      set({ loading: false });
    }
  },
  markAsRead: async (notificationId) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },
  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    
    set({
      notifications: notifications.map(n => ({ ...n, is_read: true }))
    });
    
    unreadIds.forEach(id => {
      apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    });
  },
  deleteNotification: async (notificationId) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
      }));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  },
}));