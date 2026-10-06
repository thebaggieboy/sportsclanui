"use client";

import { List, Map as MapIcon, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TournamentCard from "@/components/TournamentCard";
import { useAuth } from "@/components/AppProviders";
import { fetchAllPages, type Country, type Sport, type Tournament } from "@/lib/api";

const OpenStreetMapPicker = dynamic(() => import("@/components/OpenStreetMapPicker"), {
  ssr: false,
  loading: () => <div className="map-picker-loading">Loading OpenStreetMap…</div>,
});

export default function TournamentsPage() {
  const { request } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [result, setResult] = useState<{ key: string; tournaments: Tournament[] } | null>(null);
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [filters, setFilters] = useState({ sport: "", search: "", city: "", countryCode: "" });
  const [view, setView] = useState<"list" | "map">("list");
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [filterOptionsError, setFilterOptionsError] = useState("");
  const [filterOptionsAttempt, setFilterOptionsAttempt] = useState(0);
  const [error, setError] = useState("");

  const filterKey = JSON.stringify(filters);
  const tournaments = result?.key === filterKey ? result.tournaments : [];
  const loading = result?.key !== filterKey;

  useEffect(() => {
    let active = true;
    const loadSports = async () => {
      const [sportResult, countryResult] = await Promise.allSettled([
        fetchAllPages<Sport>("/sports/", request),
        fetchAllPages<Country>("/countries/", request),
      ]);
      if (active) {
        const errors: string[] = [];
        if (sportResult.status === "fulfilled") {
          setSports([...sportResult.value].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          errors.push(
            sportResult.reason instanceof Error
              ? `Could not load sports: ${sportResult.reason.message}`
              : "Could not load sports.",
          );
        }
        if (countryResult.status === "fulfilled") {
          setCountries([...countryResult.value].sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          errors.push(
            countryResult.reason instanceof Error
              ? `Could not load countries: ${countryResult.reason.message}`
              : "Could not load countries.",
          );
        }
        setFilterOptionsError(errors.join(" "));
        setLoadingFilters(false);
      }
    };
    void loadSports();
    return () => { active = false; };
  }, [filterOptionsAttempt, request]);

  useEffect(() => {
    let active = true;
    const loadGames = async () => {
      try {
        const params = new URLSearchParams({ status: "open" });
        if (filters.sport) params.set("sport__slug", filters.sport);
        if (filters.city) params.set("venue__city", filters.city);
        if (filters.countryCode) params.set("country__code", filters.countryCode);
        if (filters.search) params.set("search", filters.search);
        const nextGames = await fetchAllPages<Tournament>(`/tournaments/?${params.toString()}`, request);
        if (active) {
          setResult({ key: filterKey, tournaments: nextGames });
          setError("");
        }
      } catch (cause) {
        if (active) {
          setResult({ key: filterKey, tournaments: [] });
          setError(cause instanceof Error ? cause.message : "Could not load tournaments.");
        }
      }
    };
    void loadGames();
    return () => { active = false; };
  }, [filterKey, filters, request]);

  return (
    <AppShell>
      <div className="app-page">
        <div className="page-heading"><span className="eyebrow">PLAY TOGETHER</span><h1>Find your game.</h1><p>Choose a sport, find a local game, and claim your spot.</p></div>
        <form className="game-filters" onSubmit={(event) => { event.preventDefault(); setFilters({ search: search.trim(), city: city.trim(), sport, countryCode }); }}>
          <label className="search-field"><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Team, tournament, or venue" aria-label="Search tournaments" /></label>
          <input className="filter-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Filter by city" aria-label="Filter by city" />
          <select className="filter-city" value={sport} disabled={loadingFilters || sports.length === 0} onChange={(event) => { const selectedSport = event.target.value; setSport(selectedSport); setFilters((current) => ({ ...current, sport: selectedSport })); }} aria-label="Filter tournaments by sport">
            <option value="">{loadingFilters ? "Loading sports…" : sports.length ? "All sports" : "Sports unavailable"}</option>
            {sports.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select>
          <select className="filter-city" value={countryCode} disabled={loadingFilters || countries.length === 0} onChange={(event) => { const code = event.target.value; setCountryCode(code); setFilters((current) => ({ ...current, countryCode: code })); }} aria-label="Filter tournaments by country">
            <option value="">{loadingFilters ? "Loading countries…" : countries.length ? "All countries" : "Countries unavailable"}</option>
            {countries.map((country) => (
              <option key={country.code} value={country.code}>{country.name}</option>
            ))}
          </select>
          <button className="primary-button filter-button" type="submit"><SlidersHorizontal aria-hidden="true" /> Search</button>
        </form>
        <div className="sport-filters" aria-label="Filter by sport">
          <button type="button" className={!sport ? "sport-filter selected" : "sport-filter"} onClick={() => { setSport(""); setFilters({ search: search.trim(), city: city.trim(), sport: "", countryCode }); }}>All sports</button>
          {sports.map((item) => <button type="button" className={sport === item.slug ? "sport-filter selected" : "sport-filter"} key={item.id} onClick={() => { const nextSport = sport === item.slug ? "" : item.slug; setSport(nextSport); setFilters({ search: search.trim(), city: city.trim(), sport: nextSport, countryCode }); }}>{item.name}</button>)}
        </div>
        {filterOptionsError && <p className="form-error" role="alert">{filterOptionsError} <button className="text-button" type="button" onClick={() => { setLoadingFilters(true); setFilterOptionsError(""); setFilterOptionsAttempt((attempt) => attempt + 1); }}>Retry filters</button></p>}
        <div className="section-heading-row">
          <div><h2>Open tournaments</h2><span>{tournaments.length} found</span></div>
          <div className="game-view-toggle" aria-label="Tournament view">
            <button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}><List aria-hidden="true" />List</button>
            <button type="button" className={view === "map" ? "selected" : ""} aria-pressed={view === "map"} onClick={() => setView("map")}><MapIcon aria-hidden="true" />Map</button>
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <div className="status-card">Loading games…</div> : view === "map" ? (
          <OpenStreetMapPicker
            mode="tournaments"
            countryCode=""
            latitude=""
            longitude=""
            tournaments={tournaments}
          />
        ) : tournaments.length ? <div className="game-grid">{tournaments.map((item) => <TournamentCard key={item.id} tournament={item} />)}</div> : <div className="empty-state"><span className="empty-icon"><Search aria-hidden="true" /></span><h2>No open games yet</h2><p>Start a tournament and invite your friends to join.</p><Link className="primary-button" href="/tournaments/new">Create a tournament</Link></div>}
      </div>
    </AppShell>
  );
}
