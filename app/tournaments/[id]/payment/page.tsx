"use client";

import { ArrowLeft, CheckCircle2, Clock3, CreditCard, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";
import { formatDate, formatPrice, type Tournament } from "@/lib/api";

interface BillingStatus {
  payment_status: "pending" | "paid" | "refunded" | "not_required";
  reservation_expires_at: string | null;
  reservation_expired: boolean;
  slot_number: number;
  entry_fee: string;
  currency: string;
  reference: string | null;
  transaction_status: "pending" | "success" | "failed" | "success_unallocated" | null;
  authorization_url: string | null;
}

interface Checkout {
  reference?: string;
  authorization_url?: string;
  payment_status: "pending" | "paid" | "not_required";
}

export default function TournamentPaymentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isInitializing, request } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [game, status] = await Promise.all([
        request<Tournament>(`/tournaments/${id}/`),
        request<BillingStatus>(`/tournaments/${id}/payment-status/`),
      ]);
      setTournament(game);
      setBilling(status);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load this reservation.");
    } finally {
      setLoading(false);
    }
  }, [id, request]);

  useEffect(() => {
    let active = true;
    const loadStatus = async () => {
      try {
        const [game, status] = await Promise.all([
          request<Tournament>(`/tournaments/${id}/`),
          request<BillingStatus>(`/tournaments/${id}/payment-status/`),
        ]);
        if (active) {
          setTournament(game);
          setBilling(status);
          setError("");
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load this reservation.");
      } finally {
        if (active) setLoading(false);
      }
    };
    if (!isInitializing && user) void loadStatus();
    return () => { active = false; };
  }, [id, isInitializing, request, user]);

  const initializeCheckout = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const checkout = await request<Checkout>(`/tournaments/${id}/payment-initialize/`, {
        method: "POST",
        body: "{}",
      });
      if (checkout.authorization_url) {
        setBilling((current) => current ? {
          ...current,
          reference: checkout.reference ?? current.reference,
          authorization_url: checkout.authorization_url ?? null,
        } : current);
      } else {
        await load();
        setMessage("This entry is already settled.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  };

  const verifyPayment = async () => {
    if (!billing?.reference) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await request(`/tournaments/${id}/payment-verify/`, {
        method: "POST",
        body: JSON.stringify({ reference: billing.reference }),
      });
      await load();
      setMessage("Payment verified. Your spot is secured.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Payment is not confirmed yet.");
    } finally {
      setBusy(false);
    }
  };

  const releaseReservation = async () => {
    if (!window.confirm("Release your reserved spot? You can choose another available spot later.")) return;
    setBusy(true);
    setError("");
    try {
      await request(`/tournaments/${id}/leave/`, { method: "DELETE" });
      router.replace(`/tournaments/${id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not release this reservation.");
    } finally {
      setBusy(false);
    }
  };

  const paid = billing?.payment_status === "paid";
  const noCharge = billing?.payment_status === "not_required";
  const refunded = billing?.payment_status === "refunded";
  const expired = billing?.reservation_expired ?? false;

  return (
    <AppShell>
      <div className="app-page narrow-page payment-page">
        <Link className="back-link" href={`/tournaments/${id}`}><ArrowLeft aria-hidden="true" />Tournament</Link>
        <div className="page-heading"><span className="eyebrow">PLAYER CHECKOUT</span><h1>Secure your spot.</h1><p>Complete checkout, then verify your payment to confirm your place.</p></div>
        {isInitializing ? <div className="status-card">Loading reservation…</div> : !user ? (
          <div className="empty-state"><h2>Sign in to continue</h2><p>Your reservation and payment status are linked to your SportsClan account.</p><Link className="primary-button" href={`/account?next=${encodeURIComponent(`/tournaments/${id}/payment`)}`}>Sign in</Link></div>
        ) : loading ? <div className="status-card">Loading reservation…</div> : tournament && billing ? (
          <>
            <section className="payment-summary">
              <span className="payment-icon"><CreditCard aria-hidden="true" /></span>
              <div><h2>{tournament.title}</h2><p>{tournament.sport.name} · spot {billing.slot_number}</p><p>{formatDate(tournament.starts_at)}</p></div>
              <strong>{formatPrice(billing.entry_fee, billing.currency)}</strong>
            </section>
            {paid || noCharge ? (
              <div className="payment-state success"><CheckCircle2 aria-hidden="true" /><strong>{paid ? "Payment verified. Your spot is secured." : "No payment is due. Your spot is secured."}</strong></div>
            ) : refunded ? (
              <div className="payment-state expired"><strong>This entry was refunded.</strong><p>Choose another available spot from the tournament page if you still want to join.</p></div>
            ) : !tournament.payments_enabled ? (
              <div className="payment-state expired"><strong>Paid checkout is paused.</strong><p>SportsClan is not collecting paid entries until organizer payouts are supported. Release this unpaid reservation and choose a free game instead.</p></div>
            ) : expired ? (
              <div className="payment-state expired"><strong>Reservation expired</strong><p>This unpaid spot hold has ended. Release it, then choose a currently available spot again.</p></div>
            ) : (
              <>
                <div className="payment-state pending"><Clock3 aria-hidden="true" /><p>Your spot is held for 15 minutes{billing.reservation_expires_at ? `, until ${new Date(billing.reservation_expires_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}. Paystack confirms payment before the spot is secured.</p></div>
                {billing.authorization_url ? (
                  <div className="payment-actions">
                    <a className="primary-button full-button" href={billing.authorization_url} target="_blank" rel="noreferrer">Open Paystack checkout <CreditCard aria-hidden="true" /></a>
                    <button className="secondary-button full-button" type="button" onClick={() => void verifyPayment()} disabled={busy}>{busy ? "Checking payment…" : "Verify payment"} <CheckCircle2 aria-hidden="true" /></button>
                  </div>
                ) : <button className="primary-button full-button" type="button" onClick={() => void initializeCheckout()} disabled={busy}>{busy ? "Starting checkout…" : "Continue to Paystack"} <CreditCard aria-hidden="true" /></button>}
              </>
            )}
            {message && <p className="success-message" role="status"><CheckCircle2 aria-hidden="true" />{message}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            {!paid && !noCharge && !refunded && <button className="release-button" type="button" onClick={() => void releaseReservation()} disabled={busy}><RotateCcw aria-hidden="true" />Release reservation</button>}
          </>
        ) : <div className="empty-state"><h2>Reservation unavailable</h2><p>{error || "No reservation was found for this tournament."}</p><Link className="secondary-button" href={`/tournaments/${id}`}>Back to tournament</Link></div>}
      </div>
    </AppShell>
  );
}
