# Skill — Creating gelato & sorbet recipes

A guide for designing a balanced frozen-dessert recipe that (1) is sound by ice-cream
science, (2) is scoopable straight from a **home freezer (−18 °C)**, and (3) drops
directly into the Recetario Gelato website. Produce the recipe in **Spanish, Markdown**.

---

## 1. The science (what you're balancing)

Texture comes from balancing a few ingredient families. Right balance → creamy and
scoopable. Wrong → icy, gummy, or rock-hard.

- **Water** is the enemy: it forms ice crystals. You tame it with sugars (which lower
  the freezing point), solids, and stabilisers.
- **Sugars do two jobs with two sugars:**
  - **Sucrose** — sweetness + moderate anti-freeze. The baseline sugar.
  - **Dextrose** — ~1.9× the anti-freeze power of sucrose but only ~0.7× as sweet.
    Use it to make the product *softer/scoopable without making it sweeter*.
  - **Key idea:** the *total* sugar sets sweetness; the *sucrose↔dextrose split* sets
    hardness. More dextrose = softer.
- **Fat** (gelato) — from milk + cream, or from nut paste. Carries flavour and gives
  creaminess. Gelato is deliberately lower-fat than American ice cream (~6–12 %).
- **MSNF** (milk solids-non-fat, from skimmed milk powder) — proteins that trap air and
  give body, plus lactose. Keep 7–15 %; too much tastes sandy (lactose crystals).
- **Inulin** — clean solids/fibre for body; essential in sorbets that have no dairy.
- **Guar gum** — stabiliser that binds free water and slows ice growth. Tiny amounts only —
  above ~0.5 g per 800 g (gelato) or ~2.5 g (sorbet) it turns gummy and chewy. Scoopulator's
  0.4–0.6 % stabilizer target assumes a professional **blend** (guar + locust bean gum +
  carrageenan); do not try to hit it with pure guar.
- **Salt** — ~1 g lifts and rounds flavour (especially caramel, nut, chocolate).
- **Total solids** — everything that isn't water. Target ~35–45 % (gelato),
  ~28–36 % (sorbet): enough body to avoid iciness, not so much it's heavy.

## 2. The home-freezer rule (most important)

These recipes are scooped **straight from a domestic freezer at ~−18 °C**, so they must
not be over-softened. Design for an **ideal serving temperature of about −16 °C**
(acceptable band −18 to −14 °C).

Dextrose is the lever, and over-using it is the classic mistake. Per **800 g batch**:

- **Dextrose: ~45–65 g (gelato), ~45–55 g (sorbet). Do not exceed ~65 g / ~55 g.**
  (Old recipes used 80–130 g and came out far too soft to scoop at −18 °C.)
- **Sucrose:** whatever sugar is left after setting sweetness.
- **Scoopulator's serving-temp targets (gelato −14 to −10 °C, sorbet −16 to −12 °C) are for
  professional display cabinets, not home freezers.** Do not use them as recipe targets — a
  recipe hitting −14 °C would be rock-hard straight from a −18 °C freezer. Target −16 °C
  (band −18 to −14 °C) instead.

## 3. How to build a recipe (procedure)

1. **Choose** the flavour and whether it's a **gelato** (dairy base) or **sorbet**
   (water/fruit base, no dairy).
2. **Base liquid:** gelato → whole milk as the bulk + cream for fat. Sorbet → water
   and/or fruit pulp/juice.
3. **Sugars:** pick the total to hit the sweetness target (see table), then split into
   sucrose + dextrose, keeping dextrose within the limits above so it serves near −16 °C.
4. **Dairy structure (gelato):** add cream to reach ~6–12 % fat, and skimmed milk
   powder to reach 7–15 % MSNF.
5. **Body:** add inulin (15–25 g gelato, 20–50 g sorbet) and guar (~0.5 g gelato,
   0.6–2.5 g sorbet — more for watery/acidic mixes).
