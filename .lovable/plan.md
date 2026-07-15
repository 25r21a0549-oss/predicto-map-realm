## Root cause

**Auth issue.** Console shows `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` from `POST /auth/v1/token?grant_type=refresh_token`. The Supabase client has a stale refresh token in `localStorage` from an expired/rotated session. `useAuth` never catches this, so `getSession()` resolves with a null session but the UI can end up in a stuck state and Sign In appears to "not work" (attempts get silently invalidated by the recovery flow).

**Map issue.** Current search uses OSM Nominatim + Leaflet. It works but the user wants a real Google Maps experience (autocomplete, satellite/terrain, smooth zoom, reverse geocode on click).

## Scope (approved by you)

1. Silent auth recovery + harden — no UI changes.
2. Replace Leaflet map with Google Maps via the Lovable Google Maps connector — same containing UI (same card, same search bar position, same GPS button).

I will NOT change: colors, typography, spacing, layout, buttons, navbar, routes, or any page other than what's listed under "Files to change".

## Task 1 — Auth fix

**`src/hooks/useAuth.tsx`**
- On init, wrap `getSession()` in try/catch. If it throws or returns a `refresh_token_not_found` / `Invalid Refresh Token` error, call `supabase.auth.signOut({ scope: 'local' })` to clear the bad token, set `user`/`session` to null, then set `loading=false`. This makes the login form usable again after a stale session.
- Add a global listener for `TOKEN_REFRESHED` failure via `onAuthStateChange` and clear local storage on `SIGNED_OUT`.
- Improve error surfaces: return typed errors from `signIn`/`signUp`/`signInWithGoogle` (already returns `{ error }`, but make sure the error message is human-readable in `Auth.tsx` — it already shows `error.message` via toast, so no UI change).
- Verify protected routes: `ProtectedRoute` in `App.tsx` is correct; no changes needed after the recovery fix.

No UI changes. No new routes.

## Task 2–6 — Google Maps upgrade

**Connector setup**
- Call `standard_connectors--connect` with `google_maps` so `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY` (browser key) and `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID` are injected. Server-side gateway calls (reverse geocoding) will use `LOVABLE_API_KEY` + `GOOGLE_MAPS_API_KEY` via an edge function.

**`src/components/MapInner.tsx`** — replace Leaflet init with Google Maps JS API:
- Load `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&libraries=places&callback=initGoogleMaps&channel=${TRACKING_ID}` once via a shared loader utility (`src/lib/googleMaps.ts`).
- Init `google.maps.Map` with default `roadmap` type, zoom/pan controls, gesture handling, scroll-wheel zoom, double-click zoom, compass.
- Use `google.maps.Marker` (per connector rules — no `AdvancedMarkerElement`, no `mapId`).
- On map click → move marker, call `onPositionChange({ lat, lng })`.
- When `selectedLocation` changes → `map.panTo(...)` + `setZoom(16)` + move marker.

**`src/components/MapSearchBar.tsx`** — swap Nominatim for Places API (New) autocomplete:
- Use `AutocompleteSuggestion.fetchAutocompleteSuggestions()` from `google.maps.places` (new API, not the deprecated `Autocomplete` widget).
- Debounced (300ms). Session token for billing.
- On select: call `place.fetchFields({ fields: ['location','displayName','formattedAddress'] })` → propagate `{lat, lng, name}` via existing `onLocationSelect` prop.
- Keep exact same visual: same `Input` with search icon, same dropdown structure, same "No locations found" state, same clear button.

**`supabase/functions/reverse-geocode/index.ts`** — new edge function for click-to-address:
- POST `{lat, lng}` → calls Google Geocoding API via connector gateway (`https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=...`) → returns `{formatted_address, place_name}`.
- CORS via `npm:@supabase/supabase-js@2/cors`.
- Called from `MapComponent` after marker moves via click → address surfaces as location metadata (fed to predictor via existing `onLocationSelect`).

**`src/components/MapComponent.tsx`** — same JSX (Card, search bar row, GPS button, save-area form). Only internal changes:
- Store `address` alongside `lat/lng` and pass through to `onLocationSelect` when available (backward compatible — existing callers only read `{lat, lng}`).
- After map click, call reverse-geocode edge function; on success, pre-fill area name (same behavior as before, just uses Google geocoder now).

## Task 7 — Debugging pass

I will check console + network after wiring up:
- No CORS errors (edge function uses `corsHeaders`).
- No missing key errors (browser key check + fallback error toast if connector not connected).
- No map init race (use `callback=initGoogleMaps` per connector rules).
- Auth: refresh token error no longer surfaces; sign-in completes to `/dashboard`.

## Files to change

- `src/hooks/useAuth.tsx` — refresh-token recovery
- `src/lib/googleMaps.ts` — new, script loader singleton
- `src/components/MapInner.tsx` — rewrite internals for Google Maps
- `src/components/MapSearchBar.tsx` — rewrite fetch to Places API (New), same UI
- `src/components/MapComponent.tsx` — add reverse geocode call on click, unchanged JSX
- `supabase/functions/reverse-geocode/index.ts` — new edge function

## Files NOT changed

`Auth.tsx`, `Navbar.tsx`, `Predictor.tsx`, `ROI.tsx`, `Compare.tsx`, `TaxCalculator.tsx`, `Dashboard.tsx`, `Account.tsx`, `Index.tsx`, `Chatbot.tsx`, `App.tsx`, any UI primitive, Tailwind config, index.css.

## Environment / prerequisites

- Google Maps connector must be linked (I'll trigger `standard_connectors--connect` — you'll see the popup, click Approve). The managed key works on `*.lovable.app`; on a custom domain you'd later need your own key + referrer allowlist.
- No other env vars required. Lovable Cloud is already enabled.

## Verification checklist I'll run after implementing

- Load `/auth` → refresh page → no console `refresh_token_not_found` after fix.
- Sign in with existing account → redirected to `/dashboard`. Refresh → still signed in. Logout → back to `/auth`.
- Predictor page: search "Bengaluru" → autocomplete shows results → select → map pans to Bengaluru, zoom 16, marker dropped.
- Click elsewhere on map → marker moves, reverse-geocoded address appears in the location metadata line, coords fed to prediction form.
- GPS button → centers on current location, marker placed.
- Save area works with the new marker.
- No console errors, no CORS errors, no key errors.

I'll ship a short report at the end with root cause / files / APIs / env vars / test results.