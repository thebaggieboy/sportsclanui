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
              <div className="reliability-card">
                <h2>Reliability record</h2>
                <div className="reliability-stats">
                  <span><strong>{profile.reliability.games_attended}</strong><small>Games host-reported attended</small></span>
                  <span><strong>{profile.reliability.no_shows_reported}</strong><small>Host-reported no-shows</small></span>
                  <span><strong>{profile.reliability.hosted_completed}</strong><small>Games hosted and completed</small></span>
                  <span><strong>{profile.reliability.hosted_last_minute_cancellations}</strong><small>Hosted cancellations within 24 hours</small></span>
                </div>
                {profile.reliability.attendance_disputes > 0 && <p>{profile.reliability.attendance_disputes} disputed attendance record(s) are excluded from these counts.</p>}
                <p>These are activity records, not automatic ratings or penalties.</p>
              </div>
              <div className="card-title-row"><h2><Trophy aria-hidden="true" />Game history</h2><span>{profile.games_played} completed</span></div>
              {profile.completed_games.length ? <div className="game-grid">{profile.completed_games.map((game) => <TournamentCard key={game.id} tournament={game} />)}</div> : <div className="empty-state"><span className="empty-icon"><CalendarDays aria-hidden="true" /></span><h2>No completed games yet</h2><p>Come back to see this player’s SportsClan history.</p></div>}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
