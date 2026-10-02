import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleCheck,
  Gamepad2,
  MapPin,
  Trophy,
  Wallet,
} from "lucide-react";

export default function Home() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="SportsClan home">
      SPORTCLAN
        </a>
        <nav className="header-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="/about">About</a>
        </nav>
        <a className="header-cta" href="#download">Get the app <ArrowRight aria-hidden="true" /></a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-mark" /> PLAY WITH YOUR FRIENDS</div>
            <h1>Pick a sport.<br /><span>Make it a game.</span></h1>
            <p className="hero-description">Choose a sport and a local place to play. Set the price and number of spots, then invite your friends to join.</p>
            <div className="store-links">
              <a className="store-button" href="https://apps.apple.com/us/search?term=SportsClan" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.24c.02 2.17 1.9 2.89 1.92 2.9-.02.05-.3 1.04-.99 2.06-.6.88-1.23 1.75-2.22 1.77-.97.02-1.28-.57-2.39-.57s-1.46.55-2.38.59c-.95.03-1.68-.95-2.28-1.83-1.24-1.8-2.19-5.08-.92-7.3.63-1.1 1.76-1.8 2.98-1.82.93-.02 1.8.63 2.38.63.57 0 1.65-.78 2.78-.67.47.02 1.8.19 2.65 1.43-.07.05-1.58.92-1.57 2.81M14.54 6.2c.5-.6.84-1.43.75-2.26-.72.03-1.6.48-2.12 1.08-.47.54-.88 1.38-.77 2.18.8.06 1.63-.41 2.14-1" /></svg>
                <span className="store-label"><small>Download on the</small>App Store</span><ArrowRight className="store-arrow" aria-hidden="true" />
              </a>
              <a className="store-button" href="https://play.google.com/store/search?q=SportsClan&c=apps" target="_blank" rel="noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 2.8c-.25.28-.4.7-.4 1.22v15.96c0 .52.15.94.4 1.22L12.1 12 3.4 2.8Zm1.03-.62L14 11.1l2.44-2.45L6.27 2.3c-.68-.42-1.33-.48-1.84-.12ZM17.4 9.47 14.8 12l2.6 2.53 3.06-1.75c1.13-.64 1.13-1.68 0-2.32l-3.06-.99Zm-.96 5.95L14 12.9l-9.57 8.92c.51.36 1.16.3 1.84-.12l10.17-6.28Z" /></svg>
                <span className="store-label"><small>Get it on</small>Google Play</span><ArrowRight className="store-arrow" aria-hidden="true" />
              </a>
            </div>
            <div className="hero-social-proof"><div className="proof-icons"><span>J</span><span>M</span><span>S</span><span>+</span></div><span>Made for friends who play together.</span></div>
          </div>

          <div className="hero-art" aria-label="Preview of a SportsClan tournament">
            <div className="phone-card">
              <div className="phone-status"><span>9:41</span><span>● ● ●</span></div>
              <div className="phone-topline"><span className="phone-brand"><span className="brand-symbol">S</span> SPORTCLAN</span><span>TOURNAMENT</span></div>
              <div className="event-card">
                <div className="event-top"><div className="court-lines" /><span className="event-tag"><Gamepad2 aria-hidden="true" /> BASKETBALL</span><h2 className="event-title">Sunday<br />Hoops</h2><div className="event-details"><span><CalendarDays aria-hidden="true" /> SUN, 4:00 PM</span><span><MapPin aria-hidden="true" /> RIVERSIDE COURT</span></div></div>
                <div className="slot-area"><div className="slot-heading"><strong>Player spots</strong><small>3 / 8 TAKEN</small></div><div className="slot-grid"><span className="slot-picked">01 <Check /></span><span className="slot-picked">02 <Check /></span><span className="slot-picked">03 <Check /></span><span>04<small>OPEN</small></span><span>05<small>OPEN</small></span><span>06<small>OPEN</small></span><span>07<small>OPEN</small></span><span>08<small>OPEN</small></span></div><a className="join-link" href="#download">Choose a spot <ArrowRight aria-hidden="true" /></a><div className="payment-row"><CircleCheck aria-hidden="true" /> $5 per player</div></div>
              </div>
            </div>
            <div className="floating-note"><span className="floating-icon"><MapPin aria-hidden="true" /></span><span className="floating-copy"><strong>Play close by</strong><small>Pick a local court or field</small></span><ArrowRight aria-hidden="true" /></div>
          </div>
        </section>

        <div className="section-ribbon" aria-label="Tournament planning made simple"><span>CHOOSE A SPORT</span><i /><span>PICK A PLACE</span><i /><span>SET YOUR SPOTS</span><i /><span>PLAY TOGETHER</span></div>

        <section className="steps-section" id="how-it-works">
          <div className="section-heading"><span className="section-kicker">MAKE A TOURNAMENT IN MINUTES</span><h2 className="section-title">Your game.<br /><span>Your rules.</span></h2><p className="section-description">Choose what to play, where to play, and how many friends can join.</p></div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-number">01</span><span className="step-icon"><Trophy aria-hidden="true" /></span><h3>Choose a sport</h3><p>Pick basketball, football, tennis, or another sport. Give your tournament a name.</p><a className="step-link" href="#download">PICK YOUR SPORT <ArrowRight aria-hidden="true" /></a></article>
            <article className="step-card"><span className="step-number">02</span><span className="step-icon"><Wallet aria-hidden="true" /></span><h3>Set price and spots</h3><p>Choose the price for each player and set how many spots are open.</p><a className="step-link" href="#download">SET THE DETAILS <ArrowRight aria-hidden="true" /></a></article>
            <article className="step-card"><span className="step-number">03</span><span className="step-icon"><MapPin aria-hidden="true" /></span><h3>Pick a place</h3><p>Choose a nearby stadium, court, field, or other local sports venue. Invite your friends.</p><a className="step-link" href="#download">FIND A VENUE <ArrowRight aria-hidden="true" /></a></article>
          </div>
        </section>

        <section className="feature-band" id="features">
          <div className="event-summary"><div className="summary-topline"><span>TOURNAMENT DETAILS</span><span className="confirmed">READY <CircleCheck aria-hidden="true" /></span></div><h3 className="summary-title">Sunday<br /><span>Basketball</span></h3><div className="summary-detail"><div><CalendarDays aria-hidden="true" /><span><small>WHEN</small>Sunday, 4:00 PM</span></div><div><MapPin aria-hidden="true" /><span><small>WHERE</small>Riverside Court</span></div></div><div className="summary-footer"><div className="avatar-stack"><span>J</span><span>M</span><span>S</span><span>+</span></div><span>3 players joined</span><span className="attendee-count">3 / 8</span></div><div className="fee-line"><span>Price per player</span><strong>$5.00</strong></div><div className="fee-progress"><span /></div></div>
          <div className="feature-copy"><span className="section-kicker">EVERYTHING IN ONE PLACE</span><h2 className="section-title">Plan the game.<br /><span>Then go play.</span></h2><p>See the sport, price, open spots, time, and venue on one tournament page. Your friends can choose a spot and know where to go.</p><ul className="feature-list"><li><CircleCheck aria-hidden="true" /><span><strong>Pick your sport</strong><small>Choose the game your group wants to play.</small></span></li><li><CircleCheck aria-hidden="true" /><span><strong>Set price and player spots</strong><small>Decide the cost and how many can join.</small></span></li><li><CircleCheck aria-hidden="true" /><span><strong>Choose a local venue</strong><small>Meet at a nearby stadium, court, or field.</small></span></li></ul><a className="text-link" href="#download">Get SportsClan <ArrowRight aria-hidden="true" /></a></div>
        </section>

        <section className="download-band" id="download"><div className="download-copy"><span className="section-kicker">READY TO PLAY?</span><h2>Make your<br />next tournament.</h2><p>Get SportsClan and invite your friends to play.</p></div><div className="store-links"><a className="store-button" href="https://apps.apple.com/us/search?term=SportsClan" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.37 12.24c.02 2.17 1.9 2.89 1.92 2.9-.02.05-.3 1.04-.99 2.06-.6.88-1.23 1.75-2.22 1.77-.97.02-1.28-.57-2.39-.57s-1.46.55-2.38.59c-.95.03-1.68-.95-2.28-1.83-1.24-1.8-2.19-5.08-.92-7.3.63-1.1 1.76-1.8 2.98-1.82.93-.02 1.8.63 2.38.63.57 0 1.65-.78 2.78-.67.47.02 1.8.19 2.65 1.43-.07.05-1.58.92-1.57 2.81M14.54 6.2c.5-.6.84-1.43 1.59-2.26-.72.03-1.6.48-2.12 1.08-.47.54-.88 1.38-.77 2.18.8.06 1.63-.41 2.14-1" /></svg><span className="store-label"><small>Download on the</small>App Store</span><ArrowRight className="store-arrow" aria-hidden="true" /></a><a className="store-button" href="https://play.google.com/store/search?q=SportsClan&c=apps" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3.4 2.8c-.25.28-.4.7-.4 1.22v15.96c0 .52.15.94.4 1.22L12.1 12 3.4 2.8Zm1.03-.62L14 11.1l2.44-2.45L6.27 2.3c-.68-.42-1.33-.48-1.84-.12ZM17.4 9.47 14.8 12l2.6 2.53 3.06-1.75c1.13-.64 1.13-1.68 0-2.32l-3.06-.99Zm-.96 5.95L14 12.9l-9.57 8.92c.51.36 1.16.3 1.84-.12l10.17-6.28Z" /></svg><span className="store-label"><small>Get it on</small>Google Play</span><ArrowRight className="store-arrow" aria-hidden="true" /></a></div><div className="download-outline" aria-hidden="true" /></section>

        <section className="faq-section" id="faq"><div><span className="section-kicker">GOOD TO KNOW</span><h2 className="section-title">Quick answers.</h2></div><div className="faq-list"><details><summary>What is SportsClan? <ChevronDown aria-hidden="true" /></summary><p>SportsClan helps friends set up sports tournaments and meet to play.</p></details><details><summary>What can I set for a tournament? <ChevronDown aria-hidden="true" /></summary><p>Choose a sport, a local venue, the price per player, and the number of open spots.</p></details><details><summary>How do friends join? <ChevronDown aria-hidden="true" /></summary><p>Share your tournament. Friends can pick an open spot and see when and where to meet.</p></details></div></section>
      </main>

      <footer className="site-footer"><a className="wordmark" href="#top"><span className="brand-symbol">S</span> SPORTCLAN</a><span>Pick a sport. Play together.</span><nav className="footer-links" aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#download">Get the app</a></nav><span className="copyright">© {new Date().getFullYear()} SPORTCLAN</span></footer>
    </div>
  );
}
