import type { Metadata } from "next";
import { ArrowRight, Handshake, Trophy, Users } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About SportsClan | Play together",
  description:
    "SportsClan makes hangouts more fun, turns sports debates into friendly games, and helps groups run tournaments.",
};

const reasons = [
  {
    number: "01",
    icon: Users,
    title: "Make a hangout happen",
    description: "Pick a sport, choose a place and time, then bring your friends together to play.",
  },
  {
    number: "02",
    icon: Trophy,
    title: "Settle it with a game",
    description: "Got a sports argument? Put it on the court or field and let the game decide.",
  },
  {
    number: "03",
    icon: Handshake,
    title: "Bring your group together",
    description: "Clubs, schools, teams, and local organizations can set up tournaments for their people.",
  },
];

export default function AboutPage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="SportsClan home">
          <span className="brand-symbol">S</span> SPORTCLAN
        </Link>
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#features">Features</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/about" aria-current="page">About</Link>
        </nav>
        <Link className="header-cta" href="/waitlist">Join the waitlist <ArrowRight aria-hidden="true" /></Link>
      </header>

      <main className="about-main">
        <section className="about-hero">
          <span className="section-kicker">WHY SPORTCLAN</span>
          <h1>Make it a game.<br /><span>Bring everyone in.</span></h1>
          <p>
            SportsClan makes hangouts more fun, gives friends a friendly way to settle sports debates, and helps groups run tournaments.
          </p>
          <Link className="header-cta" href="/waitlist">Join the waitlist <ArrowRight aria-hidden="true" /></Link>
        </section>

        <section className="about-reasons" aria-label="What SportsClan is for">
          {reasons.map(({ number, icon: Icon, title, description }) => (
            <article className="about-reason" key={number}>
              <div className="about-reason-top"><span>{number}</span><Icon aria-hidden="true" /></div>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="about-footer-band">
          <div>
            <span className="section-kicker">YOUR NEXT GAME STARTS HERE</span>
            <h2>Pick a sport.<br />Get your people together.</h2>
          </div>
          <Link className="about-link" href="/#how-it-works">See how it works <ArrowRight aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className="site-footer">
        <Link className="wordmark" href="/"><span className="brand-symbol">S</span> SPORTCLAN</Link>
        <span>Pick a sport. Play together.</span>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/waitlist">Join the waitlist</Link>
          <Link href="/about">About</Link>
        </nav>
        <span className="copyright">© {new Date().getFullYear()} SPORTCLAN</span>
      </footer>
    </div>
  );
}