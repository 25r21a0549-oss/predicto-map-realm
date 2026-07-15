/// <reference types="google.maps" />
import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loadGoogleMaps } from '@/lib/googleMaps';

interface Suggestion {
  placeId: string;
  primary: string;
  secondary: string;
}

interface MapSearchBarProps {
  onLocationSelect: (location: { lat: number; lng: number; name: string }) => void;
}

export function MapSearchBar({ onLocationSelect }: MapSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const placesReadyRef = useRef(false);

  // Preload the Maps JS API (with Places library) as soon as the search bar mounts.
  useEffect(() => {
    loadGoogleMaps()
      .then(() => {
        placesReadyRef.current = true;
      })
      .catch((err) => {
        console.error('[MapSearchBar] Maps load failed:', err);
      });
  }, []);

  const ensureSessionToken = useCallback(async () => {
    if (sessionTokenRef.current) return sessionTokenRef.current;
    const g = await loadGoogleMaps();
    const { AutocompleteSessionToken } = (await g.maps.importLibrary('places')) as google.maps.PlacesLibrary;
    sessionTokenRef.current = new AutocompleteSessionToken();
    return sessionTokenRef.current;
  }, []);

  const searchLocation = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const g = await loadGoogleMaps();
      const placesLib = (await g.maps.importLibrary('places')) as google.maps.PlacesLibrary;
      const token = await ensureSessionToken();

      const { suggestions } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: trimmed,
        sessionToken: token,
      });

      const parsed: Suggestion[] = (suggestions || [])
        .map((s: { placePrediction?: { placeId: string; mainText?: { text: string }; secondaryText?: { text: string }; text?: { text: string } } }) => {
          const p = s.placePrediction;
          if (!p) return null;
          return {
            placeId: p.placeId,
            primary: p.mainText?.text ?? p.text?.text ?? '',
            secondary: p.secondaryText?.text ?? '',
          };
        })
        .filter(Boolean) as Suggestion[];

      setResults(parsed);
      setShowResults(true);
    } catch (err) {
      console.error('[MapSearchBar] autocomplete error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [ensureSessionToken]);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocation(value), 300);
  }, [searchLocation]);

  const handleResultSelect = useCallback(async (suggestion: Suggestion) => {
    try {
      const g = await loadGoogleMaps();
      const placesLib = (await g.maps.importLibrary('places')) as google.maps.PlacesLibrary;
      const token = sessionTokenRef.current;

      const place = new placesLib.Place({ id: suggestion.placeId });
      await place.fetchFields({ fields: ['location', 'displayName', 'formattedAddress'] });

      const loc = place.location;
      if (!loc) throw new Error('Place has no location');
      const lat = typeof loc.lat === 'function' ? loc.lat() : (loc.lat as unknown as number);
      const lng = typeof loc.lng === 'function' ? loc.lng() : (loc.lng as unknown as number);

      const name =
        place.displayName ||
        place.formattedAddress ||
        suggestion.primary;

      onLocationSelect({ lat, lng, name });
      setQuery(suggestion.primary);
      setShowResults(false);
      setResults([]);
      // End the billing session — mint a fresh token on next query.
      sessionTokenRef.current = null;
      void token; // (kept for clarity)
    } catch (err) {
      console.error('[MapSearchBar] place details error:', err);
    }
  }, [onLocationSelect]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  }, []);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for a location..."
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!loading && query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((result) => (
            <button
              key={result.placeId}
              onClick={() => handleResultSelect(result)}
              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="text-sm line-clamp-2">
                {result.primary}
                {result.secondary && (
                  <span className="text-muted-foreground"> — {result.secondary}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {showResults && query.length >= 2 && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg p-3 text-center text-sm text-muted-foreground">
          No locations found
        </div>
      )}
    </div>
  );
}
