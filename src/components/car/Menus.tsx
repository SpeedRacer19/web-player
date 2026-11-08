// The on-screen menus behind the faceplate buttons, rendered inside the VFD:
//   SRC  — the public SUB/WAVE station directory; pick one to retune.
//   BAND — the stream format (MP3 / AAC / Opus / FLAC), as the station serves
//          and this browser decodes them (same rules as the official players).
//   EQ   — three-band equalizer presets (Web Audio, see useEqualizer).
//   REQ  — request a song (useRequest); the DJ matches it against the library.

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { DirectoryStation, StreamInfo } from '@/lib/types';
import {
  FORMAT_OPTIONS,
  browserSupports,
  stationServes,
  type StreamFormat,
} from '@/lib/streamFormat';
import type { EqPreset } from '@/hooks/useEqualizer';
import type { RequestState } from '@/hooks/useRequest';

const sameStation = (a: string, b: string) =>
  a.replace(/\/+$/, '').toLowerCase() === b.replace(/\/+$/, '').toLowerCase();

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function MenuFrame({
  title,
  hint,
  onClose,
  plain,
  children,
}: {
  title: string;
  hint?: string;
  onClose: () => void;
  /** Render the body as-is instead of as a list of rows (forms, messages). */
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1.5 flex h-4 items-center gap-3 text-[10px] leading-4 tracking-widest sm:text-[11px]">
        <span className="shrink-0 whitespace-nowrap font-bold">{title}</span>
        {hint && <span className="truncate opacity-55">{hint}</span>}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto shrink-0 whitespace-nowrap px-1 hover:opacity-100"
          aria-label="Close menu"
        >
          ✕ EXIT
        </button>
      </div>
      {plain ? (
        <div className="min-h-0 flex-1">{children}</div>
      ) : (
        <ul className="lcd-scroll min-h-0 flex-1 overflow-y-auto pr-1">{children}</ul>
      )}
    </div>
  );
}

function Row({
  active,
  disabled,
  onClick,
  primary,
  secondary,
  aside,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  primary: string;
  secondary?: string;
  aside?: ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-current={active || undefined}
        className={`lcd-row flex w-full items-center gap-2 px-1.5 py-1 text-left ${active ? 'active' : ''} ${disabled ? 'opacity-35' : ''}`}
      >
        <span className="w-3 shrink-0 text-center">{active ? '▶' : ''}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold uppercase leading-4 tracking-wider sm:text-sm sm:leading-5">
            {primary}
          </span>
          {secondary && (
            <span className="block truncate text-[10px] leading-4 opacity-60 sm:text-[11px]">
              {secondary}
            </span>
          )}
        </span>
        {aside}
      </button>
    </li>
  );
}

export function StationMenu({
  stations,
  loading,
  current,
  currentName,
  home,
  onSelect,
  onClose,
}: {
  stations: DirectoryStation[];
  loading: boolean;
  current: string;
  currentName: string;
  /** The station this build points at (VITE_STATION_URL) — always reachable. */
  home: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  // Self-hosted stations that aren't in the directory still show, pinned on
  // top: the one playing now, and the build's home station.
  const listed = (url: string) => stations.some((s) => sameStation(s.url, url));
  const isHome = sameStation(current, home);
  return (
    <MenuFrame
      title="SRC · STATIONS"
      hint={loading ? 'SCANNING…' : `${stations.length || 1} FOUND`}
      onClose={onClose}
    >
      {!listed(current) && (
        <Row
          active
          primary={currentName}
          secondary={`${isHome ? 'home · ' : ''}${hostOf(current)}`}
        />
      )}
      {!isHome && !listed(home) && (
        <Row onClick={() => onSelect(home)} primary={hostOf(home)} secondary="home station" />
      )}
      {stations.map((s) => (
        <Row
          key={s.slug || s.url}
          active={sameStation(s.url, current)}
          onClick={() => onSelect(s.url)}
          primary={s.name}
          secondary={[s.genre, s.location || s.country].filter(Boolean).join(' · ') || hostOf(s.url)}
        />
      ))}
    </MenuFrame>
  );
}

export function BandMenu({
  info,
  current,
  onSelect,
  onClose,
}: {
  info: StreamInfo | null | undefined;
  current: StreamFormat;
  onSelect: (f: StreamFormat) => void;
  onClose: () => void;
}) {
  return (
    <MenuFrame title="BAND · STREAM" hint="SAME BROADCAST, DIFFERENT ENCODING" onClose={onClose}>
      {FORMAT_OPTIONS.map((o) => {
        const served = stationServes(info, o.format);
        const decodes = browserSupports(o.format);
        const ok = served && decodes;
        const label =
          o.format === 'mp3' && info?.bitrate ? `${o.label} ${info.bitrate}K` : o.label;
        return (
          <Row
            key={o.format}
            active={o.format === current}
            disabled={!ok}
            onClick={() => onSelect(o.format)}
            primary={label}
            secondary={!served ? 'not served by this station' : !decodes ? 'not playable in this browser' : o.detail}
          />
        );
      })}
    </MenuFrame>
  );
}

/** Tiny 3-bar graphic of a preset's bass / mid / treble gains. */
export function EqBars({ preset }: { preset: EqPreset }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[preset.bass, preset.mid, preset.treble].map((db, i) => (
        <span
          key={i}
          className="w-[5px] bg-[var(--lcd-fg)]"
          style={{ height: `${Math.round(((db + 8) / 16) * 100)}%` }}
        />
      ))}
    </span>
  );
}

