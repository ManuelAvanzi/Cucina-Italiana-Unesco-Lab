/* =====================================================
   CUCINA ITALIANA UNESCO LAB — unsplash.js
   Helper per caricare immagini Unsplash via API backend
   ===================================================== */

const _imgCache = {};

/**
 * Carica un'immagine Unsplash per una regione o tema.
 * Se API non configurata, usa CSS fallback.
 * @param {string} tipo  — 'regione' o 'tema'
 * @param {string} nome  — es. 'toscana', 'pasta', 'hero'
 * @param {string|HTMLElement} target — selettore CSS o elemento
 * @param {string} size  — 'small' | 'regular' | 'full'
 */
async function loadUnsplashImage(tipo, nome, target, size = 'regular') {
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  if (!el) return;

  const cacheKey = `${tipo}:${nome}`;
  if (_imgCache[cacheKey]) {
    applyImage(el, _imgCache[cacheKey], size);
    return;
  }

  try {
    const data = await fetch(`/api/immagini/${tipo}/${encodeURIComponent(nome)}`).then(r => r.json());
    if (data.fallback) return; // usa CSS fallback
    _imgCache[cacheKey] = data;
    applyImage(el, data, size);
  } catch {}
}

function applyImage(el, data, size) {
  const url = data[`url_${size}`] || data.url_regular || data.url_small;
  if (!url) return;

  // Se è un elemento con background-image
  if (el.classList.contains('regione-card-bg') || el.dataset.bg) {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    // Aggiungi attribuzione
    addAttribution(el.closest('[data-attrib]') || el.parentElement, data);
  }
  // Se è un <img>
  else if (el.tagName === 'IMG') {
    el.src = url;
    el.alt = data.alt || '';
  }
  // Altrimenti come background
  else {
    el.style.backgroundImage = `url('${url}')`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    addAttribution(el, data);
  }
}

function addAttribution(container, data) {
  if (!container || !data.photographer) return;
  // Rimuovi attribuzione precedente
  container.querySelector('.unsplash-credit')?.remove();
  const credit = document.createElement('a');
  credit.className = 'unsplash-credit';
  credit.href = data.photographer_url || '#';
  credit.target = '_blank';
  credit.rel = 'noopener';
  credit.textContent = `📷 ${data.photographer} · Unsplash`;
  credit.style.cssText = 'position:absolute;bottom:6px;right:8px;font-size:.62rem;color:rgba(255,255,255,.65);text-decoration:none;z-index:10;background:rgba(0,0,0,.3);padding:2px 6px;border-radius:4px;';
  container.style.position = container.style.position || 'relative';
  container.appendChild(credit);
}

/**
 * Carica immagini per tutte le .regione-card-bg con data-regione
 */
async function loadAllRegioneCards() {
  const cards = document.querySelectorAll('[data-regione]');
  for (const card of cards) {
    const regione = card.dataset.regione;
    const bgEl = card.querySelector('.regione-card-bg');
    if (bgEl) {
      await loadUnsplashImage('regione', regione, bgEl);
      card.setAttribute('data-attrib', '');
    }
  }
}

/**
 * Carica immagine hero
 */
async function loadHeroImage(selector = '.hero-bg') {
  await loadUnsplashImage('tema', 'hero', selector);
}

/**
 * Carica immagini per card piatto (data-food-tema)
 */
async function loadFoodCardImages() {
  const cards = document.querySelectorAll('[data-food-tema]');
  for (const card of cards) {
    const tema = card.dataset.foodTema;
    await loadUnsplashImage('tema', tema, card);
  }
}

window.loadUnsplashImage = loadUnsplashImage;
window.loadAllRegioneCards = loadAllRegioneCards;
window.loadHeroImage = loadHeroImage;
window.loadFoodCardImages = loadFoodCardImages;
