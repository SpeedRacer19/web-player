// The ONLY module that talks to a SUB/WAVE controller. Every fetch and every
// controller-relative URL (cover art, persona avatars) is built here from the
// station origin in config.ts. Keep it this way — if you redesign the UI, this
// file and the hooks are the plumbing you keep; the components are what you
// replace.
//
// Response posture mirrors the real player: feed endpoints parse JSON directly,
// /schedule throws on non-OK, /request/:id maps a 404 to status 'unknown'.

import { config } from '@/config';
import type {
  DirectoryStation,
  LyricsPayload,
  LyricsResult,
  NowPlayingResponse,
  RequestResult,
  SchedulePayload,
  SessionPayload,
  StationState,
} from '@/lib/types';

// Read at call time, not import time: the station can change at runtime.
const base = () => config.apiUrl;

const json = <T>(res: Response): Promise<T> => res.json() as Promise<T>;

/** Prefix a controller-relative path (e.g. `/persona-avatar/p_x`) with the
 *  station's API base. Empty input stays '' so `<img>` fallbacks keep working. */
export function resolveUrl(path: string | null | undefined): string {
  return path ? `${base()}${path}` : '';
}

/** Cover-art proxy URL for a library track id. */
export function coverUrl(subsonicId: string): string {
  return `${base()}/cover/${encodeURIComponent(subsonicId)}`;
}

export function fetchNowPlaying(): Promise<NowPlayingResponse> {
  return fetch(`${base()}/now-playing`).then((r) => json<NowPlayingResponse>(r));
}

export function fetchState(): Promise<StationState> {
  return fetch(`${base()}/state`).then((r) => json<StationState>(r));
}

export function fetchSession(): Promise<SessionPayload> {
  return fetch(`${base()}/session`).then((r) => json<SessionPayload>(r));
}

export async function fetchSchedule(): Promise<SchedulePayload> {
  const r = await fetch(`${base()}/schedule`);
  if (!r.ok) throw new Error(`schedule fetch ${r.status}`);
  return json<SchedulePayload>(r);
}

/** Cheap liveness GET for the signal dot. Caller owns any timeout/abort. */
export function fetchHealth(init?: { signal?: AbortSignal }): Promise<Response> {
  return fetch(`${base()}/health`, { cache: 'no-store', signal: init?.signal });
}

/** Submit a listener song request. Returns immediately with a `requestId` to
 *  poll; the actual matching + enqueue happens in the background on the server. */
export async function submitRequest(text: string, name: string): Promise<RequestResult> {
  const r = await fetch(`${base()}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, name }),
  });
  return json<RequestResult>(r);
}

/** Poll a request's outcome. 404 → 'unknown'; network error → null so the
 *  caller can keep polling. */
export async function fetchRequestStatus(requestId: string): Promise<RequestResult | null> {
  try {
    const r = await fetch(`${base()}/request/${encodeURIComponent(requestId)}`);
    if (r.status === 404) return { success: false, status: 'unknown' };
    return await json<RequestResult>(r);
  } catch {
    return null;
  }
}

/** The public station directory (lives on its own origin, not the station's).
 *  Resolves [] on any failure so the SRC list just shows the current station. */
export async function fetchDirectory(signal?: AbortSignal): Promise<DirectoryStation[]> {
  try {
    const r = await fetch(config.directoryUrl, { signal });
    if (!r.ok) return [];
    const data: unknown = await r.json();
    return Array.isArray(data)
      ? (data as DirectoryStation[]).filter((s) => s && typeof s.url === 'string' && s.name)
      : [];
  } catch {
    return [];
  }
}

/** Lyrics for the track the listener is hearing. Never throws. Status codes
 *  follow the controller: 403 lyrics off, 409 track gone, 401 private. */
export async function fetchLyrics(songId: string): Promise<LyricsResult> {
  try {
    const r = await fetch(`${base()}/lyrics/current?songId=${encodeURIComponent(songId)}`, {
      cache: 'no-store',
    });
    if (r.status === 403) return { kind: 'disabled' };
    if (r.status === 409) return { kind: 'gone' };
    if (r.status === 401) return { kind: 'locked' };
    if (!r.ok) return { kind: 'unavailable' };
    const data = (await r.json()) as Partial<LyricsPayload>;
    if (!data || !Array.isArray(data.lines)) return { kind: 'unavailable' };
    return {
      kind: 'ok',
      payload: {
        songId: data.songId ?? null,
        synced: data.synced === true,
        offsetMs: typeof data.offsetMs === 'number' ? data.offsetMs : 0,
        lines: data.lines.filter((l) => l && typeof l.text === 'string'),
        source: data.source ?? null,
        pending: data.pending === true,
      },
    };
  } catch {
    return { kind: 'unavailable' };
  }
}
