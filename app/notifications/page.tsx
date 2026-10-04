"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";
import type { UserNotification } from "@/lib/api";

export default function NotificationsPage() {
  const { user, isInitializing, request } = useAuth();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    void request<UserNotification[]>("/notifications/")
      .then((result) => {
        if (active) {
          setNotifications(result);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load notifications.");
      });
    return () => { active = false; };
  }, [request, user]);

  const markAllRead = async () => {
    setBusy(true);
    setError("");
    try {
      await request("/notifications/", { method: "POST" });
      setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="app-page narrow-page">
        <div className="page-heading"><span className="eyebrow">YOUR ACCOUNT</span><h1>Game updates.</h1><p>Waitlist openings, host announcements, and cancelled games.</p></div>
        {error && <p className="form-error" role="alert">{error}</p>}
        {isInitializing ? <div className="status-card">Loading account…</div> : !user ? (
          <div className="empty-state"><span className="empty-icon"><Bell aria-hidden="true" /></span><h2>Sign in to see updates</h2><p>Your game notifications will appear here.</p><Link className="primary-button" href="/account">Sign in</Link></div>
        ) : (
          <>
            {!!notifications.some((item) => !item.is_read) && <button className="secondary-button mark-read-button" type="button" disabled={busy} onClick={() => void markAllRead()}><CheckCheck aria-hidden="true" />{busy ? "Updating…" : "Mark all as read"}</button>}
            {notifications.length ? <div className="notification-list">{notifications.map((item) => <article className={`notification-item${item.is_read ? "" : " unread"}`} key={item.id}><span className="notification-icon"><Bell aria-hidden="true" /></span><div><p>{item.message}</p><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>{item.tournament_id && <Link href={`/tournaments/${item.tournament_id}`}>View game</Link>}</div></article>)}</div> : <div className="empty-state"><span className="empty-icon"><Bell aria-hidden="true" /></span><h2>You’re all caught up</h2><p>We’ll show game updates here.</p></div>}
          </>
        )}
      </div>
    </AppShell>
  );
}
