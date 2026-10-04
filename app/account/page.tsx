"use client";

import { ArrowRight, CircleUserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/components/AppProviders";

export default function AccountPage() {
  const { user, isInitializing, signIn, register, signOut } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "signin") await signIn(username.trim(), password);
      else await register({ username: username.trim(), email: email.trim(), password });
      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/my-games";
      router.push(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not access your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="app-page narrow-page">
        <div className="page-heading"><span className="eyebrow">SPORTSCLAN ACCOUNT</span><h1>Your account.</h1><p>Sign in or create an account to set up games and play with your crew.</p></div>
        {isInitializing ? <div className="status-card">Checking your account…</div> : user ? (
          <section className="profile-card">
            <span className="large-avatar">{(user.first_name || user.username).slice(0, 1).toUpperCase()}</span>
            <div className="profile-card-copy"><h2>{user.first_name || user.username}</h2><p>@{user.username}</p><p>{user.email}</p></div>
            <div className="profile-actions"><Link className="primary-button" href="/profile">View profile <ArrowRight aria-hidden="true" /></Link><Link className="secondary-button" href="/my-games">My games</Link><button className="text-button" type="button" onClick={signOut}>Sign out</button></div>
          </section>
        ) : (
          <section className="auth-card">
            <div className="auth-card-icon"><CircleUserRound aria-hidden="true" /></div>
            <h2>{mode === "signin" ? "Welcome back." : "Join your crew."}</h2>
            <p>{mode === "signin" ? "Sign in to find or manage your games." : "Create an account to start playing."}</p>
            <form className="app-form" onSubmit={submit}>
              {mode === "signup" && <label>Email<input type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label>}
              <label>Username<input name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Your username" required /></label>
              <label>Password<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} required /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button full-button" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"} <ArrowRight aria-hidden="true" /></button>
            </form>
            <div className="auth-switch"><span>{mode === "signin" ? "New to SportsClan?" : "Already have an account?"}</span><button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>{mode === "signin" ? "Create account" : "Sign in"}</button></div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
