// --- Recetario Gelato: zero-build static reader ---

const nav = document.getElementById('nav');
const content = document.getElementById('content');
const search = document.getElementById('search');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');

let recipes = [];          // [{file, title, category, tags}]
const bodyCache = {};      // file -> markdown text (for full-text search)
let currentFile = null;
let scaleFactor = 1;
let wakeLock = null;
const wakeSupported = ('wakeLock' in navigator);

// ---------- Storage helpers ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let wakeOn = LS.get('wakeOn', true);

const getFavs = () => LS.get('favorites', []);
const isFav = f => getFavs().includes(f);
function toggleFav(f) {
  let a = getFavs();
  a = a.includes(f) ? a.filter(x => x !== f) : [f, ...a];
  LS.set('favorites', a);
}
function pushRecent(f) {
  let a = LS.get('recents', []).filter(x => x !== f);
  a.unshift(f);
  LS.set('recents', a.slice(0, 6));
}

// ---------- Emoji per recipe ----------
const EMOJI = [
  ['pistach', '🥜'], ['avellan', '🌰'], ['chocolate', '🍫'], ['cacao', '🍫'],
  ['lim', '🍋'], ['albahaca', '🌿'], ['mango', '🥭'], ['sand', '🍉'],
  ['manzana', '🍏'], ['vainilla', '🌼'], ['canela', '🍂'], ['caramelo', '🍮'],
  ['speculoos', '🍪'], ['piparra', '🌶️'], ['fresa', '🍓']
];
function emojiFor(r) {
  const t = (r.title || '').toLowerCase();
  for (const [k, e] of EMOJI) if (t.includes(k)) return e;
  return '🍨';
}

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  LS.set('theme', t);
}
applyTheme(LS.get('theme', null)
  || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
});

// ---------- Mobile sidebar ----------
function openSidebar(open) {
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('show', open);
}
menuToggle.addEventListener('click', () => openSidebar(!sidebar.classList.contains('open')));
backdrop.addEventListener('click', () => openSidebar(false));

// ---------- Sidebar rendering ----------
function recipeByFile(f) { return recipes.find(r => r.file === f); }

function navLink(r) {
  const a = document.createElement('a');
  a.href = '#' + r.file.replace(/\.md$/, '');
  a.dataset.file = r.file;
  a.innerHTML = '<span>' + (isFav(r.file) ? '⭐ ' : '') + r.title + '</span>'
    + ((r.tags && r.tags.length) ? '<span class="tags">' + r.tags.join(' · ') + '</span>' : '');
  return a;
}
function navGroup(title, list) {
  if (!list.length) return;
  const h = document.createElement('div');
  h.className = 'group-title';
  h.textContent = title;
  nav.appendChild(h);
  list.forEach(r => nav.appendChild(navLink(r)));
}

function renderNav(filter = '') {
  const q = filter.trim().toLowerCase();
  nav.innerHTML = '';

  if (q) {
    const list = recipes.filter(r =>
      (r.title + ' ' + (r.tags || []).join(' ') + ' ' + (bodyCache[r.file] || '')).toLowerCase().includes(q));
    if (!list.length) { nav.innerHTML = '<p class="empty">Sin resultados.</p>'; return; }
    const groups = {};
    list.forEach(r => (groups[r.category] = groups[r.category] || []).push(r));
    Object.keys(groups).sort().forEach(cat => navGroup(cat, groups[cat]));
    highlightActive();
    return;
  }

  const favs = getFavs().map(recipeByFile).filter(Boolean);
  const recents = LS.get('recents', []).map(recipeByFile).filter(Boolean);
  navGroup('⭐ Favoritos', favs);
  navGroup('🕘 Recientes', recents);
  const groups = {};
  recipes.forEach(r => (groups[r.category] = groups[r.category] || []).push(r));
  Object.keys(groups).sort().forEach(cat => navGroup(cat, groups[cat]));
  highlightActive();
}

function highlightActive() {
  const current = location.hash.slice(1);
  nav.querySelectorAll('a').forEach(a =>
    a.classList.toggle('active', a.dataset.file.replace(/\.md$/, '') === current));
}

