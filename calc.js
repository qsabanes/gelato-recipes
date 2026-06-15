// --- Gelato composition engine ---
// Computes composition %, PAC/FPDF, freezing point, sweetness, serving
// temperature and nutrition from a recipe's ingredient grams.
// Values are approximate (intended as a guide, like IceCreamCalc / Scoopulator).
//
// Per-ingredient properties are per 100 g:
//   water, fat, milkfat (the dairy part of fat), msnf (milk solids non-fat),
//   sugar (added sugar grams; dairy lactose is derived from msnf),
//   sugarPAC / sugarPOD (anti-freeze & sweetness power, sucrose = 100),
//   other (other dry solids: fibre, minerals, protein not in msnf),
//   salt (boolean), kcal, protein, carb  (kcal/protein/carb per 100 g).

const INGREDIENTS = {
  whole_milk:     { water: 87.7, fat: 3.6,  milkfat: 3.6, msnf: 8.7,  kcal: 64,  protein: 3.3, carb: 4.8 },
  cream35:        { water: 59,   fat: 35,   milkfat: 35,  msnf: 6,    kcal: 340, protein: 2.1, carb: 3.1 },
  smp:            { water: 3.5,  fat: 1,    milkfat: 1,   msnf: 95.5, kcal: 360, protein: 36,  carb: 52 },
  sucrose:        { sugar: 100, sugarPAC: 100, sugarPOD: 100, kcal: 400, carb: 100 },
  dextrose:       { sugar: 100, sugarPAC: 190, sugarPOD: 70,  kcal: 374, carb: 100 },
  brown_sugar:    { water: 2, sugar: 97, sugarPAC: 100, sugarPOD: 105, kcal: 380, carb: 98 },
  inulin:         { other: 100, kcal: 150, carb: 100 },
  guar:           { other: 100, kcal: 330, carb: 80 },
  salt:           { other: 100, salt: true, kcal: 0 },
  water:          { water: 100 },
  lemon_juice:    { water: 92, sugar: 2.5, sugarPAC: 150, sugarPOD: 110, other: 1, kcal: 22, carb: 6.9 },
  cinnamon_powder:{ water: 10, fat: 1.2, sugar: 2, sugarPAC: 100, sugarPOD: 100, other: 80, kcal: 247, protein: 4, carb: 81 },
  pistachio_paste:{ water: 4, fat: 52, sugar: 8,  sugarPAC: 130, sugarPOD: 120, other: 16, kcal: 575, protein: 20, carb: 28 },
  hazelnut_paste: { water: 5, fat: 61, sugar: 4.3, sugarPAC: 130, sugarPOD: 120, other: 15, kcal: 628, protein: 15, carb: 17 },
  cocoa_powder:   { water: 3, fat: 11, sugar: 1.8, sugarPAC: 130, sugarPOD: 100, other: 64, kcal: 230, protein: 20, carb: 58 },
  butter:         { water: 16, fat: 81, milkfat: 81, msnf: 2, kcal: 717, carb: 0.6 },
  mango_pulp:     { water: 82, sugar: 14,  sugarPAC: 180, sugarPOD: 130, other: 2,   kcal: 60, carb: 15 },
  watermelon_juice:{ water: 91, sugar: 7.5, sugarPAC: 185, sugarPOD: 130, other: 0.5, kcal: 30, carb: 7.5 },
  green_apple:    { water: 85, sugar: 10,  sugarPAC: 175, sugarPOD: 125, other: 2.5, kcal: 52, carb: 14 },
  olive_oil:      { fat: 100, kcal: 884 },
  piparra:        { water: 92, fat: 0.5, sugar: 1, sugarPAC: 150, sugarPOD: 110, other: 3, kcal: 25, carb: 4 },
  brine:          { water: 96, sugar: 0.5, sugarPAC: 100, sugarPOD: 100, other: 1, kcal: 5 }
};

const LACTOSE_FRACTION_OF_MSNF = 0.545;   // lactose as a share of milk solids non-fat
const SALT_SUCROSE_EQ_PER_G    = 11.7;    // 1 g salt ≈ 11.7 g sucrose for freezing depression

