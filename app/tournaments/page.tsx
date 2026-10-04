"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TournamentCard from "@/components/TournamentCard";
import { useAuth } from "@/components/AppProviders";
import { fetchAllPages, type Sport, type Tournament } from "@/lib/api";

export default function TournamentsPage() {
  const { request } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [result, setResult] = useState<{ key: string; tournaments: Tournament[] } | null>(null);
  const [sport, setSport] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [filters, setFilters] = useState({ sport: "", search: "", city: "" });
  const [error, setError] = useState("");

  const filterKey = JSON.stringify(filters);
  const tournaments = result?.key === filterKey ? result.tournaments : [];
  const loading = result?.key !== filterKey;

  useEffect(() => {
    let active = true;
    const loadSports = async () => {
      try {
        const nextSports = await fetchAllPages<Sport>("/sports/", request);
        if (active) setSports(nextSports);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load available sports.");
      }
    };
    void loadSports();
    return () => { active = false; };
  }, [request]);

  useEffect(() => {
    let active = true;
    const loadGames = async () => {
      try {
        const params = new URLSearchParams({ status: "open" });
        if (filters.sport) params.set("sport__slug", filters.sport);
        if (filters.city) params.set("venue__city", filters.city);
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
        <form className="game-filters" onSubmit={(event) => { event.preventDefault(); setFilters({ search: search.trim(), city: city.trim(), sport }); }}>
          <label className="search-field"><Search aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Team, tournament, or venue" aria-label="Search tournaments" /></label>
          <input className="filter-city" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Filter by city" aria-label="Filter by city" />
          <button className="primary-button filter-button" type="submit"><SlidersHorizontal aria-hidden="true" /> Search</button>
        </form>
        <div className="sport-filters" aria-label="Filter by sport">
          <button type="button" className={!sport ? "sport-filter selected" : "sport-filter"} onClick={() => { setSport(""); setFilters({ search: search.trim(), city: city.trim(), sport: "" }); }}>All sports</button>
          {sports.map((item) => <button type="button" className={sport === item.slug ? "sport-filter selected" : "sport-filter"} key={item.id} onClick={() => { const nextSport = sport === item.slug ? "" : item.slug; setSport(nextSport); setFilters({ search: search.trim(), city: city.trim(), sport: nextSport }); }}>{item.name}</button>)}
        </div>
        <div className="section-heading-row"><h2>Open tournaments</h2><span>{tournaments.length} found</span></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {loading ? <div className="status-card">Loading games…</div> : tournaments.length ? <div className="game-grid">{tournaments.map((item) => <TournamentCard key={item.id} tournament={item} />)}</div> : <div className="empty-state"><span className="empty-icon"><Search aria-hidden="true" /></span><h2>No open games yet</h2><p>Start a tournament and invite your friends to join.</p><Link className="primary-button" href="/tournaments/new">Create a tournament</Link></div>}
      </div>
    </AppShell>
  );
}
