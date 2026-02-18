import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pulseIcon = (color: string) => {
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="${color}" opacity="0.8"/>
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
const markers: Array<{ pos: [number, number]; label: string; eta?: string }> = [
  { pos: [30.7333, 76.7794], label: 'Sector 17, Chandigarh', eta: '2 min' },
  { pos: [30.4833, 76.6], label: 'Rajpura Bus Stand', eta: '5 min' },
  { pos: [30.3392, 76.3869], label: 'Patiala Bus Depot', eta: '12 min' },
  { pos: [30.3782, 76.7767], label: 'Ambala Cantt', eta: '8 min' },
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
  const emeraldIcon = useMemo(() => pulseIcon('#10b981'), []);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden bg-eco-dark">
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
          <Marker key={i} position={m.pos} icon={emeraldIcon}>
            <Popup>
              <strong>{m.label}</strong>
              {m.eta && <p className="text-eco-emerald text-sm">ETA: {m.eta}</p>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
