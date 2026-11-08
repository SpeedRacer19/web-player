// The one place the station origin is resolved. Everything downstream
// (stationClient, the <audio> element) builds its URLs from here, so pointing
// this player at another SUB/WAVE station is a one-line env change.
//
// Every SUB/WAVE deployment serves the same route table on one hostname:
//   /api/*              → the controller (now-playing, state, session, …)
//   /stream.{mp3,…}     → the Icecast mounts (the audio itself)
// so a single origin URL is all we need.
//
// The station can also be switched at runtime (the head unit's SRC button,
// fed by the public station directory). The listener's pick is remembered in
// localStorage, but only against the build's default — rebuild with a new
// VITE_STATION_URL and the stale pick is ignored, so "it didn't update" can't
// come from here.
//
// A share link (?station=radio.example.com) tunes straight to that station on
// load and wins over the remembered pick. Stations typed in or opened from a
// link are kept in a short "recent" list so they can be picked again.

const trimSlash = (u: string) => u.replace(/\/+$/, '');

/** Turn whatever a listener typed into a station origin, or null if it can't
 *  be one. Adds a scheme when there's none (http:// for localhost and LAN
 *  addresses, which rarely have certificates; https:// otherwise), and drops a
 *  pasted path such
 *  as /listen, /api or /stream.mp3: every SUB/WAVE install serves its routes
 *  from the root of one hostname. */
export function normalizeStationUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const local = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(raw);
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw)
    ? raw
    : `${local ? 'http' : 'https'}://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname.includes('.') && u.hostname !== 'localhost' && !u.hostname.startsWith('['))
      return null;
    return u.origin;
  } catch {
    return null;
  }
}

const DEFAULT_STATION_URL = trimSlash(
  import.meta.env.VITE_STATION_URL ?? 'https://www.getsubwave.com',
);

/** The public SUB/WAVE station directory (same list the official app uses). */
const DIRECTORY_URL =
  import.meta.env.VITE_DIRECTORY_URL ?? 'https://www.getsubwave.com/stations.json';

const STORAGE_KEY = 'subwave.station.v1';
const RECENT_KEY = 'subwave.recent.v1';
const RECENT_MAX = 5;

/** An https:// page can't load an http:// station (browsers block mixed
 *  content), except on localhost. */
export function blockedByMixedContent(origin: string): boolean {
  return (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    origin.startsWith('http:') &&
    !/^http:\/\/(localhost|127\.)/.test(origin)
  );
}

/** ?station= on the page URL, as an origin. The parameter is removed from the
 *  address bar afterwards, so it doesn't look pinned once you switch. */
function readShared(): string | null {
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get('station');
    if (raw === null) return null;
    url.searchParams.delete('station');
    window.history.replaceState(window.history.state, '', url);
    const origin = normalizeStationUrl(raw);
    return origin && !blockedByMixedContent(origin) ? origin : null;
  } catch {
    return null;
  }
}

function readStored(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { url?: unknown; base?: unknown };
    if (typeof v.url !== 'string' || v.base !== DEFAULT_STATION_URL) return null;
    return trimSlash(v.url);
  } catch {
    return null;
  }
}

function persist(url: string) {
  try {
    if (url === DEFAULT_STATION_URL) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, base: DEFAULT_STATION_URL }));
  } catch {
    /* private mode etc. — the switch still applies for this session */
  }
}

// --- Recent stations -------------------------------------------------------

export interface RecentStation {
  url: string;
  /** The station's own name, filled in once it has answered a poll. */
  name?: string;
}

function readRecent(): RecentStation[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r): r is RecentStation => !!r && typeof r.url === 'string')
      .map((r) => ({ url: trimSlash(r.url), name: typeof r.name === 'string' ? r.name : undefined }))
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

let recent: readonly RecentStation[] = readRecent();
const recentSubscribers = new Set<() => void>();

function setRecent(next: RecentStation[]) {
  recent = next;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* not remembered across reloads, still listed this session */
  }
  recentSubscribers.forEach((fn) => fn());
}

/** Stations typed in or opened from a share link, newest first. */
export function getRecentStations(): readonly RecentStation[] {
  return recent;
}

/** Put a station at the top of the recent list (the build's own station is
 *  always reachable, so it's never added). */
export function rememberStation(url: string) {
  const u = trimSlash(url);
  if (u === DEFAULT_STATION_URL) return;
  const old = recent.find((r) => r.url === u);
  setRecent([{ url: u, name: old?.name }, ...recent.filter((r) => r.url !== u)].slice(0, RECENT_MAX));
}

export function forgetStation(url: string) {
  const u = trimSlash(url);
  if (recent.some((r) => r.url === u)) setRecent(recent.filter((r) => r.url !== u));
}

/** Record a recent station's name, in place (no-op if it isn't listed). */
export function nameStation(url: string, name: string) {
  const u = trimSlash(url);
  if (!recent.some((r) => r.url === u && r.name !== name)) return;
  setRecent(recent.map((r) => (r.url === u ? { ...r, name } : r)));
}

export function subscribeRecent(fn: () => void) {
  recentSubscribers.add(fn);
  return () => {
    recentSubscribers.delete(fn);
  };
}

// --- Current station -------------------------------------------------------

const shared = readShared();
let current = shared ?? readStored() ?? DEFAULT_STATION_URL;
if (shared) {
  persist(shared);
  rememberStation(shared);
}
const subscribers = new Set<() => void>();

export type StreamFormat = 'mp3' | 'aac' | 'opus' | 'flac';

export const config = {
  /** Station origin baked in at build time (VITE_STATION_URL). */
  defaultStationUrl: DEFAULT_STATION_URL,
  /** Current station origin, e.g. https://www.getsubwave.com */
  get stationUrl() {
    return current;
  },
  /** Controller API base — all JSON endpoints live under here. */
  get apiUrl() {
    return `${current}/api`;
  },
  /** The always-served MP3 Icecast mount (the universal audio floor). */
  get streamUrl() {
    return `${current}/stream.mp3`;
  },
  /** The Icecast mount for a given format. Callers gate on availability. */
  streamUrlFor(format: StreamFormat) {
    return `${current}/stream.${format}`;
  },
  directoryUrl: DIRECTORY_URL,
  /** This build's version (package.json), shown on the faceplate. */
  version: __APP_VERSION__,
  /** How often the live feed (now-playing / state / session) is polled. */
  pollIntervalMs: 5000,
};

/** Switch the whole player to another station origin. */
export function setStationUrl(url: string) {
  const next = trimSlash(url);
  if (next === current) return;
  current = next;
  persist(next);
  subscribers.forEach((fn) => fn());
}

/** A link that opens this player tuned to `url`. https:// is left off to keep
 *  it short (it's the default when the link is opened). */
export function shareLinkFor(url: string): string {
  const page = `${window.location.origin}${window.location.pathname}`;
  const u = trimSlash(url);
  if (u === DEFAULT_STATION_URL) return page;
  const value = u.startsWith('https://') ? u.slice('https://'.length) : u;
  return `${page}?${new URLSearchParams({ station: value })}`;
}

/** Subscribe to station changes (for useSyncExternalStore). */
export function subscribeStation(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
