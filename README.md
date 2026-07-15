# SUB/WAVE Web Player

A lean, forkable reference web player for a [SUB/WAVE](https://github.com/perminder-klair/subwave)
internet radio station — **React + Vite + TypeScript + Tailwind**.

It ships pointed at the live public station, so it plays real radio the moment
you run it. It's built to be **cloned and redesigned**: the data layer (API
client + hooks) is cleanly separated from the presentation (components), so you
can keep the plumbing and rebuild the look however you like.

> SUB/WAVE is *radio*, not a playlist — one shared Icecast stream, an AI DJ
> picking tracks and talking between them. Everyone hears the same thing at the
> same time. There's no per-listener shuffle and no skip button, and this
> player reflects that.

## Quick start

```bash
npm install
npm run dev        # → http://localhost:5173 (plays the live public station)
```

That's it — no config needed. `npm run build` produces a static `dist/` you can
host anywhere.

## Deploy

It's a static single-page app (`vite build` → `dist/`), so it deploys to any
static host in one click. These buttons clone this repo and auto-detect the Vite
build:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/perminder-klair/subwave-web-player)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/perminder-klair/subwave-web-player)
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/perminder-klair/subwave-web-player)

> The buttons pull from a **public GitHub repo** — update the URLs above to point
> at your own fork (they assume `github.com/perminder-klair/subwave-web-player`).

**Build settings** (auto-detected by the above; enter manually on other hosts):

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | 20+ |

**Docker.** A multi-stage `Dockerfile` builds the site and serves `dist/` with
nginx; `docker-compose.yml` wraps it:

```bash
docker compose up -d --build       # → http://localhost:8080

# tune the image at a specific station + port:
VITE_STATION_URL=https://radio.example.com PORT=3000 docker compose up -d --build
```

Or without compose:

```bash
docker build -t subwave-player --build-arg VITE_STATION_URL=https://www.getsubwave.com .
docker run -p 8080:80 subwave-player
```

Because `VITE_STATION_URL` is baked in at build time, changing the station means
a rebuild (`--build`), not just a restart.

**Railway / Render / Fly / any container host.** Point them at the `Dockerfile`
above (Railway/Render both auto-detect it) and set `VITE_STATION_URL` as a build
arg / env var. Prefer a static host? Build with `npm run build` and serve `dist/`
— e.g. `npx serve -s dist -l $PORT`.

**Pointing a deployment at a specific station.** `VITE_STATION_URL` is inlined at
**build time** (all Vite `VITE_*` vars are), not read at runtime. To ship a build
locked to your own station, set `VITE_STATION_URL` in the platform's environment
variables and redeploy — a rebuild bakes it in. Left unset, the deployment tunes
into the public station.

## Point it at your own station

Every SUB/WAVE deployment serves the same routes on one hostname, so a single
origin URL is all the player needs. Copy `.env.example` to `.env` and set:

```bash
VITE_STATION_URL=http://localhost:7700      # your local install
# VITE_STATION_URL=https://radio.example.com
```

From that origin the player derives `${url}/api` (the controller) and
`${url}/stream.mp3` (the audio). It works cross-origin out of the box — the
controller's CORS and the Icecast mount are both wide open.

## What it shows

| Feature | Source |
| --- | --- |
| Now playing — cover art, title/artist/album, and the acoustic-tag strip (genre · BPM · key · mood · energy) | `/now-playing` |
| Live vitals — listener count, stream bitrate, and the DJ's cumulative LLM-token ticker | `/now-playing` |
| On-air DJ — persona name, tagline, avatar, current show, guest co-hosts | `/now-playing` |
| The Booth — the live DJ session's chat log (what the AI DJ said/queued) | `/session` |
| On the Deck — up-next tease + recently played | `/state` |
| Request a track — plain-language song requests with live status | `POST /request` + `/request/:id` |
| Weekly schedule — the 7×24 grid painted in station-local time | `/schedule` |
| Play/pause + lock-screen controls (MediaSession) | `/stream.mp3`, `/cover/:id` |

## Architecture — the one thing to understand before redesigning

```
src/
  config.ts          # station origin → apiUrl + streamUrl (one env var)

  lib/               # ── DATA LAYER — keep this ──
    types.ts         #   response shapes
    stationClient.ts #   the ONLY module that fetches the controller
    format.ts        #   pure display helpers (clock, timeAgo, gradients)

  hooks/             # ── DATA LAYER — keep this ──
    useStationFeed   #   one 5s poll of /now-playing + /state + /session, shared via context
    usePlayer        #   the <audio> element: tune-in gesture, play/pause, volume
    useElapsed       #   client-side track clock
    useRequest       #   submit a request + poll its outcome
    useSchedule      #   fetch /schedule once
    useMediaSession  #   OS lock-screen metadata + artwork

  components/        # ── PRESENTATION — redesign this ──
    NowPlaying · PlayerBar · OnAir · BoothFeed · Queue · RequestBox · Schedule
    ui/              #   Avatar, SignalDot, Panel
```

**To redesign:** rewrite the components. They read everything through the hooks
and `stationClient`, so as long as your new UI consumes the same hooks, the
plumbing keeps working. Theme tokens (`--bg`, `--accent`, …) live at the top of
`src/index.css` — retint the whole player by editing those before touching a
single component.

## Notes on live-radio semantics

- **No seeking or skipping.** It's one shared stream. `usePlayer` only tunes in
  / pauses, and it re-points at the live edge on each play (a paused live stream
  goes stale). MediaSession deliberately leaves next/prev/seek unwired so a
  stray headphone tap can't skip for the whole room.
- **Autoplay needs a gesture.** Playback starts on the first tap (the "tune in"
  button) — browsers block autoplay with sound.
- **The track clock is approximate.** The server doesn't stream a playhead, so
  the progress bar counts client-side and re-syncs on every track change.

## What the flagship player also does (not included here, on purpose)

This starter stays small. The full SUB/WAVE web player additionally implements —
each is a good next exercise, and the endpoint is listed so you know where to
start:

- **Themes & skins** — `/themes` (token maps) and `ui.skin` on `/state`.
- **Opus codec upgrade** — probe `canPlayType('audio/ogg; codecs=opus')` and
  switch to `/stream.opus` when the station enables it (`stream.opusEnabled`).
- **PWA install** — manifest, icons, offline shell.
- **Audience analytics** — the fire-and-forget `POST /beacon`.
- **Community catalogs** — `/personas/community`, `/skills/community`,
  `/shows/community`.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | `eslint .` + `tsc -b` (full type-check) |

## License

MIT — clone it, gut it, ship your own.
