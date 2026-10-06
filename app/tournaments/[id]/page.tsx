"use client";

import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";
import SportSlotPicker from "@/components/SportSlotPicker";
import TournamentCommunity from "@/components/TournamentCommunity";
import TournamentHostControls from "@/components/TournamentHostControls";
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

  const taken = useMemo(
    () => new Set([
      ...(tournament?.taken_slots ?? []),
      ...(tournament?.waitlist_offers ?? []).map((offer) => offer.offered_slot_number),
    ]),
    [tournament?.taken_slots, tournament?.waitlist_offers],
  );
  const isHost = Boolean(user && tournament?.host === user.username);
  const startsAt = tournament ? new Date(tournament.starts_at) : null;
  const hasWaitlistOffer = Boolean(tournament?.waitlist_offers.length);
  const canJoin = tournament?.status === "open" &&
    Boolean(startsAt && startsAt > new Date()) &&
    !tournament.is_joined &&
    !isHost &&
    !hasWaitlistOffer &&
    (Number(tournament.entry_fee) === 0 || tournament.payments_enabled);

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
            {tournament.status === "cancelling" && <p className="payment-state pending">Cancellation is waiting for Paystack to confirm full refunds. No new players can join.</p>}
            <div className="detail-columns">
              <div className="detail-main-column">
                <section className="detail-card"><h2>Game details</h2><div className="detail-fact"><CalendarDays aria-hidden="true" /><span><small>DATE & TIME</small><strong>{formatDate(tournament.starts_at)}</strong></span></div><div className="detail-fact"><Clock3 aria-hidden="true" /><span><small>GAME LENGTH</small><strong>{formatDuration(tournament.duration_minutes)}</strong></span></div><div className="detail-fact"><MapPin aria-hidden="true" /><span><small>VENUE</small><strong>{tournament.venue_name || tournament.venue?.name}</strong><small>{[tournament.venue?.address, [tournament.venue?.city, tournament.venue?.postal_code].filter(Boolean).join(" "), tournament.state || tournament.venue?.state || tournament.venue?.region, tournament.country?.name || tournament.venue?.country].filter(Boolean).join(", ")}</small></span></div>{tournament.latitude && tournament.longitude && <a className="map-link" href={`https://www.openstreetmap.org/?mlat=${tournament.latitude}&mlon=${tournament.longitude}#map=16/${tournament.latitude}/${tournament.longitude}`} target="_blank" rel="noreferrer">Open location on OpenStreetMap <span aria-hidden="true">↗</span></a>}</section>
                {tournament.description && <section className="detail-card"><h2>About this game</h2><p className="detail-description">{tournament.description}</p></section>}
                <section className="detail-card"><div className="card-title-row"><h2>Player spots</h2><span>{tournament.slots_taken} / {tournament.max_players} filled</span></div><SportSlotPicker sport={tournament.sport} maxPlayers={tournament.max_players} takenSlots={taken} selectedSlot={selectedSlot} disabled={!canJoin} ownSlot={tournament.my_slot} onSelect={setSelectedSlot} /></section>
                <TournamentCommunity tournament={tournament} onJoined={load} />
              </div>
              <aside className="detail-side-column"><section className="join-card"><span className="eyebrow">ENTRY</span><strong className="join-price">{formatPrice(tournament.entry_fee, tournament.currency)}<small> / player</small></strong><p>{tournament.slots_open} spots left · {tournament.is_joined ? `You joined spot ${tournament.my_slot}` : "Choose an open spot to join."}</p>{hasWaitlistOffer && !tournament.is_waitlisted ? <span className="closed-note">This spot is temporarily reserved for a waitlisted player.</span> : hasWaitlistOffer && tournament.is_waitlisted ? <span className="closed-note">Your waitlist offer is ready. Claim it in the Players section.</span> : canJoin ? user ? <button className="primary-button full-button" disabled={busy || selectedSlot === null} onClick={() => void join()}>{busy ? "Processing…" : `Join spot${selectedSlot ? ` ${selectedSlot}` : ""}`} <ArrowLeft aria-hidden="true" /></button> : <Link className="primary-button full-button" href={`/account?next=${encodeURIComponent(`/tournaments/${tournament.id}`)}`}>Sign in to join <ArrowLeft aria-hidden="true" /></Link> : tournament.is_joined && !isHost && tournament.my_payment_status === "pending" && tournament.payments_enabled ? <Link className="primary-button full-button" href={`/tournaments/${tournament.id}/payment`}>Continue to checkout <CreditCard aria-hidden="true" /></Link> : tournament.is_joined && !isHost && tournament.my_payment_status === "pending" ? <button className="secondary-button full-button" disabled={busy} onClick={() => void leave()}>{busy ? "Please wait…" : "Release unpaid spot"}</button> : tournament.is_joined && !isHost && (tournament.my_payment_status === "paid" || tournament.my_payment_status === "not_required") && (tournament.status === "open" || tournament.status === "full") ? <button className="secondary-button full-button" disabled={busy} onClick={() => void leave()}>{busy ? "Please wait…" : tournament.my_payment_status === "paid" ? "Leave & request refund" : "Leave tournament"}</button> : <span className="closed-note">{isHost ? "You’re hosting this game." : tournament.entry_fee !== "0.00" && !tournament.payments_enabled ? "Paid entry is paused until organizer payouts are supported." : "This tournament is not open for new players."}</span>}{tournament.entry_fee !== "0.00" && !tournament.payments_enabled ? <p className="fee-disclaimer">Paid tournaments are paused while organizer payouts are set up. No payment will be collected.</p> : tournament.entry_fee !== "0.00" ? <p className="fee-disclaimer">Player cancellations are refundable only at least 24 hours before the game starts. Host cancellations receive full refunds. Venue costs are separate.</p> : <p className="fee-disclaimer">Free entry. Venue costs are separate.</p>}</section>{isHost && <TournamentHostControls tournament={tournament} onUpdated={load} />}{isHost && <section className="host-tools"><button className="danger-button" disabled={busy} onClick={() => void remove()}>Delete tournament permanently</button></section>}</aside>
            </div>
          </>
        ) : error ? <div className="empty-state"><h2>Tournament unavailable</h2><p>{error}</p><Link className="secondary-button" href="/tournaments">Browse tournaments</Link></div> : <div className="status-card">Tournament not found.</div>}
      </div>
    </AppShell>
  );
}
