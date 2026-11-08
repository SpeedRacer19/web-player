// The head unit's main screen, in a cyan VFD style: status row, cover art,
// title/artist, the acoustic-tag strip (genre · BPM · key · mood — all
// optional), what's up next (a column on wide screens, one line in place of
// the album on mid-size ones, e.g. 1280px laptops), and a read-only segmented
// track clock. Reads the shared feed;
// takes playback state as props from the head unit.
//
// Every row has a fixed height and a fixed line count, so a track change can
// never resize the unit. A menu (SRC / BAND / EQ) takes over the whole screen.

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useStationFeed } from '@/hooks/useStationFeed';
import { useElapsed } from '@/hooks/useElapsed';
import { useUpNext } from '@/hooks/useUpNext';
import { coverUrl } from '@/lib/stationClient';
import { clock, gradientFor } from '@/lib/format';
import { formatLabel, type StreamFormat } from '@/lib/streamFormat';
import type { NowPlayingTrack } from '@/lib/types';

const SEGMENTS = 28;

function tagStrip(t: NowPlayingTrack) {
  const tags: string[] = [];
  // Genre often arrives comma-joined ("Pop, Pop Soul, R&B…"); keep the first two.
  if (t.genre) tags.push(...t.genre.split(',').map((g) => g.trim()).filter(Boolean).slice(0, 2));
  if (typeof t.bpm === 'number') tags.push(`${Math.round(t.bpm)} BPM`);
  if (t.musicalKey) tags.push(t.musicalKey);
  if (t.energy) tags.push(`${t.energy} NRG`);
  for (const m of t.moods ?? []) tags.push(m);
  return tags.slice(0, 6);
}

