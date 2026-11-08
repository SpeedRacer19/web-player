// The car stereo — this *is* the player. VFD display in the middle, the big
// volume knob on the left, play/pause (the first press is the tune-in gesture)
// on the right, an amber readout for who's on air, and the faceplate buttons:
//   SRC  → station directory     BAND → stream format     EQ → equalizer
//   REQ  → request a song (lit while the DJ is looking for it)
//   DISP → cycle illumination (cyan / amber, bright / dim)   MUTE → mute
//   ⏏    → eject: leave for the station's own player (its built-in skins)
// There is deliberately no seek / skip / next: it's one shared live stream.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Player } from '@/hooks/usePlayer';
import type { Equalizer } from '@/hooks/useEqualizer';
import { config } from '@/config';
import { useStationFeed } from '@/hooks/useStationFeed';
import { useStation } from '@/hooks/useStation';
import { useDirectory } from '@/hooks/useDirectory';
import { useRequest } from '@/hooks/useRequest';
import { listenerCount } from '@/lib/format';
import { formatLabel, type StreamFormat } from '@/lib/streamFormat';
import { Display } from '@/components/car/Display';
import { VolumeKnob } from '@/components/car/VolumeKnob';
import { BandMenu, EjectMenu, EqMenu, RequestMenu, StationMenu } from '@/components/car/Menus';

type Menu = 'src' | 'band' | 'eq' | 'req' | 'eject' | null;

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden>
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden className="animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Secondary amber readout: on-air DJ, show, listener count. One fixed line. */
function OnAirReadout() {
  const { nowPlaying } = useStationFeed();
  const show = nowPlaying?.activeShow ?? nowPlaying?.context?.activeShow ?? null;
  const dj = show?.persona?.name || nowPlaying?.dj?.name || 'AUTO DJ';
  const listeners = listenerCount(nowPlaying?.listeners);
  const guests = show?.guests?.map((g) => g.name).filter(Boolean) ?? [];

  const parts: { label: string; value: string }[] = [{ label: 'DJ', value: dj }];
  if (guests.length) parts.push({ label: 'W/', value: guests.join(', ') });
  if (show?.name) parts.push({ label: 'SHOW', value: show.name });

  return (
    <div className="vfd-strip mt-2 flex h-6 items-center gap-3 overflow-hidden whitespace-nowrap rounded px-2.5 text-[10px] uppercase leading-6 tracking-wider sm:text-[11px]">
      <span className="flex min-w-0 flex-1 gap-3 overflow-hidden">
        {parts.map((p) => (
          <span key={p.label} className="min-w-0 truncate">
            <span className="opacity-55">{p.label} </span>
            {p.value}
          </span>
        ))}
      </span>
      {listeners != null && (
        <span className="shrink-0">
          <span className="opacity-55">LSTN </span>
          {listeners}
        </span>
      )}
    </div>
  );
}

function EjectIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden className="mx-auto">
      <path d="M12 5 4 15h16z M4 17.5h16V20H4z" />
    </svg>
  );
}

function FaceButton({
  label,
  onClick,
  pressed,
  expanded,
  lit,
  title,
}: {
  label: React.ReactNode;
  onClick: () => void;
  pressed?: boolean;
  expanded?: boolean;
  /** Backlight on without being pressed (e.g. REQ while a request is out). */
  lit?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={expanded === undefined ? pressed : undefined}
      aria-expanded={expanded}
      title={title}
      aria-label={typeof label === 'string' ? undefined : title}
      data-on={pressed || expanded || lit ? 'true' : undefined}
      className="hu-btn h-8 min-w-0 flex-1 px-1 text-[10px] font-bold tracking-wider sm:h-7 sm:min-w-12 sm:flex-none sm:px-2 sm:text-[11px] sm:tracking-widest"
    >
      {label}
    </button>
  );
}

