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

let current = readStored() ?? DEFAULT_STATION_URL;
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
  try {
    if (next === DEFAULT_STATION_URL) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: next, base: DEFAULT_STATION_URL }));
  } catch {
    /* private mode etc. — the switch still applies for this session */
  }
  subscribers.forEach((fn) => fn());
}

/** Subscribe to station changes (for useSyncExternalStore). */
export function subscribeStation(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}
