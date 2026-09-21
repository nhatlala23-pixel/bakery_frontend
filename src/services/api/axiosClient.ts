import axios from 'axios';

const getBaseURL = () => {
  let url = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const axiosClient = axios.create({
  baseURL: getBaseURL(),
});

// Interceptors for Request
axiosClient.interceptors.request.use(
  (config) => {
    const isAdminPath = window.location.pathname.startsWith('/admin');
    const token = localStorage.getItem(isAdminPath ? 'adminAccessToken' : 'accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptors for Response
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error response is 401 and it's not a retry already
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const isAdminPath = window.location.pathname.startsWith('/admin');
      const isProtectedPath = isAdminPath || 
                              window.location.pathname.startsWith('/profile') || 
                              window.location.pathname.startsWith('/checkout');
      const tokenKey = isAdminPath ? 'adminAccessToken' : 'accessToken';
      const refreshKey = isAdminPath ? 'adminRefreshToken' : 'refreshToken';
      const userKey = isAdminPath ? 'adminUser' : 'user';

      const refreshToken = localStorage.getItem(refreshKey);
      if (refreshToken) {
        try {
          // Call refresh token API directly using axios to avoid recursion
          const response = await axios.post(`${axiosClient.defaults.baseURL || 'http://localhost:8080/api'}/auth/refresh?refreshToken=${refreshToken}`);
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          localStorage.setItem(tokenKey, accessToken);
          localStorage.setItem(refreshKey, newRefreshToken);

          axiosClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          processQueue(null, accessToken);
          return axiosClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh failed, clear storage and redirect only if on protected route
          localStorage.removeItem(tokenKey);
          localStorage.removeItem(refreshKey);
          localStorage.removeItem(userKey);
          if (isProtectedPath && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token, clear storage and redirect only if on protected route
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(refreshKey);
        localStorage.removeItem(userKey);
        if (isProtectedPath && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
