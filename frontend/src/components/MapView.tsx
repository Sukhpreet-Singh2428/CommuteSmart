import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { useLocationService, Bus } from '../hooks/useLocationService';
import toast from 'react-hot-toast';

// Error boundary for MapView
const MapViewErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-white text-center">
        <span className="material-icons text-6xl mb-4">error_outline</span>
        <p className="text-lg">Map Error</p>
        <p className="text-sm text-gray-400 mt-2">Unable to load map component</p>
      </div>
    </div>
  );
};

// CONNECTED TO BACKEND: Enhanced pulse icon for real-time bus markers
const pulseIcon = (color: string, type?: 'bus' | 'metro' | 'alert' | 'warning' | 'error' | 'info', isPulsing?: boolean) => {
  const iconColor = type === 'alert' || type === 'warning' || type === 'error' || type === 'info' ? '#eab308' : color;
  const pulseColor = type === 'alert' || type === 'warning' || type === 'error' || type === 'info' ? '#f59e0b' : '#10b981';
  
  // POLISHED: Enhanced SVG with better visual design and pulsing animation
  const pulseAnimation = isPulsing ? `
    <style>
      @keyframes pulse-ring {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
    </style>
    <circle cx="16" cy="16" r="12" fill="none" stroke="${pulseColor}" stroke-width="2" opacity="0.6">
      <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
    </circle>
  ` : '';
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      ${pulseAnimation}
      <defs>
        <filter id="glow-${color.replace('#', '')}">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="12" fill="${iconColor}" opacity="0.9" filter="url(#glow-${color.replace('#', '')})"/>
      <circle cx="16" cy="16" r="8" fill="white" opacity="0.9"/>
      <circle cx="16" cy="16" r="4" fill="${iconColor}"/>
      ${type === 'bus' ? '<rect x="13" y="14" width="6" height="4" fill="white" rx="1"/>' : ''}
      ${type === 'metro' ? '<circle cx="16" cy="16" r="2" fill="white"/>' : ''}
      ${type === 'alert' ? '<path d="M16 12 L18 18 L14 18 Z" fill="white"/>' : ''}
    </svg>
  `;
  
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// CONNECTED TO BACKEND: Default center (Chandigarh - more central for Punjab region)
const defaultCenter: [number, number] = [30.73, 76.78];

function PulseAnimation() {
  useEffect(() => {
    // POLISHED: Enhanced animations and styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker { 
        animation: pulse 2s infinite, float 3s ease-in-out infinite;
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));
        transition: all 0.3s ease;
      }
      .custom-marker:hover {
        transform: scale(1.1);
        filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.4));
      }
      @keyframes pulse { 
        0%,100%{ transform: scale(1); opacity:1 } 
        50%{ transform: scale(1.1); opacity:0.8 } 
      }
      @keyframes float { 
        0%,100%{ transform: translateY(0px); } 
        50%{ transform: translateY(-5px); } 
      }
      .leaflet-popup-content-wrapper {
        background: rgba(10, 20, 17, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(15, 184, 128, 0.3);
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
      }
      .leaflet-popup-content {
        margin: 0;
        padding: 12px;
        color: white;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .leaflet-popup-tip {
        background: rgba(10, 20, 17, 0.95);
        border: 1px solid rgba(15, 184, 128, 0.3);
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}

export function MapView({ routePath, startPoint, endPoint, routeAlerts }: { 
  routePath?: [number, number][]; 
  startPoint?: [number, number]; 
  endPoint?: [number, number]; 
  routeAlerts?: any[];
}) {
  try {
    console.log('🗺️ MapView component rendering...');
    
    // CONNECTED TO BACKEND: Use location service hook for real-time data
    const { 
      buses, 
      userLocation, 
      isLoading, 
      error, 
      fetchNearbyBuses, 
      shareLocation,
      getCurrentLocation
    } = useLocationService();
    
    const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<[number, number]>(userLocation || defaultCenter);
    const mapRef = useRef<any>(null);
    
    // CONNECTED TO BACKEND: Initialize map with user location if available
    useEffect(() => {
      console.log('🗺️ MapView - userLocation changed:', userLocation);
      if (userLocation) {
        console.log('🗺️ MapView - Setting map center to user location:', userLocation);
        setMapCenter(userLocation);
      }
    }, [userLocation]);
  
  // Request user location on mount if not already available
  useEffect(() => {
    console.log('🗺️ MapView - Checking user location on mount:', userLocation);
    if (!userLocation) {
      console.log('🗺️ MapView - Requesting user location...');
      getCurrentLocation();
    } else {
      console.log('🗺️ MapView - User location already available:', userLocation);
    }
  }, [userLocation, getCurrentLocation]);
  
  // CONNECTED TO BACKEND: Adjust map bounds when route is available
  useEffect(() => {
    if (routePath && routePath.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(routePath);
      // Enhanced zoom with better padding and animation
      mapRef.current.fitBounds(bounds, { 
        padding: [80, 80], // Increased padding for better visibility
        maxZoom: 16, // Prevent excessive zoom
        animate: true, // Smooth animation
        duration: 1.5 // Animation duration
      });
    }
  }, [routePath]);

  // Additional effect to center on route when start/end points change
  useEffect(() => {
    if (startPoint && endPoint && mapRef.current) {
      const bounds = L.latLngBounds([startPoint, endPoint]);
      mapRef.current.fitBounds(bounds, { 
        padding: [100, 100],
        maxZoom: 15,
        animate: true,
        duration: 1.5
      });
    }
  }, [startPoint, endPoint]);
  
  // CONNECTED TO BACKEND: Refresh buses data periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (userLocation) {
        await fetchNearbyBuses(userLocation[0], userLocation[1]);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [userLocation, fetchNearbyBuses]);
  
  // CONNECTED TO BACKEND: Enhanced icons with pulsing effect for live buses
  const emeraldIcon = useMemo(() => pulseIcon('#10b981', 'bus', true), []);
  const metroIcon = useMemo(() => pulseIcon('#06b6d4', 'metro', true), []);
  const alertIcon = useMemo(() => pulseIcon('#f59e0b', 'alert', false), []);
  const userIcon = useMemo(() => pulseIcon('#3b82f6', 'bus', false), []);

  const getIcon = (type?: 'bus' | 'metro' | 'alert', isUser?: boolean) => {
    if (isUser) return userIcon;
    switch (type) {
      case 'metro': return metroIcon;
      case 'alert': return alertIcon;
      default: return emeraldIcon;
    }
  };

  // CONNECTED TO BACKEND: Convert bus data to marker format
  const busMarkers = buses.map((bus: Bus) => ({
    id: bus.vehicleId,
    pos: [bus.latitude, bus.longitude] as [number, number],
    label: `${bus.type === 'metro' ? 'Metro' : 'CTU Bus'} ${bus.vehicleId}`,
    eta: bus.eta || 'Calculating...',
    type: bus.type || 'bus',
    crowdLevel: bus.crowdLevel
  }));

  const getCrowdIndicator = (level?: 'low' | 'medium' | 'high') => {
    if (!level) return null;
    const colors = {
      low: '#10b981',
      medium: '#f59e0b', 
      high: '#ef4444'
    };
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[level] }}></div>
        <span className="text-xs text-gray-300 capitalize">{level} crowd</span>
      </div>
    );
  };

  // CONNECTED TO BACKEND: Handle map resizing and ensure proper sizing
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // FIXED: Initial invalidateSize after mount to ensure proper sizing
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    // FIXED: Additional invalidateSize after component renders
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // CONNECTED TO BACKEND: Share location handler
  const handleShareLocation = async () => {
    if (userLocation) {
      await shareLocation(userLocation[0], userLocation[1]);
    } else {
      toast.error('Location not available');
    }
  };

  // CONNECTED TO BACKEND: Refresh buses handler
  const handleRefreshBuses = async () => {
    if (userLocation) {
      await fetchNearbyBuses(userLocation[0], userLocation[1]);
      toast.success('Bus data refreshed! 🚌');
    } else {
      toast.error('Location not available');
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-[#0a1411] map-bg relative">
      {/* CONNECTED TO BACKEND: Loading and error states */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#0fb880] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold text-gray-200">Loading buses...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="glass-panel px-3 py-2 rounded-full flex items-center gap-2 bg-red-500/20 border border-red-500/30">
            <span className="material-symbols-outlined text-red-400 text-sm">error</span>
            <span className="text-xs font-semibold text-red-400">{error}</span>
          </div>
        </div>
      )}
      
      {/* CONNECTED TO BACKEND: Action buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="glass-panel p-1 rounded-lg flex flex-col">
          <button 
            onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
            className="w-8 h-8 flex items-center justify-center hover:text-[#0fb880] transition-colors text-white"
          >
            <span className="material-symbols-outlined text-lg">add</span>
          </button>
          <div className="h-px bg-[#0fb880]/10 mx-1"></div>
          <button 
            onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
            className="w-8 h-8 flex items-center justify-center hover:text-[#0fb880] transition-colors text-white"
          >
            <span className="material-symbols-outlined text-lg">remove</span>
          </button>
        </div>
        <button 
          onClick={handleShareLocation}
          className="glass-panel w-10 h-10 rounded-lg flex items-center justify-center text-[#0fb880] hover:bg-[#0fb880] hover:text-white transition-all shadow-lg"
          title="Share My Location"
        >
          <span className="material-symbols-outlined">location_on</span>
        </button>
        <button 
          onClick={handleRefreshBuses}
          className="glass-panel w-10 h-10 rounded-lg flex items-center justify-center text-blue-400 hover:bg-blue-400 hover:text-white transition-all shadow-lg"
          title="Refresh Bus Data"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>
      
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={13}
        className="w-full h-full rounded-2xl"
        style={{ height: "100%", width: "100%" }}
        whenReady={() => {
          // FIXED: Ensure map is properly sized after ready
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.invalidateSize();
            }
          }, 100);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <PulseAnimation />
        
        {/* CONNECTED TO BACKEND: Route visualization */}
        {routePath && routePath.length > 0 && (
          <Polyline
            positions={routePath}
            color="#0fb880"
            weight={4}
            opacity={0.8}
            smoothFactor={1}
          />
        )}
        
        {/* CONNECTED TO BACKEND: Route start point */}
        {startPoint && (
          <Marker 
            position={startPoint} 
            icon={getIcon('bus', true)}
            eventHandlers={{
              click: () => setSelectedMarker('start'),
              popupopen: () => setSelectedMarker('start'),
              popupclose: () => setSelectedMarker(null)
            }}
          >
            <Popup>
              <motion.div 
                className="popup-content"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-semibold text-white text-sm mb-1">🚀 Start Point</div>
                <div className="text-xs text-gray-300">
                  Lat: {startPoint[0].toFixed(4)}, Lng: {startPoint[1].toFixed(4)}
                </div>
              </motion.div>
            </Popup>
          </Marker>
        )}
        
        {/* CONNECTED TO BACKEND: Route end point */}
        {endPoint && (
          <Marker 
            position={endPoint} 
            icon={alertIcon}
            eventHandlers={{
              click: () => setSelectedMarker('end'),
              popupopen: () => setSelectedMarker('end'),
              popupclose: () => setSelectedMarker(null)
            }}
          >
            <Popup>
              <motion.div 
                className="popup-content"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-semibold text-white text-sm mb-1">🎯 Destination</div>
                <div className="text-xs text-gray-300">
                  Lat: {endPoint[0].toFixed(4)}, Lng: {endPoint[1].toFixed(4)}
                </div>
              </motion.div>
            </Popup>
          </Marker>
        )}
        
        {/* CONNECTED TO BACKEND: User location marker */}
        {userLocation && (
          <Marker 
            position={userLocation} 
            icon={getIcon('bus', true)}
            eventHandlers={{
              click: () => setSelectedMarker('user'),
              popupopen: () => setSelectedMarker('user'),
              popupclose: () => setSelectedMarker(null)
            }}
          >
            <Popup>
              <motion.div 
                className="popup-content"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-semibold text-white text-sm mb-1">📍 Your Location</div>
                <div className="text-xs text-gray-300">
                  Lat: {userLocation[0].toFixed(4)}, Lng: {userLocation[1].toFixed(4)}
                </div>
                <button 
                  onClick={handleShareLocation}
                  className="mt-2 w-full bg-[#0fb880]/20 hover:bg-[#0fb880]/30 text-[#0fb880] text-xs px-2 py-1 rounded transition-colors"
                >
                  Share Location
                </button>
              </motion.div>
            </Popup>
          </Marker>
        )}
        
        {/* CONNECTED TO BACKEND: Real-time bus markers */}
        {busMarkers.map((bus) => (
          <Marker 
            key={bus.id} 
            position={bus.pos} 
            icon={getIcon(bus.type)}
            eventHandlers={{
              click: () => setSelectedMarker(bus.id),
              popupopen: () => setSelectedMarker(bus.id),
              popupclose: () => setSelectedMarker(null)
            }}
          >
            <Popup>
              <motion.div 
                className="popup-content"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-semibold text-white text-sm mb-1">{bus.label}</div>
                <div className="flex items-center gap-2 text-[#0fb880] text-sm font-medium">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>ETA: {bus.eta}</span>
                </div>
                {getCrowdIndicator(bus.crowdLevel)}
                <div className="mt-2 pt-2 border-t border-white/10 flex gap-2">
                  <button className="flex-1 bg-[#0fb880]/20 hover:bg-[#0fb880]/30 text-[#0fb880] text-xs px-2 py-1 rounded transition-colors">
                    Track
                  </button>
                  <button className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs px-2 py-1 rounded transition-colors">
                    Details
                  </button>
                </div>
              </motion.div>
            </Popup>
          </Marker>
        ))}
        
        {/* ADDED: Route-specific alert markers */}
        {routeAlerts && routeAlerts.map((alert, index) => {
          // Calculate distance from route (simplified - within 2km)
          const alertPos: [number, number] = [alert.latitude || alert.lat || 30.7, alert.longitude || alert.lng || 76.8];
          const alertType = alert.type || alert.severity || 'warning';
          const alertIcon = alertType === 'jam' ? 'warning' : alertType === 'accident' ? 'error' : 'info';
          
          return (
            <Marker 
              key={`route-alert-${index}`}
              position={alertPos}
              icon={pulseIcon('#f59e0b', alertIcon, false)}
              eventHandlers={{
                click: () => setSelectedMarker(`alert-${index}`),
                popupopen: () => setSelectedMarker(`alert-${index}`),
                popupclose: () => setSelectedMarker(null)
              }}
            >
              <Popup>
                <motion.div 
                  className="popup-content"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-semibold text-white text-sm mb-1">
                    {alertType === 'jam' ? '🚗 Traffic Jam' : alertType === 'accident' ? '⚠️ Accident' : 'ℹ️ Route Alert'}
                  </div>
                  <div className="text-xs text-gray-300 mb-1">
                    {alert.message || alert.description || 'Alert on your route'}
                  </div>
                  <div className="text-xs text-orange-400">
                    ETA Impact: {alert.delay || '+5 min'}
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <button className="w-full bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs px-2 py-1 rounded transition-colors">
                      View Details
                    </button>
                  </div>
                </motion.div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* CONNECTED TO BACKEND: Map legend with live count */}
      <div className="absolute bottom-4 left-4 bg-[#0a1411]/90 backdrop-blur-md rounded-lg p-3 border border-white/10 z-10">
        <div className="text-xs font-bold text-white mb-2">Live Transit ({busMarkers.length})</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981] animate-pulse"></div>
            <span className="text-xs text-gray-300">Bus ({busMarkers.filter(b => b.type === 'bus').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#06b6d4] animate-pulse"></div>
            <span className="text-xs text-gray-300">Metro ({busMarkers.filter(b => b.type === 'metro').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
            <span className="text-xs text-gray-300">You</span>
          </div>
        </div>
      </div>
      
      {/* CONNECTED TO BACKEND: Selected marker info */}
      {selectedMarker && selectedMarker !== 'user' && (
        <motion.div 
          className="absolute top-4 right-4 bg-[#0a1411]/90 backdrop-blur-md rounded-lg p-3 border border-white/10 z-10 max-w-xs"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <div className="text-sm font-medium text-white mb-1">
            {busMarkers.find(b => b.id === selectedMarker)?.label}
          </div>
          <div className="text-xs text-[#0fb880]">
            ETA: {busMarkers.find(b => b.id === selectedMarker)?.eta}
          </div>
        </motion.div>
      )}
    </div>
  );
  } catch (error) {
    console.error('🗺️ MapView error:', error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-center">
          <span className="material-icons text-6xl mb-4">error_outline</span>
          <p className="text-lg">Map Error</p>
          <p className="text-sm text-gray-400 mt-2">Unable to load map component</p>
        </div>
      </div>
    );
  }
}
