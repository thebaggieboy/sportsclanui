"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "https://sportsclan-backend.onrender.com/api/v1"
    : "http://localhost:8000/api/v1")
).replace(/\/+$/, "");

type Interest = "player" | "organizer" | "tester";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState<Interest>("player");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/waitlist/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, interest }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message = result?.email?.[0] || result?.interest?.[0] || result?.detail;
        throw new Error(typeof message === "string" ? message : "We couldn't add you right now. Please try again.");
      }

      setIsJoined(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Couldn't connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="waitlist-page">
      <aside className="waitlist-visual" aria-label="SportsClan field">
        <Image
          src="/field_3.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 760px) 100vw, 50vw"
          className="waitlist-photo"
        />
        <Link href="/" className="waitlist-brand" aria-label="SportsClan home">
          <span className="brand-symbol">S</span>
          SPORTCLAN
        </Link>
        <div className="waitlist-visual-copy">
          <span className="waitlist-visual-kicker">SPORTCLAN · EARLY ACCESS</span>
          <h1>Pick a sport.<br />Bring your people.</h1>
          <p>Find a place to play, open a few spots, and make the next game happen.</p>
        </div>
        <span className="waitlist-visual-foot">GOOD GAMES START WITH YOUR PEOPLE</span>
      </aside>

      <section className="waitlist-panel" aria-labelledby="waitlist-title">
        <Link href="/" className="waitlist-back"><ArrowLeft aria-hidden="true" /> Back to SportsClan</Link>

        {isJoined ? (
          <div className="waitlist-success" role="status" aria-live="polite">
            <CheckCircle2 className="waitlist-success-icon" aria-hidden="true" />
            <span className="waitlist-kicker">YOU&apos;RE ON THE LIST</span>
            <h2 id="waitlist-title">We’ll be in touch.</h2>
            <p>We’ve saved <strong>{email}</strong> for SportsClan early access. Thanks for joining as a {interest}.</p>
            <Link href="/" className="waitlist-home-link">Back to SportsClan <ArrowRight aria-hidden="true" /></Link>
          </div>
        ) : (
          <div className="waitlist-form-content">
            <span className="waitlist-kicker">EARLY ACCESS</span>
            <h2 id="waitlist-title">Be first on the field.</h2>
            <p className="waitlist-intro">Join the list for launch updates and a chance to test SportsClan before it hits the field.</p>

            <form className="waitlist-form" onSubmit={handleSubmit}>
              <label htmlFor="waitlist-email">Email address</label>
              <input
                id="waitlist-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="waitlist-interest">I’m interested as a</label>
              <select
                id="waitlist-interest"
                name="interest"
                value={interest}
                onChange={(event) => setInterest(event.target.value as Interest)}
              >
                <option value="player">Player</option>
                <option value="organizer">Tournament organizer</option>
                <option value="tester">App tester</option>
              </select>

              {errorMessage && <p className="waitlist-error" role="alert">{errorMessage}</p>}

              <button className="waitlist-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {isSubmitting ? "Joining..." : "Join the waitlist"}
                {!isSubmitting && <ArrowRight aria-hidden="true" />}
              </button>
              <p className="waitlist-privacy">Only launch news and early-access updates. No spam.</p>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}