"use client";

import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";
import { formatDate, formatDuration, formatPrice, type Tournament, type TournamentEntry } from "@/lib/api";

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { user, request } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request<Tournament>(`/tournaments/${id}/`);
      setTournament(result);
      setSelectedSlot(result.my_slot);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this tournament.");
    } finally {
      setLoading(false);
    }
  }, [id, request]);
  useEffect(() => {
    let active = true;
    const loadTournament = async () => {
      try {
        const result = await request<Tournament>(`/tournaments/${id}/`);
        if (active) {
          setTournament(result);
          setSelectedSlot(result.my_slot);
          setError("");
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this tournament.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadTournament();
    return () => { active = false; };
  }, [id, request, user?.id]);

  const taken = useMemo(() => new Set(tournament?.taken_slots ?? []), [tournament?.taken_slots]);
  const isHost = Boolean(user && tournament?.host === user.username);
  const startsAt = tournament ? new Date(tournament.starts_at) : null;
  const canJoin = tournament?.status === "open" && Boolean(startsAt && startsAt > new Date()) && !tournament.is_joined && !isHost;

  const join = async () => {
    if (!tournament || selectedSlot === null) return;
    if (!user) {
      router.push(`/account?next=${encodeURIComponent(`/tournaments/${tournament.id}`)}`);
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const entry = await request<TournamentEntry>(`/tournaments/${tournament.id}/join/`, {
        method: "POST",
        body: JSON.stringify({ slot_number: selectedSlot }),
      });
      if (entry.payment_status === "not_required") {
        setNotice(`You’re in! Spot ${entry.slot_number} is yours.`);
        await load();
      } else {
        router.push(`/tournaments/${tournament.id}/payment`);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not claim this spot.");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    if (!tournament || !window.confirm("Leave this tournament?")) return;
    setBusy(true);
    setError("");
    try {
      await request(`/tournaments/${tournament.id}/leave/`, { method: "DELETE" });
      setNotice("You left this tournament.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not leave this tournament.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!tournament || !window.confirm("Delete this tournament? This also removes its player spots.")) return;
    setBusy(true);
    setError("");
    try {
      await request(`/tournaments/${tournament.id}/`, { method: "DELETE" });
      router.push("/my-games");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete this tournament.");
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="app-page detail-page">
        <Link className="back-link" href="/tournaments"><ArrowLeft aria-hidden="true" />All tournaments</Link>
        {loading && !tournament ? <div className="status-card">Loading tournament…</div> : tournament ? (
          <>
            <div className="detail-heading"><div><span className="eyebrow">{tournament.country?.name ?? "SPORTSCLAN"} · {tournament.sport.name.toUpperCase()}</span><h1>{tournament.title}</h1><div className="detail-status"><span className={`status-pill ${tournament.status}`}>{tournament.status}</span><span>Hosted by {tournament.host}</span></div></div><div className="detail-pool"><span><Trophy aria-hidden="true" /> PROJECTED PRIZE POOL</span><strong>{formatPrice(tournament.projected_prize_pool, tournament.currency)}</strong><small>{tournament.max_players} spots · estimate only</small></div></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            {notice && <p className="success-message" role="status"><CheckCircle2 aria-hidden="true" />{notice}</p>}
            <div className="detail-columns">
              <div className="detail-main-column">
                <section className="detail-card"><h2>Game details</h2><div className="detail-fact"><CalendarDays aria-hidden="true" /><span><small>DATE & TIME</small><strong>{formatDate(tournament.starts_at)}</strong></span></div><div className="detail-fact"><Clock3 aria-hidden="true" /><span><small>GAME LENGTH</small><strong>{formatDuration(tournament.duration_minutes)}</strong></span></div><div className="detail-fact"><MapPin aria-hidden="true" /><span><small>VENUE</small><strong>{tournament.venue_name || tournament.venue?.name}</strong><small>{[tournament.venue?.address, tournament.venue?.city, tournament.state || tournament.venue?.state || tournament.venue?.region, tournament.country?.name || tournament.venue?.country].filter(Boolean).join(", ")}</small></span></div>{tournament.latitude && tournament.longitude && <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${tournament.latitude},${tournament.longitude}`} target="_blank" rel="noreferrer">Open location in Maps <span aria-hidden="true">↗</span></a>}</section>
                {tournament.description && <section className="detail-card"><h2>About this game</h2><p className="detail-description">{tournament.description}</p></section>}
                <section className="detail-card"><div className="card-title-row"><h2>Player spots</h2><span>{tournament.slots_taken} / {tournament.max_players} filled</span></div><div className="slot-grid">{Array.from({ length: tournament.max_players }, (_, index) => { const slot = index + 1; const isTaken = taken.has(slot); const isSelected = selectedSlot === slot; return <button aria-pressed={isSelected} aria-label={`Spot ${slot}${isTaken ? ", taken" : ""}`} className={`slot-button${isTaken ? " taken" : ""}${isSelected ? " chosen" : ""}`} disabled={isTaken || !canJoin} key={slot} onClick={() => setSelectedSlot(slot)}><strong>{String(slot).padStart(2, "0")}</strong><small>{isTaken ? slot === tournament.my_slot ? "YOURS" : "TAKEN" : "OPEN"}</small></button>; })}</div></section>
              </div>
              <aside className="detail-side-column"><section className="join-card"><span className="eyebrow">ENTRY</span><strong className="join-price">{formatPrice(tournament.entry_fee, tournament.currency)}<small> / player</small></strong><p>{tournament.slots_open} spots left · {tournament.is_joined ? `You joined spot ${tournament.my_slot}` : "Choose an open spot to join."}</p>{canJoin ? user ? <button className="primary-button full-button" disabled={busy || selectedSlot === null} onClick={() => void join()}>{busy ? "Processing…" : `Join spot${selectedSlot ? ` ${selectedSlot}` : ""}`} <ArrowLeft aria-hidden="true" /></button> : <Link className="primary-button full-button" href={`/account?next=${encodeURIComponent(`/tournaments/${tournament.id}`)}`}>Sign in to join <ArrowLeft aria-hidden="true" /></Link> : tournament.is_joined && !isHost && tournament.my_payment_status === "pending" ? <Link className="primary-button full-button" href={`/tournaments/${tournament.id}/payment`}>Continue to checkout <CreditCard aria-hidden="true" /></Link> : tournament.is_joined && !isHost && (tournament.my_payment_status === "paid" || tournament.my_payment_status === "not_required") ? <span className="closed-note">Your spot is confirmed.</span> : tournament.is_joined && !isHost ? <button className="secondary-button full-button" disabled={busy} onClick={() => void leave()}>{busy ? "Please wait…" : "Leave tournament"}</button> : <span className="closed-note">{isHost ? "You’re hosting this game." : "This tournament is not open for new players."}</span>}<p className="fee-disclaimer">Entry fees are handled securely at checkout. Venue costs are separate.</p></section>{isHost && <section className="host-tools"><h2>Host tools</h2><button className="danger-button" disabled={busy} onClick={() => void remove()}>Delete tournament</button></section>}</aside>
            </div>
          </>
        ) : error ? <div className="empty-state"><h2>Tournament unavailable</h2><p>{error}</p><Link className="secondary-button" href="/tournaments">Browse tournaments</Link></div> : <div className="status-card">Tournament not found.</div>}
      </div>
    </AppShell>
  );
}
