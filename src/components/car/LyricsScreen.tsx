// The lyrics screen fitted inside the glovebox. Same VFD glass as the head
// unit's display (the `.lcd` styles), so it follows DISP — cyan / amber,
// bright / dim — with everything else. Reads the current track from the feed
// and its lyrics from useLyrics, fetched only while the screen is showing.
//
// Synced lyrics follow the song. Listener time = now − track start (live edge)
// − the stream buffer, plus the station's per-track offset — the same
// correction the official players use.

import { useEffect, useRef, useState } from 'react';
import { useStationFeed } from '@/hooks/useStationFeed';
import { useLyrics, type LyricsStatus } from '@/hooks/useLyrics';
import type { LyricLine } from '@/lib/types';

const MESSAGES: Record<Exclude<LyricsStatus, 'ready'>, string> = {
  idle: 'NOTHING ON AIR',
  loading: 'LOADING LYRICS…',
  unavailable: 'NO ANSWER — RETRYING…',
  disabled: 'LYRICS OFF AT THIS STATION',
  gone: 'TRACK HAS MOVED ON',
  locked: 'LYRICS NEED A STATION LOGIN',
};

/** Index of the line being heard, or -1 before the first timed line. */
function activeLine(lines: LyricLine[], ms: number) {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].startMs;
    if (s != null && s <= ms) idx = i;
  }
  return idx;
}

/** Listener-time position in the track (ms), ticking 4×/s while `on`. */
function useListenerClock(startUnix: number | undefined, bufferSec: number, on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [on]);
  if (!startUnix) return null;
  return now - startUnix * 1000 - bufferSec * 1000;
}

export function LyricsScreen({ onClose, className = '' }: { onClose: () => void; className?: string }) {
  const { nowPlaying, heardTrack: track } = useStationFeed();
  const { status, payload } = useLyrics(track?.subsonic_id, true);
  const lines = payload?.lines ?? [];
  const synced = !!payload?.synced && lines.some((l) => l.startMs != null);
  const pos = useListenerClock(track?.timestamp, nowPlaying?.stream?.bufferSeconds ?? 0, synced);
  const current = synced && pos != null ? activeLine(lines, pos + (payload?.offsetMs ?? 0)) : -1;

  // Keep the current line centred (scroll the screen, never the page).
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>('[data-now]');
    if (!box || !el) return;
    box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [current]);

  let body;
  if (status === 'ready' && lines.length > 0) {
    body = lines.map((l, i) => (
      <p
        key={i}
        data-now={i === current ? '' : undefined}
        className={`lyric-line px-1.5 py-[3px] ${synced ? (i === current ? 'now' : i < current ? 'past' : 'next') : ''}`}
      >
        {l.text || ' '}
      </p>
    ));
  } else {
    const msg =
      status === 'ready'
        ? payload?.pending
          ? 'LOOKING UP LYRICS…'
          : 'NO LYRICS FOR THIS TRACK'
        : MESSAGES[status];
    body = (
      <p className={`flex h-full items-center justify-center text-center tracking-[0.2em] ${status === 'loading' || payload?.pending ? 'blink' : ''}`}>
        {msg}
      </p>
    );
  }

  return (
    <section aria-label="Lyrics" className={`lcd flex flex-col rounded-md ${className}`}>
      <header className="flex h-7 shrink-0 items-center gap-2 border-b border-[color-mix(in_srgb,var(--lcd-fg)_25%,transparent)] px-2.5 text-[10px] tracking-widest">
        <span className="font-bold">LYRICS</span>
        <span className={synced ? '' : 'lcd-dim'}>SYNC</span>
        <span className="min-w-0 flex-1 truncate opacity-60">{track?.title?.toUpperCase()}</span>
        <button type="button" onClick={onClose} className="shrink-0 px-1" aria-label="Close the glovebox">
          ✕
        </button>
      </header>
      <div ref={scroller} className="lcd-scroll relative min-h-0 flex-1 overflow-y-auto px-1.5 py-2 text-xs leading-5">
        {body}
      </div>
    </section>
  );
}
