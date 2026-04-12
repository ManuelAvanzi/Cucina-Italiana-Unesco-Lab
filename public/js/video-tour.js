/* =====================================================
   CUCINA ITALIANA UNESCO LAB — video-tour.js
   ===================================================== */

let allVideos = [], currentPage = 1, pageSize = 12;
let activeFilter = { territorio: '', tema: '' };

async function initVideoTour() {
  const grid    = document.getElementById('video-grid');
  const loading = document.getElementById('video-loading');

  try {
    if (loading) loading.style.display = 'flex';
    allVideos = await apiFetch('/video?limit=200');

    // Popola counter hero
    const regioni = new Set(allVideos.filter(v => v.regione).map(v => v.regione));
    const temi    = new Set(allVideos.filter(v => v.tema).map(v => v.tema));
    const heroCount   = document.getElementById('hero-count');
    const heroRegioni = document.getElementById('hero-regioni');
    const heroTemi    = document.getElementById('hero-temi');
    if (heroCount)   heroCount.textContent   = allVideos.length;
    if (heroRegioni) heroRegioni.textContent = regioni.size;
    if (heroTemi)    heroTemi.textContent    = temi.size;

    buildTemiFilter(temi);
    buildTerritorioFilter(regioni);
    renderVideos();
  } catch (e) {
    if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Errore nel caricamento dei video.</p></div>`;
  } finally {
    if (loading) loading.style.display = 'none';
  }

  function buildTemiFilter(temi) {
    const container = document.getElementById('filter-temi');
    if (!container) return;
    if (!temi.size) { container.innerHTML = '<span style="font-size:.82rem;color:#bbb;">Nessun tema disponibile.</span>'; return; }
    container.innerHTML = `<button class="filter-btn active" data-tema="">Tutti</button>` +
      [...temi].sort().map(t => `<button class="filter-btn" data-tema="${sanitizeText(t)}">${sanitizeText(t)}</button>`).join('');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter.tema = btn.dataset.tema;
        currentPage = 1;
        renderVideos();
      });
    });
  }

  function buildTerritorioFilter(regioni) {
    const container = document.getElementById('filter-territorio');
    if (!container) return;
    if (!regioni.size) { container.innerHTML = '<span style="font-size:.82rem;color:#bbb;">Nessun territorio disponibile.</span>'; return; }
    container.innerHTML = `<button class="filter-btn active" data-territorio="">Tutti</button>` +
      [...regioni].sort().map(r => `<button class="filter-btn" data-territorio="${sanitizeText(r)}">${sanitizeText(r)}</button>`).join('');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter.territorio = btn.dataset.territorio;
        currentPage = 1;
        renderVideos();
      });
    });
  }

  function getFiltered() {
    const q = (document.getElementById('video-search')?.value || '').toLowerCase();
    return allVideos.filter(v => {
      const okTema  = !activeFilter.tema       || v.tema    === activeFilter.tema;
      const okTerr  = !activeFilter.territorio || v.regione === activeFilter.territorio;
      const okSearch = !q || v.titolo.toLowerCase().includes(q)
        || (v.descrizione   && v.descrizione.toLowerCase().includes(q))
        || (v.istituto_nome && v.istituto_nome.toLowerCase().includes(q));
      return okTema && okTerr && okSearch;
    });
  }

  function renderVideos() {
    if (!grid) return;
    const filtered = getFiltered();
    const start    = (currentPage - 1) * pageSize;
    const page     = filtered.slice(start, start + pageSize);

    const counter = document.getElementById('video-counter');
    if (counter) counter.textContent = `${filtered.length} video`;

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <p>Nessun video trovato per i filtri selezionati.</p>
      </div>`;
      document.getElementById('video-pagination')?.replaceChildren();
      return;
    }

    grid.innerHTML = page.map(v => {
      const thumb = v.youtube_id
        ? `<img src="${ytThumb(v.youtube_id)}" alt="${sanitizeText(v.titolo)}" loading="lazy" onerror="this.src='/assets/placeholder-video.jpg'">`
        : `<div style="width:100%;aspect-ratio:16/9;background:linear-gradient(135deg,#1B4332,#2D6A4F);display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🎬</div>`;

      const temaColor = { 'Ricette tradizionali': '#1B4332', 'Turismo enogastronomico': '#7a4a1e', 'Prodotti tipici': '#155a8a', 'Mercati e sagre': '#5a1588', 'Tecniche di cucina': '#8B1a1a' };
      const tc = temaColor[v.tema] || '#555';

      return `
      <div class="video-card">
        <div class="video-thumb" onclick="openVideoModal('${sanitizeText(v.youtube_id || '')}')">
          ${thumb}
          <div class="video-play-btn"><div class="play-icon">&#9654;</div></div>
          ${v.tema ? `<div style="position:absolute;top:.6rem;left:.6rem;background:${tc};color:#fff;font-size:.68rem;font-weight:700;letter-spacing:.5px;padding:.2rem .55rem;border-radius:4px;text-transform:uppercase;">${sanitizeText(v.tema)}</div>` : ''}
        </div>
        <div class="video-info">
          <h4 style="font-size:.98rem;margin-bottom:.3rem;line-height:1.35;">${sanitizeText(v.titolo)}</h4>
          ${v.descrizione ? `<p style="font-size:.83rem;color:#777;margin:.3rem 0 .6rem;line-height:1.5;">${sanitizeText(v.descrizione.slice(0, 110))}${v.descrizione.length > 110 ? '…' : ''}</p>` : ''}
          <div style="display:flex;align-items:center;justify-content:space-between;margin-top:.5rem;">
            <div style="font-size:.78rem;color:#999;">
              ${v.regione ? `<span style="font-weight:600;color:#2D6A4F;">${sanitizeText(v.regione)}</span>` : ''}
              ${v.regione && v.istituto_nome ? '<span style="margin:0 .3rem;color:#ddd;">·</span>' : ''}
              ${v.istituto_nome ? `<a href="/istituto.html?id=${v.istituto_id}" style="color:#888;text-decoration:none;" onclick="event.stopPropagation()">${sanitizeText(v.istituto_nome)}</a>` : ''}
            </div>
            ${v.youtube_id ? `<a href="https://youtube.com/watch?v=${sanitizeText(v.youtube_id)}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="font-size:.72rem;color:#aaa;text-decoration:none;" title="Apri su YouTube">YT ↗</a>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    renderPagination(filtered.length);
  }

  function renderPagination(total) {
    const container = document.getElementById('video-pagination');
    if (!container) return;
    const pages = Math.ceil(total / pageSize);
    if (pages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage - 1})">&#8249;</button>`;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || Math.abs(i - currentPage) <= 2)
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
      else if (Math.abs(i - currentPage) === 3)
        html += `<span style="padding:0 .4rem;color:#999">…</span>`;
    }
    if (currentPage < pages) html += `<button class="page-btn" onclick="goPage(${currentPage + 1})">&#8250;</button>`;
    container.innerHTML = html;
  }

  window.goPage = (p) => { currentPage = p; renderVideos(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const searchInput = document.getElementById('video-search');
  if (searchInput) {
    let t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { currentPage = 1; renderVideos(); }, 300);
    });
  }
}

document.addEventListener('DOMContentLoaded', initVideoTour);