export function HeadUnit({
  player,
  eq,
  onDisp,
}: {
  player: Player;
  eq: Equalizer;
  /** Advance the illumination mode; returns the new mode's label. */
  onDisp: () => string;
}) {
  const { nowPlaying } = useStationFeed();
  const { stationUrl, setStation, defaultStationUrl } = useStation();
  const { playing, loading, tunedIn, volume, muted, toggle, setVolume, toggleMute } = player;

  const [menu, setMenu] = useState<Menu>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const directory = useDirectory(menu === 'src');
  // Owned here, not by the REQ menu, so a request keeps going if you close it.
  const request = useRequest();
  const requestBusy = request.state.phase === 'submitting' || request.state.phase === 'pending';

  // Guards against double-toggling mute across fast pointermove events.
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Escape closes a menu.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const show = useCallback((text: string) => {
    setFlash(text);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), 1400);
  }, []);

  // A request that finishes while the REQ menu is closed reports on the
  // display; with the menu open, the menu shows the outcome itself.
  const menuRef = useRef(menu);
  useEffect(() => {
    menuRef.current = menu;
  }, [menu]);
  const { phase: reqPhase, status: reqStatus } = request.state;
  useEffect(() => {
    if (reqPhase !== 'done' || menuRef.current === 'req') return;
    show(reqStatus === 'resolved' ? 'REQ QUEUED' : reqStatus === 'failed' ? 'REQ NOT FOUND' : 'REQ SENT');
  }, [reqPhase, reqStatus, show]);

  function onVolume(v: number) {
    // Turning the knob up un-mutes, like a real stereo.
    if (mutedRef.current && v > 0) {
      mutedRef.current = false;
      toggleMute();
    }
    setVolume(v);
    show(`VOL ${String(Math.round(v * 30)).padStart(2, '0')}`);
  }

  const toggleMenu = (m: Exclude<Menu, null>) => setMenu((cur) => (cur === m ? null : m));

  function pickStation(url: string) {
    setMenu(null);
    if (url.replace(/\/+$/, '') === stationUrl) return;
    setStation(url);
    // A pending request belongs to the old station; its id means nothing here.
    request.reset();
    // The new station may not serve the current optional mount; start on MP3.
    // Either call retunes in place if we were playing (this is a click, so
    // the browser still counts it as a user gesture).
    if (player.format !== 'mp3') player.setFormat('mp3');
    else player.retune();
    show('SEEK…');
  }

  function pickFormat(f: StreamFormat) {
    setMenu(null);
    player.setFormat(f);
    show(`BAND ${formatLabel(f)}`);
  }

  function pickEq(id: string) {
    eq.apply(id);
    const p = eq.presets.find((x) => x.id === id);
    setMenu(null);
    if (p) show(`EQ ${p.label}`);
  }

  const station = nowPlaying?.dj?.station || 'SUB/WAVE';

  const menuNode =
    menu === 'src' ? (
      <StationMenu
        stations={directory.stations}
        loading={directory.loading}
        current={stationUrl}
        currentName={station}
        home={defaultStationUrl}
        onSelect={pickStation}
        onClose={() => setMenu(null)}
      />
    ) : menu === 'band' ? (
      <BandMenu
        info={nowPlaying?.stream}
        current={player.format}
        onSelect={pickFormat}
        onClose={() => setMenu(null)}
      />
    ) : menu === 'req' ? (
      <RequestMenu
        request={request.state}
        onSubmit={request.submit}
        onReset={request.reset}
        onClose={() => setMenu(null)}
      />
    ) : menu === 'eject' ? (
      <EjectMenu stationName={station} stationUrl={stationUrl} onClose={() => setMenu(null)} />
    ) : menu === 'eq' ? (
      <EqMenu
        presets={eq.presets}
        current={eq.preset.id}
        onSelect={pickEq}
        onClose={() => setMenu(null)}
      />
    ) : null;

  return (
    <section
      aria-label="Car stereo"
      className="head-unit relative mx-auto w-full min-w-0 max-w-[920px] rounded-xl px-3 pb-3 pt-2 sm:px-5 sm:pb-4 sm:pt-3"
    >
      {/* Silkscreen */}
      <div className="mb-2 flex h-4 items-baseline justify-between gap-3 overflow-hidden whitespace-nowrap text-[10px] uppercase leading-4 tracking-[0.3em] text-[var(--chrome)]">
        <span className="min-w-0 truncate font-bold">{station}</span>
        <span className="min-w-0 truncate tracking-widest opacity-60">{hostOf(stationUrl)}</span>
      </div>

      {/* Equal side columns (the knob's width) keep the display centred. */}
      <div className="grid grid-cols-2 items-center gap-x-3 gap-y-3 sm:grid-cols-[116px_1fr_116px] sm:gap-x-4 lg:gap-x-5">
        <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <Display
            playing={playing}
            loading={loading}
            tunedIn={tunedIn}
            muted={muted}
            format={player.format}
            eqOn={eq.preset.id !== 'flat'}
            flash={flash}
            menu={menuNode}
          />
          <OnAirReadout />
        </div>

        <div className="flex flex-col items-center sm:col-start-1 sm:row-start-1">
          <VolumeKnob value={muted ? 0 : volume} onChange={onVolume} />
          <span className="-mt-1 text-[9px] uppercase tracking-[0.3em] text-[var(--chrome)]">Vol</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 sm:col-start-3 sm:row-start-1">
          <button
            type="button"
            onClick={toggle}
            className={`play-btn flex h-[72px] w-[72px] items-center justify-center sm:h-20 sm:w-20 ${!tunedIn && !playing ? 'beckon' : ''}`}
            aria-label={playing ? 'Pause' : tunedIn ? 'Play' : 'Tune in'}
          >
            {loading ? <Spinner /> : playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <span className="text-[9px] uppercase tracking-[0.3em] text-[var(--chrome)]">
            {playing ? 'Pause' : tunedIn ? 'Play' : 'Tune in'}
          </span>
        </div>
        {/* Faceplate buttons, centred under the screen (its grid column on
            wider screens). No skip, no seek — it's a shared live stream. */}
        <div className="col-span-2 flex min-w-0 gap-1 sm:col-span-1 sm:col-start-2 sm:row-start-2 sm:justify-center sm:gap-2">
          <FaceButton label="SRC" title="Source — choose a station" expanded={menu === 'src'} onClick={() => toggleMenu('src')} />
          <FaceButton label="BAND" title="Band — stream format" expanded={menu === 'band'} onClick={() => toggleMenu('band')} />
          <FaceButton label="EQ" title="Equalizer presets" expanded={menu === 'eq'} onClick={() => toggleMenu('eq')} />
          <FaceButton
            label="REQ"
            title={requestBusy ? 'Request — the DJ is looking for your song' : 'Request a song'}
            expanded={menu === 'req'}
            lit={requestBusy}
            onClick={() => toggleMenu('req')}
          />
          <FaceButton label="DISP" title="Display illumination" onClick={() => show(onDisp())} />
          <FaceButton
            label="MUTE"
            title={muted ? 'Unmute' : 'Mute'}
            pressed={muted}
            onClick={() => {
              mutedRef.current = !muted;
              toggleMute();
              show(muted ? 'MUTE OFF' : 'MUTE');
            }}
          />
          <FaceButton
            label={<EjectIcon />}
            title="Eject — open this station's own player and its built-in skins"
            expanded={menu === 'eject'}
            onClick={() => toggleMenu('eject')}
          />
        </div>

        {/* Model number, silkscreened bottom-left: this build's version. */}
        <div className="col-span-2 self-end text-[9px] leading-3 tracking-[0.3em] text-[var(--chrome)] opacity-60 sm:col-span-1 sm:col-start-1 sm:row-start-2 sm:pb-1">
          v{config.version}
        </div>
      </div>
    </section>
  );
}
