import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


// Fix default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapInnerProps {
  position: { lat: number; lng: number } | null;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function MapInner({ position, onPositionChange, selectedLocation }: MapInnerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = selectedLocation 
      ? [selectedLocation.lat, selectedLocation.lng]
      : [20.5937, 78.9629];

    const map = L.map(containerRef.current).setView(defaultCenter, 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange({ lat, lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle position updates
  useEffect(() => {
    if (!mapRef.current) return;

    if (position) {
      if (markerRef.current) {
        markerRef.current.setLatLng([position.lat, position.lng]);
      } else {
        markerRef.current = L.marker([position.lat, position.lng]).addTo(mapRef.current);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [position]);

  // Handle selectedLocation center updates - zoom to 16 for searched locations
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;
    
    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    
    // Center map and zoom to searched location
    mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 16);
    
    // Place new marker at searched location
    markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(mapRef.current);
  }, [selectedLocation]);

  return <div ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}