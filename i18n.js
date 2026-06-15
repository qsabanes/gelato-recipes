// --- UI strings per language ---
window.LANGS = ['es', 'ca', 'en'];
window.LANG_NAMES = { es: 'ES', ca: 'CA', en: 'EN' };

window.STRINGS = {
  es: {
    search: 'Buscar receta o ingrediente…',
    favorites: '⭐ Favoritos', recents: '🕘 Recientes',
    noResults: 'Sin resultados.', loading: 'Cargando…',
    homeTitle: '🍨 Recetario Gelato',
    homeSub: n => n + ' recetas. Toca una tarjeta o usa el buscador.',
    homeTip: 'Añade la página a la pantalla de inicio para usarla como app.',
    about: 'Recetas generadas con un LLM y afinadas usando Scoopulator e IceCreamCalc como guías. El análisis técnico es una aproximación, no un valor de laboratorio.',
    qty: 'Cantidad', favorite: '☆ Favorito', favorited: '⭐ Favorito',
    screenOn: '🔆 Pantalla', screenOff: '💤 Pantalla', clear: '↺ Limpiar',
    categories: { gelato: 'Gelato', sorbet: 'Sorbete' },
    notFound: f => 'No se pudo cargar la receta (' + f + ').',
    noConfig: 'No se pudo cargar recipes.json.'
  },
  ca: {
    search: 'Cerca recepta o ingredient…',
    favorites: '⭐ Preferits', recents: '🕘 Recents',
    noResults: 'Sense resultats.', loading: 'Carregant…',
    homeTitle: '🍨 Receptari Gelat',
    homeSub: n => n + ' receptes. Toca una targeta o fes servir el cercador.',
    homeTip: "Afegeix la pàgina a la pantalla d'inici per fer-la servir com una app.",
    about: "Receptes generades amb un LLM i afinades fent servir Scoopulator i IceCreamCalc com a guies. L'anàlisi tècnica és una aproximació, no un valor de laboratori.",
    qty: 'Quantitat', favorite: '☆ Preferit', favorited: '⭐ Preferit',
    screenOn: '🔆 Pantalla', screenOff: '💤 Pantalla', clear: '↺ Neteja',
    categories: { gelato: 'Gelat', sorbet: 'Sorbet' },
    notFound: f => "No s'ha pogut carregar la recepta (" + f + ').',
    noConfig: "No s'ha pogut carregar recipes.json."
  },
  en: {
    search: 'Search recipe or ingredient…',
    favorites: '⭐ Favourites', recents: '🕘 Recent',
    noResults: 'No results.', loading: 'Loading…',
    homeTitle: '🍨 Gelato Recipe Book',
    homeSub: n => n + ' recipes. Tap a card or use the search.',
    homeTip: 'Add the page to your home screen to use it like an app.',
    about: 'Recipes generated with an LLM and tuned using Scoopulator and IceCreamCalc as guides. The technical analysis is an approximation, not a lab value.',
    qty: 'Quantity', favorite: '☆ Favourite', favorited: '⭐ Favourite',
    screenOn: '🔆 Screen', screenOff: '💤 Screen', clear: '↺ Reset',
    categories: { gelato: 'Gelato', sorbet: 'Sorbet' },
    notFound: f => 'Could not load recipe (' + f + ').',
    noConfig: 'Could not load recipes.json.'
  }
};
