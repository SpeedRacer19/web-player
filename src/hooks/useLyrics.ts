// Lyrics for the current track, fetched only while something wants them
// (`enabled` — e.g. the glovebox is open). Mirrors the official player's
// retry posture: a `pending` answer (the station is still asking LRCLIB) is
// re-asked every 4s for up to ~40s; a station that didn't answer is retried
// with backoff; disabled / gone / locked are final for that track.

import { useEffect, useState } from 'react';
import { fetchLyrics } from '@/lib/stationClient';
import type { LyricsPayload } from '@/lib/types';

export type LyricsStatus =
  | 'idle' // no library track to ask about
  | 'loading'
  | 'ready'
  | 'unavailable' // station / network didn't answer; retrying
  | 'disabled'
  | 'gone'
  | 'locked';

const PENDING_RECHECK_MS = 4_000;
const PENDING_MAX_ASKS = 10;
const RETRY_BASE_MS = 5_000;
const RETRY_MAX_MS = 60_000;

interface LyricsState {
  songId: string | null;
  status: LyricsStatus;
  payload: LyricsPayload | null;
}

export function useLyrics(songId: string | null | undefined, enabled: boolean) {
  const [state, setState] = useState<LyricsState>({ songId: null, status: 'idle', payload: null });

  useEffect(() => {
    if (!enabled || !songId) return;
    let cancelled = false;
    let timer: number | undefined;
    let pendingAsks = 0;
    let failures = 0;

    setState((s) =>
      s.songId === songId ? s : { songId, status: 'loading', payload: null },
    );

    async function ask() {
      const res = await fetchLyrics(songId!);
      if (cancelled) return;
      if (res.kind === 'ok') {
        failures = 0;
        setState({ songId: songId!, status: 'ready', payload: res.payload });
        if (res.payload.pending && ++pendingAsks < PENDING_MAX_ASKS) {
          timer = window.setTimeout(ask, PENDING_RECHECK_MS);
        }
      } else if (res.kind === 'unavailable') {
        setState((s) => ({ songId: songId!, status: 'unavailable', payload: s.songId === songId ? s.payload : null }));
        const wait = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** failures++);
        timer = window.setTimeout(ask, wait);
      } else {
        setState({ songId: songId!, status: res.kind, payload: null });
      }
    }
    ask();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [songId, enabled]);

  // A different track than the one we hold answers is still loading.
  if (!songId) return { status: 'idle' as LyricsStatus, payload: null };
  if (state.songId !== songId) return { status: 'loading' as LyricsStatus, payload: null };
  return { status: state.status, payload: state.payload };
}
