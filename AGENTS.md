# AGENTS.md — Color Picross

## Projet

SPA **Color Picross** (client-only) : créer une grille colorée, partager un lien jouable, vérifier l’unicité de solution.

UI / messages / commentaires utiles en **français** (tutoiement).

## Commandes

```text
npm install | npm run serve | npm run build | npm test | npm run lint
```

Préférer **npm** uniquement (`package-lock.json` ; ne pas committer `yarn.lock`). Stack : Vue 3 + **Vite**, Options API, pas de TS / Pinia. Tests : **Vitest** (`src/**/*.test.js`).

Node **18+** recommandé (plus besoin de `NODE_OPTIONS=--openssl-legacy-provider` depuis la migration Vite).

## Architecture et portée des diffs

- Entrée : `index.html` → `main.js` → `App.vue` → **`Game.vue`** (état + `provide`/`inject` + watchers).
- UI : `Grid` / `Cell` / `Hints` / `Tools` / `Modal` ; logique pure : `src/solver.js`, `src/hints.js`, `src/puzzleUrl.js`, `src/daily.js` ; styles globaux : `src/assets/style.css`.
- **Portée** : diff local dans le composant concerné ; ne toucher `Game.vue` que pour l’état partagé ; ne pas ajouter de store sans demande.

## Domaine (critique)

Ce n’est **pas** un picross classique (suites de blocs).

- Cellule : index couleur `0..n-1` ou `""` (gomme).
- Indice par ligne/colonne **et par couleur** : `{ number, contiguous }` (`contiguous` = toutes adjacentes ; pastille dans l’UI).
- Couleurs **2–5** ; dimensions **3–15** (UI et logique alignées).
- Modes : édition (pas de query) | jeu (`?p=` ou legacy `?g=`) | daily (`/daily`) | hypothèse (backup grille).

## Partage URL (ne pas casser)

- `?p=` compact : `{ g, w, c }` (grille base36, largeur, couleurs sans `#`) ; hints recalculés à la lecture.
- `?g=` legacy : conserver pour rétrocompatibilité.

## Daily (sans backend)

- Calendrier : [`src/daily/calendar.json`](src/daily/calendar.json) — clé `YYYY-MM-DD` → tableau de payloads (partie après `?p=`, ou URL complète).
- Logique : [`src/daily.js`](src/daily.js) — date locale, tirage **déterministe** si plusieurs grilles, fallback sur la dernière date ≤ aujourd’hui.
- Route `/daily` détectée via `pathname` (pas de vue-router). Sur Netlify : rewrite SPA via [`public/_redirects`](public/_redirects) (`/* → /index.html` 200).

## Solveur

- `checkSolvability({ rows, columns, hints, colorCount })` → `reason` : `unique` | `no_solution` | `multiple` | `too_complex` | `invalid_hints`.
- Budget 5s / cap arrangements 2e6 ; snake_case + commentaires FR dans ce fichier.
- **Ne pas réécrire l’algo** sans besoin ; étendre plutôt feedback UI ou raisons exposées. Appel édition seulement, debounce 300 ms, grille pleine.

## UI

Puzzle calme : police **Dongle**, fond via `--background` (cycle `#e9e9e9` → `#848282` → `#1f1f1f`), texte/traits `--grid-dark` / `--grid-separations`, CTA `#5670c5`. Grille = ancre (tirets 2px, traits forts tous les **5**) ; breakpoint unique **1100px** ; outils = cercles + icônes CSS `gg-*` + Tippy. Réutiliser transitions existantes ; détail dans `style.css` / composants.

## Conventions

- Options API, props/emits + inject depuis `Game`.
- CamelCase côté Vue / `hints.js` / `puzzleUrl.js` ; snake_case dans `solver.js`.
- Touch/drag (`Cell`/`Grid`) : modifier avec prudence (mobile).
- Raccourcis couleurs : `e.code` (`Digit1`–`Digit5`) pour rester correct en AZERTY.

## Pièges

- Watchers via `stringifiedGrid` / `stringifiedColors` (comparaison par valeur).
- Les valeurs `provide`d doivent passer par `computed(() => …)` (déjà le cas) + `unwrapInjectedRef` dans `main.js`.
- Indice satisfait masqué (`visibility: hidden`) ; erreur = trop de cases ou mismatch contiguïté.