/** Text that scrolls like a VFD marquee, but only when it doesn't fit. */
function Marquee({ text, className = '' }: { text: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      if (box.current && probe.current) {
        setOverflow(probe.current.scrollWidth > box.current.clientWidth + 1);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div ref={box} className={`relative overflow-hidden whitespace-nowrap ${className}`}>
      {/* Invisible probe measures the natural width of the text. */}
      <span ref={probe} className="invisible absolute">
        {text}
      </span>
      {overflow ? (
        <span className="marquee">
          <span>{text}</span>
          <span aria-hidden>{text}</span>
        </span>
      ) : (
        <span>{text || ' '}</span>
      )}
    </div>
  );
}

function Cover({ track, trackKey }: { track: NowPlayingTrack | null; trackKey?: string }) {
  const src = track?.subsonic_id ? coverUrl(track.subsonic_id) : null;
  const [broken, setBroken] = useState<string | null>(null);
  return (
    <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black sm:h-[104px] sm:w-[104px]">
      {src && broken !== src ? (
        <img
          src={src}
          alt={track?.album || track?.title || 'cover'}
          className="lcd-cover h-full w-full object-cover"
          onError={() => setBroken(src)}
        />
      ) : (
        <div className="h-full w-full opacity-70" style={{ background: gradientFor(trackKey) }} />
      )}
      <div className="lcd-cover-tint pointer-events-none absolute inset-0" />
    </div>
  );
}

/** The next track or two, in a column on the right of the screen. Only shown
 *  once the screen is wide enough (a container query on the body), so phones
 *  keep the full-width now-playing view. */
function UpNext() {
  const next = useUpNext(2);
  return (
    <div className="hidden w-[36%] max-w-[240px] shrink-0 flex-col justify-center border-l border-[color-mix(in_srgb,var(--lcd-fg)_25%,transparent)] pl-3 @min-[420px]:flex sm:pl-4">
      <div className="mb-1 h-4 text-[10px] leading-4 tracking-[0.25em] opacity-55 sm:text-[11px]">NEXT ▸</div>
      {next.length === 0 ? (
        <div className="text-[11px] uppercase tracking-wider opacity-55">DJ’s choice</div>
      ) : (
        next.map((e, i) => (
          <div key={`${e.subsonic_id ?? e.title}-${i}`} className={`min-w-0 ${i ? 'mt-1.5 opacity-55' : ''}`}>
            <div className="truncate text-xs font-bold uppercase leading-4 tracking-wider sm:text-[13px] sm:leading-5">
              {e.title || 'Unknown track'}
            </div>
            <div className="truncate text-[11px] leading-4 opacity-80">
              {e.artist}
              {e.requestedBy && <span className="opacity-80">{e.artist ? ' · ' : ''}♥ {e.requestedBy}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Indicator({ on, children, blink }: { on: boolean; children: string; blink?: boolean }) {
  return <span className={on ? (blink ? 'blink' : '') : 'lcd-dim'}>{children}</span>;
}

export interface DisplayProps {
  playing: boolean;
  loading: boolean;
  tunedIn: boolean;
  muted: boolean;
  format: StreamFormat;
  eqOn: boolean;
  /** Momentary message that takes over the body (VOL 18, EQ BASS…). */
  flash: string | null;
  /** A menu that takes over the whole screen (SRC / BAND / EQ). */
  menu: ReactNode | null;
}

export function Display({
  playing,
  loading,
  tunedIn,
  muted,
  format,
  eqOn,
  flash,
  menu,
}: DisplayProps) {
  // The song coming out of the speakers, not the live edge ~20s ahead of it.
  const { nowPlaying, ready, online, heardTrack: track } = useStationFeed();
  const key = track?.subsonic_id ?? track?.title;
  const elapsed = useElapsed(key, playing);
  const duration = track?.duration ?? 0;
  const frac = duration > 0 ? Math.min(1, elapsed / duration) : 0;
  const lit = Math.round(frac * SEGMENTS);
  const bitrate = nowPlaying?.stream?.bitrate ?? nowPlaying?.streamBitrate;
  const tags = track ? tagStrip(track) : [];
  const offAir = ready && !track;
  const [next] = useUpNext(1);
  const fmt = format === 'mp3' ? (bitrate ? `${bitrate}K` : 'MP3') : formatLabel(format);

  let body: ReactNode;
  if (!ready) {
    body = (
      <div className="blink flex h-full items-center justify-center text-lg tracking-[0.3em]">
        TUNING…
      </div>
    );
  } else if (offAir) {
    body = (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <div className="text-lg tracking-[0.3em]">NO SIGNAL</div>
        <div className="text-xs tracking-widest opacity-70">STATION OFF AIR</div>
      </div>
    );
  } else {
    const sub = [track?.album, track?.year].filter(Boolean).join(' · ');
    body = (
      <div className="flex h-full min-w-0 gap-3 sm:gap-4">
        <Cover track={track} trackKey={key} />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <Marquee
            text={(track?.title || 'Unknown track').toUpperCase()}
            className="h-6 text-base font-bold leading-6 tracking-wider sm:h-7 sm:text-xl sm:leading-7"
          />
          <Marquee
            text={track?.artist || 'Unknown artist'}
            className="h-5 text-sm leading-5 opacity-90 sm:h-6 sm:text-base sm:leading-6"
          />
          {/* Mid-size screens (no room for the NEXT column, more than a
              phone): the album line becomes a one-line "up next". */}
          <div className={next ? 'block @min-[340px]:hidden @min-[420px]:block' : ''}>
            <Marquee text={sub} className="h-4 text-[11px] leading-4 opacity-55 sm:text-xs" />
          </div>
          {next && (
            <div className="hidden h-4 gap-1.5 text-[11px] leading-4 sm:text-xs @min-[340px]:flex @min-[420px]:hidden">
              <span className="shrink-0 opacity-55">NEXT ▸</span>
              <Marquee
                text={`${(next.title || 'Unknown track').toUpperCase()}${next.artist ? ` — ${next.artist}` : ''}${next.requestedBy ? ` · ♥ ${next.requestedBy}` : ''}`}
                className="min-w-0 flex-1 opacity-80"
              />
            </div>
          )}
          {/* One row only: chips that don't fit wrap out of sight. */}
          <div className="mt-1.5 flex h-4 flex-wrap gap-1 overflow-hidden sm:mt-2">
            {tags.map((t) => (
              <span
                key={t}
                className="h-4 whitespace-nowrap border border-[color-mix(in_srgb,var(--lcd-fg)_45%,transparent)] px-1 text-[10px] uppercase leading-[14px] tracking-wider sm:text-[11px]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <UpNext />
      </div>
    );
  }

  return (
    <div className="lcd rounded-md px-3 py-2 sm:px-4 sm:py-3">
      {/* Status row */}
      <div className="mb-2 flex h-4 items-center gap-3 overflow-hidden whitespace-nowrap text-[10px] leading-4 tracking-widest sm:text-[11px]">
        <Indicator on={playing} blink={loading}>
          ● LIVE
        </Indicator>
        <Indicator on={playing}>ST</Indicator>
        <span className={bitrate || format !== 'mp3' ? '' : 'lcd-dim'}>{fmt}</span>
        <Indicator on={eqOn}>EQ</Indicator>
        <Indicator on={muted}>MUTE</Indicator>
        <span className="ml-auto">
          {ready && !online ? (
            <span className="blink">RECONNECTING</span>
          ) : (
            <span className={online ? '' : 'lcd-dim'}>RX</span>
          )}
        </span>
      </div>

      {/* Body (or a momentary flash message over it) */}
      <div className="@container relative h-[84px] sm:h-[112px]">
        {body}
        {flash && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--lcd-bg)] text-center text-xl font-bold tracking-[0.25em] sm:text-2xl">
            {flash}
          </div>
        )}
      </div>

      {/* Track clock — read-only: this is live radio, no seeking. */}
      <div className="mt-2 flex h-4 items-center gap-2 text-[11px] leading-4 tabular-nums tracking-wider sm:text-xs">
        {!tunedIn && !playing ? (
          <span className="blink flex-1 text-center tracking-[0.2em]">PRESS ▶ TO TUNE IN</span>
        ) : (
          <>
            <span>{clock(elapsed)}</span>
            <div className="flex flex-1 gap-[2px]" aria-hidden>
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 flex-1 ${i < lit ? 'bg-[var(--lcd-fg)] shadow-[0_0_4px_var(--lcd-fg)]' : 'bg-[var(--lcd-dim)] opacity-50'}`}
                />
              ))}
            </div>
            <span>{duration > 0 ? clock(duration) : 'LIVE'}</span>
          </>
        )}
      </div>

      {menu && (
        <div className="absolute inset-0 z-10 bg-[var(--lcd-bg)] px-3 py-2 sm:px-4 sm:py-3">{menu}</div>
      )}
    </div>
  );
}
