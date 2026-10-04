"use client";

import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TournamentCard from "@/components/TournamentCard";
import { useAuth } from "@/components/AppProviders";
import { fetchAllPages, type Tournament } from "@/lib/api";

export default function MyGamesPage() {
  const { user, isInitializing, request } = useAuth();
  const [result, setResult] = useState<{ userId: number; tournaments: Tournament[] } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!user || isInitializing) return () => { active = false; };
    const load = async () => {
      try {
        const tournaments = await fetchAllPages<Tournament>("/tournaments/mine/", request);
        if (active) {
          setResult({ userId: user.id, tournaments });
          setError("");
        }
      } catch (cause) {
        if (active) {
          setResult({ userId: user.id, tournaments: [] });
          setError(cause instanceof Error ? cause.message : "Could not load your games.");
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [isInitializing, request, user]);
  const tournaments = result && user && result.userId === user.id ? result.tournaments : [];
  const loading = Boolean(user && (!result || result.userId !== user.id));
  return (
    <AppShell>
      <div className="app-page">
        <div className="page-heading"><span className="eyebrow">YOUR GAMES</span><h1>My tournaments.</h1><p>Games you host or joined.</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {isInitializing ? <div className="status-card">Loading your games…</div> : !user ? (
          <div className="empty-state"><span className="empty-icon"><CalendarDays aria-hidden="true" /></span><h2>Sign in to see your games</h2><p>Your hosted and joined tournaments will show up here.</p><Link className="primary-button" href="/account">Sign in or join</Link></div>
        ) : loading ? <div className="status-card">Loading your games…</div> : tournaments.length ? <div className="game-grid">{tournaments.map((item) => <TournamentCard key={item.id} tournament={item} />)}</div> : (
          <div className="empty-state"><span className="empty-icon"><CalendarDays aria-hidden="true" /></span><h2>No tournaments yet</h2><p>Join an open spot or make a tournament for your friends.</p><div className="empty-actions"><Link className="secondary-button" href="/tournaments">Browse games</Link><Link className="primary-button" href="/tournaments/new">Create a tournament</Link></div></div>
        )}
      </div>
    </AppShell>
  );
}
