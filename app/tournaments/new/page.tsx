"use client";

import { ArrowRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";
import { fetchAllPages, formatPrice, type Country, type Sport, type Tournament } from "@/lib/api";

const OpenStreetMapPicker = dynamic(() => import("@/components/OpenStreetMapPicker"), {
  ssr: false,
  loading: () => <div className="map-picker-loading">Loading OpenStreetMap…</div>,
});

function localDateTimeValue() {
  const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  date.setHours(18, 0, 0, 0);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function CreateTournamentPage() {
  const { user, isInitializing, request } = useAuth();
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [sportId, setSportId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [venueName, setVenueName] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [startsAt, setStartsAt] = useState(localDateTimeValue);
  const [duration, setDuration] = useState(120);
  const entryFee = "0";
  const [currency, setCurrency] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [optionsAttempt, setOptionsAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedCountry = countries.find((country) => country.code === countryCode) ?? null;
  const selectedSport = sports.find((sport) => String(sport.id) === sportId) ?? null;

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      const [countryResult, sportResult] = await Promise.allSettled([
        fetchAllPages<Country>("/countries/", request),
        fetchAllPages<Sport>("/sports/", request),
      ]);
      if (active) {
        const messages: string[] = [];
        if (countryResult.status === "fulfilled") {
          setCountries(countryResult.value);
        } else {
          messages.push(
            countryResult.reason instanceof Error
              ? `Could not load countries: ${countryResult.reason.message}`
              : "Could not load countries.",
          );
        }
        if (sportResult.status === "fulfilled") {
          const orderedSports = [...sportResult.value].sort((a, b) => a.name.localeCompare(b.name));
          setSports(orderedSports);
          setSportId((current) =>
            orderedSports.some((sport) => String(sport.id) === current)
              ? current
              : String(orderedSports[0]?.id ?? ""),
          );
        } else {
          messages.push(
            sportResult.reason instanceof Error
              ? `Could not load sports: ${sportResult.reason.message}`
              : "Could not load sports.",
          );
        }
        setOptionsError(messages.join(" "));
        setLoadingOptions(false);
      }
    };
    void loadOptions();
    return () => { active = false; };
  }, [optionsAttempt, request]);

  const changeCountry = (code: string) => {
    setCountryCode(code);
    const country = countries.find((item) => item.code === code);
    setCurrency(country?.default_currency ?? country?.currencies[0]?.code ?? "");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!user) {
      router.push("/account?next=%2Ftournaments%2Fnew");
      return;
    }
    if (!selectedCountry || !selectedSport || !currency) {
      setError("Choose a country, sport, and supported currency.");
      return;
    }
    if (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90 ||
        !Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
      setError("Enter valid venue coordinates (latitude −90 to 90, longitude −180 to 180).");
      return;
    }
    if (new Date(startsAt) <= new Date()) {
      setError("Choose a future date and time.");
      return;
    }
    const fee = Number(entryFee);
    if (!Number.isFinite(fee) || fee < 0) {
      setError("Enter a valid entry fee of zero or more.");
      return;
    }
    setBusy(true);
    try {
      const created = await request<Tournament>("/tournaments/", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim() || `${selectedSport.name} tournament`,
          description: description.trim(),
          country_id: selectedCountry.code,
          sport_id: selectedSport.id,
          venue_id: null,
          venue_city: city.trim(),
          venue_address: address.trim(),
          postal_code: postalCode.trim(),
          venue_name: venueName.trim(),
          state: state.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          starts_at: new Date(startsAt).toISOString(),
          duration_minutes: duration,
          entry_fee: fee.toFixed(2),
          currency,
          max_players: maxPlayers,
        }),
      });
      router.push(`/tournaments/${created.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this tournament.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="app-page narrow-page create-page">
        <Link className="back-link" href="/tournaments"><span aria-hidden="true">←</span>Find games</Link>
        <div className="page-heading"><span className="eyebrow">MAKE A PLAN</span><h1>Create a game.</h1><p>Set the details, invite your crew, and get playing.</p></div>
        {isInitializing ? <div className="status-card">Checking your account…</div> : !user ? <div className="empty-state"><h2>Sign in to create a tournament</h2><p>Your account will be listed as the tournament host.</p><Link className="primary-button" href="/account?next=%2Ftournaments%2Fnew">Sign in or join <ArrowRight aria-hidden="true" /></Link></div> : (
          <form className="app-form create-form" onSubmit={submit}>
            <section className="form-section"><h2>Game</h2><label>Tournament name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="Sunday Hoops" /></label><label>Details <small>(optional)</small><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What should players bring?" /></label><div className="form-grid"><label htmlFor="tournament-country">Country<select id="tournament-country" value={countryCode} onChange={(event) => changeCountry(event.target.value)} disabled={loadingOptions || countries.length === 0} required><option value="">{loadingOptions ? "Loading countries…" : countries.length ? "Choose a country" : "Countries unavailable"}</option>{[...countries].sort((a, b) => a.name.localeCompare(b.name)).map((country) => <option value={country.code} key={country.code}>{country.name}</option>)}</select></label><label htmlFor="tournament-sport">Sport<select id="tournament-sport" value={sportId} onChange={(event) => setSportId(event.target.value)} disabled={loadingOptions || sports.length === 0} required><option value="">{loadingOptions ? "Loading sports…" : sports.length ? "Choose a sport" : "Sports unavailable"}</option>{sports.map((sport) => <option value={sport.id} key={sport.id}>{sport.name}</option>)}</select></label></div>{loadingOptions && <small className="field-hint">Loading countries and sports…</small>}{optionsError && <div className="form-error" role="alert">{optionsError} <button className="text-button" type="button" onClick={() => { setLoadingOptions(true); setOptionsError(""); setOptionsAttempt((attempt) => attempt + 1); }}>Retry</button></div>}</section>
            <section className="form-section">
              <h2>Where</h2>
              <p className="form-intro">
                Search OpenStreetMap or select the exact meeting point on the map. The pin coordinates will be saved with this game.
              </p>
              <label>Venue name<input value={venueName} onChange={(event) => setVenueName(event.target.value)} maxLength={160} placeholder="Riverside Court" required /></label>
              <label>Street address / directions<input value={address} onChange={(event) => setAddress(event.target.value)} maxLength={240} placeholder="Street, building, entrance, or meeting point" /></label>
              <div className="form-grid">
                <label>City<input value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} placeholder="City" required /></label>
                <label>State / region<input value={state} onChange={(event) => setState(event.target.value)} maxLength={100} placeholder="State or region" /></label>
              </div>
              <label>ZIP / postal code<input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} maxLength={20} autoComplete="postal-code" placeholder="ZIP or postal code" /></label>
              <OpenStreetMapPicker
                countryCode={countryCode}
                latitude={latitude}
                longitude={longitude}
                onCoordinatesChange={(nextLatitude, nextLongitude) => {
                  setLatitude(nextLatitude);
                  setLongitude(nextLongitude);
                }}
                onAddressChange={(nextCity, nextState) => {
                  if (nextCity) setCity(nextCity);
                  if (nextState) setState(nextState);
                }}
              />
              <div className="form-grid">
                <label>Latitude<input type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="Choose a point on the map" required /></label>
                <label>Longitude<input type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="Choose a point on the map" required /></label>
              </div>
              <small className="field-hint">OpenStreetMap data © OpenStreetMap contributors. The venue is created as a free location in the MVP.</small>
            </section>
            <section className="form-section"><h2>When</h2><div className="form-grid"><label>Date & time<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label><label>Game length<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{[30, 60, 90, 120, 150, 180, 240, 300, 360].map((minutes) => <option value={minutes} key={minutes}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} hr${minutes > 60 ? "s" : ""}`}</option>)}</select></label></div></section>
            <section className="form-section"><h2>Spots & entry</h2><label>Price per spot<input type="number" min="0" step="0.01" value={entryFee} disabled aria-describedby="entry-fee-paused" required /></label><small className="field-hint" id="entry-fee-paused">Paid tournaments are paused until organizer payouts are supported. New games are free to join.</small><label>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={!selectedCountry} required><option value="">Choose a country first</option>{selectedCountry?.currencies.map((option) => <option value={option.code} key={option.code}>{option.code}{option.is_default ? " · default" : ""}</option>)}</select></label>{selectedCountry && <small className="field-hint">Choose from currencies supported in {selectedCountry.name}. Payments are collected securely during checkout.</small>}<div className="stepper-row"><span><strong>Player spots</strong><small>Total number of players who can join.</small></span><div className="stepper"><button type="button" aria-label="Reduce player spots" disabled={maxPlayers <= 1} onClick={() => setMaxPlayers((count) => Math.max(1, count - 1))}><Minus aria-hidden="true" /></button><strong>{maxPlayers}</strong><button type="button" aria-label="Add player spots" disabled={maxPlayers >= 99} onClick={() => setMaxPlayers((count) => Math.min(99, count + 1))}><Plus aria-hidden="true" /></button></div></div>{selectedCountry && <div className="prize-preview"><span>Projected prize pool <small>if every spot is paid</small></span><strong>{formatPrice(Number(entryFee || 0) * maxPlayers, currency || selectedCountry.default_currency || "USD")}</strong></div>}</section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" type="submit" disabled={busy || loadingOptions}>{busy ? "Creating tournament…" : "Create tournament"} <ArrowRight aria-hidden="true" /></button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