// ---------- Scaling ----------
function scaleHtml(html, f) {
  if (f === 1) return html;
  return html.replace(/(\d+(?:[.,]\d+)?)/g, (m) => {
    const n = parseFloat(m.replace(',', '.'));
    if (isNaN(n)) return m;
    let r = Math.round(n * f * 100) / 100;
    let s = String(r);
    return m.indexOf(',') >= 0 ? s.replace('.', ',') : s;
  });
}
function markScalable() {
  content.querySelectorAll('table').forEach(t => {
    const ths = [...t.querySelectorAll('thead th')];
    const idx = ths.findIndex(th => /cantidad/i.test(th.textContent));
    if (idx < 0) return;
    t.dataset.scalable = '1';
    t.dataset.qtyCol = idx;
    t.querySelectorAll('tbody tr').forEach(tr => {
      const c = tr.children[idx];
      if (c) c.dataset.orig = c.innerHTML;
    });
  });
  const h1 = content.querySelector('h1');
  if (h1) h1.dataset.orig = h1.textContent;
}
function applyScale(f) {
  scaleFactor = f;
  content.querySelectorAll('table[data-scalable]').forEach(t => {
    const idx = +t.dataset.qtyCol;
    t.querySelectorAll('tbody tr').forEach(tr => {
      const c = tr.children[idx];
      if (c && c.dataset.orig !== undefined) c.innerHTML = scaleHtml(c.dataset.orig, f);
    });
  });
  const h1 = content.querySelector('h1');
  if (h1 && h1.dataset.orig !== undefined) {
    h1.textContent = h1.dataset.orig.replace(/(\d+(?:[.,]\d+)?)(\s*g\))/g,
      (m, num, tail) => scaleHtml(num, f) + tail);
  }
  content.querySelectorAll('.scaler button').forEach(b =>
    b.classList.toggle('active', parseFloat(b.dataset.factor) === f));
}

// ---------- Check-off ingredients & steps ----------
function setupChecks() {
  const items = [];
  content.querySelectorAll('table[data-scalable] tbody tr').forEach(el => items.push(el));
  content.querySelectorAll('li').forEach(el => items.push(el));
  const saved = new Set(LS.get('checks:' + currentFile, []));
  items.forEach((el, i) => {
    el.classList.add('checkable');
    if (saved.has(i)) el.classList.add('checked');
    el.addEventListener('click', ev => {
      if (ev.target.closest('a, button')) return;
      ev.stopPropagation();
      el.classList.toggle('checked');
      const cur = new Set(LS.get('checks:' + currentFile, []));
      el.classList.contains('checked') ? cur.add(i) : cur.delete(i);
      LS.set('checks:' + currentFile, [...cur]);
    });
  });
}
function resetChecks() {
  LS.set('checks:' + currentFile, []);
  content.querySelectorAll('.checked').forEach(el => el.classList.remove('checked'));
}

// ---------- Wake lock ----------
async function applyWake() {
  if (wakeOn && currentFile && wakeSupported) {
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
  } else {
    try { if (wakeLock) await wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') applyWake();
});

// ---------- Toolbar ----------
function buildToolbar(meta) {
  const bar = document.createElement('div');
  bar.className = 'toolbar';
  const factors = [['½', 0.5], ['1×', 1], ['2×', 2], ['3×', 3]];
  bar.innerHTML =
    '<div class="scaler"><span class="lbl">Cantidad</span>'
    + factors.map(([t, f]) => '<button data-factor="' + f + '"' + (f === 1 ? ' class="active"' : '') + '>' + t + '</button>').join('')
    + '<input type="number" class="custom" min="0.1" step="0.1" placeholder="×" title="Factor a medida" /></div>'
    + '<div class="tools">'
    + '<button class="tbtn fav-btn">' + (isFav(meta.file) ? '⭐ Favorito' : '☆ Favorito') + '</button>'
    + (wakeSupported ? '<button class="tbtn wake-btn">' + (wakeOn ? '🔆 Pantalla' : '💤 Pantalla') + '</button>' : '')
    + '<button class="tbtn reset-btn">↺ Limpiar</button>'
    + '</div>';

  bar.querySelectorAll('.scaler button').forEach(b =>
    b.addEventListener('click', () => { bar.querySelector('.custom').value = ''; applyScale(parseFloat(b.dataset.factor)); }));
  bar.querySelector('.custom').addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (v > 0) applyScale(v);
  });
  bar.querySelector('.fav-btn').addEventListener('click', e => {
    toggleFav(meta.file);
    e.target.textContent = isFav(meta.file) ? '⭐ Favorito' : '☆ Favorito';
    renderNav(search.value);
  });
  const wb = bar.querySelector('.wake-btn');
  if (wb) wb.addEventListener('click', () => {
    wakeOn = !wakeOn; LS.set('wakeOn', wakeOn);
    wb.textContent = wakeOn ? '🔆 Pantalla' : '💤 Pantalla';
    applyWake();
  });
  bar.querySelector('.reset-btn').addEventListener('click', resetChecks);
  return bar;
}

