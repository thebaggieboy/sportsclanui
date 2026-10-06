"use client";

import { ArrowRight, CalendarDays, LogOut, PencilLine, Plus, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import AppShell from "@/components/AppShell";
import TournamentCard from "@/components/TournamentCard";
import { useAuth } from "@/components/AppProviders";
import type { PlayerProfile, Sport } from "@/lib/api";

interface ProfileResult extends PlayerProfile {
  userId: number;
}

export default function ProfilePage() {
  const { user, isInitializing, signOut, request } = useAuth();
  const [profile, setProfile] = useState<ProfileResult | null>(null);
  const [sports, setSports] = useState<Sport[]>([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [preferredSportIds, setPreferredSportIds] = useState<number[]>([]);
  const [editing, setEditing] = useState(false);
  const [loadedForUserId, setLoadedForUserId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    void Promise.all([
      request<PlayerProfile>("/profiles/me/"),
      request<{ results: Sport[] }>("/sports/"),
    ]).then(([result, catalog]) => {
      if (active) {
        setProfile({ ...result, userId: user.id });
        setFirstName(result.first_name || "");
        setLastName(result.last_name || "");
        setBio(result.bio || "");
        setPreferredSportIds(result.preferred_sports.map((sport) => sport.id));
        setSports(catalog.results);
        setError("");
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load your player profile.");
    }).finally(() => {
      if (active) setLoadedForUserId(user.id);
    });
    return () => { active = false; };
  }, [reloadKey, request, user]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await request<PlayerProfile>("/profiles/me/", {
        method: "PATCH",
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
          preferred_sport_ids: preferredSportIds,
        }),
      });
      setProfile((current) => current ? { ...result, userId: current.userId } : null);
      setEditing(false);
      setNotice("Your player profile is saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  const toggleSport = (sportId: number) => {
    setPreferredSportIds((current) => current.includes(sportId)
      ? current.filter((id) => id !== sportId)
      : [...current, sportId]);
  };

  return (
    <AppShell>
      <div className="app-page narrow-page">
        <div className="page-heading"><span className="eyebrow">YOUR PROFILE</span><h1>Play together.</h1><p>Your player card, sport preferences, and completed games.</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="success-message" role="status">{notice}</p>}
        {isInitializing ? <div className="status-card">Loading your account…</div> : user ? profile && profile.userId === user.id ? (
          <>
            <section className="profile-card">
              <span className="large-avatar">{(profile.first_name || user.username).slice(0, 1).toUpperCase()}</span>
              <div className="profile-card-copy">
                <h2>{[profile.first_name, profile.last_name].filter(Boolean).join(" ") || user.username}</h2>
                <p>@{user.username}</p><p>{user.email}</p>
                {profile.bio && <p>{profile.bio}</p>}
                {!!profile.preferred_sports.length && <div className="sport-chip-list">{profile.preferred_sports.map((sport) => <span key={sport.id}>{sport.name}</span>)}</div>}
              </div>
              <button className="secondary-button profile-edit-trigger" type="button" onClick={() => setEditing((value) => !value)}><PencilLine aria-hidden="true" />{editing ? "Close editor" : "Edit profile"}</button>
            </section>
            {editing && <section className="detail-card profile-edit-card">
              <h2>Player details</h2>
              <form className="app-form" onSubmit={(event) => void saveProfile(event)}>
                <div className="form-grid"><label>First name<input value={firstName} maxLength={150} onChange={(event) => setFirstName(event.target.value)} /></label><label>Last name<input value={lastName} maxLength={150} onChange={(event) => setLastName(event.target.value)} /></label></div>
                <label>About you<textarea value={bio} maxLength={280} rows={3} placeholder="A little about how you like to play." onChange={(event) => setBio(event.target.value)} /></label>
                <fieldset className="sport-preferences"><legend>Sports you play</legend>{sports.map((sport) => <label key={sport.id}><input type="checkbox" checked={preferredSportIds.includes(sport.id)} onChange={() => toggleSport(sport.id)} />{sport.name}</label>)}</fieldset>
                <button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save profile"} <Save aria-hidden="true" /></button>
              </form>
            </section>}
            <div className="account-note"><strong>Games played · {profile.games_played}</strong><p>Completed games you joined will appear in your player history.</p></div>
            <section className="reliability-card">
              <h2>Reliability record</h2>
              <div className="reliability-stats">
                <span><strong>{profile.reliability.games_attended}</strong><small>Games host-reported attended</small></span>
                <span><strong>{profile.reliability.no_shows_reported}</strong><small>Host-reported no-shows</small></span>
                <span><strong>{profile.reliability.hosted_completed}</strong><small>Games hosted and completed</small></span>
                <span><strong>{profile.reliability.hosted_last_minute_cancellations}</strong><small>Hosted cancellations within 24 hours</small></span>
              </div>
              {profile.reliability.attendance_disputes > 0 && <p>{profile.reliability.attendance_disputes} disputed attendance record(s) are excluded from these counts.</p>}
              <p>These are activity records, not automatic ratings or penalties.</p>
            </section>
            <div className="profile-link-list"><Link href="/my-games"><CalendarDays aria-hidden="true" />My games<ArrowRight aria-hidden="true" /></Link><Link href="/notifications"><CalendarDays aria-hidden="true" />Game updates<ArrowRight aria-hidden="true" /></Link><Link href="/tournaments/new"><Plus aria-hidden="true" />Create a tournament<ArrowRight aria-hidden="true" /></Link></div>
            {profile.completed_games.length > 0 && <section className="profile-history"><div className="card-title-row"><h2>Game history</h2><span>{profile.completed_games.length} completed</span></div><div className="game-grid">{profile.completed_games.map((game) => <TournamentCard key={game.id} tournament={game} />)}</div></section>}
            <button className="secondary-button signout-button" type="button" onClick={signOut}><LogOut aria-hidden="true" />Sign out</button>
          </>
        ) : loadedForUserId === user.id ? <div className="empty-state"><h2>Player profile unavailable</h2><p>{error || "Try again in a moment."}</p><button className="secondary-button" type="button" onClick={() => { setLoadedForUserId(null); setError(""); setReloadKey((key) => key + 1); }}>Try again</button></div> : <div className="status-card">Loading your player profile…</div> : (
          <section className="auth-card"><h2>Sign in to your account.</h2><p>Sign in to create tournaments, claim a spot, and keep track of your games.</p><Link className="primary-button full-button" href="/account">Sign in or create account <ArrowRight aria-hidden="true" /></Link></section>
        )}
      </div>
    </AppShell>
  );
}
