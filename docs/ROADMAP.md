# Roadmap

Ideas agreed for future versions. Not commitments to dates; the CHANGELOG
records what actually shipped.

## 2.0 — make it yours

### Settings dashboard
A screen where listeners choose what they see. The store is already in place
(`src/lib/settings.ts`, `useSettings()`): the dashboard reads and flips its
switches, and each feature already respects its own.

- Switches that exist today: **motorcycle**, **shooting stars**.
- Every new optional piece of scenery should arrive with a switch, so the
  dashboard grows with it.

### Road layouts
Let the listener pick the road outside the windshield:

- single lane
- multi-lane (today's three lanes is one option)
- two-way street, with oncoming traffic
- other variations to explore (country road, motorway, …)

The lane markings, the car ahead, the streetlights, the motorcycle's lane and
the rear-view mirror would all follow the chosen layout. It would be a setting
in the dashboard above.

## Still open (no version yet)

- **Accessibility pass:** volume knob as a keyboard slider, arrow keys in the
  menus, screen-reader announcements on track change.
- **Unused components:** decide what to do with `BoothFeed`, `Queue`,
  `RequestBox` and `Schedule` (move to `src/components/examples/`, or drop).
- **Schedule refetch on station switch:** only needed once something shows the
  schedule.
