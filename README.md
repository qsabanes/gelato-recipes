# 🍨 Recetario Gelato

A small, zero-build website to browse my gelato & sorbet recipes from any device.
No frameworks, no build step — just HTML/CSS/JS that reads markdown files.

> **About the recipes.** They're generated with an LLM and tuned using
> [Scoopulator](https://scoopulator.app/) and IceCreamCalc as guides. The on-page
> technical analysis (composition, PAC, freezing point, serving temperature) is an
> **approximation** calculated from the ingredient grams — a guide, not a lab value.

## Features

- **Three languages** — Spanish, Catalan and English, switchable in the header.
- **Technical analysis per recipe** — Scoopulator-style composition cards (solids, fat, MSNF, sugars…), PAC, freezing point, a scoopability gauge, a freezing curve and a nutrition table, all computed from the grams.
- **Installable app (PWA) + offline.** "Add to Home Screen"; works with no signal.
- **Ingredient scaling** — ½ / 1× / 2× / 3× or a custom factor; quantities and the batch size recalculate.
- **Keep screen awake**, **tap-to-check** ingredients/steps, **favorites & recents**.
- **Home cards, search, dark mode**, responsive for phone & PC.

## How it works

- Each recipe is a markdown file per language: `recipes/es/<file>.md`, `recipes/ca/<file>.md`, `recipes/en/<file>.md`. If a translation is missing, the app falls back to the Spanish one.
- [`recipes.json`](recipes.json) lists every recipe: localized titles/tags, the canonical `category` (`gelato`/`sorbet`) and the language-independent `ingredients` (canonical key + grams) that feed the analysis.
- `calc.js` computes the analysis, `analysis.js` renders it, `i18n.js` holds UI strings, `app.js` ties it together.

## Add a new recipe

1. Write the recipe markdown. Start with a `# Title`, keep the formulation table's
   quantity column header exactly `Cantidad (g)` / `Quantitat (g)` / `Quantity (g)`
   (it drives the scaling feature). Save it as `recipes/es/fresa.md` (+ `ca/` and `en/`
   versions when you have them).
2. Add an entry to `recipes.json`:
   ```json
   { "file": "fresa.md", "category": "sorbet",
     "ingredients": [ { "k": "strawberry_pulp", "g": 350 }, { "k": "sucrose", "g": 60 } ],
     "es": { "title": "Sorbete de Fresa", "tags": ["fruta"] },
     "ca": { "title": "Sorbet de Maduixa", "tags": ["fruita"] },
     "en": { "title": "Strawberry Sorbet", "tags": ["fruit"] } }
   ```
   - `ingredients` keys must exist in the `INGREDIENTS` database in `calc.js`. Add a new
     ingredient there (with its properties) if you use one that isn't listed yet.
   - Every entry except the last needs a trailing comma.
3. In **GitHub Desktop**: write a summary → **Commit to main** → **Push origin**.

## Edit a recipe

Open the `.md` file (any editor or GitHub's web editor), change it, commit & push.
Each recipe ends with a **Registro de versiones / Version log** section for tasting notes.

## Publishing (one-time setup)

1. Create a **public** repo on GitHub and push these files via GitHub Desktop.
2. github.com → repo → **Settings → Pages** → Source **Deploy from a branch**, branch
   **main**, folder **/ (root)** → Save.
3. After a minute it's live at `https://<your-user>.github.io/gelato-recipes/`.

Open that URL on your phone and "Add to Home Screen" to use it like an app.
