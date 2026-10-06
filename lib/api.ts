export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === "production"
    ? "https://sportsclan-backend.onrender.com/api/v1"
    : "http://127.0.0.1:8000/api/v1")
).replace(/\/+$/, "");

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Sport {
  id: number;
  name: string;
  slug: string;
}

export interface CurrencyOption {
  code: string;
  name: string;
  is_default: boolean;
}

export interface Country {
  code: string;
  name: string;
  default_currency: string | null;
  currencies: CurrencyOption[];
}

export interface Venue {
  id: number;
  name: string;
  venue_name: string;
  address: string;
  postal_code: string;
  city: string;
  region: string;
  state: string;
  country: string;
  country_info: Country | null;
  latitude: string | null;
  longitude: string | null;
  sports: Sport[];
  pricing_type: "free" | "fixed" | "hourly" | "quote";
  price_amount: string | null;
  price_currency: string;
}

export interface Tournament {
  id: number;
  title: string;
  description: string;
  host: string;
  sport: Sport;
  venue: Venue;
  venue_name: string;
  state: string;
  latitude: string | null;
  longitude: string | null;
  country: Country | null;
  starts_at: string;
  duration_minutes: number;
  venue_pricing_type_snapshot: Venue["pricing_type"];
  venue_rate_snapshot: string | null;
  venue_rate_currency_snapshot: string;
  venue_fee_estimate: string | null;
  venue_fee: string | null;
  venue_fee_status: string;
  entry_fee: string;
  currency: string;
  max_players: number;
  projected_prize_pool: string;
  slots_taken: number;
  slots_open: number;
  taken_slots: number[];
  waitlist_offers: { offered_slot_number: number; offer_expires_at: string }[];
  payments_enabled: boolean;
  player_refund_deadline: string;
  status: "open" | "full" | "cancelling" | "cancelled" | "completed";
  is_joined: boolean;
  my_slot: number | null;
  my_payment_status: "pending" | "paid" | "refunded" | "not_required" | null;
  is_waitlisted: boolean;
  waitlist_position: number | null;
  created_at: string;
  updated_at: string;
}

export interface TournamentEntry {
  id: number;
  user_id: number;
  username: string;
  slot_number: number;
  entry_fee_at_join: string;
  payment_status: "pending" | "paid" | "refunded" | "not_required";
  reservation_expires_at: string | null;
  joined_at: string;
  attendance_status: "unmarked" | "attended" | "no_show" | "excused";
  attendance_confirmed: boolean;
  attendance_disputed: boolean;
  first_name: string;
  last_name: string;
}

export interface PlayerReliability {
  games_attended: number;
  no_shows_reported: number;
  attendance_disputes: number;
  hosted_completed: number;
  hosted_cancelled: number;
  hosted_last_minute_cancellations: number;
}

export interface PlayerProfile {
  username: string;
  first_name: string;
  last_name: string;
  bio: string;
  preferred_sports: Sport[];
  games_played: number;
  reliability: PlayerReliability;
  completed_games: Tournament[];
}

export interface TournamentMessage {
  id: number;
  sender: string;
  body: string;
  created_at: string;
}

export interface UserNotification {
  id: number;
  kind: "spot_open" | "tournament_cancelled" | "host_announcement";
  message: string;
  tournament_id: number | null;
  is_read: boolean;
  created_at: string;
}

export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly data?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const fields = data as Record<string, unknown>;
  if (typeof fields.detail === "string") return fields.detail;
  return Object.entries(fields)
    .map(([key, value]) => {
      const message = Array.isArray(value) ? value.join(" ") : String(value);
      return `${key === "non_field_errors" ? "" : `${key.replaceAll("_", " ")}: `}${message}`;
    })
    .join(" ") || fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (requestOptions.body) requestHeaders.set("Content-Type", "application/json");
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    const requestUrl = new URL(path, `${API_BASE_URL}/`);
    const basePath = new URL(API_BASE_URL).pathname.replace(/\/$/, "");
    const endpoint = requestUrl.pathname.startsWith(basePath)
      ? requestUrl.pathname.slice(basePath.length)
      : requestUrl.pathname.replace(/^\/api\/v1/, "");
    response = await fetch(`${API_BASE_URL}${endpoint}${requestUrl.search}`, {
      ...requestOptions,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError(`Could not reach the SportsClan API at ${API_BASE_URL}.`, 0);
  }

  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(errorMessage(data, `Request failed (${response.status}).`), response.status, data);
  }
  return data as T;
}

export async function fetchAllPages<T>(
  path: string,
  request: <R>(path: string, options?: RequestInit) => Promise<R>,
): Promise<T[]> {
  const rows: T[] = [];
  let next: string | null = path;
  for (let page = 0; next && page < 20; page += 1) {
    const result: Page<T> = await request<Page<T>>(next);
    rows.push(...result.results);
    next = result.next;
  }
  return rows;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPrice(amount: string | number, currency: string) {
  const value = Number(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}
