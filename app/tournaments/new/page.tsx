"use client";

import { ArrowRight, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";
import { fetchAllPages, formatPrice, type Country, type Sport, type Tournament } from "@/lib/api";

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
  const [venueName, setVenueName] = useState("");
  const [state, setState] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [startsAt, setStartsAt] = useState(localDateTimeValue);
  const [duration, setDuration] = useState(120);
  const [entryFee, setEntryFee] = useState("0");
  const [currency, setCurrency] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const selectedCountry = countries.find((country) => country.code === countryCode) ?? null;
  const selectedSport = sports.find((sport) => String(sport.id) === sportId) ?? null;

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const [nextCountries, nextSports] = await Promise.all([
          fetchAllPages<Country>("/countries/", request),
          fetchAllPages<Sport>("/sports/", request),
        ]);
        if (active) {
          setCountries(nextCountries);
          setSports(nextSports);
          if (nextSports.length) setSportId(String(nextSports[0].id));
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load countries and sports.");
      } finally {
        if (active) setLoadingOptions(false);
      }
    };
    void loadOptions();
    return () => { active = false; };
  }, [request]);

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
            <section className="form-section"><h2>Game</h2><label>Tournament name<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="Sunday Hoops" /></label><label>Details <small>(optional)</small><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What should players bring?" /></label><div className="form-grid"><label htmlFor="tournament-country">Country<select id="tournament-country" value={countryCode} onChange={(event) => changeCountry(event.target.value)} required><option value="">Choose a country</option>{countries.map((country) => <option value={country.code} key={country.code}>{country.name}</option>)}</select></label><label>Sport<select value={sportId} onChange={(event) => setSportId(event.target.value)} required><option value="">Choose a sport</option>{sports.map((sport) => <option value={sport.id} key={sport.id}>{sport.name}</option>)}</select></label></div>{loadingOptions && <small className="field-hint">Loading countries and sports…</small>}</section>
            <section className="form-section"><h2>Where</h2><p className="form-intro">Add the venue details and its map coordinates. You can find coordinates in Google Maps by right-clicking the venue and copying them.</p><label>Venue name<input value={venueName} onChange={(event) => setVenueName(event.target.value)} maxLength={160} placeholder="Riverside Court" required /></label><div className="form-grid"><label>City<input value={city} onChange={(event) => setCity(event.target.value)} maxLength={100} placeholder="City" required /></label><label>State / region<input value={state} onChange={(event) => setState(event.target.value)} maxLength={100} placeholder="State or region" /></label></div><div className="form-grid"><label>Latitude<input type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} placeholder="e.g. 51.507400" required /></label><label>Longitude<input type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} placeholder="e.g. -0.127800" required /></label></div><small className="field-hint">A map pin helps players find the meeting point. The venue is created as a free location in the MVP.</small></section>
            <section className="form-section"><h2>When</h2><div className="form-grid"><label>Date & time<input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required /></label><label>Game length<select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{[30, 60, 90, 120, 150, 180, 240, 300, 360].map((minutes) => <option value={minutes} key={minutes}>{minutes < 60 ? `${minutes} min` : `${minutes / 60} hr${minutes > 60 ? "s" : ""}`}</option>)}</select></label></div></section>
            <section className="form-section"><h2>Spots & entry</h2><label>Price per spot<input type="number" min="0" step="0.01" value={entryFee} onChange={(event) => setEntryFee(event.target.value)} required /></label><label>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={!selectedCountry} required><option value="">Choose a country first</option>{selectedCountry?.currencies.map((option) => <option value={option.code} key={option.code}>{option.code}{option.is_default ? " · default" : ""}</option>)}</select></label>{selectedCountry && <small className="field-hint">Choose from currencies supported in {selectedCountry.name}. Payments are collected securely during checkout.</small>}<div className="stepper-row"><span><strong>Player spots</strong><small>Total number of players who can join.</small></span><div className="stepper"><button type="button" aria-label="Reduce player spots" disabled={maxPlayers <= 1} onClick={() => setMaxPlayers((count) => Math.max(1, count - 1))}><Minus aria-hidden="true" /></button><strong>{maxPlayers}</strong><button type="button" aria-label="Add player spots" disabled={maxPlayers >= 99} onClick={() => setMaxPlayers((count) => Math.min(99, count + 1))}><Plus aria-hidden="true" /></button></div></div>{selectedCountry && <div className="prize-preview"><span>Projected prize pool <small>if every spot is paid</small></span><strong>{formatPrice(Number(entryFee || 0) * maxPlayers, currency || selectedCountry.default_currency || "USD")}</strong></div>}</section>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button full-button" type="submit" disabled={busy || loadingOptions}>{busy ? "Creating tournament…" : "Create tournament"} <ArrowRight aria-hidden="true" /></button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