export function EqMenu({
  presets,
  current,
  onSelect,
  onClose,
}: {
  presets: readonly EqPreset[];
  current: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const fmt = (db: number) => (db > 0 ? `+${db}` : String(db));
  return (
    <MenuFrame title="EQ · PRESETS" hint="BASS · MID · TREBLE" onClose={onClose}>
      {presets.map((p) => (
        <Row
          key={p.id}
          active={p.id === current}
          onClick={() => onSelect(p.id)}
          primary={p.label}
          secondary={`B ${fmt(p.bass)}  M ${fmt(p.mid)}  T ${fmt(p.treble)} dB`}
          aside={<EqBars preset={p} />}
        />
      ))}
    </MenuFrame>
  );
}

/** The station's own web player lives at /listen on every SUB/WAVE install. */
function stationPlayerUrl(stationUrl: string) {
  return `${stationUrl.replace(/\/+$/, '')}/listen`;
}

/** EJECT: leave the car for the station's own player, where every built-in
 *  SUB/WAVE skin lives. Skins are picked there (its Themes menu) — the choice
 *  is stored on the station's site, so it can't be pre-selected from here. */
export function EjectMenu({
  stationName,
  stationUrl,
  onClose,
}: {
  stationName: string;
  stationUrl: string;
  onClose: () => void;
}) {
  return (
    <MenuFrame title="⏏ EJECT" hint="LEAVE THE CAR" onClose={onClose}>
      <Row
        onClick={() => window.location.assign(stationPlayerUrl(stationUrl))}
        primary={`Open the ${stationName} player`}
        secondary="its built-in skins: Classic, Unit, Platter, Drift…"
        aside={<span className="text-xs">↗</span>}
      />
      <Row onClick={onClose} primary="Stay in the car" secondary="back to the road" />
    </MenuFrame>
  );
}

const NAME_KEY = 'subwave.car.reqname.v1';

function loadName() {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

/** REQ: ask the DJ for a song. The request itself lives in the head unit
 *  (useRequest there), so it keeps going if this menu closes; this screen just
 *  shows where it's at. */
export function RequestMenu({
  request,
  onSubmit,
  onReset,
  onClose,
}: {
  request: RequestState;
  onSubmit: (text: string, name: string) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [name, setName] = useState(loadName);
  const input = useRef<HTMLInputElement>(null);
  const { phase, status, result, error } = request;
  const busy = phase === 'submitting' || phase === 'pending';

  // Ready to type as soon as the menu opens (and after "request another").
  useEffect(() => {
    if (phase === 'idle') input.current?.focus();
  }, [phase]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || !text.trim()) return;
    try {
      localStorage.setItem(NAME_KEY, name.trim());
    } catch {
      /* private mode: the name just won't be remembered */
    }
    onSubmit(text, name);
  }

  const field =
    'h-6 min-w-0 rounded-[2px] border border-[color-mix(in_srgb,var(--lcd-fg)_40%,transparent)] bg-transparent px-1.5 text-xs uppercase tracking-wider text-[var(--lcd-fg)] outline-none placeholder:text-[var(--lcd-dim)] focus:border-[var(--lcd-fg)] sm:h-7 sm:text-sm';
  const action = 'lcd-row px-2 text-[10px] font-bold uppercase tracking-widest sm:text-[11px]';

  let body: ReactNode;
  if (phase === 'idle') {
    body = (
      <form onSubmit={submit} className="flex h-full flex-col justify-center gap-1.5 sm:gap-2">
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Song, artist or a vibe"
          aria-label="What should the DJ play?"
          maxLength={200}
          enterKeyHint="send"
          className={`${field} w-full`}
        />
        <div className="flex gap-1.5 sm:gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            aria-label="Your name (optional)"
            maxLength={40}
            className={`${field} flex-1`}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            // Inline: .lcd-row (unlayered CSS) would beat a Tailwind border class.
            style={{ borderColor: 'color-mix(in srgb, var(--lcd-fg) 45%, transparent)' }}
            className={`${action} h-6 shrink-0 disabled:opacity-35 sm:h-7`}
          >
            ▶ Send
          </button>
        </div>
      </form>
    );
  } else if (busy) {
    body = (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center" role="status">
        <div className="blink text-base tracking-[0.25em] sm:text-lg">SEARCHING…</div>
        {text.trim() && (
          <div className="max-w-full truncate text-[11px] uppercase tracking-wider opacity-60">
            “{text.trim()}”
          </div>
        )}
      </div>
    );
  } else {
    const track = result?.track;
    const reply = result?.reply || result?.message;
    const [headline, detail] =
      status === 'resolved'
        ? ['✓ QUEUED', track ? [track.title, track.artist].filter(Boolean).join(' — ') : '']
        : status === 'failed'
          ? error === 'network'
            ? ['NO SIGNAL', 'couldn’t reach the station']
            : ['NOT FOUND', 'not in this station’s library']
          : ['STILL WORKING', 'it may turn up on air shortly'];
    body = (
      <div className="flex h-full flex-col justify-center gap-0.5" role="status">
        <div className="text-base font-bold tracking-[0.25em] sm:text-lg">{headline}</div>
        {detail && <div className="truncate text-xs uppercase tracking-wider sm:text-sm">{detail}</div>}
        {reply && status !== 'failed' && (
          <div className="truncate text-[11px] italic opacity-60 sm:text-xs">“{reply}”</div>
        )}
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => {
              // Keep a miss in the box to tweak; clear it after a hit.
              if (status === 'resolved') setText('');
              onReset();
            }}
            className={`${action} h-6`}
          >
            {status === 'resolved' ? 'Request another' : 'Try another'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <MenuFrame title="REQ · SONG" hint="PLAYS FOR EVERYONE" onClose={onClose} plain>
      {body}
    </MenuFrame>
  );
}
