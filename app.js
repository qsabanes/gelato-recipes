// --- Recetario Gelato: zero-build static reader (multilingual) ---

const nav = document.getElementById('nav');
const content = document.getElementById('content');
const search = document.getElementById('search');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('backdrop');
const menuToggle = document.getElementById('menuToggle');
const themeToggle = document.getElementById('themeToggle');
const langSwitch = document.getElementById('langSwitch');
const brand = document.querySelector('.brand');

let recipes = [];
const bodyCache = {};       // "lang/file" -> markdown text
let currentFile = null;
let scaleFactor = 1;
let wakeLock = null;
const wakeSupported = ('wakeLock' in navigator);

// ---------- Storage ----------
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
let wakeOn = LS.get('wakeOn', true);

// ---------- Language ----------
let lang = LS.get('lang', null);
if (!lang || !window.LANGS.includes(lang)) {
  const nl = (navigator.language || 'es').toLowerCase();
  lang = nl.startsWith('ca') ? 'ca' : nl.startsWith('en') ? 'en' : 'es';
}
const T = () => window.STRINGS[lang] || window.STRINGS.es;
const loc = r => r[lang] || r.es;
const titleOf = r => loc(r).title;
const tagsOf = r => loc(r).tags || [];
const catName = c => T().categories[c] || c;
const bodyKey = f => lang + '/' + f;

// ---------- Favorites / recents ----------
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

