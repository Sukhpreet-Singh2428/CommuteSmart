// CONNECTED TO BACKEND: API service utility with environment-based URL configuration
import axios from 'axios';
import toast from 'react-hot-toast';

// Get backend URL from environment variables
const getBackendUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    console.warn('VITE_API_URL not found in environment, using default localhost');
    return 'http://localhost:5000';
  }
  // Strip trailing /api or /api/ if present in the env var to prevent /api/api duplication
  return url.replace(/\/api\/?$/, '');
};

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true, // Important for httpOnly JWT cookies
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Ensure cookies work in cross-origin scenarios
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Log error response
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data
      console.warn('User not authorized, clearing auth data');
      localStorage.removeItem('commuteSmart_user');

      // Only redirect to login on protected routes, NOT on public routes
      // Public routes: /, /login, /register, /auth/callback
      const publicRoutes = ['/', '/login', '/register', '/auth/callback'];
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isPublicRoute = publicRoutes.some(route => currentPath === route || currentPath.startsWith(route));

      if (typeof window !== 'undefined' && !isPublicRoute && currentPath !== '/login') {
        console.log('Redirecting to login page from protected route...');
        // Use a small delay to prevent immediate redirect loops
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        console.log('Not redirecting - user is on a public route');
      }
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden');
      toast.error('Access forbidden. You do not have permission to access this resource.');
    } else if (error.response?.status === 404) {
      // Not found
      console.error('Resource not found');
      toast.error('The requested resource was not found.');
    } else if (error.response?.status >= 500) {
      // Server error
      console.error('Server error:', error.response?.data?.message || 'Internal server error');
      toast.error('Server error. Please try again later.');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      // Network error
      console.error('Network connection failed');
      toast.error('Cannot connect to server. Please check your internet connection.');
    } else {
      // Generic error
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      console.error('Generic error:', errorMessage);
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// API endpoint functions
export const authAPI = {
  // CONNECTED TO BACKEND: Authentication endpoints
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (email: string, password: string, name?: string) =>
    api.post('/api/auth/signup', { email, password, name }),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  // Check if user is authenticated
  me: () =>
    api.get('/api/auth/me'),

  // Forgot password OTP flow
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post('/api/auth/verify-otp', { email, otp }),
  resetPassword: (resetToken: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { resetToken, newPassword }),

  // Email verification flow
  verifyEmail: (email: string, otp: string) =>
    api.post('/api/auth/verify-email', { email, otp }),
  resendVerification: (email: string) =>
    api.post('/api/auth/resend-verification', { email }),
};

export const locationAPI = {
  // CONNECTED TO BACKEND: Location tracking endpoints
  reportLocation: (lat: number, long: number, vehicleId?: string) =>
    api.post('/api/location/report', { lat, long, vehicleId }),
  
  getNearbyBuses: (lat: number, long: number) =>
    api.get(`/api/location/nearby?lat=${lat}&long=${long}`),
};

export const alertsAPI = {
  // CONNECTED TO BACKEND: Alerts endpoints
  getAlerts: (page: number = 1, limit: number = 20) =>
    api.get(`/api/alerts?page=${page}&limit=${limit}`),
  
  createAlert: (data: {
    message: string;
    lat: number;
    long: number;
    type?: string;
    severity?: string;
    location?: string;
    area?: string;
    routeFrom?: string;
    routeTo?: string;
    transportMode?: string;
    locationText?: string;
  }) => api.post('/api/alerts', data),
  
  upvoteAlert: (alertId: string) =>
    api.patch(`/api/alerts/${alertId}/upvote`),

  // CONNECTED TO BACKEND: Get nearby alerts within radius
  getNearbyAlerts: (lat: number, long: number, radius: number = 8) =>
    api.get(`/api/alerts/nearby?lat=${lat}&long=${long}&radius=${radius}`),

  // CONNECTED TO BACKEND: Delete own alert
  deleteAlert: (alertId: string) =>
    api.delete(`/api/alerts/${alertId}`),

  // CONNECTED TO BACKEND: Get route-specific alerts
  getRouteAlerts: (startLat: number, startLong: number, endLat: number, endLong: number, radius: number = 20) =>
    api.get(`/api/alerts/route?startLat=${startLat}&startLong=${startLong}&endLat=${endLat}&endLong=${endLong}&radius=${radius}`),

  // CONNECTED TO BACKEND: Create route-specific alert
  createRouteAlert: (startPoint: string, endPoint: string, startLat: number, startLong: number, endLat: number, endLong: number, message: string, type?: string, severity?: string) =>
    api.post('/api/alerts/route', { startPoint, endPoint, startLat, startLong, endLat, endLong, message, type, severity }),

  // PHASE 3: Comments
  addComment: (alertId: string, text: string) =>
    api.post(`/api/alerts/${alertId}/comments`, { text }),

  getComments: (alertId: string) =>
    api.get(`/api/alerts/${alertId}/comments`),

  deleteComment: (alertId: string, commentId: string) =>
    api.delete(`/api/alerts/${alertId}/comments/${commentId}`),
};

export const leaderboardAPI = {
  // CONNECTED TO BACKEND: Leaderboard endpoint
  getLeaderboard: (limit: number = 50) =>
    api.get(`/api/leaderboard?limit=${limit}`),
};

export const userAPI = {
  // CONNECTED TO BACKEND: User favourites endpoints
  getFavourites: () =>
    api.get('/api/users/me/favourites'),

  addFavourite: (routeId: string) =>
    api.post('/api/users/me/favourites', { routeId }),

  removeFavourite: (routeId: string) =>
    api.delete(`/api/users/me/favourites/${routeId}`),

  // CONNECTED TO BACKEND: User stats endpoint
  getStats: () =>
    api.get('/api/users/me/stats'),

  // PHASE 3: Profile update
  updateProfile: (data: {
    name?: string;
    username?: string;
    bio?: string;
    city?: string;
    profilePhoto?: string;
  }) => api.patch('/api/users/me/profile', data),
};

export const tripsAPI = {
  // PHASE 3: Trip endpoints
  createTrip: (data: {
    routeFrom: string;
    routeTo: string;
    distanceKm: number;
    transportMode: string;
    carbonSaved: number;
  }) => api.post('/api/trips', data),

  getMyTrips: () =>
    api.get('/api/trips/me'),
};

export const statsAPI = {
  // CONNECTED TO BACKEND: Live statistics
  getLiveStats: () =>
    api.get('/api/stats/live'),

  // CONNECTED TO BACKEND: Trending areas
  getTrendingAreas: () =>
    api.get('/api/stats/trending'),
};

export const routesAPI = {
  // CONNECTED TO BACKEND: Route suggestion endpoints
  suggestRoutes: (startLat: number, startLong: number, endLat: number, endLong: number) =>
    api.post('/api/routes/suggest', { startLat, startLong, endLat, endLong }),

  calculateCarbon: (distance: number, mode: string) =>
    api.post('/api/routes/calculate-carbon', { distance, mode }),
};

// Export backend URL for Socket.io connection
export const getSocketUrl = () => getBackendUrl();

export default api;