// Freezing point (°C) of a solution with SE g sucrose-equivalent per 100 g water.
// Fitted to real sucrose freezing-point-depression data (e.g. 30 g→≈-1.9, 50 g→≈-3.4).
const FP_A = 0.052, FP_B = 0.00035;
function fpFromSE(se) { return -(FP_A * se + FP_B * se * se); }
// Inverse: sucrose-equivalent needed to reach freezing point t (t < 0).
function seFromFP(t) { return (-FP_A + Math.sqrt(FP_A * FP_A - 4 * FP_B * t)) / (2 * FP_B); }

const SERVING_ICE_FRACTION = 0.685;  // calibrated to match Scoopulator's serving temperature

function analyze(list) {
  let total = 0, water = 0, fat = 0, milkfat = 0, msnf = 0;
  let addedSugar = 0, other = 0, guar = 0;
  let sucroseEqPAC = 0, pod = 0, lactose = 0;
  let kcal = 0, protein = 0, carb = 0;

  list.forEach(it => {
    const p = INGREDIENTS[it.k];
    if (!p) return;
    const g = it.g;
    total += g;
    water += g * (p.water || 0) / 100;
    fat += g * (p.fat || 0) / 100;
    milkfat += g * (p.milkfat || 0) / 100;
    const m = g * (p.msnf || 0) / 100;
    msnf += m;
    const lac = m * LACTOSE_FRACTION_OF_MSNF;
    lactose += lac;
    const s = g * (p.sugar || 0) / 100;
    addedSugar += s;
    other += g * (p.other || 0) / 100;
    if (it.k === 'guar') guar += g;
    sucroseEqPAC += s * (p.sugarPAC || 0) / 100 + lac * 1.0;
    if (p.salt) sucroseEqPAC += g * SALT_SUCROSE_EQ_PER_G;
    pod += s * (p.sugarPOD || 0) / 100 + lac * 0.16;
    kcal += g * (p.kcal || 0) / 100;
    protein += g * (p.protein || 0) / 100;
    carb += g * (p.carb || 0) / 100;
  });

  const solids = total - water;
  const sugarsComp = addedSugar;          // composition sugars: added only (like Scoopulator)
  const sugarsNutr = addedSugar + lactose; // nutritional sugars: include lactose
  const fpdf = water > 0 ? sucroseEqPAC / water * 100 : 0;
  const freezingPoint = fpFromSE(fpdf);
  const servingTemp = fpFromSE(fpdf / (1 - SERVING_ICE_FRACTION));
  const pct = x => total > 0 ? x / total * 100 : 0;

  return {
    total,
    servingTemp,
    freezingPoint,
    fpdf,
    pac: sucroseEqPAC,
    sweetness: pct(pod),
    totalSolids: pct(solids),
    totalFat: pct(fat),
    milkFat: pct(milkfat),
    sugars: pct(sugarsComp),
    msnf: pct(msnf),
    stabilizers: pct(guar),
    emulsifiers: 0,
    alcohol: 0,
    nutrition: {
      kcal: pct(kcal), fat: pct(fat), carb: pct(carb),
      sugars: pct(sugarsNutr), protein: pct(protein)
    }
  };
}

// Freezing curve: ice fraction (0..1) vs temperature, from the freezing point down.
function freezingCurve(fpdf, minTemp) {
  const fp = fpFromSE(fpdf);
  const pts = [];
  for (let t = 0; t >= (minTemp || -22); t -= 0.5) {
    let ice = 0;
    if (t < fp) ice = Math.min(0.97, 1 - fpdf / seFromFP(t));
    pts.push({ t, ice });
  }
  return { fp, points: pts };
}

// Target ranges per category. [min,max] gets a check; null = informational only.
const TARGETS = {
  // Serving-temperature targets are tuned for a HOME freezer (~-18 °C):
  // the ice cream should be scoopable straight from the freezer or after a brief rest.
  gelato: {
    servingTemp: [-18, -14], sweetness: [11, 20], totalSolids: [35, 45],
    totalFat: [10, 30], milkFat: [5, 18], sugars: null, msnf: [7, 15],
    stabilizers: [0, 0.3], emulsifiers: null, alcohol: [0, 2]
  },
  sorbet: {
    servingTemp: [-18, -14], sweetness: [22, 30], totalSolids: [26, 38],
    totalFat: null, milkFat: null, sugars: null, msnf: null,
    stabilizers: [0, 0.5], emulsifiers: null, alcohol: [0, 2]
  }
};

window.Calc = { INGREDIENTS, analyze, freezingCurve, TARGETS, fpFromSE };
