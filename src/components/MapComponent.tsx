import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Save, X } from 'lucide-react';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapComponentProps {
  onSaveArea?: (area: { name: string; latitude: number; longitude: number; bounds?: Record<string, unknown>; metadata?: Record<string, unknown> }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  height?: string;
}

interface LocationMarkerProps {
  position: L.LatLng | null;
  onPositionChange: (pos: L.LatLng) => void;
}

function LocationMarker({ position, onPositionChange }: LocationMarkerProps) {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  if (!position) return null;
  return <Marker position={position} />;
}

interface MapUpdaterProps {
  center: [number, number];
}

function MapUpdater({ center }: MapUpdaterProps) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function MapComponent({ onSaveArea, selectedLocation, onLocationSelect, height = '400px' }: MapComponentProps) {
  const [position, setPosition] = useState<L.LatLng | null>(
    selectedLocation ? L.latLng(selectedLocation.lat, selectedLocation.lng) : null
  );
  const [areaName, setAreaName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    if (selectedLocation) {
      setPosition(L.latLng(selectedLocation.lat, selectedLocation.lng));
    }
  }, [selectedLocation]);

  const handlePositionChange = useCallback((newPos: L.LatLng) => {
    setPosition(newPos);
    onLocationSelect?.({ lat: newPos.lat, lng: newPos.lng });
  }, [onLocationSelect]);

  const handleSave = () => {
    if (!position || !areaName.trim()) return;
    onSaveArea?.({
      name: areaName,
      latitude: position.lat,
      longitude: position.lng,
      metadata: {
        selectedAt: new Date().toISOString(),
      },
    });
    setAreaName('');
    setShowSaveForm(false);
  };

  const mapCenter = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng] as [number, number]
    : defaultCenter;

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          Select Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg overflow-hidden border" style={{ height }}>
          <MapContainer
            center={mapCenter}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} onPositionChange={handlePositionChange} />
            {selectedLocation && <MapUpdater center={mapCenter} />}
          </MapContainer>
        </div>

        {position && (
          <div className="text-sm text-muted-foreground">
            Selected: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
          </div>
        )}

        {onSaveArea && position && (
          <>
            {showSaveForm ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Area name"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSave} disabled={!areaName.trim()} size="sm">
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowSaveForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowSaveForm(true)} variant="outline" className="w-full">
                <Save className="h-4 w-4 mr-2" /> Save This Area
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}