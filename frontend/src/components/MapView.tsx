import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pulseIcon = (color: string, type?: 'bus' | 'metro' | 'alert') => {
  const iconColor = type === 'alert' ? '#eab308' : color;
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="${iconColor}" opacity="0.8"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'pulse-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const center: [number, number] = [30.73, 76.78]; // Chandigarh area
const markers: Array<{ pos: [number, number]; label: string; eta?: string; type?: 'bus' | 'metro' | 'alert' }> = [
  { pos: [30.7333, 76.7794], label: 'Bus 42B - Sector 17', eta: '2 min', type: 'bus' },
  { pos: [30.4833, 76.6], label: 'Metro Bus S1 - Rajpura', eta: '5 min', type: 'metro' },
  { pos: [30.3392, 76.3869], label: 'Traffic Alert: Patiala Road', type: 'alert' },
  { pos: [30.3782, 76.7767], label: 'Bus 18 - Ambala Cantt', eta: '8 min', type: 'bus' },
];

function PulseAnimation() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pulse-marker { animation: pulse 2s infinite; }
      @keyframes pulse { 0%,100%{ transform: scale(1); opacity:1 } 50%{ transform: scale(1.2); opacity:0.7 } }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  return null;
}

export function MapView() {
  const emeraldIcon = useMemo(() => pulseIcon('#10b981', 'bus'), []);
  const metroIcon = useMemo(() => pulseIcon('#10b981', 'metro'), []);
  const alertIcon = useMemo(() => pulseIcon('#10b981', 'alert'), []);

  const getIcon = (type?: 'bus' | 'metro' | 'alert') => {
    switch (type) {
      case 'metro': return metroIcon;
      case 'alert': return alertIcon;
      default: return emeraldIcon;
    }
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-[#0a1411] map-bg">
      <MapContainer
        center={center}
        zoom={13}
        className="w-full h-full min-h-[300px] rounded-2xl"
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <PulseAnimation />
        {markers.map((m, i) => (
          <Marker key={i} position={m.pos} icon={getIcon(m.type)}>
            <Popup>
              <strong>{m.label}</strong>
              {m.eta && <p className="text-[#0fb880] text-sm">ETA: {m.eta}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
