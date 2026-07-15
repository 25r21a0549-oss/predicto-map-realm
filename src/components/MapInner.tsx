import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/googleMaps';

interface MapInnerProps {
  position: { lat: number; lng: number } | null;
  onPositionChange: (pos: { lat: number; lng: number }) => void;
  selectedLocation?: { lat: number; lng: number } | null;
}

export default function MapInner({ position, onPositionChange, selectedLocation }: MapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Keep latest callback available inside the click listener without re-binding.
  useEffect(() => {
    onPositionChangeRef.current = onPositionChange;
  }, [onPositionChange]);

  // Initialize map once.
  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        const initialCenter = selectedLocation || position || { lat: 20.5937, lng: 78.9629 };
        const initialZoom = selectedLocation || position ? 16 : 5;

        const map = new google.maps.Map(containerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });

        mapRef.current = map;

        // Click anywhere to move marker.
        clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onPositionChangeRef.current({ lat, lng });
        });

        // Place initial marker if position exists.
        if (position) {
          markerRef.current = new google.maps.Marker({
            position,
            map,
            animation: google.maps.Animation.DROP,
          });
        }

        setReady(true);
      })
      .catch((err: Error) => {
        console.error('[MapInner] load error:', err);
        if (!cancelled) setError(err.message || 'Failed to load Google Maps');
      });

    return () => {
      cancelled = true;
      if (clickListenerRef.current) {
        clickListenerRef.current.remove();
        clickListenerRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker to `position` (from map clicks or parent updates).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !window.google) return;

    if (position) {
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position,
          map,
        });
      }
    } else if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, [position, ready]);

  // Handle explicit "selected location" (search / GPS) — pan + zoom + marker.
  const selLat = selectedLocation?.lat;
  const selLng = selectedLocation?.lng;
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || selLat === undefined || selLng === undefined || !window.google) return;

    const target = { lat: selLat, lng: selLng };
    map.panTo(target);
    map.setZoom(16);

    if (markerRef.current) {
      markerRef.current.setPosition(target);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: target,
        map,
        animation: window.google.maps.Animation.DROP,
      });
    }
  }, [selLat, selLng, ready]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted p-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
