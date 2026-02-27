import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

// CONNECTED TO BACKEND: API base URL and Socket.io connection
const API_BASE_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_API_URL;

// Bus data structure from backend API
export interface Bus {
  vehicleId: string;
  latitude: number;
  longitude: number;
  eta?: string;
  route?: string;
  crowdLevel?: 'low' | 'medium' | 'high';
  type?: 'bus' | 'metro';
}

// User location for sharing
export interface UserLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// Hook return type
interface UseLocationServiceReturn {
  // Location state
  userLocation: [number, number] | null;
  buses: Bus[];
  isLoading: boolean;
  error: string | null;
  
  // Socket connection
  socket: Socket | null;
  
  // Actions
  fetchNearbyBuses: (lat: number, lng: number) => Promise<void>;
  shareLocation: (lat: number, lng: number) => Promise<void>;
  getCurrentLocation: () => Promise<[number, number] | null>;
  reconnectSocket: () => void;
}

// Default Ludhiana coordinates
const DEFAULT_LOCATION: [number, number] = [30.91, 75.86];

export const useLocationService = (): UseLocationServiceReturn => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(DEFAULT_LOCATION);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // CONNECTED TO BACKEND: Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to backend Socket.io server');
      toast.success('Real-time updates connected! 🚌');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
      toast.error('Real-time updates disconnected');
    });

    // CONNECTED TO BACKEND: Listen for real-time location updates
    newSocket.on('locationUpdate', (data: { buses: Bus[] }) => {
      console.log('Received real-time location update:', data);
      setBuses(data.buses);
    });

    newSocket.on('error', (err: any) => {
      console.error('Socket error:', err);
      setError('Connection error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // CONNECTED TO BACKEND: Fetch nearby buses from API
  const fetchNearbyBuses = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/location/nearby?lat=${lat}&long=${lng}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setBuses(response.data.buses);
        console.log('Fetched nearby buses:', response.data.buses);
      } else {
        throw new Error('Failed to fetch buses');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch nearby buses';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching buses:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // CONNECTED TO BACKEND: Share user location with API
  const shareLocation = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const locationData: UserLocation = {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now()
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/location/report`,
        locationData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success('Location shared successfully! 📍');
        console.log('Location shared:', response.data);
      } else {
        throw new Error('Failed to share location');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to share location';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error sharing location:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get current user location using browser geolocation
  const getCurrentLocation = useCallback(async (): Promise<[number, number] | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        resolve(DEFAULT_LOCATION);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast('Using default location (Ludhiana)', { icon: '⚠️' });
          setUserLocation(DEFAULT_LOCATION);
          resolve(DEFAULT_LOCATION);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute cache
        }
      );
    });
  }, []);

  // Reconnect socket connection
  const reconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    
    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('locationUpdate', (data: { buses: Bus[] }) => {
      setBuses(data.buses);
    });
    
    setSocket(newSocket);
  }, [socket]);

  // Initialize with current location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      const location = await getCurrentLocation();
      if (location) {
        await fetchNearbyBuses(location[0], location[1]);
      }
    };
    
    initializeLocation();
  }, [getCurrentLocation, fetchNearbyBuses]);

  return {
    userLocation,
    buses,
    isLoading,
    error,
    socket,
    fetchNearbyBuses,
    shareLocation,
    getCurrentLocation,
    reconnectSocket
  };
};
