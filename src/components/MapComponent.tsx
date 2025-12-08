import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Save, X, Loader2 } from 'lucide-react';
import { MapSearchBar } from './MapSearchBar';

interface MapComponentProps {
  onSaveArea?: (area: { name: string; latitude: number; longitude: number; bounds?: Record<string, unknown>; metadata?: Record<string, unknown> }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  height?: string;
  showSearch?: boolean;
}

// Lazy load the actual map to avoid SSR/hydration issues
const MapInner = lazy(() => import('./MapInner'));

export function MapComponent({ onSaveArea, selectedLocation, onLocationSelect, height = '400px', showSearch = true }: MapComponentProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(selectedLocation || null);
  const [areaName, setAreaName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      setPosition(selectedLocation);
    }
  }, [selectedLocation]);

  const handlePositionChange = useCallback((newPos: { lat: number; lng: number }) => {
    setPosition(newPos);
    onLocationSelect?.(newPos);
  }, [onLocationSelect]);

  const handleSearchLocationSelect = useCallback((location: { lat: number; lng: number; name: string }) => {
    setPosition({ lat: location.lat, lng: location.lng });
    setSearchLocation({ lat: location.lat, lng: location.lng });
    onLocationSelect?.({ lat: location.lat, lng: location.lng });
    // Pre-fill area name with search result
    if (!areaName) {
      setAreaName(location.name.split(',')[0]);
    }
  }, [onLocationSelect, areaName]);

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
        {/* Search Bar - NEW FEATURE */}
        {showSearch && (
          <MapSearchBar onLocationSelect={handleSearchLocationSelect} />
        )}

        <div className="rounded-lg overflow-hidden border" style={{ height }}>
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <MapInner
              position={position}
              onPositionChange={handlePositionChange}
              selectedLocation={searchLocation || selectedLocation}
            />
          </Suspense>
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
