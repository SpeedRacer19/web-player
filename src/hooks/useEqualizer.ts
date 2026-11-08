// A three-band equalizer (bass / mid / treble) on the player's <audio>
// element via Web Audio. The element is already crossOrigin="anonymous" and
// the Icecast mounts send Access-Control-Allow-Origin: *, so the samples are
// readable.
//
// The audio graph is built lazily, the first time a non-flat preset is picked
// (that pick is a click, so the AudioContext starts unlocked). Until then the
// element plays straight to the speakers — listeners who never touch EQ keep
// plain <audio> behaviour, including background playback on mobile.
// createMediaElementSource is one-way: once routed, the element stays routed
// for the page's lifetime, and FLAT just zeroes the gains.

import { useEffect, useRef, useState } from 'react';

export interface EqPreset {
  id: string;
  label: string;
  /** Gains in dB. */
  bass: number;
  mid: number;
  treble: number;
}

export const EQ_PRESETS: readonly EqPreset[] = [
  { id: 'flat', label: 'FLAT', bass: 0, mid: 0, treble: 0 },
  { id: 'bass', label: 'BASS BOOST', bass: 7, mid: 0, treble: 1 },
  { id: 'night', label: 'NIGHT DRIVE', bass: 4, mid: -2, treble: 3 },
  { id: 'vocal', label: 'VOCAL', bass: -2, mid: 4, treble: 1 },
  { id: 'bright', label: 'BRIGHT', bass: -1, mid: 0, treble: 6 },
  { id: 'warm', label: 'WARM', bass: 3, mid: 1, treble: -4 },
];

interface Graph {
  ctx: AudioContext;
  pre: GainNode;
  bass: BiquadFilterNode;
  mid: BiquadFilterNode;
  treble: BiquadFilterNode;
}

const dbToGain = (db: number) => Math.pow(10, db / 20);

function buildGraph(el: HTMLAudioElement): Graph | null {
  const Ctx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const src = ctx.createMediaElementSource(el);
  const pre = ctx.createGain();
  const bass = ctx.createBiquadFilter();
  bass.type = 'lowshelf';
  bass.frequency.value = 120;
  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1200;
  mid.Q.value = 0.9;
  const treble = ctx.createBiquadFilter();
  treble.type = 'highshelf';
  treble.frequency.value = 7000;
  src.connect(pre).connect(bass).connect(mid).connect(treble).connect(ctx.destination);
  // A suspended context means silence — wake it whenever playback starts.
  el.addEventListener('play', () => void ctx.resume());
  return { ctx, pre, bass, mid, treble };
}

export function useEqualizer(getAudioElement: () => HTMLAudioElement | null) {
  const [presetId, setPresetId] = useState<string>('flat');
  const graph = useRef<Graph | null>(null);

  useEffect(() => () => void graph.current?.ctx.close(), []);

  function apply(id: string) {
    const p = EQ_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    const flat = p.bass === 0 && p.mid === 0 && p.treble === 0;
    if (!graph.current) {
      if (flat) return; // nothing to do — stay on the plain element path
      const el = getAudioElement();
      if (!el) return;
      graph.current = buildGraph(el);
      if (!graph.current) return;
    }
    const g = graph.current;
    void g.ctx.resume();
    const t = g.ctx.currentTime;
    g.bass.gain.setTargetAtTime(p.bass, t, 0.05);
    g.mid.gain.setTargetAtTime(p.mid, t, 0.05);
    g.treble.gain.setTargetAtTime(p.treble, t, 0.05);
    // Headroom: pull the input down by most of the largest boost so it doesn't clip.
    const boost = Math.max(0, p.bass, p.mid, p.treble);
    g.pre.gain.setTargetAtTime(dbToGain(-boost * 0.7), t, 0.05);
  }

  const preset = EQ_PRESETS.find((x) => x.id === presetId) ?? EQ_PRESETS[0];
  return { preset, presets: EQ_PRESETS, apply };
}

export type Equalizer = ReturnType<typeof useEqualizer>;
