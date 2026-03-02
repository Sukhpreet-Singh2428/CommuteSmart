// CONNECTED TO BACKEND: API service utility with environment-based URL configuration
import axios from 'axios';

// Get backend URL from environment variables
const getBackendUrl = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) {
    console.warn('VITE_API_URL not found in environment, using default localhost');
    return 'http://localhost:5000';
  }
  return url;
};

// Create axios instance with default configuration
export const api = axios.create({
  baseURL: getBackendUrl(),
  withCredentials: true, // Important for httpOnly JWT cookies
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
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
      // Unauthorized - clear auth and redirect to login
      localStorage.removeItem('commuteSmart_user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('Access forbidden');
    } else if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
      console.error('Network connection failed');
    }
    
    return Promise.reject(error);
  }
);

// API endpoint functions
export const authAPI = {
  // CONNECTED TO BACKEND: Authentication endpoints
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  
  register: (email: string, password: string) =>
    api.post('/api/auth/signup', { email, password }),
  
  logout: () =>
    api.post('/api/auth/logout'),
  
  // Check if user is authenticated
  me: () =>
    api.get('/api/auth/me'),
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
  getAlerts: () =>
    api.get('/api/alerts'),
  
  createAlert: (message: string, lat: number, long: number, type?: string, severity?: string, location?: string) =>
    api.post('/api/alerts', { message, lat, long, type, severity, location }),
  
  upvoteAlert: (alertId: string) =>
    api.patch(`/api/alerts/${alertId}/upvote`),

  // CONNECTED TO BACKEND: Get route-specific alerts
  getRouteAlerts: (startLat: number, startLong: number, endLat: number, endLong: number) =>
    api.get(`/api/alerts/route?startLat=${startLat}&startLong=${startLong}&endLat=${endLat}&endLong=${endLong}`),

  // CONNECTED TO BACKEND: Create route-specific alert
  createRouteAlert: (startPoint: string, endPoint: string, startLat: number, startLong: number, endLat: number, endLong: number, message: string, type?: string, severity?: string) =>
    api.post('/api/alerts/route', { startPoint, endPoint, startLat, startLong, endLat, endLong, message, type, severity }),
};

// Export backend URL for Socket.io connection
export const getSocketUrl = () => getBackendUrl();

export default api;
