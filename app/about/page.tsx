import type { Metadata } from "next";
import { ArrowRight, Handshake, Trophy, Users } from "lucide-react";

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
        <a className="wordmark" href="/" aria-label="SportsClan home">
          <span className="brand-symbol">S</span> SPORTCLAN
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="/#how-it-works">How it works</a>
          <a href="/#features">Features</a>
          <a href="/#faq">FAQ</a>
          <a href="/about" aria-current="page">About</a>
        </nav>
        <a className="header-cta" href="/#download">Get the app <ArrowRight aria-hidden="true" /></a>
      </header>

      <main className="about-main">
        <section className="about-hero">
          <span className="section-kicker">WHY SPORTCLAN</span>
          <h1>Make it a game.<br /><span>Bring everyone in.</span></h1>
          <p>
            SportsClan makes hangouts more fun, gives friends a friendly way to settle sports debates, and helps groups run tournaments.
          </p>
          <a className="header-cta" href="/#download">Get the app <ArrowRight aria-hidden="true" /></a>
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
          <a className="about-link" href="/#how-it-works">See how it works <ArrowRight aria-hidden="true" /></a>
        </section>
      </main>

      <footer className="site-footer">
        <a className="wordmark" href="/"><span className="brand-symbol">S</span> SPORTCLAN</a>
        <span>Pick a sport. Play together.</span>
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="/#how-it-works">How it works</a>
          <a href="/#download">Get the app</a>
          <a href="/about">About</a>
        </nav>
        <span className="copyright">© {new Date().getFullYear()} SPORTCLAN</span>
      </footer>
    </div>
  );
}