// ---------- Emoji per recipe (by file, language-independent) ----------
const EMOJI = {
  'canela.md': '🍂', 'caramelo.md': '🍮', 'chocolate.md': '🍫', 'pistacho.md': '🥜',
  'avellana.md': '🌰', 'speculoos.md': '🍪', 'vainilla.md': '🌼', 'limon-albahaca.md': '🍋',
  'mango.md': '🥭', 'sandia.md': '🍉', 'manzana-verde.md': '🍏', 'piparra.md': '🌶️'
};
const emojiFor = r => EMOJI[r.file] || '🍨';

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  LS.set('theme', t);
}
applyTheme(LS.get('theme', null)
  || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click', () =>
  applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

// ---------- Mobile sidebar ----------
function openSidebar(open) {
  sidebar.classList.toggle('open', open);
  backdrop.classList.toggle('show', open);
}
menuToggle.addEventListener('click', () => openSidebar(!sidebar.classList.contains('open')));
backdrop.addEventListener('click', () => openSidebar(false));

// ---------- Language switcher ----------
function renderLangSwitch() {
  langSwitch.innerHTML = window.LANGS.map(l =>
    '<button data-l="' + l + '"' + (l === lang ? ' class="active"' : '') + '>' + window.LANG_NAMES[l] + '</button>').join('');
  langSwitch.querySelectorAll('button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.l)));
}
function applyChrome() {
  document.documentElement.setAttribute('lang', lang);
  document.title = T().homeTitle.replace(/^[^\w]+/, '').trim();
  brand.textContent = T().homeTitle;
  search.placeholder = T().search;
}
function setLang(l) {
  if (l === lang) return;
  lang = l; LS.set('lang', l);
  applyChrome();
  renderLangSwitch();
  recipes.sort((a, b) => titleOf(a).localeCompare(titleOf(b), lang));
  renderNav(search.value);
  route();
  prefetchBodies();
}

// ---------- Sidebar ----------
const recipeByFile = f => recipes.find(r => r.file === f);

function navLink(r) {
  const a = document.createElement('a');
  a.href = '#' + r.file.replace(/\.md$/, '');
  a.dataset.file = r.file;
  a.innerHTML = '<span>' + (isFav(r.file) ? '⭐ ' : '') + titleOf(r) + '</span>'
    + (tagsOf(r).length ? '<span class="tags">' + tagsOf(r).join(' · ') + '</span>' : '');
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
      (titleOf(r) + ' ' + tagsOf(r).join(' ') + ' ' + (bodyCache[bodyKey(r.file)] || '')).toLowerCase().includes(q));
    if (!list.length) { nav.innerHTML = '<p class="empty">' + T().noResults + '</p>'; return; }
    const groups = {};
    list.forEach(r => (groups[r.category] = groups[r.category] || []).push(r));
    Object.keys(groups).sort().forEach(c => navGroup(catName(c), groups[c]));
    highlightActive();
    return;
  }
  navGroup(T().favorites, getFavs().map(recipeByFile).filter(Boolean));
  navGroup(T().recents, LS.get('recents', []).map(recipeByFile).filter(Boolean));
  const groups = {};
  recipes.forEach(r => (groups[r.category] = groups[r.category] || []).push(r));
  Object.keys(groups).sort().forEach(c => navGroup(catName(c), groups[c]));
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
  return html.replace(/(\d+(?:[.,]\d+)?)/g, m => {
    const n = parseFloat(m.replace(',', '.'));
    if (isNaN(n)) return m;
    const r = Math.round(n * f * 100) / 100;
    return m.indexOf(',') >= 0 ? String(r).replace('.', ',') : String(r);
  });
}
function markScalable() {
  content.querySelectorAll('table').forEach(t => {
    const ths = [...t.querySelectorAll('thead th')];
    const idx = ths.findIndex(th => /cantidad|quantitat|quantity/i.test(th.textContent));
    if (idx < 0) return;
    t.dataset.scalable = '1';
    t.dataset.qtyCol = idx;
    t.querySelectorAll('tbody tr').forEach(tr => { const c = tr.children[idx]; if (c) c.dataset.orig = c.innerHTML; });
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
  if (h1 && h1.dataset.orig !== undefined)
    h1.textContent = h1.dataset.orig.replace(/(\d+(?:[.,]\d+)?)(\s*g\))/g, (m, num, tail) => scaleHtml(num, f) + tail);
  content.querySelectorAll('.scaler button').forEach(b =>
    b.classList.toggle('active', parseFloat(b.dataset.factor) === f));
}

// ---------- Check-off ----------
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
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') applyWake(); });

// ---------- Toolbar ----------
function buildToolbar(meta) {
  const bar = document.createElement('div');
  bar.className = 'toolbar';
  const factors = [['½', 0.5], ['1×', 1], ['2×', 2], ['3×', 3]];
  bar.innerHTML =
    '<div class="scaler"><span class="lbl">' + T().qty + '</span>'
    + factors.map(([t, f]) => '<button data-factor="' + f + '"' + (f === 1 ? ' class="active"' : '') + '>' + t + '</button>').join('')
    + '<input type="number" class="custom" min="0.1" step="0.1" placeholder="×" /></div>'
    + '<div class="tools">'
    + '<button class="tbtn fav-btn">' + (isFav(meta.file) ? T().favorited : T().favorite) + '</button>'
    + (wakeSupported ? '<button class="tbtn wake-btn">' + (wakeOn ? T().screenOn : T().screenOff) + '</button>' : '')
    + '<button class="tbtn reset-btn">' + T().clear + '</button></div>';

  bar.querySelectorAll('.scaler button').forEach(b =>
    b.addEventListener('click', () => { bar.querySelector('.custom').value = ''; applyScale(parseFloat(b.dataset.factor)); }));
  bar.querySelector('.custom').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) applyScale(v); });
  bar.querySelector('.fav-btn').addEventListener('click', e => {
    toggleFav(meta.file);
    e.target.textContent = isFav(meta.file) ? T().favorited : T().favorite;
    renderNav(search.value);
  });
  const wb = bar.querySelector('.wake-btn');
  if (wb) wb.addEventListener('click', () => {
    wakeOn = !wakeOn; LS.set('wakeOn', wakeOn);
    wb.textContent = wakeOn ? T().screenOn : T().screenOff;
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
  content.innerHTML = '<p class="loading">' + T().loading + '</p>';
  try {
    let md = bodyCache[bodyKey(file)];
    if (md === undefined) {
      let res = await fetch('recipes/' + lang + '/' + file);
      if (!res.ok && lang !== 'es') res = await fetch('recipes/es/' + file);
      if (!res.ok) throw new Error(res.status);
      md = await res.text();
      bodyCache[bodyKey(file)] = md;
    }
    content.innerHTML = marked.parse(md);
    const h1 = content.querySelector('h1');
    if (h1 && meta) {
      const chips = document.createElement('div');
      chips.className = 'recipe-meta';
      chips.innerHTML = '<span class="chip">' + catName(meta.category) + '</span>'
        + tagsOf(meta).map(t => '<span class="chip">' + t + '</span>').join('');
      h1.insertAdjacentElement('afterend', chips);
      chips.insertAdjacentElement('afterend', buildToolbar(meta));
    }
    markScalable();
    applyScale(1);
    setupChecks();
    if (meta && meta.notes)
      content.insertAdjacentHTML('beforeend',
        '<section class="tasting-notes"><h3>' + T().tastingNotes + '</h3><p>'
        + meta.notes.replace(/\n/g, '<br>') + '</p></section>');
    if (meta && meta.ingredients && window.renderAnalysis)
      content.insertAdjacentHTML('beforeend', renderAnalysis(meta.ingredients, meta.category, lang));
    pushRecent(file);
    renderNav(search.value);
    window.scrollTo(0, 0);
    applyWake();
  } catch (e) {
    content.innerHTML = '<p class="loading">' + T().notFound(file) + '</p>';
  }
}

// ---------- Home ----------
function cardFor(r) {
  let kcalBadge = '';
  if (r.ingredients && window.Calc) {
    const kcal = Math.round(Calc.analyze(r.ingredients).nutrition.kcal);
    const cat = kcal < 130 ? T().kcalLight : kcal < 190 ? T().kcalMed : T().kcalRich;
    kcalBadge = '<span class="kcal-badge">' + cat + ' · ' + kcal + ' kcal</span>';
  }
  return '<a class="card" href="#' + r.file.replace(/\.md$/, '') + '">'
    + '<span class="card-body"><span class="card-title">' + titleOf(r) + '</span>'
    + '<span class="card-tags">' + tagsOf(r).join(' · ') + '</span>'
    + kcalBadge + '</span>'
    + '<button class="card-fav" data-file="' + r.file + '">' + (isFav(r.file) ? '⭐' : '☆') + '</button></a>';
}
function cardSection(title, list) {
  return list.length ? '<h2 class="home-h">' + title + '</h2><div class="cards">' + list.map(cardFor).join('') + '</div>' : '';
}
function showHome() {
  currentFile = null;
  applyWake();
  const favs = getFavs().map(recipeByFile).filter(Boolean);
  const recents = LS.get('recents', []).map(recipeByFile).filter(Boolean);
  let html = '<h1 class="home-title">' + T().homeTitle + '</h1>'
    + '<p class="home-sub">' + T().homeSub(recipes.length) + ' ' + T().homeTip + '</p>';
  html += cardSection(T().favorites, favs);
  html += cardSection(T().recents, recents);
  const groups = {};
  recipes.forEach(r => (groups[r.category] = groups[r.category] || []).push(r));
  Object.keys(groups).sort().forEach(c => { html += cardSection(catName(c), groups[c]); });
  html += '<p class="about-note">' + T().about + '</p>';
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

// ---------- Prefetch (for offline + full-text search) ----------
function prefetchBodies() {
  recipes.forEach(r => {
    if (bodyCache[bodyKey(r.file)] !== undefined) return;
    fetch('recipes/' + lang + '/' + r.file)
      .then(x => x.ok ? x.text() : fetch('recipes/es/' + r.file).then(y => y.ok ? y.text() : ''))
      .then(t => { if (t) bodyCache[bodyKey(r.file)] = t; }).catch(() => {});
  });
}

// ---------- Init ----------
(async function init() {
  try {
    recipes = await (await fetch('recipes.json')).json();
  } catch (e) {
    content.innerHTML = '<p class="loading">' + T().noConfig + '</p>';
    return;
  }
  recipes.sort((a, b) => titleOf(a).localeCompare(titleOf(b), lang));
  applyChrome();
  renderLangSwitch();
  renderNav();
  route();
  prefetchBodies();
  if ('serviceWorker' in navigator)
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
