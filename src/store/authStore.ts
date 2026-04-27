import { create } from 'zustand';
import { API_BASE, getToken, setToken, clearToken, apiFetch } from '../lib/api';

export interface User {
  id: string;
  name: string;
  role: 'student' | 'professor';
  email?: string;
  phone_number?: string;
  bio?: string;
  // Specialized data
  student?: {
    points: number;
    major: string;
    level: string;
    gpa: number;
    graduation_year?: number;
  };
  professor?: {
    department: string;
    expertise: string;
    academic_rank: string;
    office_location: string;
    meeting_link: string;
    zoom_enabled: boolean;
    in_person_enabled: boolean;
    office_hours: string; // JSON string
  };
  rating?: string;
  stats?: {
    completed_topics_count: number;
    quizzes_taken_count: number;
    average_quiz_score: number;
    courses_enrolled_count: number;
    managed_students_count: number;
    total_courses_count: number;
    recent_activity: any[];
  };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem('learnpulse_user');
    const token = getToken();
    // Only restore user if token also exists
    return (stored && token) ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Login failed' }));
        set({ loading: false, error: err.detail || 'Login failed' });
        return false;
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('learnpulse_user', JSON.stringify(data.user));
      set({ user: data.user, loading: false, error: null });
      return true;
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Network error' });
      return false;
    }
  },

  register: async (name, email, password, role) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Registration failed' }));
        set({ loading: false, error: err.detail || 'Registration failed' });
        return false;
      }

      const data = await response.json();
      setToken(data.access_token);
      localStorage.setItem('learnpulse_user', JSON.stringify(data.user));
      set({ user: data.user, loading: false, error: null });
      return true;
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Network error' });
      return false;
    }
  },

  logout: () => {
    clearToken();
    localStorage.removeItem('learnpulse_user');
    set({ user: null, error: null });
  },

  updateProfile: async (data) => {
    const user = get().user;
    if (!user) return;
    try {
      const updated = await apiFetch<any>(`/api/profile/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      localStorage.setItem('learnpulse_user', JSON.stringify(updated));
      set({ user: updated });
    } catch (error) {
      console.error("Profile update failed:", error);
    }
  },

  refreshUser: async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await apiFetch<any>('/api/auth/me');
      localStorage.setItem('learnpulse_user', JSON.stringify(data));
      set({ user: data });
    } catch (error) {
      console.error("Refresh user failed:", error);
      get().logout();
    }
  },

  clearError: () => set({ error: null }),
}));
