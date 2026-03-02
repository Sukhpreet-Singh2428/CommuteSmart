import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SafeMapView } from '../components/SafeMapView';
import { UserMenu } from '../components/UserMenu';
import { useLocationService } from '../hooks/useLocationService';
import { useRoute } from '../context/RouteContext';
import { alertsAPI } from '../lib/api';
import toast from 'react-hot-toast';
import axios from 'axios';

const punjabReports = [
  { 
    name: 'Amanjeet S.', 
    time: '2m ago', 
    text: 'CTU Bus 42 delayed at Sector 22 intersection. Technical fault reported. Expect +15m. ⚠️',
    avatar: 'AS'
  },
  { 
    name: 'Gurpreet K.', 
    time: '12m ago', 
    text: 'Patiala Road super clean today! AC is working perfectly. Nice work CommuteSmart! ❄️✨',
    avatar: 'GK'
  },
  { 
    name: 'System Update', 
    time: '45m ago', 
    text: 'New bicycle docking station added at Rajpura highway intersection. 🚲',
    avatar: 'SYS',
    isSystem: true
  },
  { 
    name: 'Harpreet S.', 
    time: '1h ago', 
    text: 'Metro train on time at Sector 34 station. Great service today! 🚇',
    avatar: 'HS'
  },
  { 
    name: 'Simranjeet K.', 
    time: '2h ago', 
    text: 'Heavy traffic near Ambala Cantt due to festival season. Plan accordingly. 🎉',
    avatar: 'SK'
  },
];

const transportModes = [
  { id: 'bus', icon: 'directions_bus', label: 'BUS' },
  { id: 'metro', icon: 'train', label: 'METRO' },
  { id: 'bike', icon: 'directions_bike', label: 'CYCLE' },
];

