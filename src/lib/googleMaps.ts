// Shared Google Maps JS API loader.
// Loads the script once (with Places library) and caches the promise.
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    google?: typeof google;
    __initGoogleMaps?: () => void;
  }
}

let loaderPromise: Promise<typeof google> | null = null;

async function fetchApiKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('maps-config');
  if (error) throw new Error(`Failed to load maps config: ${error.message}`);
  if (!data?.apiKey) throw new Error('maps-config returned no apiKey');
  return data.apiKey as string;
}

export function loadGoogleMaps(): Promise<typeof google> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser'));
  }
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = (async () => {
    const apiKey = await fetchApiKey();

    return new Promise<typeof google>((resolve, reject) => {
      window.__initGoogleMaps = () => {
        if (window.google?.maps) {
          resolve(window.google);
        } else {
          reject(new Error('Google Maps failed to initialize'));
        }
      };

      const script = document.createElement('script');
      const params = new URLSearchParams({
        key: apiKey,
        libraries: 'places',
        loading: 'async',
        callback: '__initGoogleMaps',
        v: 'weekly',
      });
      script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    });
  })();

  return loaderPromise;
}
