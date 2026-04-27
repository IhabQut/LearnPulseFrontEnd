export const API_BASE = 'http://localhost:8000';

const TOKEN_KEY = 'learnpulse_token';

/** Get stored JWT token */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Store JWT token */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove JWT token */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Authenticated fetch wrapper.
 * Automatically attaches Authorization header and handles 401 auto-logout.
 */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid — clear auth state
    clearToken();
    localStorage.removeItem('learnpulse_user');
    // Redirect to login if not already there
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please login again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `API Error ${response.status}`);
  }

  return response.json();
}
