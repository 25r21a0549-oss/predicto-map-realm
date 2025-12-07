import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { LatLng, Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Save, X } from 'lucide-react';

// Fix for default marker icon
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapComponentProps {
  onSaveArea?: (area: { name: string; latitude: number; longitude: number; bounds?: object; metadata?: object }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  height?: string;
}

function LocationMarker({ position, setPosition }: { position: LatLng | null; setPosition: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} icon={defaultIcon} /> : null;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export const MapComponent = ({ onSaveArea, selectedLocation, onLocationSelect, height = '400px' }: MapComponentProps) => {
  const [position, setPosition] = useState<LatLng | null>(
    selectedLocation ? new LatLng(selectedLocation.lat, selectedLocation.lng) : null
  );
  const [areaName, setAreaName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

  useEffect(() => {
    if (selectedLocation) {
      setPosition(new LatLng(selectedLocation.lat, selectedLocation.lng));
    }
  }, [selectedLocation]);

  const handlePositionChange = (newPos: LatLng) => {
    setPosition(newPos);
    onLocationSelect?.({ lat: newPos.lat, lng: newPos.lng });
  };

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
            center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : defaultCenter}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={handlePositionChange} />
            {selectedLocation && <MapUpdater center={[selectedLocation.lat, selectedLocation.lng]} />}
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
};
