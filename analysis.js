// --- Rich analysis renderer (Scoopulator-style cards, gauge, freezing curve) ---

const A_LABELS = {
  es: {
    title: 'Análisis técnico',
    note: 'Valores aproximados, calculados a partir de los gramos. Sirven de guía, como IceCreamCalc o Scoopulator.',
    target: 'Objetivo', upTo: 'hasta', na: 'N/A', soft: 'Blando', hard: 'Duro',
    fpdfTitle: 'PAC (poder anticongelante)',
    fpdfDesc: 'Equivalente en gramos de sacarosa, escala IceCreamCalc (como las notas de PAC de tus recetas). Scoopulator muestra lo mismo como "FPDF" pero normalizado por 100 g de agua, así que el número es distinto.',
    scoop: 'Facilidad de servir (scoopability)',
    servingTitle: 'Temperatura de servicio', servingDesc: 'Tu helado estará en su punto de cuchara a esta temperatura.',
    freezeTitle: 'Punto de congelación', freezeDesc: 'Tu helado empezará a congelarse a esta temperatura.',
    curveTitle: 'Curva de congelación',
    curveDesc: 'Aproxima la dureza del helado a distintas temperaturas. Al bajar la temperatura se forma hielo, la fase líquida se concentra y el punto de congelación baja más (de ahí la curva).',
    curveX: 'Dureza →', curveBand: 'Rango de servicio en casa (-18 a -14 °C)', curveFreezer: 'Congelador doméstico (-18 °C)',
    nutrTitle: 'Información nutricional (por 100 g)',
    nKcal: 'Energía', nFat: 'Grasas', nCarb: 'Hidratos de carbono', nSugar: 'de los cuales azúcares', nProtein: 'Proteínas',
    metrics: { servingTemp: 'Temperatura de servicio', sweetness: 'Dulzor relativo', totalSolids: 'Sólidos totales', totalFat: 'Grasa total', milkFat: 'Grasa láctea', sugars: 'Azúcares', msnf: 'MSNF (sólidos lácteos)', stabilizers: 'Estabilizantes', alcohol: 'Alcohol' }
  },
  ca: {
    title: 'Anàlisi tècnica',
    note: 'Valors aproximats, calculats a partir dels grams. Serveixen de guia, com IceCreamCalc o Scoopulator.',
    target: 'Objectiu', upTo: 'fins a', na: 'N/D', soft: 'Tou', hard: 'Dur',
    fpdfTitle: 'PAC (poder anticongelant)',
    fpdfDesc: 'Equivalent en grams de sacarosa, escala IceCreamCalc (com les notes de PAC de les teves receptes). Scoopulator ho mostra com a "FPDF" però normalitzat per 100 g d\'aigua, així que el número és diferent.',
    scoop: 'Facilitat de servir (scoopability)',
    servingTitle: 'Temperatura de servei', servingDesc: 'El gelat estarà al punt de cullera a aquesta temperatura.',
    freezeTitle: 'Punt de congelació', freezeDesc: 'El gelat començarà a congelar-se a aquesta temperatura.',
    curveTitle: 'Corba de congelació',
    curveDesc: "Aproxima la duresa del gelat a diferents temperatures. En baixar la temperatura es forma gel, la fase líquida es concentra i el punt de congelació baixa més (d'aquí la corba).",
    curveX: 'Duresa →', curveBand: 'Rang de servei a casa (-18 a -14 °C)', curveFreezer: 'Congelador domèstic (-18 °C)',
    nutrTitle: 'Informació nutricional (per 100 g)',
    nKcal: 'Energia', nFat: 'Greixos', nCarb: 'Hidrats de carboni', nSugar: 'dels quals sucres', nProtein: 'Proteïnes',
    metrics: { servingTemp: 'Temperatura de servei', sweetness: 'Dolçor relativa', totalSolids: 'Sòlids totals', totalFat: 'Greix total', milkFat: 'Greix lacti', sugars: 'Sucres', msnf: 'MSNF (sòlids lactis)', stabilizers: 'Estabilitzants', alcohol: 'Alcohol' }
  },
  en: {
    title: 'Technical analysis',
    note: 'Approximate values, computed from the grams. A guide, like IceCreamCalc or Scoopulator.',
    target: 'Target', upTo: 'up to', na: 'N/A', soft: 'Soft', hard: 'Hard',
    fpdfTitle: 'PAC (anti-freezing power)',
    fpdfDesc: 'Sucrose-gram equivalent, IceCreamCalc scale (like the PAC notes in your recipes). Scoopulator shows the same thing as "FPDF" but normalised per 100 g of water, so the number differs.',
    scoop: 'Scoopability',
    servingTitle: 'Serving temperature', servingDesc: 'Your ice cream will be appropriately scoopable at this temperature.',
    freezeTitle: 'Freezing point', freezeDesc: 'Your ice cream will begin to freeze at this temperature.',
    curveTitle: 'Freezing curve',
    curveDesc: 'Approximates the hardness of the ice cream at different temperatures. As it cools, ice forms, the liquid phase concentrates and the freezing point drops further (hence the curve).',
    curveX: 'Hardness →', curveBand: 'Home serving range (-18 to -14 °C)', curveFreezer: 'Home freezer (-18 °C)',
    nutrTitle: 'Nutrition (per 100 g)',
    nKcal: 'Energy', nFat: 'Fat', nCarb: 'Carbohydrate', nSugar: 'of which sugars', nProtein: 'Protein',
    metrics: { servingTemp: 'Serving temperature', sweetness: 'Relative sweetness', totalSolids: 'Total solids', totalFat: 'Total fat', milkFat: 'Milk fat', sugars: 'Sugars', msnf: 'MSNF (milk solids)', stabilizers: 'Stabilizers', alcohol: 'Alcohol' }
  }
};

