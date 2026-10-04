"use client";

import { ArrowLeft, CalendarDays, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import TournamentCard from "@/components/TournamentCard";
import { useAuth } from "@/components/AppProviders";
import type { PlayerProfile } from "@/lib/api";

export default function PublicPlayerPage() {
  const { username } = useParams<{ username: string }>();
  const { request } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void request<PlayerProfile>(`/players/${encodeURIComponent(username)}/`)
      .then((result) => { if (active) setProfile(result); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load this player."); });
    return () => { active = false; };
  }, [request, username]);

  return (
    <AppShell>
      <div className="app-page narrow-page">
        <Link className="back-link" href="/tournaments"><ArrowLeft aria-hidden="true" />Browse games</Link>
        {error ? <div className="empty-state"><h2>Player unavailable</h2><p>{error}</p></div> : !profile ? <div className="status-card">Loading player…</div> : (
          <>
            <section className="profile-card">
              <span className="large-avatar">{(profile.first_name || profile.username).slice(0, 1).toUpperCase()}</span>
              <div className="profile-card-copy"><h2>{[profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username}</h2><p>@{profile.username}</p>{profile.bio && <p>{profile.bio}</p>}{!!profile.preferred_sports.length && <div className="sport-chip-list">{profile.preferred_sports.map((sport) => <span key={sport.id}>{sport.name}</span>)}</div>}</div>
            </section>
            <section className="profile-history">
              <div className="card-title-row"><h2><Trophy aria-hidden="true" />Game history</h2><span>{profile.games_played} completed</span></div>
              {profile.completed_games.length ? <div className="game-grid">{profile.completed_games.map((game) => <TournamentCard key={game.id} tournament={game} />)}</div> : <div className="empty-state"><span className="empty-icon"><CalendarDays aria-hidden="true" /></span><h2>No completed games yet</h2><p>Come back to see this player’s SportsClan history.</p></div>}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
