import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // sends cookies automatically for refresh token
});

// Request interceptor - attach access token to every request
api.interceptors.request.use(
  (config) => {
    // Access token stored in memory via auth context
    // Retrieved from window.__accessToken set by AuthContext
    if (typeof window !== "undefined" && window.__accessToken) {
      config.headers.Authorization = `Bearer ${window.__accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint - refresh token in cookie sent automatically
        const refreshResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;

        // Update in memory token
        if (typeof window !== "undefined") {
          window.__accessToken = newAccessToken;
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed - clear token and redirect to login
        if (typeof window !== "undefined") {
          window.__accessToken = undefined;
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;