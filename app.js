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

// ---------- Theme ----------
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('theme', t); } catch (e) {}
}
applyTheme(
  (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })()
  || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
);
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
function renderNav(filter = '') {
  const q = filter.trim().toLowerCase();
  let list = recipes;
  if (q) {
    list = recipes.filter(r => {
      const hay = (r.title + ' ' + (r.tags || []).join(' ') + ' ' + (bodyCache[r.file] || '')).toLowerCase();
      return hay.includes(q);
    });
  }
  nav.innerHTML = '';
  if (!list.length) {
    nav.innerHTML = '<p class="empty">Sin resultados.</p>';
    return;
  }
  const groups = {};
  list.forEach(r => { (groups[r.category] = groups[r.category] || []).push(r); });
  Object.keys(groups).sort().forEach(cat => {
    const h = document.createElement('div');
    h.className = 'group-title';
    h.textContent = cat;
    nav.appendChild(h);
    groups[cat].forEach(r => {
      const a = document.createElement('a');
      a.href = '#' + r.file.replace(/\.md$/, '');
      a.dataset.file = r.file;
      a.innerHTML = '<span>' + r.title + '</span>'
        + ((r.tags && r.tags.length) ? '<span class="tags">' + r.tags.join(' · ') + '</span>' : '');
      nav.appendChild(a);
    });
  });
  highlightActive();
}

function highlightActive() {
  const current = location.hash.slice(1);
  nav.querySelectorAll('a').forEach(a => {
    a.classList.toggle('active', a.dataset.file.replace(/\.md$/, '') === current);
  });
}

// ---------- Recipe loading ----------
async function loadRecipe(file) {
  const meta = recipes.find(r => r.file === file);
  content.innerHTML = '<p class="loading">Cargando…</p>';
  try {
    let md = bodyCache[file];
    if (md === undefined) {
      const res = await fetch('recipes/' + file);
      if (!res.ok) throw new Error(res.status);
      md = await res.text();
      bodyCache[file] = md;
    }
    const chips = meta && meta.tags && meta.tags.length
      ? '<div class="recipe-meta">'
        + '<span class="chip">' + meta.category + '</span>'
        + meta.tags.map(t => '<span class="chip">' + t + '</span>').join('')
        + '</div>'
      : '';
    // Insert chips right after the first heading.
    const html = marked.parse(md);
    content.innerHTML = html.replace(/(<\/h1>)/i, '$1' + chips);
    content.scrollTo ? window.scrollTo(0, 0) : null;
    window.scrollTo(0, 0);
  } catch (e) {
    content.innerHTML = '<p class="loading">No se pudo cargar la receta (' + file + ').</p>';
  }
}

// ---------- Routing ----------
function route() {
  const slug = location.hash.slice(1);
  highlightActive();
  if (!slug) { showHome(); return; }
  const meta = recipes.find(r => r.file.replace(/\.md$/, '') === slug);
  if (meta) loadRecipe(meta.file);
  else showHome();
  openSidebar(false);
}

function showHome() {
  const count = recipes.length;
  content.innerHTML =
    '<h1>🍨 Recetario Gelato</h1>'
    + '<p>' + count + ' recetas de gelato y sorbete. Elige una en el menú lateral '
    + 'o usa el buscador para filtrar por nombre o ingrediente.</p>'
    + '<p class="loading">Consejo: añade esta página a la pantalla de inicio del móvil para abrirla como una app.</p>';
}

window.addEventListener('hashchange', route);
search.addEventListener('input', () => renderNav(search.value));

// ---------- Init ----------
(async function init() {
  try {
    const res = await fetch('recipes.json');
    recipes = await res.json();
  } catch (e) {
    content.innerHTML = '<p class="loading">No se pudo cargar recipes.json.</p>';
    return;
  }
  recipes.sort((a, b) => a.title.localeCompare(b.title, 'es'));
  renderNav();
  route();
  // Lazily prefetch bodies so search covers ingredients too.
  recipes.forEach(r => {
    fetch('recipes/' + r.file).then(x => x.ok ? x.text() : '').then(t => { if (t) bodyCache[r.file] = t; }).catch(() => {});
  });
})();
