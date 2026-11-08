// The on-screen menus behind the faceplate buttons, rendered inside the VFD:
//   SRC  — the public SUB/WAVE station directory; pick one to retune.
//   BAND — the stream format (MP3 / AAC / Opus / FLAC), as the station serves
//          and this browser decodes them (same rules as the official players).
//   EQ   — three-band equalizer presets (Web Audio, see useEqualizer).

import type { ReactNode } from 'react';
import type { DirectoryStation, StreamInfo } from '@/lib/types';
import {
  FORMAT_OPTIONS,
  browserSupports,
  stationServes,
  type StreamFormat,
} from '@/lib/streamFormat';
import type { EqPreset } from '@/hooks/useEqualizer';

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
  children,
}: {
  title: string;
  hint?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1.5 flex h-4 items-center gap-3 text-[10px] leading-4 tracking-widest sm:text-[11px]">
        <span className="font-bold">{title}</span>
        {hint && <span className="truncate opacity-55">{hint}</span>}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto px-1 hover:opacity-100"
          aria-label="Close menu"
        >
          ✕ EXIT
        </button>
      </div>
      <ul className="lcd-scroll min-h-0 flex-1 overflow-y-auto pr-1">{children}</ul>
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