let A_DS = ',';  // decimal separator (set per language)
function fmt(n, d) { return (n).toFixed(d == null ? 1 : d).replace('.', A_DS); }

const METRIC_SPECS = [
  { key: 'servingTemp', unit: ' °C', d: 1, big: true, temp: true },
  { key: 'sweetness', unit: ' %', d: 1, big: true },
  { key: 'totalSolids', unit: ' %', d: 1 },
  { key: 'totalFat', unit: ' %', d: 1 },
  { key: 'milkFat', unit: ' %', d: 1 },
  { key: 'sugars', unit: ' %', d: 1 },
  { key: 'msnf', unit: ' %', d: 1 },
  { key: 'stabilizers', unit: ' %', d: 2 },
  { key: 'alcohol', unit: ' %', d: 1 }
];

function targetText(L, spec, range) {
  if (!range) return L.target + ': ' + L.na;
  if (spec.temp) return L.target + ': ' + fmt(range[0], 0) + ' a ' + fmt(range[1], 0) + ' °C';
  if (range[0] === 0) return L.target + ': ' + L.upTo + ' ' + fmt(range[1], range[1] < 1 ? 1 : 0) + ' %';
  return L.target + ': ' + fmt(range[0], 0) + ' – ' + fmt(range[1], 0) + ' %';
}
function statusOf(value, range) { return !range ? 'info' : (value >= range[0] && value <= range[1] ? 'ok' : 'warn'); }
const ICON = { ok: '✓', warn: '!', info: '' };

function metricCard(L, spec, a, targets) {
  const v = a[spec.key], range = targets[spec.key], st = statusOf(v, range);
  return '<div class="metric ' + (spec.big ? 'big ' : '') + 's-' + st + '">'
    + '<div class="m-top"><span class="m-name">' + L.metrics[spec.key] + '</span>'
    + (ICON[st] ? '<span class="m-badge ' + st + '">' + ICON[st] + '</span>' : '') + '</div>'
    + '<div class="m-val">' + fmt(v, spec.d) + spec.unit + '</div>'
    + '<div class="m-target">' + targetText(L, spec, range) + '</div></div>';
}

