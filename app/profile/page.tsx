"use client";

import { ArrowRight, CalendarDays, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";

export default function ProfilePage() {
  const { user, isInitializing, signOut } = useAuth();
  return (
    <AppShell>
      <div className="app-page narrow-page">
        <div className="page-heading"><span className="eyebrow">YOUR PROFILE</span><h1>Play together.</h1><p>Your SportsClan account and games.</p></div>
        {isInitializing ? <div className="status-card">Loading your account…</div> : user ? (
          <>
            <section className="profile-card">
              <span className="large-avatar">{(user.first_name || user.username).slice(0, 1).toUpperCase()}</span>
              <div className="profile-card-copy"><h2>{user.first_name || user.username}</h2><p>@{user.username}</p><p>{user.email}</p></div>
            </section>
            <div className="account-note"><strong>Entry fees</strong><p>SportsClan records tournament prices. If an entry requires payment, checkout opens securely with the payment provider before your spot is confirmed.</p></div>
            <div className="profile-link-list"><Link href="/my-games"><CalendarDays aria-hidden="true" />My games<ArrowRight aria-hidden="true" /></Link><Link href="/tournaments/new"><Plus aria-hidden="true" />Create a tournament<ArrowRight aria-hidden="true" /></Link></div>
            <button className="secondary-button signout-button" type="button" onClick={signOut}><LogOut aria-hidden="true" />Sign out</button>
          </>
        ) : (
          <section className="auth-card"><h2>Sign in to your account.</h2><p>Sign in to create tournaments, claim a spot, and keep track of your games.</p><Link className="primary-button full-button" href="/account">Sign in or create account <ArrowRight aria-hidden="true" /></Link></section>
        )}
      </div>
    </AppShell>
  );
}