// ---------- Recipe loading ----------
async function loadRecipe(file) {
  const meta = recipeByFile(file);
  currentFile = file;
  scaleFactor = 1;
  content.innerHTML = '<p class="loading">Cargando…</p>';
  try {
    let md = bodyCache[file];
    if (md === undefined) {
      const res = await fetch('recipes/' + file);
      if (!res.ok) throw new Error(res.status);
      md = await res.text();
      bodyCache[file] = md;
    }
    content.innerHTML = marked.parse(md);
    const h1 = content.querySelector('h1');
    if (h1 && meta) {
      const chips = document.createElement('div');
      chips.className = 'recipe-meta';
      chips.innerHTML = '<span class="chip">' + meta.category + '</span>'
        + (meta.tags || []).map(t => '<span class="chip">' + t + '</span>').join('');
      h1.insertAdjacentElement('afterend', chips);
      chips.insertAdjacentElement('afterend', buildToolbar(meta));
    }
    markScalable();
    applyScale(1);
    setupChecks();
    pushRecent(file);
    renderNav(search.value);
    window.scrollTo(0, 0);
    applyWake();
  } catch (e) {
    content.innerHTML = '<p class="loading">No se pudo cargar la receta (' + file + ').</p>';
  }
}

// ---------- Home (cards) ----------
function cardFor(r) {
  return '<a class="card" href="#' + r.file.replace(/\.md$/, '') + '">'
    + '<span class="card-emoji">' + emojiFor(r) + '</span>'
    + '<span class="card-body"><span class="card-title">' + r.title + '</span>'
    + '<span class="card-tags">' + (r.tags || []).join(' · ') + '</span></span>'
    + '<button class="card-fav" data-file="' + r.file + '" aria-label="Favorito">' + (isFav(r.file) ? '⭐' : '☆') + '</button>'
    + '</a>';
}
function cardSection(title, list) {
  if (!list.length) return '';
  return '<h2 class="home-h">' + title + '</h2><div class="cards">' + list.map(cardFor).join('') + '</div>';
}
function showHome() {
  currentFile = null;
  applyWake();
  const favs = getFavs().map(recipeByFile).filter(Boolean);
  const recents = LS.get('recents', []).map(recipeByFile).filter(Boolean);
  let html = '<h1 class="home-title">🍨 Recetario Gelato</h1>'
    + '<p class="home-sub">' + recipes.length + ' recetas. Toca una tarjeta o usa el buscador. '
    + 'Añade la página a la pantalla de inicio para usarla como app.</p>';
  html += cardSection('⭐ Favoritos', favs);
  html += cardSection('🕘 Recientes', recents);
  const groups = {};
  recipes.forEach(r => (groups[r.category] = groups[r.category] || []).push(r));
  Object.keys(groups).sort().forEach(cat => { html += cardSection(cat, groups[cat]); });
  content.innerHTML = html;
  content.querySelectorAll('.card-fav').forEach(btn => btn.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    toggleFav(btn.dataset.file);
    showHome(); renderNav(search.value);
  }));
}

// ---------- Routing ----------
function route() {
  const slug = location.hash.slice(1);
  highlightActive();
  if (!slug) { showHome(); return; }
  const meta = recipes.find(r => r.file.replace(/\.md$/, '') === slug);
  if (meta) loadRecipe(meta.file); else showHome();
  openSidebar(false);
}
window.addEventListener('hashchange', route);
search.addEventListener('input', () => renderNav(search.value));

// ---------- Init ----------
(async function init() {
  try {
    recipes = await (await fetch('recipes.json')).json();
  } catch (e) {
    content.innerHTML = '<p class="loading">No se pudo cargar recipes.json.</p>';
    return;
  }
  recipes.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  renderNav();
  route();
  recipes.forEach(r => fetch('recipes/' + r.file).then(x => x.ok ? x.text() : '')
    .then(t => { if (t) bodyCache[r.file] = t; }).catch(() => {}));
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