6. **Salt:** ~1–1.5 g in gelato; optional in sorbet (a few g in savoury ones).
7. **Sanity-check** against the targets table before writing it up.
8. **Write the method** (see technique patterns).

## 4. Targets (per 800 g)

| | Gelato | Sorbet |
|---|---|---|
| Ideal serving temp | ≈ −16 °C | ≈ −16 °C |
| Total solids | 35–45 % | 28–36 % |
| Relative sweetness (POD) | 12–18 % | 22–28 % (savoury ~12–15 %) |
| Milk fat | 6–12 % | — |
| MSNF | 7–15 % | — |
| Dextrose | 45–65 g | 45–55 g |
| Guar | ~0.5 g | 0.6–2.5 g |
| Inulin | 15–25 g | 20–50 g |
| Salt | 1–1.5 g | optional |

(Authentic gelato is lower-fat than the generic "ice cream" profile, so total fat may
read slightly low in analysis — that's correct, not a fault.)

## 5. Technique patterns (for the method section)

- **Gelato base:** heat milk + cream; at **50 °C** rain in the pre-mixed powders
  (sugars, milk powder, inulin, salt, guar); blend; raise to **85 °C** for 1 min to
  pasteurise and activate the guar; cool fast; **mature 12–24 h** in the fridge; churn
  15–25 min.
- **Nut flavours (pistachio, hazelnut):** add the nut paste to the *hot* base and blend
  hard for 1–2 min to force a stable emulsion.
- **Aromatics (cinnamon sticks, vanilla pods, spices):** cold-infuse and/or steep in the
  base, then **strain out** before churning.
- **Fruit sorbet:** keep the fruit **cold and raw** (don't cook it); make a hot syrup
  with water + the powders, then combine with the cold fruit; add lemon juice to stop
  oxidation and lift flavour.
- **Anti-iciness trick:** 15 min in the freezer just before churning.

## 6. Output format

- Title: `# Gelato de <Sabor> (800g)` or `# Sorbete de <Sabor> (800g)`. **Plain names**
  — no "Técnico / Pura / Gastronómico / Real / Extremo / Fresh Lab / Rescate / 100% /
  con Variegato", and **no emojis**.
- `## Formulación` then a table with columns **exactly**
  `| Ingrediente | Cantidad (g) | Notas |`, bolding name and grams
  (`| **Leche Entera** | **440g** | … |`). Keep the `Cantidad (g)` header verbatim.
- Method in `##` / `###` sections, numbered steps. Temperatures as `85 °C`
  (degree symbol, never LaTeX / `$...$`).
- **Tone:** clean and technical — explain the *why*, but no hype, exclamations, slang
  or emojis.
- End with:
  ```
  ## Registro de versiones

  - **v1.0** — *Notas de cata pendientes.*
  ```

## 7. Ingredient palette the calculator knows

Prefer these so the website can auto-analyse the recipe: whole milk, cream 35%, skimmed
milk powder, sucrose, dextrose, brown sugar, inulin, guar gum, salt, water, lemon juice,
cocoa powder, pure pistachio paste, pure hazelnut paste, butter, mango pulp, watermelon
juice, green apple, extra-virgin olive oil, pickled piparra + brine, ground cinnamon.
Infused-then-strained aromatics (cinnamon sticks, vanilla pods, basil) are fine — note
they're removed. Any **new** ingredient must be added to the site's database by hand.

## 8. Final checklist

- [ ] Title is plain, no fluff, no emoji.
- [ ] `## Formulación` table with the exact `Cantidad (g)` header.
- [ ] Dextrose ≤ ~65 g (gelato) / ~55 g (sorbet) → serves near −16 °C.
- [ ] Solids, sweetness, MSNF, fat within the target ranges.
- [ ] Method covers disperse → pasteurise (85 °C) → mature → churn.
- [ ] Ends with `## Registro de versiones` and a `v1.0` line.
- [ ] Spanish, clean technical tone, no emojis.
