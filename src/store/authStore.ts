import { create } from 'zustand';
import { API_BASE } from '../lib/api';

type Role = 'student' | 'professor';

export interface User {
  id: string;
  name: string;
  role: Role;
  points: number;
  email: string;
  bio: string;
  zoom_enabled?: boolean;
  in_person_enabled?: boolean;
  office_hours: string;
  meeting_link: string;
  rating?: number;
  stats?: {
    completed_topics_count: number;
    quizzes_taken_count: number;
    average_quiz_score: number;
    courses_enrolled_count: number;
    managed_students_count: number;
    total_courses_count: number;
    recent_activity: {
      id: string;
      type: string;
      title: string;
      date: string;
      detail: string;
    }[];
  };
}

interface AuthState {
  user: User | null;
  login: (role: Role) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('learnpulse_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  login: async (role) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      console.log(response);
      const data = await response.json();
      localStorage.setItem('learnpulse_user', JSON.stringify(data));
      set({ user: data });
    } catch (error) {
      console.error("Login Error:", error);
    }
  },
  logout: () => {
    localStorage.removeItem('learnpulse_user');
    set({ user: null });
  },
  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/api/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const updated = await response.json();
      localStorage.setItem('learnpulse_user', JSON.stringify(updated));
      set({ user: updated });
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  },
  refreshUser: async () => {
    const user = get().user;
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE}/api/profile/${user.id}`);
      const data = await response.json();
      localStorage.setItem('learnpulse_user', JSON.stringify(data));
      set({ user: data });
    } catch (error) {
      console.error("Refresh user failed:", error);
    }
  }
}));
