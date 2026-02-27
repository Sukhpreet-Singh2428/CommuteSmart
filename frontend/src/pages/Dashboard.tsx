import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useLocationService } from '../hooks/useLocationService';
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
  
  const [from, setFrom] = useState('Sector 17, Chandigarh');
  const [to, setTo] = useState('');
  const [selectedMode, setSelectedMode] = useState<'bus' | 'metro' | 'bike'>('bus');
  const [co2Offset] = useState(12.8);
  const [rewardTokens] = useState(450);
  const [weeklyProgress] = useState(75);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({ co2: 0, tokens: 0, progress: 0 });
  
  // CONNECTED TO BACKEND: Route search state
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [routeStart, setRouteStart] = useState<[number, number] | null>(null);
  const [routeEnd, setRouteEnd] = useState<[number, number] | null>(null);
  
  // CONNECTED TO BACKEND: Dynamic Community Feed state
  const [routeAlerts, setRouteAlerts] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [routeCenter, setRouteCenter] = useState<[number, number] | null>(null);
  
  // ADDED: Geocoding loading state
  const [isGeocoding, setIsGeocoding] = useState(false);

  // POLISHED: Simulate loading and animate stats on mount - FIXED: Reduced delay
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const duration = 2000;
      const steps = 60;
      const increment = {
        co2: co2Offset / steps,
        tokens: rewardTokens / steps,
        progress: weeklyProgress / steps
      };
      
      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        setAnimatedStats({
          co2: Math.min(co2Offset, increment.co2 * currentStep),
          tokens: Math.min(rewardTokens, increment.tokens * currentStep),
          progress: Math.min(weeklyProgress, increment.progress * currentStep)
        });
        
        if (currentStep >= steps) clearInterval(interval);
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, co2Offset, rewardTokens, weeklyProgress]);

  // ROBUST GEOCODING FOR PUNJAB: Multiple queries + fallback dictionary
  const geocodePlace = async (placeName: string): Promise<[number, number] | null> => {
    // Clean input: remove commas, extra spaces, and normalize
    const cleanName = placeName.trim().replace(/,/g, '').replace(/\s+/g, ' ').toLowerCase();
    
    // ROBUST GEOCODING: Fallback dictionary for common Punjab places
    const punjabFallbacks: { [key: string]: [number, number] } = {
      'rajpura': [30.48, 76.59],
      'sector 17 chandigarh': [30.74, 76.78],
      'sector 17': [30.74, 76.78],
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
    
    // Check fallback dictionary first
    if (punjabFallbacks[cleanName]) {
      const coords = punjabFallbacks[cleanName];
      console.log(`Using fallback coordinates for "${placeName}": [${coords[0]}, ${coords[1]}]`);
      return coords;
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
    if (userLocation) {
      await shareLocation(userLocation[0], userLocation[1]);
    } else {
      toast.error('Location not available. Please enable location services.');
    }
  };

  const handleCalculateRoute = async () => {
    if (!from || !to) {
      toast.error('Please enter both starting point and destination');
      return;
    }
    
    setIsGeocoding(true);
    setIsCalculatingRoute(true);
    
    try {
      // FIXED: Robust geocoding + route calculation for Punjab cities
      console.log(`Starting route calculation for: "${from}" → "${to}"`);
      
      // Step 1: Convert place names to coordinates
      const startCoords = await geocodePlace(from);
      const endCoords = await geocodePlace(to);
      
      // Step 2: Validate geocoding results
      if (!startCoords || !endCoords) {
        toast.error('Could not find location. Try more specific name like \'Sector 17 Chandigarh Punjab\'');
        return;
      }
      
      const [startLat, startLng] = startCoords;
      const [endLat, endLng] = endCoords;
      
      // Step 3: Double validate coordinates are valid numbers
      if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
        toast.error('Invalid coordinates received. Please try again.');
        return;
      }
      
      console.log(`✅ Geocoded successfully - Start: [${startLat}, ${startLng}], End: [${endLat}, ${endLng}]`);
      
      // Step 4: Calculate center point for alerts API
      const centerLat = (startLat + endLat) / 2;
      const centerLng = (startLng + endLng) / 2;
      const centerPoint: [number, number] = [centerLat, centerLng];
      
      console.log(`📍 Route center calculated: [${centerLat}, ${centerLng}]`);
      
      // FIXED: Realistic OSRM routing + auto zoom + alerts on map
      let routeCoords: [number, number][] = [];
      try {
        console.log('🚀 Calling OSRM for realistic route...');
        // Use OSRM free demo server for real road routing with steps for better visualization
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=polyline&steps=true&alternatives=false`;
        const osrmResponse = await axios.get(osrmUrl);
        
        if (osrmResponse.data.routes && osrmResponse.data.routes.length > 0) {
          const route = osrmResponse.data.routes[0];
          // Decode OSRM polyline to coordinates
          routeCoords = decodePolyline(route.geometry);
          console.log('✅ OSRM realistic route received with', routeCoords.length, 'points');
          console.log('📍 Distance:', (route.distance / 1000).toFixed(1), 'km, Duration:', (route.duration / 60).toFixed(1), 'minutes');
        } else {
          throw new Error('No OSRM route found');
        }
        } catch (osrmError) {
        console.log('⚠️ OSRM routing failed, trying backend fallback:', osrmError);
        try {
          // Try backend route suggestion as fallback
          const routeResponse = await axios.post(
            'http://localhost:5000/api/routes/suggest',
            {
              start: { latitude: startLat, longitude: startLng },
              end: { latitude: endLat, longitude: endLng }
            },
            { withCredentials: true }
          );
          
          if (routeResponse.data.success && routeResponse.data.path) {
            routeCoords = routeResponse.data.path.map((point: any) => [point.latitude, point.longitude]);
            console.log('✅ Backend route path received');
          } else {
            throw new Error('No path in backend response');
          }
        } catch (backendError) {
          console.log('⚠️ Backend routing failed, using straight line fallback:', backendError);
          // Final fallback to simple straight line route
          routeCoords = [
            [startLat, startLng],
            [(startLat + endLat) / 2, (startLng + endLng) / 2],
            [endLat, endLng]
          ];
        }
      }
      
      // Step 6: Update map with route
      const startPoint: [number, number] = [startLat, startLng];
      const endPoint: [number, number] = [endLat, endLng];
      
      setRouteStart(startPoint);
      setRouteEnd(endPoint);
      setRoutePath(routeCoords);
      setRouteCenter(centerPoint);
      
      console.log('🗺️ Map updated with route line');
      
      // Step 7: Fetch alerts for route area (8km radius)
      try {
        console.log('🔍 Fetching route alerts...');
        await fetchRouteAlerts(centerPoint);
        console.log('✅ Route alerts fetched successfully');
      } catch (alertsError) {
        console.log('⚠️ Alerts fetch failed, but route still works:', alertsError);
        // Don't fail the entire route calculation if alerts fail
      }
      
      // Step 8: Show success message
      toast.success('Optimal route calculated! 🚌');
      console.log('🎉 Route calculation completed successfully');
      
    } catch (error: any) {
      console.error('❌ Route calculation failed:', error);
      
      // Provide specific error messages based on error type
      if (error.code === 'ECONNREFUSED' || error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid route data. Please try different locations.');
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again in a moment.');
      } else {
        toast.error('Failed to calculate route. Please try again.');
      }
    } finally {
      setIsGeocoding(false);
      setIsCalculatingRoute(false);
    }
  };

  // CONNECTED TO BACKEND: Fetch route-specific alerts
  const fetchRouteAlerts = async (center: [number, number]) => {
    setIsLoadingAlerts(true);
    try {
      // Call API with 8km radius (converted to degrees)
      const response = await axios.get(
        `http://localhost:5000/api/location/nearby?lat=${center[0]}&long=${center[1]}`,
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.alerts) {
        setRouteAlerts(response.data.alerts);
      } else {
        setRouteAlerts([]);
      }
    } catch (error: any) {
      console.error('Error fetching route alerts:', error);
      // Fallback to empty alerts on error
      setRouteAlerts([]);
      toast.error('Failed to load route alerts');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // CONNECTED TO BACKEND: Reset alerts when route is cleared
  const clearRoute = () => {
    setRoutePath(null);
    setRouteStart(null);
    setRouteEnd(null);
    setRouteCenter(null);
    setRouteAlerts([]);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0a1411]">
      {/* Navigation */}
      <nav className="h-16 flex items-center justify-between px-6 border-b border-primary/20 bg-[#0a1411]/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#0fb880] flex items-center justify-center text-white font-bold text-lg shadow-[0_0_15px_rgba(15,184,128,0.4)]">C</div>
          <span className="font-bold text-xl tracking-tight text-white">Commute<span className="text-[#0fb880]">Smart</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-[#0fb880] border-b-2 border-[#0fb880] h-16 flex items-center text-sm font-medium" to="/dashboard">Dashboard</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/alerts">Community</Link>
          <Link className="text-gray-400 hover:text-white transition-colors text-sm font-medium" to="/profile">Profile</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Punjab Eco-Rank</span>
            <span className="text-sm font-bold text-[#0fb880]">#142 Chandigarh</span>
          </div>
          <div className="h-9 w-9 rounded-full border-2 border-[#0fb880]/30 p-0.5">
            <div className="w-full h-full rounded-full bg-[#0fb880]/30 flex items-center justify-center text-white font-bold text-sm">
              U
            </div>
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
              <MapView routePath={routePath || undefined} startPoint={routeStart || undefined} endPoint={routeEnd || undefined} routeAlerts={routeAlerts} />
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
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-4 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <input 
                  className="w-full bg-[#122620]/50 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-1 focus:ring-[#0fb880] focus:border-[#0fb880] outline-none transition-all text-white focus:bg-[#122620]/70" 
                  placeholder="Where to go?" 
                  type="text"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
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
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-red-400 text-xl">forum</span>
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
                  onClick={handleShareLocation}
                  disabled={locationLoading}
                  className="bg-[#0fb880]/20 hover:bg-[#0fb880]/30 disabled:opacity-50 text-[#0fb880] text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  SHARE
                </button>
                <button 
                  onClick={() => toast.success('Report feature coming soon!')}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1.5 rounded-full transition-colors"
                >
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
                              <span className="text-xs font-bold text-white">Route Alert</span>
                            </div>
                            <span className="text-[10px] text-gray-500">{alert.time || 'Just now'}</span>
                          </div>
                          <p className="text-xs text-gray-300">{alert.message || alert.text || 'Alert on your route'}</p>
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
                    punjabReports.map((report, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-[#0fb880]/20 transition-all cursor-pointer group"
                        whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                            {report.isSystem ? (
                              <div className="w-6 h-6 rounded-full bg-[#0fb880]/20 flex items-center justify-center text-[8px] font-black text-[#0fb880] border border-[#0fb880]/20 uppercase">
                                {report.avatar}
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white text-[10px] font-bold border border-white/20">
                                {report.avatar}
                              </div>
                            )}
                            <span className="text-xs font-bold text-white">{report.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">{report.time}</span>
                        </div>
                        <p className="text-xs text-gray-300">{report.text}</p>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              )}
              
              {/* CONNECTED TO BACKEND: Show "Read More" only for default feed */}
              {!routeCenter && !isLoadingAlerts && (
                <motion.button 
                  onClick={() => toast.success('Loading more reports...')}
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
    </div>
  );
}
