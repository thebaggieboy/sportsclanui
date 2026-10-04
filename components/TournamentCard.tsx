import { CalendarDays, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { formatDate, formatPrice, type Tournament } from "@/lib/api";

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  const venue = tournament.venue_name || tournament.venue?.name || "Venue to be confirmed";
  const city = tournament.venue?.city || tournament.state;
  return (
    <Link className="game-card" href={`/tournaments/${tournament.id}`}>
      <div className="game-card-top">
        <span className="sport-pill">{tournament.sport.name}</span>
        <span className="game-price">{formatPrice(tournament.entry_fee, tournament.currency)} <small>/ player</small></span>
      </div>
      <h2>{tournament.title}</h2>
      <div className="game-meta"><CalendarDays aria-hidden="true" /><span>{formatDate(tournament.starts_at)}</span></div>
      <div className="game-meta"><MapPin aria-hidden="true" /><span>{[venue, city].filter(Boolean).join(", ")}</span></div>
      <div className="game-card-footer">
        <span>Hosted by {tournament.host}</span>
        <span className="game-spots"><Users aria-hidden="true" />{tournament.slots_open} open</span>
      </div>
    </Link>
  );
}