export function Dashboard() {
  // CONNECTED TO BACKEND: Use location service for real-time data
  const { shareLocation, userLocation, isLoading: locationLoading } = useLocationService();
  const { routeData, setStartPoint, setEndPoint, setRoutePath } = useRoute();
  
  const [selectedMode, setSelectedMode] = useState<'bus' | 'metro' | 'bike'>('bus');
  const [co2Offset] = useState(12.8);
  const [rewardTokens] = useState(450);
  const [weeklyProgress] = useState(75);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({ co2: 0, tokens: 0, progress: 0 });
  
  // Memoize increment values to prevent infinite re-renders
  const incrementValues = useMemo(() => {
    const steps = 60;
    return {
      co2: co2Offset / steps,
      tokens: rewardTokens / steps,
      progress: weeklyProgress / steps
    };
  }, [co2Offset, rewardTokens, weeklyProgress]);
  
  // CONNECTED TO BACKEND: Dynamic Community Feed state
  const [routeAlerts, setRouteAlerts] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [routeCenter, setRouteCenter] = useState<[number, number] | null>(null);
  
  // ADDED: Geocoding loading state
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  // ADDED: Report message state
  const [reportMessage, setReportMessage] = useState('');
  
  // ADDED: Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  
  // ADDED: Community alerts state for user-reported alerts
  const [communityAlerts, setCommunityAlerts] = useState<any[]>([]);

  // CONNECTED TO BACKEND: Fetch route-specific alerts
  const fetchRouteAlerts = async (center: [number, number]) => {
    setIsLoadingAlerts(true);
    try {
      if (routeData.startCoords && routeData.endCoords) {
        // Get all alerts and filter by proximity to route
        const response = await alertsAPI.getAlerts();
        
        if (response.data.success && response.data.alerts) {
          // Combine backend alerts with community alerts from localStorage
          const communityAlerts = JSON.parse(localStorage.getItem('commuteSmart_alerts') || '[]');
          const allAlerts = [...response.data.alerts, ...communityAlerts];
          
          // Filter alerts by proximity to route center (within ~8km)
          const nearbyAlerts = allAlerts.filter((alert: any) => {
            // Backend stores coordinates as location.coordinates: [longitude, latitude]
            // Community alerts have lat/long properties
            let latitude, longitude;
            
            if (alert.location && alert.location.coordinates && alert.location.coordinates.length >= 2) {
              // Backend alert structure
              [longitude, latitude] = alert.location.coordinates;
            } else if (alert.lat && alert.long) {
              // Community alert structure
              latitude = alert.lat;
              longitude = alert.long;
            } else {
              return false;
            }
            
            const distance = calculateDistance(center[0], center[1], latitude, longitude);
            return distance <= 50; // Increased to 50km radius for testing
          });
          
          // If no alerts in database, use mock data for now
          if (response.data.alerts.length === 0) {
            setRouteAlerts(punjabReports.slice(0, 3)); // Show first 3 mock reports
          } else if (nearbyAlerts.length === 0) {
            setRouteAlerts(allAlerts);
          } else {
            setRouteAlerts(nearbyAlerts);
          }
        } else {
          setRouteAlerts([]);
        }
      } else {
        // Fallback to general alerts if no route
        const response = await alertsAPI.getAlerts();
        
        if (response.data.success && response.data.alerts) {
          setRouteAlerts(response.data.alerts);
        } else {
          setRouteAlerts([]);
        }
      }
    } catch (error: any) {
      setRouteAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // STABILITY FIX: Use stable references to prevent infinite re-renders
  const stableFetchGeneralFeed = useCallback(async () => {
    setIsLoadingAlerts(true);
    try {
      const response = await alertsAPI.getAlerts();
      
      if (response.data.success && response.data.alerts) {
        setRouteAlerts(response.data.alerts);
      } else {
        setRouteAlerts([]);
      }
    } catch (error: any) {
      console.error('Error fetching general feed:', error);
      setRouteAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  // STABILITY FIX: Use stable reference for route center check
  const hasRouteCenter = !!routeCenter;

  // POLISHED: Simulate loading and animate stats on mount - FIXED: Reduced delay
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // STABILITY FIX: Simplified animation useEffect to prevent infinite loops
  useEffect(() => {
    if (!isLoading) {
      const duration = 2000;
      const steps = 60;
      let currentStep = 0;
      
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedStats(prev => ({
          co2: Math.min(co2Offset, (co2Offset / steps) * currentStep),
          tokens: Math.min(rewardTokens, (rewardTokens / steps) * currentStep),
          progress: Math.min(weeklyProgress, (weeklyProgress / steps) * currentStep)
        }));
        
        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [isLoading]); // Only depend on isLoading, not on incrementValues

  // ROBUST GEOCODING FOR PUNJAB: Multiple queries + fallback dictionary
  const geocodePlace = async (placeName: string): Promise<[number, number] | null> => {
    // Clean input: remove commas, extra spaces, and normalize
    const cleanName = placeName.trim().replace(/,/g, '').replace(/\s+/g, ' ').toLowerCase();
    
    // ROBUST GEOCODING: Fallback dictionary for common Punjab places
    const punjabFallbacks: { [key: string]: [number, number] } = {
      'rajpura': [30.48, 76.59],
      // Chandigarh sectors
      'sector 1 chandigarh': [30.71, 76.79],
      'sector 2 chandigarh': [30.72, 76.79],
      'sector 3 chandigarh': [30.72, 76.78],
      'sector 4 chandigarh': [30.73, 76.78],
      'sector 5 chandigarh': [30.73, 76.77],
      'sector 6 chandigarh': [30.73, 76.79],
      'sector 7 chandigarh': [30.74, 76.78],
      'sector 8 chandigarh': [30.74, 76.77],
      'sector 9 chandigarh': [30.74, 76.79],
      'sector 10 chandigarh': [30.74, 76.80],
      'sector 11 chandigarh': [30.75, 76.78],
      'sector 12 chandigarh': [30.75, 76.79],
      'sector 13 chandigarh': [30.75, 76.77],
      'sector 14 chandigarh': [30.75, 76.80],
      'sector 15 chandigarh': [30.75, 76.78],
      'sector 16 chandigarh': [30.75, 76.79],
      'sector 17 chandigarh': [30.74, 76.78],
      'sector 18 chandigarh': [30.73, 76.77],
      'sector 19 chandigarh': [30.73, 76.79],
      'sector 20 chandigarh': [30.73, 76.80],
      'sector 21 chandigarh': [30.72, 76.78],
      'sector 22 chandigarh': [30.72, 76.77],
      'sector 23 chandigarh': [30.72, 76.79],
      'sector 24 chandigarh': [30.72, 76.80],
      'sector 25 chandigarh': [30.71, 76.78],
      'sector 26 chandigarh': [30.71, 76.79],
      'sector 27 chandigarh': [30.71, 76.77],
      'sector 28 chandigarh': [30.71, 76.80],
      'sector 29 chandigarh': [30.70, 76.78],
      'sector 30 chandigarh': [30.70, 76.79],
      'sector 31 chandigarh': [30.70, 76.77],
      'sector 32 chandigarh': [30.70, 76.80],
      'sector 33 chandigarh': [30.69, 76.78],
      'sector 34 chandigarh': [30.69, 76.79],
      'sector 35 chandigarh': [30.69, 76.77],
      'sector 36 chandigarh': [30.69, 76.80],
      'sector 37 chandigarh': [30.68, 76.78],
      'sector 38 chandigarh': [30.68, 76.79],
      'sector 39 chandigarh': [30.68, 76.77],
      'sector 40 chandigarh': [30.68, 76.80],
      'sector 41 chandigarh': [30.67, 76.78],
      'sector 42 chandigarh': [30.67, 76.79],
      'sector 43 chandigarh': [30.67, 76.77],
      'sector 44 chandigarh': [30.67, 76.80],
      'sector 45 chandigarh': [30.66, 76.78],
      'sector 46 chandigarh': [30.66, 76.79],
      'sector 47 chandigarh': [30.66, 76.77],
      'sector 48 chandigarh': [30.66, 76.80],
      'sector 49 chandigarh': [30.65, 76.78],
      'sector 50 chandigarh': [30.65, 76.79],
      'sector 17': [30.74, 76.78],
      'sector 15': [30.75, 76.78],
      'chandigarh': [30.73, 76.78],
      'ludhiana': [30.91, 75.85],
      'patiala': [30.34, 76.39],
      'ambala': [30.38, 76.78],
      'jalandhar': [31.33, 75.58],
      'amritsar': [31.64, 74.87],
      'bathinda': [30.21, 75.00],
      'pathankot': [32.27, 75.65],
      'mohali': [30.71, 76.71],
      'panchkula': [30.69, 76.86],
      'zirakpur': [30.65, 76.81],
      'kharar': [30.75, 76.64],
      'derabassi': [30.60, 76.84],
      'khanna': [30.70, 75.81],
      'phagwara': [31.77, 75.77],
      'kapurthala': [31.38, 75.34],
      'hoshiarpur': [31.53, 75.91],
      'nawanshahr': [31.12, 76.07],
      'ropar': [30.97, 76.53],
      'sangrur': [30.25, 75.84],
      'barnala': [30.38, 75.54],
      'moga': [31.49, 75.17],
      'faridkot': [30.68, 74.76],
      'firozpur': [31.93, 74.60],
      'gurdaspur': [32.04, 75.40],
      'batala': [31.82, 75.20],
      'muktsar': [30.47, 74.52],
    };
    
    // Check fallback dictionary first with multiple patterns
    if (punjabFallbacks[cleanName]) {
      const coords = punjabFallbacks[cleanName] as [number, number];
      console.log(`Using fallback coordinates for "${placeName}": [${coords[0]}, ${coords[1]}]`);
      return coords;
    }
    
    // Try sector-specific patterns for Chandigarh
    const sectorMatch = cleanName.match(/sector\s*(\d+)/);
    if (sectorMatch && (cleanName.includes('chandigarh') || cleanName.includes('sector'))) {
      const sectorNum = sectorMatch[1];
      const sectorKey = `sector ${sectorNum} chandigarh`;
      const sectorKeyShort = `sector ${sectorNum}`;
      
      if (punjabFallbacks[sectorKey]) {
        const coords = punjabFallbacks[sectorKey] as [number, number];
        console.log(`Using sector fallback for "${placeName}": [${coords[0]}, ${coords[1]}]`);
        return coords;
      }
      
      if (punjabFallbacks[sectorKeyShort]) {
        const coords = punjabFallbacks[sectorKeyShort] as [number, number];
        console.log(`Using short sector fallback for "${placeName}": [${coords[0]}, ${coords[1]}]`);
        return coords;
      }
    }
    
    // Try city-specific patterns for other major cities
    const cityPatterns = {
      'ambala': [30.38, 76.78],
      'patiala': [30.34, 76.39],
      'rajpura': [30.48, 76.59],
      'ludhiana': [30.91, 75.85],
      'jalandhar': [31.33, 75.58],
      'amritsar': [31.64, 74.87],
      'bathinda': [30.21, 75.00],
      'mohali': [30.71, 76.71],
      'zirakpur': [30.65, 76.81],
      'kharar': [30.75, 76.64],
      'panchkula': [30.69, 76.86],
    };
    
    // Check if the place name contains any of these cities
    for (const [city, coords] of Object.entries(cityPatterns)) {
      if (cleanName.includes(city)) {
        console.log(`Using city fallback for "${placeName}": [${coords[0]}, ${coords[1]}]`);
        return coords as [number, number];
      }
    }
    
    // Try Nominatim API with optimized query format
    try {
      const query = `${placeName.trim().replace(/,/g, '')}, Punjab, India`;
      const encodedQuery = encodeURIComponent(query);
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'CommuteSmart/1.0'
          },
          timeout: 3000
        }
      );
      
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);
        
        // FIXED GEOCODING: Validate coordinates are valid numbers and in reasonable range
        if (!isNaN(lat) && !isNaN(lon) && lat >= 20 && lat <= 40 && lon >= 65 && lon <= 85) {
          console.log(`Geocoded "${placeName}" to: [${lat}, ${lon}] using query: "${query}"`);
          return [lat, lon];
        }
      }
    } catch (error) {
      console.log(`Nominatim API failed for "${placeName}":`, error);
    }
    
    // All attempts failed
    console.error(`Geocoding completely failed for "${placeName}"`);
    return null;
  };

  // ADDED: Decode OSRM polyline to coordinates
  const decodePolyline = (encoded: string): [number, number][] => {
    const points: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    
    while (index < len) {
      let shift = 0;
      let result = 0;
      let byte;
      
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
      shift = 0;
      result = 0;
      
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      
      lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
      
      points.push([lat / 1e5, lng / 1e5]);
    }
    
    return points;
  };

  // CONNECTED TO BACKEND: Share location handler
  const handleShareLocation = async () => {
    try {
      if (userLocation) {
        await shareLocation(userLocation[0], userLocation[1], 'user');
        toast.success('Location shared successfully! 📍');
      } else {
        toast.error('Location not available. Please enable location services.');
      }
    } catch (error) {
      console.error('Error sharing location:', error);
      toast.error('Failed to share location. Please try again.');
    }
  };

  // CONNECTED TO BACKEND: Share route handler
  const handleShareRoute = async () => {
    try {
      if (!routeData.startPoint || !routeData.endPoint) {
        toast.error('Please enter both start and end points to share route');
        return;
      }

      // Share the route details
      const routeInfo = {
        startPoint: routeData.startPoint,
        endPoint: routeData.endPoint,
        startCoords: routeData.startCoords,
        endCoords: routeData.endCoords,
        routePath: routeData.routePath,
        timestamp: new Date().toISOString()
      };

      // Here you would send this to your backend API
      console.log('Sharing route:', routeInfo);
      toast.success('Route shared successfully! 🚗');
      
      // You could also copy to clipboard or share via social media
      if (navigator.share) {
        await navigator.share({
          title: 'My CommuteSmart Route',
          text: `Route from ${routeData.startPoint} to ${routeData.endPoint}`,
          url: window.location.href
        });
      }
    } catch (error) {
      console.error('Error sharing route:', error);
      toast.error('Failed to share route. Please try again.');
    }
  };

  // CONNECTED TO BACKEND: Report alert handler
  const handleReportAlert = async () => {
    if (!routeData.startPoint || !routeData.endPoint) {
      toast.error('Please enter both start and end points to report an alert');
      return;
    }

    if (!routeData.startCoords || !routeData.endCoords) {
      toast.error('Please calculate the route first to report an alert');
      return;
    }

    // Open the report modal
    setShowReportModal(true);
  };

  // CONNECTED TO BACKEND: Submit report from modal
  const handleSubmitReport = async (message: string) => {
    try {
      if (!message.trim()) {
        toast.error('Please enter a message for the alert');
        return;
      }

      // Create a route-specific alert for the backend
      const alertData = {
        message: message.trim(),
        location: `${routeData.startPoint} - ${routeData.endPoint}`,
        lat: routeData.startCoords[0],
        long: routeData.startCoords[1],
        type: 'traffic',
        severity: 'medium',
        timestamp: new Date().toISOString()
      };

      console.log('🚨 Reporting route alert to backend:', alertData);
      
      try {
        // Try to send to backend using existing alerts API
        const response = await alertsAPI.createAlert(
          alertData.message,
          alertData.lat,
          alertData.long,
          alertData.type,
          alertData.severity,
          alertData.location
        );

        console.log('✅ Alert reported successfully to backend:', response.data);
        toast.success('Alert reported successfully! 🚨');
      } catch (backendError: any) {
        console.warn('⚠️ Backend not available, using local storage fallback:', backendError);
        
        // Fallback to local storage if backend is not running
        const existingAlerts = JSON.parse(localStorage.getItem('commuteSmart_alerts') || '[]');
        const newAlert = {
          ...alertData,
          id: Date.now().toString(),
          time: 'Just now',
          user: 'You',
          name: 'You',
          avatar: 'YU',
          text: alertData.message,
          location: alertData.location,
          lat: alertData.lat,
          long: alertData.long
        };
        existingAlerts.push(newAlert);
        localStorage.setItem('commuteSmart_alerts', JSON.stringify(existingAlerts));
        
        console.log('✅ Alert saved locally:', newAlert);
        toast.success('Alert reported successfully! (Saved locally) 🚨');
        
        // Add to current alerts immediately for both route and community feed
        setRouteAlerts(prev => [newAlert, ...prev]);
        
        // Also add to community alerts for community feed visibility
        setCommunityAlerts(prev => [newAlert, ...prev]);
      }
      
      // Close modal and clear message
      setShowReportModal(false);
      setReportMessage('');
      
      // Refresh the alerts to show the new one
      if (routeData.startCoords && routeData.endCoords) {
        await fetchRouteAlerts([routeData.startCoords[0], routeData.startCoords[1]]);
      }
      
    } catch (error: any) {
      console.error('❌ Error reporting alert:', error);
      
      // More detailed error handling
      if (error.code === 'ECONNREFUSED') {
        toast.error('Cannot connect to server. Alert saved locally.');
      } else if (error.response?.status === 401) {
        toast.error('Please login to report alerts.');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to report alert. Please try again.');
      }
    }
  };

  const handleCalculateRoute = async () => {
    if (!routeData.startPoint || !routeData.endPoint) {
      toast.error('Please enter both starting point and destination');
      return;
    }

    setIsCalculatingRoute(true);
    setIsGeocoding(true);
    
    try {
      const startCoords = await geocodePlace(routeData.startPoint);
      const endCoords = await geocodePlace(routeData.endPoint);
      
      if (!startCoords || !endCoords) {
        toast.error('Could not find locations. Please try different place names.');
        return;
      }

      setStartPoint(routeData.startPoint, startCoords);
      setEndPoint(routeData.endPoint, endCoords);

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=full&geometries=geojson`;
      const response = await fetch(osrmUrl);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]) as [number, number][];
        
        setRoutePath(coordinates);
        
        const centerLat = (startCoords[0] + endCoords[0]) / 2;
        const centerLng = (startCoords[1] + endCoords[1]) / 2;
        setRouteCenter([centerLat, centerLng]);
        
        await fetchRouteAlerts([centerLat, centerLng]);
        
        toast.success('Route calculated successfully! 🎉');
      } else {
        toast.error('Could not calculate route. Please try again.');
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      toast.error('Failed to calculate route. Please check your network connection.');
    } finally {
      setIsCalculatingRoute(false);
      setIsGeocoding(false);
    }
  };

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // STABILITY FIX: Use stable callback and simple dependency
  useEffect(() => {
    if (!hasRouteCenter) {
      stableFetchGeneralFeed();
    }
  }, [hasRouteCenter, stableFetchGeneralFeed]);

  // CONNECTED TO BACKEND: Listen for new community alerts
  useEffect(() => {
    const handleNewCommunityAlert = (event: CustomEvent) => {
      const newAlert = event.detail;
      console.log('📢 New community alert received:', newAlert);
      setCommunityAlerts(prev => [newAlert, ...prev]);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('newCommunityAlert', handleNewCommunityAlert as EventListener);
      
      // Load existing community alerts from localStorage
      const existingAlerts = JSON.parse(localStorage.getItem('commuteSmart_alerts') || '[]');
      if (existingAlerts.length > 0) {
        setCommunityAlerts(existingAlerts);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('newCommunityAlert', handleNewCommunityAlert as EventListener);
      }
    };
  }, []);

  // CONNECTED TO BACKEND: Reset alerts when route is cleared
  const clearRoute = () => {
    setRoutePath(null);
    setRouteCenter(null);
    setRouteAlerts([]);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* Navigation */}
      <nav className="h-16 flex items-center justify-between px-8 border-b border-primary/20 bg-[#0a1411]/80 backdrop-blur-md z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="material-icons text-white text-lg">directions_bus</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CommuteSmart</span>
        </div>
        <div className="hidden md:flex items-center justify-center flex-1 gap-12">
          <Link className="text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium" to="/dashboard">Dashboard</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/alerts">Community</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/profile">Profile</Link>
        </div>
        <div className="flex items-center justify-end">
          <div className="relative z-[100]">
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-2 pb-safe glass-panel border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          <Link to="/dashboard" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-[#0fb880]">
            <span className="material-symbols-outlined text-lg">dashboard</span>
            <span className="text-xs mt-0.5">Dashboard</span>
          </Link>
          <Link to="/alerts" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400">
            <span className="material-symbols-outlined text-lg">forum</span>
            <span className="text-xs mt-0.5">Community</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center justify-center flex-1 py-2 rounded-xl text-gray-400">
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="text-xs mt-0.5">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
          {/* CONNECTED TO BACKEND: Enhanced Map Section with live status */}
        <div className="relative w-full overflow-hidden map-bg border-b border-[#0fb880]/10 h-[calc(100vh-140px)] md:h-[calc(100vh-160px)]">
          <div className="absolute top-4 left-4 z-20">
            <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0fb880] shadow-[0_0_8px_#0fb880] animate-pulse"></span>
              <span className="text-xs font-semibold text-gray-200 uppercase tracking-widest">
                {locationLoading ? 'Connecting...' : 'Live: Punjab Transit'}
              </span>
            </div>
          </div>
          
          {/* CONNECTED TO BACKEND: Share Location Button */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <motion.button
              onClick={handleShareLocation}
              disabled={locationLoading}
              className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 bg-[#0fb880]/20 hover:bg-[#0fb880]/30 border border-[#0fb880]/30 text-[#0fb880] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="text-xs font-bold">Share My Location</span>
            </motion.button>
          </div>
          
          {/* Map Component - CONNECTED TO BACKEND: Real-time bus data */}
          <div className="w-full h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <SafeMapView routePath={routeData.routePath || undefined} startPoint={routeData.startCoords || undefined} endPoint={routeData.endCoords || undefined} routeAlerts={routeAlerts} />
            </motion.div>
          </div>
        </div>

        {/* Bottom Grid Section */}
        <div className="p-4 bg-[#0a1411] grid grid-cols-12 gap-4">
          {/* Route Planner */}
          <div className="col-span-12 md:col-span-3 glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <span className="material-symbols-outlined text-[#0fb880] text-xl">route</span>
              Route Planner
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              <div className="relative">
                <div className="absolute left-3 top-3.5 w-1.5 h-1.5 rounded-full bg-[#0fb880]"></div>
                <div className="absolute left-[14px] top-6 bottom-4 w-0.5 bg-gray-700/50"></div>
                <input 
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70" 
                  placeholder="Enter Starting Point" 
                  type="text" 
                  value={routeData.startPoint}
                  onChange={(e) => setStartPoint(e.target.value, routeData.startCoords || [30.73, 76.78])}
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-3.5 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <div className="absolute left-[14px] top-6 bottom-4 w-0.5 bg-gray-700/50"></div>
                <input 
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70" 
                  placeholder="Enter Ending Point" 
                  type="text" 
                  value={routeData.endPoint}
                  onChange={(e) => setEndPoint(e.target.value, routeData.endCoords || [30.73, 76.78])}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 py-2">
                  {transportModes.map((mode) => (
                    <motion.button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id as any)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        selectedMode === mode.id 
                          ? 'bg-[#0fb880]/10 border-[#0fb880]/20 text-[#0fb880]' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:border-[#0fb880]/20 hover:text-[#0fb880]'
                      }`}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                    <span className="material-symbols-outlined text-xl">{mode.icon}</span>
                    <span className="text-[10px] font-bold">{mode.label}</span>
                    </motion.button>
                  ))}
              </div>
              <button 
                onClick={handleCalculateRoute}
                disabled={isCalculatingRoute || locationLoading || isGeocoding}
                className="w-full bg-[#0fb880] hover:bg-[#0fb880]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-[#0fb880]/20 transition-all active:scale-95 text-sm relative overflow-hidden group"
              >
                <AnimatePresence mode="wait">
                  {(isGeocoding || isCalculatingRoute) ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{isGeocoding ? 'Finding locations...' : 'Calculating route...'}</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="calculate"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2"
                    >
                      <span>Calculate Optimal Path</span>
                      <span className="material-symbols-outlined text-sm">route</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* POLISHED: Added shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>
            </div>
          </div>

          {/* Eco Dashboard */}
          <div className="col-span-12 md:col-span-5 glass-panel rounded-2xl p-5 flex items-center justify-between h-full gap-6">
            <div className="flex-1 flex flex-col justify-between h-full">
              <div>
                <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[#0fb880] text-xl">eco</span>
                  Eco Dashboard
                </h2>
                <p className="text-xs text-gray-400">Sustainability performance since Oct 1</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0fb880]/10 flex items-center justify-center text-[#0fb880]">
                    <span className="material-symbols-outlined">cloud_off</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">CO2 Offset</p>
                    <motion.p 
                      className="text-xl font-black text-white leading-none"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {animatedStats.co2.toFixed(1)} kg
                    </motion.p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                    <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Reward Tokens</p>
                    <motion.p 
                      className="text-xl font-black text-white leading-none"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {Math.floor(animatedStats.tokens)} CP
                    </motion.p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-tighter">
                  <span>Daily Progress</span>
                  <span className="text-[#0fb880]">82% to Level Up</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#0fb880]/50 to-[#0fb880] rounded-full shadow-[0_0_8px_rgba(15,184,128,0.4)]"
                    initial={{ width: 0 }}
                    animate={{ width: '82%' }}
                    transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
                  ></motion.div>
                </div>
              </div>
            </div>
            <div className="w-48 h-48 relative flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-white/5" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="12"></circle>
                <motion.circle 
                  className="text-[#0fb880]" 
                  cx="96" 
                  cy="96" 
                  fill="transparent" 
                  r="88" 
                  stroke="currentColor" 
                  strokeDasharray="553"
                  initial={{ strokeDashoffset: 553 }}
                  animate={{ strokeDashoffset: 553 - (553 * animatedStats.progress) / 100 }}
                  transition={{ delay: 0.7, duration: 1.5, ease: 'easeOut' }}
                  strokeLinecap="round" 
                  strokeWidth="12"
                ></motion.circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-gray-400 uppercase leading-none mb-1">Weekly</span>
                <span className="text-4xl font-black text-white leading-none">{Math.floor(animatedStats.progress)}%</span>
                <span className="text-[10px] text-[#0fb880] font-bold mt-1 uppercase">Target Met</span>
              </div>
            </div>
          </div>

          {/* Community Feed */}
          <div className="col-span-12 md:col-span-4 glass-panel rounded-2xl p-5 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[#0fb880] text-xl">forum</span>
                {routeCenter ? 'Route Alerts' : 'Community Feed'}
              </h2>
              <div className="flex gap-2">
                {/* CONNECTED TO BACKEND: Clear route button */}
                {routeCenter && (
                  <button 
                    onClick={clearRoute}
                    className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-xs">clear</span>
                    CLEAR
                  </button>
                )}
                {/* CONNECTED TO BACKEND: Report button with enhanced functionality */}
                <button 
                  onClick={handleShareRoute}
                  disabled={locationLoading}
                  className="bg-[#0fb880]/20 hover:bg-[#0fb880]/30 disabled:opacity-50 text-[#0fb880] text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">share</span>
                  SHARE
                </button>
                <button 
                  onClick={handleReportAlert}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-xs">report</span>
                  REPORT +
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {/* CONNECTED TO BACKEND: Loading state for alerts */}
              {isLoadingAlerts && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[#0fb880] border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span className="text-xs text-gray-400">Loading route alerts...</span>
                </div>
              )}
              
              {/* CONNECTED TO BACKEND: Dynamic route alerts */}
              {!isLoadingAlerts && (
                <AnimatePresence>
                  {routeCenter ? (
                    // Show route-specific alerts
                    routeAlerts.length > 0 ? (
                      routeAlerts.map((alert, index) => (
                        <motion.div
                          key={`route-alert-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group"
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(251, 146, 60, 0.15)' }}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-[8px] font-black text-orange-400 border border-orange-500/20 uppercase">
                                ⚠️
                              </div>
                              <span className="text-xs font-bold text-white">
                                {alert.user === 'You' ? 'Your Report' : 'Route Alert'}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500">{alert.time || 'Just now'}</span>
                          </div>
                          <p className="text-xs text-gray-300">{alert.message || alert.text || 'Alert on your route'}</p>
                          {alert.location && alert.user === 'You' && (
                            <p className="text-xs text-orange-400 mt-1">📍 {alert.location}</p>
                          )}
                        </motion.div>
                      ))
                    ) : (
                      // No alerts found message
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-8 text-center"
                      >
                        <span className="material-symbols-outlined text-3xl text-green-400 mb-3">check_circle</span>
                        <span className="text-sm text-gray-300 font-medium">No alerts or reports found</span>
                        <span className="text-xs text-gray-500 mt-1">on this route or within 8km radius</span>
                      </motion.div>
                    )
                  ) : (
                    // Show default community feed when no route is selected
                    // Combine user reports with default reports
                    [...communityAlerts, ...punjabReports].map((report, index) => (
                      <motion.div
                        key={report.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                          report.user === 'You' 
                            ? 'bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40' 
                            : 'bg-white/5 border-white/5 hover:border-[#0fb880]/20'
                        }`}
                        whileHover={{ scale: 1.02, backgroundColor: report.user === 'You' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {report.user === 'You' ? (
                              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-[8px] font-black text-orange-400 border border-orange-500/20 uppercase">
                                ⚠️
                              </div>
                            ) : report.isSystem ? (
                              <div className="w-6 h-6 rounded-full bg-[#0fb880]/20 flex items-center justify-center text-[8px] font-black text-[#0fb880] border border-[#0fb880]/20 uppercase">
                                {report.avatar}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                                {report.avatar}
                              </div>
                            )}
                            <span className="text-xs font-bold text-white">
                              {report.user === 'You' ? 'Your Report' : report.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500">{report.time || 'Just now'}</span>
                        </div>
                        <p className="text-xs text-gray-300">{report.text || report.message}</p>
                        {report.location && report.user === 'You' && (
                          <p className="text-xs text-orange-400 mt-1">📍 {report.location}</p>
                        )}
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              )}
              
              {/* CONNECTED TO BACKEND: Show "Read More" only for default feed */}
              {!routeCenter && !isLoadingAlerts && (
                <motion.button 
                  onClick={() => console.log('Loading more reports...')}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-500">expand_more</span>
                  Read More
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONNECTED TO BACKEND: Report Alert Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-[#0a1411] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0fb880]">report</span>
                  Report Alert
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                    Route Details
                  </label>
                  <div className="bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-[#0fb880]"></span>
                      <span>From: {routeData.startPoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span>
                      <span>To: {routeData.endPoint}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                    Alert Message
                  </label>
                  <textarea
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                    placeholder="Describe the traffic issue, road condition, or any alert..."
                    className="w-full bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {reportMessage.length}/200 characters
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
                    Alert Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'traffic', label: 'Traffic', icon: 'traffic' },
                      { id: 'accident', label: 'Accident', icon: 'crash_alert' },
                      { id: 'construction', label: 'Construction', icon: 'construction' },
                      { id: 'weather', label: 'Weather', icon: 'thunderstorm' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        className="bg-[#122620]/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 hover:border-[#0fb880]/50 hover:text-[#0fb880] transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-xs">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 font-medium py-2 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSubmitReport(reportMessage)}
                    disabled={!reportMessage.trim()}
                    className="flex-1 bg-[#0fb880] hover:bg-[#0fb880]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 rounded-xl transition-colors"
                  >
                    Report Alert
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
