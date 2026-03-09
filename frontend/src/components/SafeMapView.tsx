import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocationService } from '../hooks/useLocationService';

interface SafeMapViewProps {
  routePath?: [number, number][];
  startPoint?: [number, number];
  endPoint?: [number, number];
  routeAlerts?: any[];
}

// Custom icons for start and end points
const createCustomIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 10px;
      color: white;
    ">${label}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Custom icon for buses
const createBusIcon = () => {
  return L.divIcon({
    className: 'custom-bus-icon',
    html: `<div style="
      background-color: #3b82f6;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="color: white; font-size: 12px;">🚌</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Custom icon for bus stops
const createBusStopIcon = () => {
  return L.divIcon({
    className: 'custom-bus-stop-icon',
    html: `<div style="
      background-color: #f59e0b;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    "><span style="color: white; font-size: 8px;">🛑</span></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// MOCK DATA - REMOVE IN PRODUCTION
const getMockBusStops = (startPoint?: [number, number], endPoint?: [number, number]) => {
  // Check if route contains "Banur" and "Chandigarh" (case-insensitive match)
  if (startPoint && endPoint) {
    const isBanurRoute = 
      // Check if start is near Banur area
      (startPoint[0] >= 30.6 && startPoint[0] <= 30.65 && startPoint[1] >= 76.7 && startPoint[1] <= 76.75) ||
      // Check if end is near Chandigarh area  
      (endPoint[0] >= 30.7 && endPoint[0] <= 30.75 && endPoint[1] >= 76.75 && endPoint[1] <= 76.85) ||
      // Also check reverse route
      (endPoint[0] >= 30.6 && endPoint[0] <= 30.65 && endPoint[1] >= 76.7 && endPoint[1] <= 76.75) ||
      (startPoint[0] >= 30.7 && startPoint[0] <= 30.75 && startPoint[1] >= 76.75 && startPoint[1] <= 76.85);
    
    if (isBanurRoute) {
      // MOCK DATA - REMOVE IN PRODUCTION: Bus stops for Banur to Chandigarh route
      return [
        { name: 'Banur Bus Stand', coords: [30.6391, 76.7205] as [number, number] },
        { name: 'Dera Bassi', coords: [30.5854, 76.8378] as [number, number] },
        { name: 'Zirakpur', coords: [30.6468, 76.8185] as [number, number] },
        { name: 'Chandigarh ISBT', coords: [30.7333, 76.7794] as [number, number] }
      ];
    }
  }
  return [];
};

function MapController({ startPoint, endPoint, routePath }: { startPoint?: [number, number]; endPoint?: [number, number]; routePath?: [number, number][] }) {
  const map = useMap();

  React.useEffect(() => {
    if (map && (startPoint || endPoint)) {
      // Calculate bounds for auto-zoom with responsive padding
      const bounds: L.LatLngExpression[] = [];
      
      if (startPoint) bounds.push(L.latLng(startPoint[0], startPoint[1]));
      if (endPoint) bounds.push(L.latLng(endPoint[0], endPoint[1]));
      if (routePath && routePath.length > 0) {
        routePath.forEach(coord => bounds.push(L.latLng(coord[0], coord[1])));
      }

      if (bounds.length > 0) {
        const mapBounds = L.latLngBounds(bounds);
        
        // Responsive padding based on screen size
        const isMobile = window.innerWidth < 768;
        const padding = isMobile ? [20, 20] : [50, 50];
        
        map.fitBounds(mapBounds, { padding: padding as L.PointExpression });
      }
    }
  }, [map, startPoint, endPoint, routePath]);

  // Handle window resize for responsive map
  React.useEffect(() => {
    const handleResize = () => {
      if (map && (startPoint || endPoint)) {
        const bounds: L.LatLngExpression[] = [];
        
        if (startPoint) bounds.push(L.latLng(startPoint[0], startPoint[1]));
        if (endPoint) bounds.push(L.latLng(endPoint[0], endPoint[1]));
        if (routePath && routePath.length > 0) {
          routePath.forEach(coord => bounds.push(L.latLng(coord[0], coord[1])));
        }

        if (bounds.length > 0) {
          const mapBounds = L.latLngBounds(bounds);
          
          // Adjust padding on resize
          const isMobile = window.innerWidth < 768;
          const padding = isMobile ? [20, 20] : [50, 50];
          
          map.fitBounds(mapBounds, { padding: padding as L.PointExpression });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map, startPoint, endPoint, routePath]);

  return null;
}

export function SafeMapView({ routePath, startPoint, endPoint, routeAlerts }: SafeMapViewProps) {
  const [mapReady, setMapReady] = React.useState(false);
  const { buses } = useLocationService();
  const [mapError, setMapError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Set map ready immediately and add debugging
    console.log('🗺️ SafeMapView: Component mounting');
    
    // Check if Leaflet is available
    if (typeof window !== 'undefined') {
      console.log('🗺️ SafeMapView: Window available, checking Leaflet...');
      console.log('🗺️ SafeMapView: Leaflet available:', typeof L !== 'undefined');
      console.log('🗺️ SafeMapView: Leaflet Icon Default:', (L as any).Icon);
    }
    
    setMapReady(true);
  }, []);

  // Fix Leaflet default icon issue and ensure proper initialization
  React.useEffect(() => {
    console.log('🗺️ SafeMapView: Setting up Leaflet icons...');
    
    // Ensure Leaflet is properly initialized
    if (typeof window !== 'undefined' && (L as any).Icon) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      console.log('🗺️ SafeMapView: Leaflet icons configured');
    }
  }, []);

  // Get mock bus stops for testing
  const mockBusStops = getMockBusStops(startPoint, endPoint);

  if (!mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-center">
          <span className="material-icons text-6xl mb-4 animate-spin">map</span>
          <p className="text-lg">Loading Map...</p>
          <p className="text-xs text-gray-400 mt-2">Initializing map components</p>
        </div>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-center">
          <span className="material-icons text-6xl mb-4">error_outline</span>
          <p className="text-lg">Map Error</p>
          <p className="text-sm text-gray-400 mt-2">{mapError}</p>
        </div>
      </div>
    );
  }

  try {
    console.log('🗺️ SafeMapView: Rendering MapContainer...');
    return (
      <div className="w-full h-full relative">
        <MapContainer
          center={[30.73, 76.78]} // Chandigarh center
          zoom={12}
          style={{ height: '100%', width: '100%', zIndex: 1 }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            maxNativeZoom={19}
          />
        
          {/* Route line */}
          {routePath && routePath.length > 1 && (
            <Polyline
              positions={routePath}
              color="#0fb880"
              weight={4}
              opacity={0.8}
              dashArray="10, 5"
            />
          )}
        
        {/* Nearby bus markers */}
        {buses.map((bus, index) => {
          // Extract coordinates from GeoJSON format or use direct lat/lng properties
          let latitude, longitude;
          
          // Type assertion to handle backend data format
          const busData = bus as any;
          
          if (busData.location && busData.location.coordinates && Array.isArray(busData.location.coordinates)) {
            // GeoJSON format: [longitude, latitude]
            [longitude, latitude] = busData.location.coordinates;
          } else if (typeof bus.latitude === 'number' && typeof bus.longitude === 'number') {
            // Direct format
            latitude = bus.latitude;
            longitude = bus.longitude;
          } else {
            console.warn('Invalid bus coordinates:', bus);
            return null;
          }
          
          // Ensure coordinates are valid numbers
          if (typeof latitude !== 'number' || typeof longitude !== 'number' || isNaN(latitude) || isNaN(longitude)) {
            console.warn('Invalid coordinate values:', { latitude, longitude, bus });
            return null;
          }
          
          return (
            <Marker 
              key={`bus-${index}`}
              position={[latitude, longitude]} 
              icon={createBusIcon()}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-blue-600">Public Transport</p>
                  <p className="text-sm text-gray-600">Vehicle ID: {bus.vehicleId || 'Unknown'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </p>
                  {bus.route && (
                    <p className="text-xs text-gray-500 mt-1">Route: {bus.route}</p>
                  )}
                  {bus.crowdLevel && (
                    <p className="text-xs text-gray-500 mt-1">
                      Crowd: <span className={`font-medium ${
                        bus.crowdLevel === 'low' ? 'text-green-600' :
                        bus.crowdLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>{bus.crowdLevel}</span>
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        }).filter(Boolean)}
        
        {/* Mock bus stop markers for testing */}
        {mockBusStops.map((stop, index) => {
          // Ensure stop has valid coordinates
          if (!stop || !stop.coords || !Array.isArray(stop.coords) || stop.coords.length !== 2) {
            console.warn('Invalid bus stop coordinates:', stop);
            return null;
          }
          
          return (
            <Marker 
              key={`stop-${index}`}
              position={stop.coords} 
              icon={createBusStopIcon()}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-amber-600">Bus Stop</p>
                  <p className="text-sm text-gray-600">{stop.name || 'Unknown Stop'}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stop.coords[0].toFixed(4)}, {stop.coords[1].toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        }).filter(Boolean)}
        
        {/* Start point marker */}
        {startPoint && (
          <Marker position={startPoint} icon={createCustomIcon('#10b981', 'S')}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-green-600">Start Point</p>
                <p className="text-sm text-gray-600">Your journey begins here</p>
                <p className="text-xs text-gray-500 mt-1">
                  {startPoint[0].toFixed(4)}, {startPoint[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* End point marker */}
        {endPoint && (
          <Marker position={endPoint} icon={createCustomIcon('#ef4444', 'E')}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-red-600">End Point</p>
                <p className="text-sm text-gray-600">Your destination</p>
                <p className="text-xs text-gray-500 mt-1">
                  {endPoint[0].toFixed(4)}, {endPoint[1].toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Map controller for auto-zoom */}
        <MapController startPoint={startPoint} endPoint={endPoint} routePath={routePath} />
      </MapContainer>
      </div>
    );
  } catch (error) {
    console.error('MapView error:', error);
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-center">
          <span className="material-icons text-6xl mb-4">error_outline</span>
          <p className="text-lg">Map Error</p>
          <p className="text-sm text-gray-400 mt-2">Unable to load map</p>
        </div>
      </div>
    );
  }
}