function buildGauge(L, servingTemp) {
  const cx = 120, cy = 120, r = 96;
  const t2a = t => { const f = Math.max(0, Math.min(1, (t + 20) / 12)); return Math.PI - f * Math.PI; };
  const pt = (ang, rad) => [cx + rad * Math.cos(ang), cy - rad * Math.sin(ang)];
  const arc = (t1, t2, rad) => {
    const [x1, y1] = pt(t2a(t1), rad), [x2, y2] = pt(t2a(t2), rad);
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' A' + rad + ' ' + rad + ' 0 0 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  };
  const [nx, ny] = pt(t2a(Math.max(-20, Math.min(-8, servingTemp))), r - 14);
  let s = '<svg viewBox="0 0 240 150" class="gauge">';
  s += '<path d="' + arc(-20, -8, r) + '" fill="none" stroke="var(--border)" stroke-width="12" stroke-linecap="round"/>';
  s += '<path d="' + arc(-18, -14, r) + '" fill="none" stroke="var(--ok)" stroke-width="12" stroke-linecap="round"/>';
  [['-20', -20], ['-16', -16], ['-14', -14], ['-12', -12], ['-8', -8]].forEach(([lab, t]) => {
    const [lx, ly] = pt(t2a(t), r + 16);
    s += '<text x="' + lx.toFixed(0) + '" y="' + ly.toFixed(0) + '" class="g-tick">' + lab + '</text>';
  });
  s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="var(--text)" stroke-width="3"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="var(--text)"/>';
  s += '<text x="40" y="140" class="g-end">' + L.soft + '</text>';
  s += '<text x="200" y="140" class="g-end">' + L.hard + '</text></svg>';
  return s;
}

function buildCurve(L, fpdf) {
  const W = 480, H = 250, ml = 46, mr = 14, mt = 14, mb = 28;
  const pw = W - ml - mr, ph = H - mt - mb, tMin = -20;
  const x = ice => ml + ice * pw, y = t => mt + (-t / -tMin) * ph;
  const { points } = Calc.freezingCurve(fpdf, tMin);
  const line = points.filter(p => p.t >= tMin).map(p => x(p.ice).toFixed(1) + ',' + y(p.t).toFixed(1)).join(' ');
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="curve">';
  s += '<rect x="' + ml + '" y="' + y(-14).toFixed(1) + '" width="' + pw + '" height="' + (y(-18) - y(-14)).toFixed(1) + '" fill="var(--accent-soft)"/>';
  [0, -5, -10, -15, -20].forEach(t => {
    s += '<line x1="' + ml + '" y1="' + y(t).toFixed(1) + '" x2="' + (W - mr) + '" y2="' + y(t).toFixed(1) + '" stroke="var(--border)" stroke-width="1"/>';
    s += '<text x="' + (ml - 6) + '" y="' + (y(t) + 3).toFixed(1) + '" class="c-tick">' + t + ' °C</text>';
  });
  s += '<line x1="' + ml + '" y1="' + y(-18).toFixed(1) + '" x2="' + (W - mr) + '" y2="' + y(-18).toFixed(1) + '" stroke="var(--muted)" stroke-dasharray="4 3" stroke-width="1"/>';
  s += '<polyline points="' + line + '" fill="none" stroke="var(--warn)" stroke-width="2.5"/>';
  s += '<text x="' + (W - mr) + '" y="' + (H - 6) + '" class="c-tick" text-anchor="end">' + L.curveX + '</text></svg>';
  return s;
}

function renderAnalysis(list, category, lang) {
  if (!list || !list.length || !window.Calc) return '';
  const L = A_LABELS[lang] || A_LABELS.es;
  A_DS = lang === 'en' ? '.' : ',';
  const a = Calc.analyze(list);
  const targets = Calc.TARGETS[category] || Calc.TARGETS.gelato;
  let h = '<h2 class="an-title">' + L.title + '</h2><p class="an-note">' + L.note + '</p>';
  h += '<div class="metrics">' + METRIC_SPECS.map(sp => metricCard(L, sp, a, targets)).join('') + '</div>';

  h += '<div class="an-row">';
  h += '<div class="an-card"><h3>' + L.scoop + '</h3>' + buildGauge(L, a.servingTemp) + '</div>';
  h += '<div class="an-card"><h3>' + L.fpdfTitle + '</h3><div class="big-num">' + fmt(a.pac, 0) + '</div><p class="an-sub">' + L.fpdfDesc + '</p></div>';
  h += '</div>';

  h += '<div class="an-row">';
  h += '<div class="an-card"><h3>' + L.servingTitle + '</h3><p class="an-sub">' + L.servingDesc + '</p><div class="big-num">' + fmt(a.servingTemp, 1) + ' °C</div></div>';
  h += '<div class="an-card"><h3>' + L.freezeTitle + '</h3><p class="an-sub">' + L.freezeDesc + '</p><div class="big-num">' + fmt(a.freezingPoint, 1) + ' °C</div></div>';
  h += '</div>';

  h += '<div class="an-card wide"><h3>' + L.curveTitle + '</h3><p class="an-sub">' + L.curveDesc + '</p>'
    + buildCurve(L, a.fpdf)
    + '<div class="curve-legend"><span><i class="sw band"></i>' + L.curveBand + '</span><span><i class="sw frz"></i>' + L.curveFreezer + '</span></div></div>';

  const n = a.nutrition;
  h += '<h3 class="an-title">' + L.nutrTitle + '</h3>';
  h += '<table class="nutr"><tbody>'
    + '<tr><td>' + L.nKcal + '</td><td>' + fmt(n.kcal, 0) + ' kcal</td></tr>'
    + '<tr><td>' + L.nFat + '</td><td>' + fmt(n.fat, 1) + ' g</td></tr>'
    + '<tr><td>' + L.nCarb + '</td><td>' + fmt(n.carb, 1) + ' g</td></tr>'
    + '<tr class="sub"><td>' + L.nSugar + '</td><td>' + fmt(n.sugars, 1) + ' g</td></tr>'
    + '<tr><td>' + L.nProtein + '</td><td>' + fmt(n.protein, 1) + ' g</td></tr>'
    + '</tbody></table>';

  return '<section class="analysis">' + h + '</section>';
}

window.renderAnalysis = renderAnalysis;
