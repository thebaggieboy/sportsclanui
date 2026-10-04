"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AppProviders";
import type { Tournament } from "@/lib/api";

interface TournamentHostControlsProps {
  tournament: Tournament;
  onUpdated: () => Promise<void>;
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function TournamentHostControls({ tournament, onUpdated }: TournamentHostControlsProps) {
  const { request } = useAuth();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/tournaments/${tournament.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          title: String(form.get("title")).trim(),
          description: String(form.get("description")).trim(),
          starts_at: new Date(String(form.get("starts_at"))).toISOString(),
          duration_minutes: Number(form.get("duration_minutes")),
          max_players: Number(form.get("max_players")),
          entry_fee: Number(form.get("entry_fee")).toFixed(2),
        }),
      });
      setEditing(false);
      setNotice("Tournament details updated.");
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this tournament.");
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!window.confirm("Mark this game as completed? It will appear in joined players’ game history.")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/tournaments/${tournament.id}/complete/`, { method: "POST" });
      setNotice("Game marked as completed. Players have been notified.");
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete this game.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this game? Joined players and waitlisted players will be notified.")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/tournaments/${tournament.id}/cancel/`, { method: "POST" });
      setNotice("Tournament cancelled. Participants have been notified.");
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not cancel this tournament.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="host-tools">
      <h2>Host tools</h2>
      {error && <p className="form-error" role="alert">{error}</p>}
      {notice && <p className="success-message" role="status">{notice}</p>}
      {editing ? (
        <form className="host-edit-form" onSubmit={(event) => void submit(event)}>
          <label>Game name<input name="title" defaultValue={tournament.title} maxLength={140} required /></label>
          <label>Details<textarea name="description" defaultValue={tournament.description} rows={3} /></label>
          <label>Date & time<input name="starts_at" type="datetime-local" defaultValue={toLocalDateTime(tournament.starts_at)} required /></label>
          <div className="form-grid">
            <label>Minutes<input name="duration_minutes" type="number" min={15} max={1440} defaultValue={tournament.duration_minutes} required /></label>
            <label>Player spots<input name="max_players" type="number" min={Math.max(1, tournament.slots_taken)} max={99} defaultValue={tournament.max_players} required /></label>
          </div>
          <label>Entry fee ({tournament.currency})<input name="entry_fee" type="number" min="0" step="0.01" defaultValue={tournament.entry_fee} required /></label>
          <div className="host-edit-actions"><button type="button" className="secondary-button" disabled={busy} onClick={() => setEditing(false)}>Keep current</button><button className="primary-button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
        </form>
      ) : <button className="secondary-button full-button" disabled={busy || tournament.status === "cancelled" || tournament.status === "completed"} onClick={() => setEditing(true)}>Edit game details</button>}
      {tournament.status !== "cancelled" && tournament.status !== "completed" && <button className="danger-button" disabled={busy} onClick={() => void cancel()}>{busy ? "Please wait…" : "Cancel game & notify players"}</button>}
      {(tournament.status === "open" || tournament.status === "full") && <button className="secondary-button full-button" disabled={busy} onClick={() => void complete()}>{busy ? "Please wait…" : "Mark game completed"}</button>}
    </section>
  );
}
