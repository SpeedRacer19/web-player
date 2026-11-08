// Composition root. The layout lives here; every piece of data comes from the
// hooks. This skin is a car interior: the windshield scene fills the top, the
// dashboard (with the head-unit player) runs along the bottom.

import { StationFeedProvider, useStationFeed } from '@/hooks/useStationFeed';
import { usePlayer } from '@/hooks/usePlayer';
import { useMediaSession } from '@/hooks/useMediaSession';
import { useEqualizer } from '@/hooks/useEqualizer';
import { Windshield } from '@/components/car/Windshield';
import { Dashboard } from '@/components/car/Dashboard';

function PlayerView() {
  const player = usePlayer();
  // Lives next to the player: its audio graph attaches to the <audio> element
  // once and must outlive any re-render of the head unit.
  const eq = useEqualizer(player.getAudioElement);
  const { nowPlaying, heardTrack: track } = useStationFeed();

  useMediaSession(track, nowPlaying?.dj?.station, player.playing, {
    onPlay: player.tuneIn,
    onPause: player.toggle,
  });

  return (
    <main className="flex min-h-dvh flex-col bg-[var(--cabin)]">
      <Windshield />
      <Dashboard player={player} eq={eq} />
    </main>
  );
}

export default function App() {
  return (
    <StationFeedProvider>
      <PlayerView />
    </StationFeedProvider>
  );
}
