# 🍨 Recetario Gelato

A small, zero-build website to browse my gelato & sorbet recipes from any device.
No frameworks, no build step — just HTML/CSS/JS that reads markdown files.

## How it works

- Each recipe is a markdown file in [`recipes/`](recipes/).
- [`recipes.json`](recipes.json) lists every recipe (this drives the sidebar + search).
- `index.html` + `app.js` render them with a sidebar, search and dark mode.

## Add a new recipe

1. Create a new file in `recipes/`, e.g. `recipes/fresa.md`. Start it with a title:
   ```markdown
   # Sorbete de Fresa (800g)

   ## Formulación
   | Ingrediente | Cantidad (g) | Notas |
   | :-- | :-- | :-- |
   | ... | ... | ... |
   ```
   (You can paste the LLM output straight in — just keep the `# Title` as the first line.)
2. Add one line to `recipes.json`:
   ```json
   { "file": "fresa.md", "title": "Sorbete de Fresa", "category": "Sorbete", "tags": ["fruta"] }
   ```
   ⚠️ Every line except the last needs a comma at the end.
3. In **GitHub Desktop**: write a summary → **Commit to main** → **Push origin**.
   The live site updates in a few seconds.

## Edit a recipe

Open the `.md` file (in any editor or GitHub's web editor), change it, commit & push.

## Publishing (one-time setup)

1. Create a new repository on GitHub (e.g. `gelato-recipes`) and add these files to it
   via GitHub Desktop (Commit → Push).
2. On github.com open the repo → **Settings → Pages**.
3. Under **Build and deployment → Source**, pick **Deploy from a branch**,
   branch **main**, folder **/ (root)**. Save.
4. After a minute the site is live at `https://<your-user>.github.io/gelato-recipes/`.

Open that URL on your phone and "Add to Home Screen" to use it like an app.
