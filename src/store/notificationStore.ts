import { create } from 'zustand';
import { API_BASE } from '../lib/api';

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
      const response = await fetch(`${API_BASE}/api/notifications/?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        set({ notifications: data });
      }
    } finally {
      set({ loading: false });
    }
  },
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (response.ok) {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, is_read: true } : n
          ),
        }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  },
  markAllAsRead: async () => {
    const { notifications } = get();
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    
    // In a real app, there would be a bulk endpoint. 
    // For now, we'll mark all as read locally for immediate feedback 
    // and potentially hit individual endpoints if necessary.
    // Let's assume there's no bulk endpoint yet, but we'll reflect it in the store.
    set({
      notifications: notifications.map(n => ({ ...n, is_read: true }))
    });
    
    // Try to hit individual endpoints (silent)
    unreadIds.forEach(id => {
      fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PUT' });
    });
  },
  deleteNotification: async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        }));
      }
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  },
}));