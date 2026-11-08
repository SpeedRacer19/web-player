// Which Icecast mounts this listener can pull. Mirrors the official SUB/WAVE
// players: MP3 is always served and always plays; AAC/Opus/FLAC need the
// station's `stream.*Enabled` flag AND a browser that decodes them. Opus and
// FLAC ride chained Ogg, which iOS and Firefox break at crossfades, so both
// are ruled out there (the flagship web player's rule).

import type { StreamFormat } from '@/config';
import type { StreamInfo } from '@/lib/types';

export type { StreamFormat };

export interface FormatOption {
  format: StreamFormat;
  label: string;
  detail: string;
}

export const FORMAT_OPTIONS: readonly FormatOption[] = [
  { format: 'mp3', label: 'MP3', detail: 'universal · most reliable' },
  { format: 'aac', label: 'AAC', detail: 'efficient · easy on data' },
  { format: 'opus', label: 'OPUS', detail: 'best quality per bit' },
  { format: 'flac', label: 'FLAC', detail: 'lossless · heavy on data' },
];

function isIOS() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** Can this browser decode the format as a live stream? */
export function browserSupports(format: StreamFormat): boolean {
  if (format === 'mp3') return true;
  if (typeof document === 'undefined') return false;
  const a = document.createElement('audio');
  if (format === 'aac') {
    return a.canPlayType('audio/aac') !== '' || a.canPlayType('audio/mp4; codecs="mp4a.40.2"') !== '';
  }
  if (isIOS() || /firefox/i.test(navigator.userAgent)) return false;
  if (format === 'opus') return a.canPlayType('audio/ogg; codecs=opus') === 'probably';
  return a.canPlayType('audio/ogg; codecs=flac') !== '';
}

/** Does the station advertise the mount? Unknown info counts as no. */
export function stationServes(info: StreamInfo | null | undefined, format: StreamFormat): boolean {
  if (format === 'mp3') return true;
  if (!info) return false;
  if (format === 'aac') return info.aacEnabled === true;
  if (format === 'opus') return info.opusEnabled === true;
  return info.flacEnabled === true;
}

export function formatLabel(format: StreamFormat): string {
  return FORMAT_OPTIONS.find((o) => o.format === format)?.label ?? format.toUpperCase();
}
