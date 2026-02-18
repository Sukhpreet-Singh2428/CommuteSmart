import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';

const pulseIcon = (color: string, type?: 'bus' | 'metro' | 'alert') => {
  const iconColor = type === 'alert' ? '#eab308' : color;
  const pulseColor = type === 'alert' ? '#f59e0b' : '#10b981';
  
  // POLISHED: Enhanced SVG with better visual design
  const svg = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
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

const center: [number, number] = [30.73, 76.78]; // Chandigarh area
const markers: Array<{ pos: [number, number]; label: string; eta?: string; type?: 'bus' | 'metro' | 'alert'; crowdLevel?: 'low' | 'medium' | 'high' }> = [
  { pos: [30.7333, 76.7794], label: 'CTU Bus 42B - Sector 17', eta: '2 min', type: 'bus', crowdLevel: 'medium' },
  { pos: [30.4833, 76.6], label: 'Metro Express S1 - Rajpura', eta: '5 min', type: 'metro', crowdLevel: 'low' },
  { pos: [30.3392, 76.3869], label: '⚠️ Traffic Alert: Patiala Road', type: 'alert', crowdLevel: 'high' },
  { pos: [30.3782, 76.7767], label: 'CTU Bus 18 - Ambala Cantt', eta: '8 min', type: 'bus', crowdLevel: 'high' },
  { pos: [30.6543, 76.8187], label: 'Metro Line - Sector 34', eta: '3 min', type: 'metro', crowdLevel: 'medium' },
];

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

export function MapView() {
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const mapRef = useRef<any>(null);
  
  // POLISHED: Enhanced icons with better visual design
  const emeraldIcon = useMemo(() => pulseIcon('#10b981', 'bus'), []);
  const metroIcon = useMemo(() => pulseIcon('#06b6d4', 'metro'), []);
  const alertIcon = useMemo(() => pulseIcon('#f59e0b', 'alert'), []);

  const getIcon = (type?: 'bus' | 'metro' | 'alert') => {
    switch (type) {
      case 'metro': return metroIcon;
      case 'alert': return alertIcon;
      default: return emeraldIcon;
    }
  };

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

  // FIXED: Handle map resizing and ensure proper sizing
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

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-[#0a1411] map-bg relative">
      <MapContainer
        ref={mapRef}
        center={center}
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
        {markers.map((m, i) => (
          <Marker 
            key={i} 
            position={m.pos} 
            icon={getIcon(m.type)}
            eventHandlers={{
              click: () => setSelectedMarker(i),
              popupopen: () => setSelectedMarker(i),
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
                <div className="font-semibold text-white text-sm mb-1">{m.label}</div>
                {m.eta && (
                  <div className="flex items-center gap-2 text-[#0fb880] text-sm font-medium">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>ETA: {m.eta}</span>
                  </div>
                )}
                {getCrowdIndicator(m.crowdLevel)}
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
      </MapContainer>
      
      {/* POLISHED: Map legend */}
      <div className="absolute bottom-4 left-4 bg-[#0a1411]/90 backdrop-blur-md rounded-lg p-3 border border-white/10 z-10">
        <div className="text-xs font-bold text-white mb-2">Live Transit</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="text-xs text-gray-300">Bus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#06b6d4]"></div>
            <span className="text-xs text-gray-300">Metro</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
            <span className="text-xs text-gray-300">Alert</span>
          </div>
        </div>
      </div>
      
      {/* Selected marker info */}
      {selectedMarker !== null && (
        <motion.div 
          className="absolute top-4 right-4 bg-[#0a1411]/90 backdrop-blur-md rounded-lg p-3 border border-white/10 z-10 max-w-xs"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <div className="text-sm font-medium text-white mb-1">
            {markers[selectedMarker].label}
          </div>
          {markers[selectedMarker].eta && (
            <div className="text-xs text-[#0fb880]">ETA: {markers[selectedMarker].eta}</div>
          )}
        </motion.div>
      )}
    </div>
  );
}
