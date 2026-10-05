"use client";

import { Bell, CalendarDays, CircleUserRound, Compass, Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useAuth } from "@/components/AppProviders";

const links = [
  { href: "/tournaments", label: "Find games", icon: Compass },
  { href: "/tournaments/new", label: "Create", icon: Plus },
  { href: "/my-games", label: "My games", icon: CalendarDays },
  { href: "/notifications", label: "Updates", icon: Bell },
  { href: "/profile", label: "Profile", icon: CircleUserRound },
];

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user, initializationError } = useAuth();
  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/"><span className="brand-symbol">S</span><span>SPORTCLAN</span></Link>
        <div className="sidebar-label">PLAY</div>
        <nav className="app-nav" aria-label="App navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link className={`app-nav-link${pathname === href || (href !== "/tournaments" && pathname.startsWith(`${href}/`)) ? " active" : ""}`} href={href} key={href}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-promo"><Trophy aria-hidden="true" /><strong>Your next game starts here.</strong><span>Bring your people together and get playing.</span><Link href="/tournaments/new">Plan a game <span aria-hidden="true">→</span></Link></div>
          <Link className="sidebar-account" href="/account">
            <span className="sidebar-avatar">{user ? (user.first_name || user.username).slice(0, 1).toUpperCase() : <CircleUserRound aria-hidden="true" />}</span>
            <span><strong>{user ? user.first_name || user.username : "Your account"}</strong><small>{user ? `@${user.username}` : "Sign in or create one"}</small></span>
          </Link>
        </div>
      </aside>
      <div className="app-main-wrap">
        <header className="app-mobile-header"><Link className="app-brand" href="/"><span className="brand-symbol">S</span><span>SPORTSCLAN</span></Link><div className="mobile-header-actions"><Link className="mobile-account" href="/notifications" aria-label="Game updates"><Bell aria-hidden="true" /></Link><Link className="mobile-account" href="/account" aria-label="Account"><CircleUserRound aria-hidden="true" /></Link></div></header>
        <main className="app-main">
          {initializationError && <p className="form-error session-error" role="alert">{initializationError}</p>}
          {children}
        </main>
      </div>
      <nav className="app-bottom-nav" aria-label="App navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link className={pathname === href || (href !== "/tournaments" && pathname.startsWith(`${href}/`)) ? "active" : ""} href={href} key={href}>
            <Icon aria-hidden="true" /><span>{label === "Find games" ? "Browse" : label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
