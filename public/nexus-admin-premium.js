/* CUYRA Admin · mejoras de presentación sobre nexus-admin-v5.js.
   Tema claro/oscuro (claro por defecto), iconos Lucide en lugar de caracteres,
   estado de conexión, giro del botón de actualizar y crédito al pie.
   No cambia IDs, endpoints ni la forma de autenticar. */
(() => {
  'use strict';
  const ICONS = window.CUYRA_ICONS || {};
  const THEME_KEY = 'cuyra-admin-theme';
  const $ = id => document.getElementById(id);
  const icon = (name, cls = '') => ICONS[name] ? `<svg class="cuyra-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>` : '';
  const setIconLabel = (el, name, label) => { if (el) el.innerHTML = `${icon(name)}<span>${label}</span>` };

  function applyTheme(mode, persist) {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.dataset.theme = mode; root.style.colorScheme = mode;
    if (persist) try { localStorage.setItem(THEME_KEY, mode) } catch {}
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  }

  function themeToggle() {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'admin-theme-toggle';
    btn.innerHTML = icon('sun', 'ico-sun') + icon('moon', 'ico-moon');
    const sync = () => { const next = document.documentElement.dataset.theme === 'dark' ? 'claro' : 'oscuro'; btn.setAttribute('aria-label', `Activar modo ${next}`); btn.title = `Activar modo ${next}` };
    btn.addEventListener('click', () => { applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true); sync() });
    sync();
    return btn;
  }

  // Íconos para los subtítulos de la vitrina, por su texto.
  const SECTION_ICONS = [[/checkout|entrega/i, 'truck'], [/agencias/i, 'package'], [/pago/i, 'credit-card'], [/anuncio/i, 'megaphone'],
    [/logos|marcas/i, 'tags'], [/portada/i, 'layout-panel-top'], [/presentaci/i, 'store']];

  function decorateProducts(root) {
    root.querySelectorAll('.v5-product-missing:not([data-ico])').forEach(el => { el.dataset.ico = '1'; el.innerHTML = icon('image-off') });
    root.querySelectorAll('.v5-edit-trigger:not([data-ico])').forEach(el => { el.dataset.ico = '1'; el.innerHTML = icon('pencil') + `<span>${el.textContent.trim()}</span>` });
    const empty = root.querySelector('.v5-empty-products:not([data-ico])');
    if (empty) { empty.dataset.ico = '1'; empty.insertAdjacentHTML('afterbegin', icon('package')) }
  }

  function init() {
    if (!document.querySelector('.v5-shell')) return;

    const actions = document.querySelector('.v51-top-actions');
    if (actions) actions.append(themeToggle());

    // Barra superior: línea inferior al desplazarse
    const topbar = document.querySelector('.v51-topbar');
    if (topbar) { const on = () => topbar.classList.toggle('is-scrolled', window.scrollY > 4); on(); window.addEventListener('scroll', on, { passive: true }) }

    // Botones con icono
    const refresh = $('v51-refresh-products');
    setIconLabel(refresh, 'refresh-cw', 'Actualizar productos');
    if (refresh) {
      refresh.addEventListener('click', () => {
        if (!$('secret')?.value.trim() || !$('slug')?.value.trim()) return;
        refresh.classList.add('is-spinning'); refresh.disabled = true;
        const done = () => { refresh.classList.remove('is-spinning'); refresh.disabled = false };
        window.addEventListener('nexus:products-loaded', done, { once: true }); setTimeout(done, 15000);
      });
    }
    const jump = $('v51-jump-products'); if (jump) jump.innerHTML = `<span>Abrir productos</span>${icon('chevron-right')}`;
    setIconLabel($('create'), 'store', $('create')?.textContent.trim() || '');
    setIconLabel($('rotate'), 'key-round', $('rotate')?.textContent.trim() || '');
    setIconLabel($('rotateSofia'), 'shield-check', $('rotateSofia')?.textContent.trim() || '');
    setIconLabel($('testBackend'), 'terminal', $('testBackend')?.textContent.trim() || '');
    setIconLabel($('saveStorefront'), 'check', $('saveStorefront')?.textContent.trim() || '');
    setIconLabel($('loadMerchandising'), 'refresh-cw', $('loadMerchandising')?.textContent.trim() || '');
    setIconLabel($('loadReviews'), 'star', $('loadReviews')?.textContent.trim() || '');
    setIconLabel($('loadStorefront'), 'store', $('loadStorefront')?.textContent.trim() || '');
    const prev = $('v5-prev'), next = $('v5-next');
    if (prev) prev.innerHTML = `${icon('chevron-left')}<span>Anterior</span>`;
    if (next) next.innerHTML = `<span>Siguiente</span>${icon('chevron-right')}`;
    const close = document.querySelector('.v5-editor-heading button[aria-label="Cerrar"]'); if (close) close.innerHTML = icon('x');
    const search = $('v5-search');
    if (search) { search.placeholder = 'Nombre, SKU, marca o categoría…'; search.insertAdjacentHTML('afterend', icon('search')) }

    // Estado de conexión: el texto "●  Empresa configurada" pasa a un indicador real
    const conn = $('v51-toggle-connection');
    if (conn) {
      const render = () => {
        const connected = /configurada/i.test(conn.textContent);
        const html = connected ? `${icon('circle-check')}<span>Empresa conectada</span>` : `${icon('plug-zap')}<span>Conectar catálogo</span>`;
        if (conn.dataset.state !== String(connected)) { conn.dataset.state = String(connected); conn.classList.toggle('is-connected', connected); obs.disconnect(); conn.innerHTML = html; obs.observe(conn, { childList: true, characterData: true, subtree: true }) }
      };
      const obs = new MutationObserver(() => { conn.dataset.state = ''; render() });
      render(); obs.observe(conn, { childList: true, characterData: true, subtree: true });
    }

    // Estadísticas con icono
    [['package', 'v51-stat-total'], ['package-check', 'v51-stat-in'], ['package-x', 'v51-stat-out'], ['badge-percent', 'v51-stat-offer']]
      .forEach(([name, id]) => $(id)?.closest('.v51-stat')?.insertAdjacentHTML('afterbegin', `<span class="stat-ico">${icon(name)}</span>`));

    // Subtítulos de la vitrina
    document.querySelectorAll('.v5-panel .section h3').forEach(h => { const hit = SECTION_ICONS.find(([re]) => re.test(h.textContent)); if (hit) h.insertAdjacentHTML('afterbegin', icon(hit[1])) });

    // Tabla y vista móvil se regeneran al filtrar: se decoran al cambiar
    const list = $('merchandising');
    if (list) { decorateProducts(list); new MutationObserver(() => decorateProducts(list)).observe(list, { childList: true }) }

    // Crédito discreto
    const workspace = document.querySelector('.v5-workspace');
    if (workspace) workspace.insertAdjacentHTML('beforeend', '<p class="admin-credit">Programación por <b>Oliver Lugo</b> · Crea tu página web o catálogo con <b>Shalom OD</b></p>');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
