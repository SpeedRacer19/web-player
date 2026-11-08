// What the listener will hear next, in order. Like the current song, this has
// to account for the stream buffer: /now-playing and /state describe the LIVE
// edge, ~20s ahead of the speakers. Right after a track change the live track
// is one the listener hasn't heard yet, so it leads the list, followed by
// /state's `upcoming` (usually a single track: the station paces itself).

import { useStationFeed } from '@/hooks/useStationFeed';
import type { NowPlayingTrack, QueueEntry } from '@/lib/types';

const keyOf = (t: QueueEntry | NowPlayingTrack | null | undefined) =>
  t ? t.subsonic_id || `${t.title ?? ''}|${t.artist ?? ''}` : null;

export function useUpNext(limit = 3): QueueEntry[] {
  const { nowPlaying, state, heardTrack } = useStationFeed();
  const heard = keyOf(heardTrack);
  const seen = new Set<string>(heard ? [heard] : []);
  const list: QueueEntry[] = [];
  const add = (e: QueueEntry) => {
    const k = keyOf(e);
    if (!k || seen.has(k) || (!e.title && !e.artist)) return;
    seen.add(k);
    list.push(e);
  };

  const live = nowPlaying?.nowPlaying;
  if (live) add({ title: live.title, artist: live.artist, album: live.album, subsonic_id: live.subsonic_id });
  for (const e of state?.upcoming ?? []) add(e);
  return list.slice(0, limit);
}
