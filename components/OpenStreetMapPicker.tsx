"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import Link from "next/link";
import { CalendarDays, LocateFixed, MapPin } from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { formatDate, type Tournament } from "@/lib/api";

type PlaceResult = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    state?: string;
    state_district?: string;
  };
};

type OpenStreetMapPickerProps = {
  countryCode: string;
  latitude: string;
  longitude: string;
  onCoordinatesChange?: (latitude: string, longitude: string) => void;
  onAddressChange?: (city: string, region: string) => void;
  tournaments?: Tournament[];
  mode?: "venue" | "tournaments";
};

let lastSearchAt = 0;

const selectedPin = L.divIcon({
  className: "osm-selected-pin",
  html: "<span><i></i></span>",
  iconSize: [34, 42],
  iconAnchor: [17, 40],
});

const tournamentPin = L.divIcon({
  className: "osm-game-pin",
  html: "<span><i></i></span>",
  iconSize: [32, 40],
  iconAnchor: [16, 38],
});

const liveLocationPin = L.divIcon({
  className: "osm-live-pin",
  html: "<span></span>",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

type Coordinates = [number, number];

function MapClickHandler({
  onSelect,
}: {
  onSelect?: (lat: number, lon: number) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function MapPosition({ position }: { position: Coordinates | null }) {
  const map = useMap();
  const latitude = position?.[0] ?? null;
  const longitude = position?.[1] ?? null;
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 15));
    }
  }, [latitude, longitude, map]);
  return null;
}

