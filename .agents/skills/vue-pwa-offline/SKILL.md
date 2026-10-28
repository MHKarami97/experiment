---
name: vue-pwa-offline
description: Implements and verifies offline-first PWA behavior with Vite, vite-plugin-pwa, Service Worker caching and Dexie IndexedDB persistence for a serverless Vue 3 app. Use for manifest, caching, storage, install, update, or backup tasks.
---

# Vue PWA offline

## Setup
- `vite-plugin-pwa` with `registerType: 'prompt'` (user chooses when to update).
- Precache all built assets, fonts, icons, and experiment chunks. Lazy-loaded experiment chunks must also be precached so the app works fully offline.
- Manifest: name, short_name, `dir: 'rtl'`, `lang: 'fa'`, theme/background colors, 192/512 + maskable icons, `display: 'standalone'`.
- Provide an offline-ready toast and an "update available" prompt.

## Storage (Dexie)
Tables: `runs`, `slots`, `notes`, `settings`, `reports`.
- Version the schema; write migrations for every change.
- Store binary (PNG) as Blob.
- Request `navigator.storage.persist()` and show storage usage.
- Provide full backup: export all tables to one JSON file and import with validation.

## Rules
- No runtime network calls. All fonts/libs bundled locally.
- No localStorage for large data.
- Heavy computation in Web Workers.
- Test offline: build, serve `dist`, load once, enable offline in DevTools, reload, run an experiment, save, reload again.

## Verification checklist
Lighthouse PWA installable · works offline · update flow works · data survives reload · import/export round-trips.
