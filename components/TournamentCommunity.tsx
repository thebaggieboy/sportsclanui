"use client";

import { BellRing, Flag, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AppProviders";
import type { Tournament, TournamentEntry, TournamentMessage } from "@/lib/api";

interface Participant extends TournamentEntry {
  first_name: string;
  last_name: string;
}

type AttendanceStatus = "unmarked" | "attended" | "no_show" | "excused";

interface WaitlistEntry {
  id: number;
  position: number;
  offered_slot_number: number | null;
  offer_expires_at: string | null;
}

interface TournamentCommunityProps {
  tournament: Tournament;
  onJoined: () => Promise<void>;
}

function initials(participant: Participant) {
  const label = participant.first_name || participant.username;
  return label.slice(0, 1).toUpperCase();
}

export default function TournamentCommunity({ tournament, onJoined }: TournamentCommunityProps) {
  const { user, request } = useAuth();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<TournamentMessage[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [reportTarget, setReportTarget] = useState<{ playerId?: number; label: string } | null>(null);
  const [reportReason, setReportReason] = useState("abuse");
  const [reportDetails, setReportDetails] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [attendanceBusyId, setAttendanceBusyId] = useState<number | null>(null);
  const isHost = Boolean(user && user.username === tournament.host);
  const canReadMessages = isHost || tournament.is_joined;
  const canWaitlist = Boolean(
    user && !isHost && !tournament.is_joined &&
    (tournament.status === "full" || waitlist),
  );

  const loadCommunity = useCallback(async () => {
    const roster = await request<Participant[]>(`/tournaments/${tournament.id}/participants/`);
    const feed = canReadMessages
      ? await request<TournamentMessage[]>(`/tournaments/${tournament.id}/messages/`)
      : [];
    const entry = user && !isHost
      ? await request<WaitlistEntry | { joined: false }>(`/tournaments/${tournament.id}/waitlist/`)
      : null;
    return {
      roster,
      feed,
      waitlist: entry && "position" in entry ? entry : null,
    };
  }, [canReadMessages, isHost, request, tournament.id, user]);

  useEffect(() => {
    let active = true;
    void loadCommunity().then((result) => {
      if (active) {
        setParticipants(result.roster);
        setMessages(result.feed);
        setWaitlist(result.waitlist);
        setError("");
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load tournament players.");
    });
    return () => { active = false; };
  }, [loadCommunity, tournament.slots_taken, user?.id]);

  const joinWaitlist = async () => {
    setBusy(true);
    setError("");
    try {
      const entry = await request<WaitlistEntry>(`/tournaments/${tournament.id}/waitlist/`, {
        method: "POST",
      });
      setWaitlist(entry);
      setNotice(`You’re on the waitlist at position ${entry.position}. We’ll let you know if a spot opens.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join the waitlist.");
    } finally {
      setBusy(false);
    }
  };

  const leaveWaitlist = async () => {
    setBusy(true);
    setError("");
    try {
      await request(`/tournaments/${tournament.id}/waitlist/`, { method: "DELETE" });
      setWaitlist(null);
      setNotice("You left the waitlist.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not leave the waitlist.");
    } finally {
      setBusy(false);
    }
  };

  const claimWaitlistOffer = async () => {
    if (!waitlist?.offered_slot_number) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const entry = await request<TournamentEntry>(
        `/tournaments/${tournament.id}/join/`,
        {
          method: "POST",
          body: JSON.stringify({ slot_number: waitlist.offered_slot_number }),
        },
      );
      if (entry.payment_status === "not_required") {
        setWaitlist(null);
        setNotice(`Spot ${entry.slot_number} is yours.`);
        await onJoined();
      } else {
        router.push(`/tournaments/${tournament.id}/payment`);
      }
    } catch (cause) {
      const joinError = cause instanceof Error ? cause.message : "Could not claim this spot.";
      setError(joinError);
      try {
        const result = await loadCommunity();
        setWaitlist(result.waitlist);
      } catch (refreshCause) {
        const refreshError = refreshCause instanceof Error
          ? refreshCause.message
          : "Could not refresh the waitlist offer.";
        setError(`${joinError} ${refreshError}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const sendAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request<TournamentMessage>(`/tournaments/${tournament.id}/messages/`, {
        method: "POST",
        body: JSON.stringify({ body: announcement }),
      });
      setAnnouncement("");
      setNotice("Your announcement was sent to joined players.");
      const result = await loadCommunity();
      setParticipants(result.roster);
      setMessages(result.feed);
      setWaitlist(result.waitlist);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the announcement.");
    } finally {
      setBusy(false);
    }
  };

  const report = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reportTarget) return;
    setBusy(true);
    setError("");
    try {
      const payload = reportTarget.playerId
        ? { reported_player: reportTarget.playerId, reason: reportReason, details: reportDetails }
        : { tournament: tournament.id, reason: reportReason, details: reportDetails };
      await request("/reports/", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Thanks. Your report was sent to the SportsClan team.");
      setReportTarget(null);
      setReportDetails("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send your report.");
    } finally {
      setBusy(false);
    }
  };

  const markAttendance = async (participantId: number, attendanceStatus: AttendanceStatus) => {
    setAttendanceBusyId(participantId);
    setError("");
    setNotice("");
    try {
      const roster = await request<Participant[]>(`/tournaments/${tournament.id}/attendance/`, {
        method: "POST",
        body: JSON.stringify({
          participants: [{ participant_id: participantId, attendance_status: attendanceStatus }],
        }),
      });
      setParticipants(roster);
      setNotice("Attendance record saved.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save attendance.");
    } finally {
      setAttendanceBusyId(null);
    }
  };

  const confirmAttendance = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await request<Participant>(
        `/tournaments/${tournament.id}/confirm-attendance/`,
        { method: "POST" },
      );
      setParticipants((current) =>
        current.map((participant) =>
          participant.user_id === updated.user_id ? updated : participant,
        ),
      );
      setNotice(
        updated.attendance_disputed
          ? "Your attendance confirmation was submitted. This record is disputed and excluded from reliability counts pending review."
          : "Thanks for confirming you attended.",
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not confirm attendance.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="detail-card community-card">
        <div className="card-title-row">
          <h2><Users aria-hidden="true" />Players</h2>
          <span>{participants.length} joined</span>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="success-message" role="status"><BellRing aria-hidden="true" />{notice}</p>}
        {participants.length ? (
          <div className="participant-list">
            {participants.map((participant) => {
              const name = [participant.first_name, participant.last_name].filter(Boolean).join(" ") || participant.username;
              return (
                <div className="participant-row" key={participant.id}>
                  <span className="participant-avatar">{initials(participant)}</span>
                  <span className="participant-copy">
                    <Link href={`/players/${encodeURIComponent(participant.username)}`}>{name}</Link>
                    <small>@{participant.username} · spot {participant.slot_number}</small>
                  </span>
                  <span className={`participant-payment ${participant.payment_status}`}>
                    {participant.payment_status === "not_required" || participant.payment_status === "paid" ? "Confirmed" : participant.payment_status === "pending" ? "Payment pending" : "Refunded"}
                  </span>
                  {participant.attendance_disputed ? (
                    <span className="attendance-badge disputed">Attendance disputed</span>
                  ) : participant.attendance_status !== "unmarked" ? (
                    <span className={`attendance-badge ${participant.attendance_status}`}>
                        {participant.attendance_status === "no_show" ? "Host-reported no-show" : participant.attendance_status === "attended" ? "Attended" : "Excused"}
                    </span>
                  ) : null}
                  {isHost && tournament.status === "completed" && (
                    <label className="attendance-control">
                      <span className="visually-hidden">Attendance for {name}</span>
                      <select
                        aria-label={`Record attendance for ${name}`}
                        value={participant.attendance_status}
                        disabled={attendanceBusyId === participant.id || participant.attendance_disputed}
                        onChange={(event) =>
                          void markAttendance(participant.id, event.target.value as AttendanceStatus)
                        }
                      >
                        <option value="unmarked">Mark attendance…</option>
                        <option value="attended">Attended</option>
                        <option value="no_show">No-show reported</option>
                        <option value="excused">Excused</option>
                      </select>
                    </label>
                  )}
                  {!isHost &&
                    user?.id === participant.user_id &&
                    tournament.status === "completed" &&
                    (participant.payment_status === "paid" || participant.payment_status === "not_required") &&
                    !participant.attendance_confirmed && (
                      <button className="attendance-confirm-button" type="button" disabled={busy} onClick={() => void confirmAttendance()}>
                        I attended
                      </button>
                    )}
                  {!isHost && user?.id === participant.user_id && participant.attendance_disputed && (
                    <small className="attendance-dispute-note">Your confirmation is awaiting review.</small>
                  )}
                  {user && user.id !== participant.user_id && (
                    <button
                      className="icon-quiet-button"
                      type="button"
                      title={`Report ${participant.username}`}
                      aria-label={`Report ${participant.username}`}
                      onClick={() => setReportTarget({ playerId: participant.user_id, label: name })}
                    ><Flag aria-hidden="true" /></button>
                  )}
                </div>
              );
            })}
          </div>
        ) : <p className="community-empty">No confirmed players yet. Be the first to grab a spot.</p>}
        {isHost && tournament.status === "completed" && (
          <p className="attendance-policy-note">
            Attendance is a host report, not an automatic penalty. Players can confirm they attended; disputed reports are excluded from reliability counts.
          </p>
        )}
        {canWaitlist && (
          <div className="waitlist-action">
            {waitlist ? (
              <>
                {waitlist.offered_slot_number && waitlist.offer_expires_at ? (
                  <>
                    <p>Spot <strong>{waitlist.offered_slot_number}</strong> is reserved for you until {new Date(waitlist.offer_expires_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.</p>
                    <button className="primary-button" disabled={busy} onClick={() => void claimWaitlistOffer()}>{busy ? "Claiming…" : "Claim your spot"}</button>
                  </>
                ) : <p>You’re on the waitlist at position <strong>{waitlist.position}</strong>. We’ll offer the next available spot to you for 15 minutes when your turn arrives.</p>}
                <button className="secondary-button" disabled={busy} onClick={() => void leaveWaitlist()}>Leave waitlist</button>
              </>
            ) : (
              <><p>All spots are claimed. Join the queue and we’ll notify you if one opens.</p><button className="secondary-button" disabled={busy} onClick={() => void joinWaitlist()}>{busy ? "Joining…" : "Join waitlist"}</button></>
            )}
          </div>
        )}
        {!user && tournament.status === "full" && <p className="community-empty"><Link href={`/account?next=${encodeURIComponent(`/tournaments/${tournament.id}`)}`}>Sign in</Link> to join the waitlist.</p>}
        {!isHost && user && <button className="text-button report-game-button" type="button" onClick={() => setReportTarget({ label: tournament.title })}><Flag aria-hidden="true" />Report this game</button>}
      </section>

      {canReadMessages && (
        <section className="detail-card community-card">
          <div className="card-title-row"><h2><MessageCircle aria-hidden="true" />Game updates</h2>{isHost && <span>Host announcements</span>}</div>
          {messages.length ? (
            <div className="message-list">
              {messages.map((message) => <article className="tournament-message" key={message.id}><strong>{message.sender}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time><p>{message.body}</p></article>)}
            </div>
          ) : <p className="community-empty">No game updates yet.</p>}
          {isHost && <form className="announcement-form" onSubmit={(event) => void sendAnnouncement(event)}><label htmlFor={`announcement-${tournament.id}`}>Send an update to everyone in this game</label><textarea id={`announcement-${tournament.id}`} maxLength={1000} rows={3} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Share a change, reminder, or meetup detail." required /><button className="primary-button" disabled={busy || !announcement.trim()}>{busy ? "Sending…" : "Send update"}</button></form>}
        </section>
      )}

      {reportTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportTarget(null); }}>
          <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <h2 id="report-title">Report {reportTarget.playerId ? reportTarget.label : "this game"}</h2>
            <p>Reports are reviewed by the SportsClan team. Only share details relevant to this safety concern.</p>
            <form className="app-form" onSubmit={(event) => void report(event)}>
              <label htmlFor="report-reason">Reason<select id="report-reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option value="spam">Spam or misleading</option><option value="abuse">Abusive or unsafe</option><option value="fake">Fake event or impersonation</option><option value="other">Other</option></select></label>
              <label htmlFor="report-details">Details <small>(optional)</small><textarea id="report-details" maxLength={1000} rows={4} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="report-actions"><button type="button" className="secondary-button" onClick={() => setReportTarget(null)}>Cancel</button><button className="primary-button" disabled={busy}>{busy ? "Sending…" : "Send report"}</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
