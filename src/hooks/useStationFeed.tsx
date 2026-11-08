// The single live-data heartbeat. One interval polls /now-playing and /state
// together (plus /session, if asked) and shares the result through context, so
// every component reads the same snapshot instead of each opening its own poll
// loop.
//
// Behaviour that matters:
//  - /session (the Booth chat log) is opt-in: <StationFeedProvider withSession>.
//    Without it `session` stays null, and every listener makes one request
//    fewer every 5s. Turn it on only if your skin shows the booth.
//  - Polls every config.pollIntervalMs, immediately on mount.
//  - Pauses while the tab is hidden (a backgrounded tab shouldn't poll) and
//    refetches the moment it becomes visible again.
//  - On a failed fetch it keeps the last good snapshot and flips `online`
//    false — the UI degrades to "reconnecting", never blanks.
//  - On a station switch (useStation) it drops the old snapshot and starts a
//    fresh loop; late answers from the old station are discarded.
//  - `heardTrack` is the track the listener is actually HEARING. The API
//    reports the live edge, but Icecast plays every listener
//    `stream.bufferSeconds` behind it (~20s), so a new song shows up in
//    /now-playing well before it comes out of the speakers. heardTrack holds
//    the previous track until `timestamp + bufferSeconds`, then switches.
//    Anything that renders "the current song" should read this, not
//    nowPlaying.nowPlaying.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { config, nameStation } from '@/config';
import { useStation } from '@/hooks/useStation';
import { fetchNowPlaying, fetchSession, fetchState } from '@/lib/stationClient';
import type {
  NowPlayingResponse,
  NowPlayingTrack,
  SessionPayload,
  StationState,
} from '@/lib/types';

export interface StationFeed {
  nowPlaying: NowPlayingResponse | null;
  state: StationState | null;
  session: SessionPayload | null;
  /** True once at least one poll has completed. */
  ready: boolean;
  /** True while the most recent poll succeeded. */
  online: boolean;
  /** Round-trip time of the last successful poll (all reads), in ms. */
  latencyMs: number | null;
  /** The track the listener is hearing right now — nowPlaying.nowPlaying,
   *  delayed by the stream buffer. Use this to render the current song. */
  heardTrack: NowPlayingTrack | null;
}

const EMPTY: StationFeed = {
  nowPlaying: null,
  state: null,
  session: null,
  ready: false,
  online: false,
  latencyMs: null,
  heardTrack: null,
};

const trackKey = (t: NowPlayingTrack | null | undefined) =>
  t ? t.subsonic_id || `${t.title ?? ''}\u0000${t.artist ?? ''}` : null;

const FeedContext = createContext<StationFeed>(EMPTY);

/** What a poll produces; heardTrack is derived from it in the provider. */
type Snapshot = Omit<StationFeed, 'heardTrack'>;

export function StationFeedProvider({
  children,
  withSession = false,
}: {
  children: ReactNode;
  /** Also poll /session (the Booth chat log) into `session`. Off by default. */
  withSession?: boolean;
}) {
  const [feed, setFeed] = useState<Snapshot>(EMPTY);
  // Keep the latest snapshot in a ref so a failed poll can preserve it without
  // adding `feed` to the effect deps (which would restart the interval).
  const latest = useRef<Snapshot>(EMPTY);
  const { stationUrl } = useStation();

  useEffect(() => {
    let cancelled = false;
    // New station (or first mount): start from "not ready", not stale data.
    if (latest.current !== EMPTY) {
      latest.current = EMPTY;
      setFeed(EMPTY);
    }
    let timer: ReturnType<typeof setInterval> | undefined;

    async function poll() {
      const t0 = performance.now();
      try {
        const [nowPlaying, state, session] = await Promise.all([
          fetchNowPlaying(),
          fetchState(),
          withSession ? fetchSession() : Promise.resolve(null),
        ]);
        if (cancelled) return;
        // A typed / shared station gets its real name in the recent list.
        if (nowPlaying?.dj?.station) nameStation(stationUrl, nowPlaying.dj.station);
        const next: Snapshot = {
          nowPlaying,
          state,
          session,
          ready: true,
          online: true,
          latencyMs: Math.round(performance.now() - t0),
        };
        latest.current = next;
        setFeed(next);
      } catch {
        if (cancelled) return;
        const next = { ...latest.current, ready: true, online: false };
        latest.current = next;
        setFeed(next);
      }
    }

    function start() {
      poll();
      timer = setInterval(poll, config.pollIntervalMs);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = undefined;
    }

    function onVisibility() {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    }

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [stationUrl, withSession]);

  // Hold the previous track until the new one reaches the listener's ears.
  const [heardTrack, setHeardTrack] = useState<NowPlayingTrack | null>(null);
  const heardKey = useRef<string | null>(null);
  useEffect(() => {
    const live = feed.nowPlaying?.nowPlaying ?? null;
    const show = (t: NowPlayingTrack | null) => {
      heardKey.current = trackKey(t);
      setHeardTrack(t);
    };
    // Same song (fresh tags/fields), nothing heard yet, or off air: no delay.
    if (!live || heardKey.current === null || heardKey.current === trackKey(live)) {
      show(live);
      return;
    }
    const buffer = feed.nowPlaying?.stream?.bufferSeconds ?? 0;
    const wait = live.timestamp ? (live.timestamp + buffer) * 1000 - Date.now() : 0;
    if (wait <= 0) {
      show(live);
      return;
    }
    const timer = window.setTimeout(() => show(live), wait);
    return () => window.clearTimeout(timer);
  }, [feed.nowPlaying]);

  // Before the effect's first run (the poll just landed) fall back to live.
  const value = { ...feed, heardTrack: heardTrack ?? feed.nowPlaying?.nowPlaying ?? null };
  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

/** Read the shared live station snapshot. */
// The provider and its hook live together on purpose (one import for the
// whole feed). Editing this file just does a full reload instead of a fast
// refresh, which is fine for a data-layer module.
// eslint-disable-next-line react-refresh/only-export-components
export function useStationFeed(): StationFeed {
  return useContext(FeedContext);
}
