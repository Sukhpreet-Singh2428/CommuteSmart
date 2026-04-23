import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { locationAPI, getSocketUrl } from '../lib/api';
import toast from 'react-hot-toast';

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
  shareLocation: (lat: number, lng: number, vehicleId?: string) => Promise<void>;
  getCurrentLocation: () => Promise<[number, number] | null>;
  reconnectSocket: () => void;
}

// Default Chandigarh coordinates (more central for Punjab region)
const DEFAULT_LOCATION: [number, number] = [30.73, 76.78];

export const useLocationService = (): UseLocationServiceReturn => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // CONNECTED TO BACKEND: Initialize Socket.io connection
  useEffect(() => {
    const newSocket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to backend Socket.io server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.io server');
    });

    // CONNECTED TO BACKEND: Listen for real-time location updates
    newSocket.on('locationUpdate', (data: { vehicleId: string; lat: number; long: number }) => {
      console.log('Received real-time location update:', data);
      if (data.vehicleId && data.lat && data.long) {
        setBuses(prev => {
          const existing = prev.findIndex(b => b.vehicleId === data.vehicleId);
          const updatedBus: Bus = {
            vehicleId: data.vehicleId,
            latitude: data.lat,
            longitude: data.long,
            eta: 'Live',
            route: 'Unknown',
            crowdLevel: 'medium',
            type: 'bus'
          };
          if (existing >= 0) {
            const newBuses = [...prev];
            newBuses[existing] = updatedBus;
            return newBuses;
          }
          return [...prev, updatedBus];
        });
      }
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
      const response = await locationAPI.getNearbyBuses(lat, lng);
      
      if (response.data.success) {
        // Transform backend data to match frontend Bus interface
        const transformedBuses = (response.data.buses || []).map((bus: any) => ({
          vehicleId: bus.vehicleId || `bus-${bus._id}`,
          latitude: bus.location?.coordinates?.[1] || bus.latitude || lat,
          longitude: bus.location?.coordinates?.[0] || bus.longitude || lng,
          eta: bus.eta || 'Calculating...',
          route: bus.route || 'Unknown',
          crowdLevel: bus.crowdLevel || 'medium',
          type: bus.type || 'bus'
        }));
        
        setBuses(transformedBuses);
        console.log('Fetched nearby buses:', transformedBuses);
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
  const shareLocation = useCallback(async (lat: number, lng: number, vehicleId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const locationData = {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
        vehicleId
      };

      const response = await locationAPI.reportLocation(lat, lng, vehicleId);
      
      if (response.data.success) {
        console.log('Location shared successfully:', response.data);
        toast.success('Location shared successfully! 📍');
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
      console.log('📍 Requesting user location...');
      
      if (!navigator.geolocation) {
        console.error('❌ Geolocation not supported');
        resolve(DEFAULT_LOCATION);
        return;
      }

      console.log('📍 Calling navigator.geolocation.getCurrentPosition...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          console.log('✅ User location obtained:', location);
          setUserLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('❌ Geolocation error:', error);
          let errorMessage = 'Location access denied';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied by user';
              console.log('❌ User denied location permission');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'Unknown error occurred';
              break;
          }
          
          console.log(`Using default location (Chandigarh) due to: ${errorMessage}`);
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
    
    const newSocket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('locationUpdate', (data: { vehicleId: string; lat: number; long: number }) => {
      if (data.vehicleId && data.lat && data.long) {
        setBuses(prev => {
          const existing = prev.findIndex(b => b.vehicleId === data.vehicleId);
          const updatedBus: Bus = {
            vehicleId: data.vehicleId,
            latitude: data.lat,
            longitude: data.long,
            eta: 'Live',
            route: 'Unknown',
            crowdLevel: 'medium',
            type: 'bus'
          };
          if (existing >= 0) {
            const newBuses = [...prev];
            newBuses[existing] = updatedBus;
            return newBuses;
          }
          return [...prev, updatedBus];
        });
      }
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