export default function OpenStreetMapPicker({
  countryCode,
  latitude,
  longitude,
  onCoordinatesChange,
  onAddressChange,
  tournaments = [],
  mode = "venue",
}: OpenStreetMapPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [tracking, setTracking] = useState(false);
  const [livePosition, setLivePosition] = useState<Coordinates | null>(null);
  const [gpsError, setGpsError] = useState("");
  const [routeTarget, setRouteTarget] = useState<{ coordinates: Coordinates; title: string } | null>(null);
  const livePositionRef = useRef<Coordinates | null>(null);
  const selectedCoordinates =
    latitude && longitude ? ([Number(latitude), Number(longitude)] as Coordinates) : null;
  const gameLocations = useMemo(
    () =>
      tournaments.flatMap((tournament) => {
        const lat = Number(tournament.latitude ?? tournament.venue?.latitude);
        const lon = Number(tournament.longitude ?? tournament.venue?.longitude);
        return Number.isFinite(lat) && Number.isFinite(lon)
          ? [{ tournament, coordinates: [lat, lon] as Coordinates }]
          : [];
      }),
    [tournaments],
  );
  const firstGame = gameLocations[0]?.coordinates ?? null;
  const mapFocus = tracking && livePosition
    ? livePosition
    : mode === "venue"
      ? selectedCoordinates
      : firstGame;
  const destinationLatitude =
    mode === "venue" ? selectedCoordinates?.[0] : routeTarget?.coordinates[0];
  const destinationLongitude =
    mode === "venue" ? selectedCoordinates?.[1] : routeTarget?.coordinates[1];
  const destination =
    destinationLatitude !== undefined && destinationLongitude !== undefined
      ? ([destinationLatitude, destinationLongitude] as Coordinates)
      : null;

  useEffect(() => {
    if (!tracking) return;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const position: Coordinates = [coords.latitude, coords.longitude];
        livePositionRef.current = position;
        setLivePosition(position);
        setGpsError("");
      },
      (cause) => {
        livePositionRef.current = null;
        setLivePosition(null);
        const message =
          cause.code === cause.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in your browser to use live tracking."
            : cause.code === cause.POSITION_UNAVAILABLE
              ? "Your current location is unavailable. Check that location services are enabled."
              : "Could not get your location. Try again when GPS is available.";
        setGpsError(message);
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking]);

  const formatDistance = (meters: number) =>
    meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
  const formatEta = (seconds: number) => {
    const minutes = Math.max(1, Math.round(seconds / 60));
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
  };
  const distanceBetween = (from: Coordinates, to: Coordinates) => {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const [lat1, lon1] = from.map(radians);
    const [lat2, lon2] = to.map(radians);
    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;
    const value =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };
  const destinationDistance =
    tracking && livePosition && destination
      ? distanceBetween(livePosition, destination)
      : null;
  const destinationEtaSeconds =
    destinationDistance === null ? null : destinationDistance / (30000 / 3600) + 120;

  const selectPlace = (place: PlaceResult) => {
    onCoordinatesChange?.(Number(place.lat).toFixed(6), Number(place.lon).toFixed(6));
    const address = place.address;
    const city =
      address?.city ??
      address?.town ??
      address?.village ??
      address?.municipality ??
      address?.suburb ??
      "";
    onAddressChange?.(city, address?.state ?? address?.state_district ?? "");
    setResults([]);
    setError("");
  };

  const selectMapPoint = (lat: number, lon: number) => {
    if (mode === "venue") onCoordinatesChange?.(lat.toFixed(6), lon.toFixed(6));
  };

  const startRouteToGame = (title: string, coordinates: Coordinates) => {
    setRouteTarget({ title, coordinates });
  };

  const searchPlaces = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Enter a place or venue name to search.");
      return;
    }
    setSearching(true);
    setError("");
    setResults([]);
    try {
      const wait = Math.max(0, 1000 - (Date.now() - lastSearchAt));
      if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
      const params = new URLSearchParams({
        q: trimmedQuery,
        format: "jsonv2",
        addressdetails: "1",
        limit: "5",
      });
      if (countryCode) params.set("countrycodes", countryCode.toLowerCase());
      lastSearchAt = Date.now();
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: { Accept: "application/json" },
          referrerPolicy: "strict-origin-when-cross-origin",
        },
      );
      if (!response.ok) {
        throw new Error(`Place search failed (${response.status}). Please try again.`);
      }
      const places = (await response.json()) as PlaceResult[];
      if (!places.length) {
        setError("No matching places found. Try a nearby town or a more specific name.");
        return;
      }
      setResults(places);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not search OpenStreetMap. Check your connection and try again.",
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="osm-picker">
      {mode === "venue" && (
        <>
          <div className="osm-search-row">
            <input
              aria-label="Search for a place on OpenStreetMap"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void searchPlaces();
                }
              }}
              placeholder="Search for a venue, street, or town"
            />
            <button
              className="secondary-button"
              type="button"
              onClick={() => void searchPlaces()}
              disabled={searching}
            >
              {searching ? "Searching…" : "Search map"}
            </button>
          </div>
          <p className="field-hint">Search for a place or click directly on the map to drop the pin.</p>
          {error && <p className="osm-search-error" role="status">{error}</p>}
          {results.length > 0 && (
            <ul className="osm-search-results" aria-label="Place search results">
              {results.map((place) => (
                <li key={place.place_id}>
                  <button type="button" onClick={() => selectPlace(place)}>
                    {place.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <div className="osm-location-toolbar">
        <div>
          <strong>{tracking ? "Live location is on" : "Location sharing is off"}</strong>
          <small>
            {tracking
              ? "Your position updates while this map is open."
              : "Your location stays on this device and is only used while tracking is on."}
          </small>
        </div>
        <button
          className={tracking ? "secondary-button is-tracking" : "secondary-button"}
          type="button"
          onClick={() => {
            if (tracking) {
              livePositionRef.current = null;
              setLivePosition(null);
            } else if (!navigator.geolocation) {
              setGpsError("Live location is not available in this browser.");
              return;
            }
            setGpsError("");
            setTracking((active) => !active);
          }}
        >
          <LocateFixed aria-hidden="true" />
          {tracking ? "Stop tracking" : "Use live location"}
        </button>
      </div>
      {gpsError && <p className="osm-search-error" role="status">{gpsError}</p>}
      {destinationLatitude !== undefined && destinationLongitude !== undefined && tracking && (
        <div className="osm-route-summary" role="status">
          <MapPin aria-hidden="true" />
          <span>
            <strong>{mode === "tournaments" ? routeTarget?.title ?? "Selected game" : "Route to selected venue"}</strong>
            {destinationDistance !== null && destinationEtaSeconds !== null
              ? `${formatDistance(destinationDistance)} direct · about ${formatEta(destinationEtaSeconds)} drive`
              : "Waiting for GPS location…"}
          </span>
          {mode === "tournaments" && routeTarget && (
            <button type="button" onClick={() => setRouteTarget(null)}>Clear destination</button>
          )}
        </div>
      )}
      {tracking && destinationLatitude !== undefined && destinationLongitude !== undefined && (
        <small className="field-hint">Distance is measured straight-line on your device. Drive time is a rough estimate using 30 km/h; it is not a road route, live traffic, or turn-by-turn navigation.</small>
      )}
      {mode === "tournaments" && !gameLocations.length && (
        <p className="field-hint">No open tournaments with map coordinates are available to show.</p>
      )}
      <div className="osm-map" aria-label="OpenStreetMap venue picker">
        <MapContainer
          center={mapFocus ?? [20, 0]}
          zoom={mode === "tournaments" ? 11 : 2}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onSelect={selectMapPoint} />
          <MapPosition position={mapFocus} />
          {selectedCoordinates && <Marker position={selectedCoordinates} icon={selectedPin} />}
          {livePosition && tracking && (
            <Marker position={livePosition} icon={liveLocationPin}>
              <Popup><strong>Your live location</strong><br />Only visible to you.</Popup>
            </Marker>
          )}
          {gameLocations.map(({ tournament, coordinates }) => (
            <Marker key={tournament.id} position={coordinates} icon={tournamentPin}>
              <Popup>
                <div className="osm-game-popup">
                  <strong>{tournament.title}</strong>
                  <span>{tournament.sport.name} · {tournament.venue_name || tournament.venue.name}</span>
                  <span><CalendarDays aria-hidden="true" />{formatDate(tournament.starts_at)}</span>
                  {livePosition && <span>{formatDistance(distanceBetween(livePosition, coordinates))} away (straight-line)</span>}
                  <Link href={`/tournaments/${tournament.id}`}>View game</Link>
                  {mode === "tournaments" && (
                    <button type="button" onClick={() => startRouteToGame(tournament.title, coordinates)}>
                      Route to game
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <small className="osm-attribution">
        Map data © OpenStreetMap contributors · Search powered by{" "}
        <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noreferrer">Nominatim</a>
      </small>
    </div>
  );
}
