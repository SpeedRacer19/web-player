# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A lean, **forkable reference web player** for a [SUB/WAVE](https://github.com/perminder-klair/subwave)
internet radio station — React 19 + Vite 6 + TypeScript + Tailwind v4. It ships
pointed at the live public station and is meant to be **cloned and redesigned**:
the whole point is that the data layer stays and the UI gets replaced.

SUB/WAVE is *live radio*, not a playlist — one shared Icecast stream, an AI DJ
picking tracks and talking between them. Design constraints follow from that:
**no seeking, no skip**, playback starts only on a user gesture, and the track
clock is a client-side approximation.

## Commands

```bash
npm run dev        # Vite dev server + HMR → http://localhost:5173
npm run build      # tsc -b (full type-check) + vite build → dist/
npm run preview    # serve the production build
npm run lint       # eslint . && tsc -b
```

There is no test runner. `npm run lint` is the quality gate.

**`npm run lint` must use `tsc -b`, not `tsc --noEmit`.** The root `tsconfig.json`
has `"files": []` and only project references, so a bare `tsc --noEmit` type-checks
*nothing* and passes trivially. `tsc -b` walks the `tsconfig.app.json` /
`tsconfig.node.json` project references and is the real check.

## Pointing at a station

`VITE_STATION_URL` (see `.env.example`) is the main config surface. It defaults
to `https://www.getsubwave.com`. `src/config.ts` derives everything from that one
origin: `${url}/api` (the controller JSON API) and `${url}/stream.mp3` (Icecast
audio). Cross-origin works out of the box — the controller's CORS and the Icecast
mount are both `Access-Control-Allow-Origin: *`.

**Runtime switching.** `VITE_STATION_URL` is the *default*. Listeners can switch
station at runtime (the head unit's SRC list, fed by the public directory at
`VITE_DIRECTORY_URL`, default `https://www.getsubwave.com/stations.json`).
`config.stationUrl`/`apiUrl`/`streamUrl` are getters, `setStationUrl()` changes
them, and `useStation()` exposes it to React. The pick is saved in localStorage
**keyed to the build's default**, so rebuilding with a new `VITE_STATION_URL`
discards a stale pick. `stationClient` reads config at call time (never cache
the URL at import), and `useStationFeed` resets and restarts its loop on a switch.

## Architecture — the load-bearing idea

**Strict separation of data from presentation.** This is the one thing to preserve.

- **Data layer (keep when redesigning):** `src/config.ts`, `src/lib/**`,
  `src/hooks/**`.
  - `src/lib/stationClient.ts` is the **only** module that fetches the
    controller. Every controller-relative URL (cover art, avatars) is built here.
    If you add an endpoint, add it here — no `fetch` in components.
  - `src/lib/types.ts` mirrors the controller's public JSON (a pragmatic subset).
  - `src/hooks/**` own all live state (see below).
- **Presentation (rewrite freely):** `src/components/**`. Components read
  everything through the hooks + `stationClient`. A redesign that keeps consuming
  the same hooks keeps working with zero data-layer changes.

### Data flow

- **One poll loop for the whole app.** `useStationFeed` (`src/hooks/useStationFeed.tsx`)
  is a context provider that polls `/now-playing` + `/state` together every
  `config.pollIntervalMs` (5s), via `Promise.all`, and shares one snapshot.
  `/session` (Booth chat) is opt-in with `<StationFeedProvider withSession>`;
  the car skin doesn't show the booth, so it doesn't poll it.
  Components call `useStationFeed()` to read it — they do **not** open their own
  loops. It **pauses while the tab is hidden** and, on a failed poll, keeps the
  last good snapshot and flips `online` false (the UI degrades to "reconnecting",
  never blanks). `App` mounts exactly one `<StationFeedProvider>`.
- `usePlayer` owns the single `<audio crossOrigin="anonymous">` element. It only
  tunes in / pauses / sets volume, and **re-points at the live edge on each play**
  (a paused live stream goes stale) with a cache-busting query param. Autoplay is
  gated behind a user gesture (`tuneIn()` from a click).
- `useElapsed` is a client-side track clock — the server streams no playhead, so
  it counts up and resets on every `subsonic_id` change.
- `useRequest` runs a listener song request end to end: `POST /request` returns a
  `requestId`, then it polls `/request/:id` every 2s until terminal
  (resolved/failed/unknown). The slow LLM matching happens server-side, which is
  why it's poll-based.
