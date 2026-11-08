# Changelog

All notable changes to this player are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.1.0] — Unreleased

### Changed
- GitHub Pages deploy now builds against `https://www.getsubwave.com` by default,
  matching `src/config.ts` and `.env.example`. Override it with the `STATION_URL`
  repository variable.
- GitHub Pages deploy now runs only on pushes to `main`. The `car-skin-v1`
  branch trigger is gone.

### Added
- This changelog.

## [1.0.0] — 2026-11-08

### Added
- "Night Drive" car-interior skin: a windshield scene, plus a dashboard with a
  head unit (SRC station picker, EQ, stream format, lyrics glovebox) and a
  volume knob.
- GitHub Actions workflow that deploys the player to GitHub Pages.

## [0.1.0] — 2026-07-15

### Added
- Initial SUB/WAVE web player starter: React 19 + Vite 6 + TypeScript +
  Tailwind v4, with the data layer (`config.ts`, `lib/`, `hooks/`) kept
  separate from presentation (`components/`).
- One-click deploy buttons, Docker, agent skills (`redesign-player`,
  `connect-station`), and the GitHub Pages guide site.
