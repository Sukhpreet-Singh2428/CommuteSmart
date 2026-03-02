import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function MapController({ startPoint, endPoint, routePath }: { startPoint?: [number, number]; endPoint?: [number, number]; routePath?: [number, number][] }) {
  const map = useMap();

  React.useEffect(() => {
    if (map && (startPoint || endPoint)) {
      // Calculate bounds for auto-zoom
      const bounds: [number, number][] = [];
      
      if (startPoint) bounds.push(startPoint);
      if (endPoint) bounds.push(endPoint);
      if (routePath && routePath.length > 0) {
        bounds.push(...routePath);
      }

      if (bounds.length > 0) {
        const mapBounds = L.latLngBounds(bounds);
        map.fitBounds(mapBounds, { padding: [50, 50] });
      }
    }
  }, [map, startPoint, endPoint, routePath]);

  return null;
}

export function SafeMapView({ routePath, startPoint, endPoint, routeAlerts }: SafeMapViewProps) {
  const [mapReady, setMapReady] = React.useState(false);

  React.useEffect(() => {
    // Set map ready after a short delay
    const timer = setTimeout(() => setMapReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Fix Leaflet default icon issue
  React.useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  if (!mapReady) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-center">
          <span className="material-icons text-6xl mb-4 animate-spin">map</span>
          <p className="text-lg">Loading Map...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <MapContainer
        center={[30.73, 76.78]} // Chandigarh center
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