- `useSchedule` fetches `/schedule` once (outside the 5s loop — it rarely changes).
  It does not refetch on a station switch yet; key it on `useStation()` when the
  schedule comes back into the layout.
- `usePlayer` also picks the stream mount (`format`/`setFormat`: MP3, AAC, Opus,
  FLAC), gated by `lib/streamFormat.ts`: the station must advertise it in
  `now-playing.stream.*Enabled` and the browser must decode it (Opus/FLAC never
  on iOS or Firefox, as in the official player). A failing mount falls back to MP3.
- `useEqualizer` is a 3-band Web Audio EQ on the player's `<audio>`. The graph is
  built only when a non-flat preset is first picked, and
  `createMediaElementSource` is permanent, so it lives in `App` next to
  `usePlayer` and must never be re-created.
- `useLyrics(songId, enabled)` reads `GET /lyrics/current?songId=` only while
  something shows lyrics (the glovebox). It re-asks a `pending` answer every 4s
  (up to ~40s) and backs off on an unreachable station; disabled (403) / gone
  (409) / locked (401) are final. Sync uses listener time:
  `now − nowPlaying.timestamp − stream.bufferSeconds + offsetMs`.
- `useStationFeed` also reports `latencyMs`, the round-trip of the last poll.
- `useUpNext` lists what the listener will hear next. Same buffer problem as
  `heardTrack`: while the live edge is ahead of the speakers, the live track
  leads the list, then `/state.upcoming`.
- Typed station URLs go through `normalizeStationUrl()` (`config.ts`) and
  `probeStation()` (`stationClient`) before `setStationUrl()`.
- **Share links:** `?station=<host or URL>` on the page tunes to that station at
  load (it beats the remembered pick), is saved like a pick, and is then removed
  from the address bar. `shareLinkFor()` builds one.
- **Recent stations:** typed and shared stations go in a recent list (max 5,
  localStorage, `useRecentStations()`), all in `config.ts`. `useStationFeed`
  fills in a station's name from `dj.station` when it answers.
- `config.version` is `package.json`'s version, injected at build time as
  `__APP_VERSION__` (`vite.config.ts`). Bump `package.json` to change it.
- **Render the current song from `heardTrack`, not `nowPlaying.nowPlaying`.**
  The API reports the live edge, but Icecast plays every listener
  `stream.bufferSeconds` (~20s) behind it, so the raw field flips to the next
  song while the old one is still audible. `heardTrack` holds the previous track
  until `timestamp + bufferSeconds`. `useElapsed` keyed on it therefore resets
  when the new song is actually heard.
- The station's own player (and its built-in skins) is always at
  `${stationUrl}/listen`. The listener's skin choice is stored on that site, so
  this player can link there (EJECT) but can't preselect a skin.
- `useMediaSession` wires OS lock-screen metadata + artwork. **Next/prev/seek are
  intentionally left unwired** — a stray headphone tap must not skip a shared live
  stream. Only play/pause are meaningful.

### Public API consumed

`/now-playing` (track + acoustic tags + vitals + DJ + active show/guests + token
ticker), `/state` (queue/history/DJ log), `/session` (Booth chat feed), `/lyrics/current`, `/schedule`
(weekly grid), `POST /request` + `/request/:id`, `/cover/:id` (art proxy),
`/health`. All unauthenticated. `docs/*-design.md` has the endpoint→feature map.

## Styling

Tailwind v4 via `@tailwindcss/vite` — **no `tailwind.config.js`** (v4 is
config-less; `@import "tailwindcss"` lives in `src/index.css`). Theme is a small
set of CSS custom properties (`--bg`, `--panel`, `--accent`, …) at the top of
`src/index.css`, referenced from components through Tailwind arbitrary values
(`bg-[var(--bg)]`). **Retint the whole player by editing those vars** before
touching any component. Path alias `@/*` → `src/*` (in `vite.config.ts` +
`tsconfig.app.json`).

The car skin's wide layout (wheel + gauges, glovebox) uses one custom breakpoint,
`cockpit:` (1400px, `@theme` in `src/index.css`). `WIDE` in `Dashboard.tsx`
mirrors it for JS; change both together. Below it the gauges' readings show in
the head unit's readout line instead.

## Deliberate non-goals

Omitted to stay a lean starter (documented in README with their endpoints as
next exercises): theme/skin engine (`/themes`), PWA manifest, audience beacon
(`POST /beacon`), community catalogs. Don't add these without a reason — the value here is smallness.
