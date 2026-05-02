import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // send cookies automatically
});

// Public paths where a 401 should NOT redirect to /login
const PUBLIC_PATHS = ['/', '/login', '/signup'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const requestUrl = err.config?.url || '';
      const currentPath = window.location.pathname;
      const isPublicPage = PUBLIC_PATHS.some(p => currentPath === p || currentPath.startsWith(p + '/'));
      const isSessionCheck = requestUrl.includes('/auth/me');

      // Only force-redirect to login if:
      // - We're on a protected page (not a public page)
      // - The 401 is NOT from the silent session check on mount
      if (!isPublicPage && !isSessionCheck) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // On public pages, just clear local state silently
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
