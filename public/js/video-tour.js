/* =====================================================
   CUCINA ITALIANA UNESCO LAB — video-tour.js
   ===================================================== */

let allVideos = [], currentPage = 1, pageSize = 12;
let activeFilter = { territorio: '', tema: '' };

async function initVideoTour() {
  const grid = document.getElementById('video-grid');
  const loading = document.getElementById('video-loading');

  try {
    if (loading) loading.style.display = 'flex';
    allVideos = await apiFetch('/video?limit=100');
    await buildTemiFilter();
    await buildTerritorioFilter();
    renderVideos();
  } catch (e) {
    showToast('Errore nel caricamento dei video', 'error');
  } finally {
    if (loading) loading.style.display = 'none';
  }

  async function buildTemiFilter() {
    try {
      const temi = await apiFetch('/video/temi');
      const container = document.getElementById('filter-temi');
      if (!container) return;
      container.innerHTML = `<button class="filter-btn active" data-tema="">Tutti i temi</button>` +
        temi.map(t => `<button class="filter-btn" data-tema="${t}">${t}</button>`).join('');
      container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeFilter.tema = btn.dataset.tema;
          currentPage = 1;
          renderVideos();
        });
      });
    } catch {}
  }

  async function buildTerritorioFilter() {
    const regioni = [...new Set(allVideos.filter(v => v.regione).map(v => v.regione))].sort();
    const container = document.getElementById('filter-territorio');
    if (!container) return;
    container.innerHTML = `<button class="filter-btn active" data-territorio="">Tutti i territori</button>` +
      regioni.map(r => `<button class="filter-btn" data-territorio="${r}">${r}</button>`).join('');
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
    return allVideos.filter(v => {
      const okTema = !activeFilter.tema || v.tema === activeFilter.tema;
      const okTerr = !activeFilter.territorio || v.regione === activeFilter.territorio || (v.territorio && v.territorio.includes(activeFilter.territorio));
      const q = document.getElementById('video-search')?.value?.toLowerCase() || '';
      const okSearch = !q || v.titolo.toLowerCase().includes(q) || (v.descrizione && v.descrizione.toLowerCase().includes(q));
      return okTema && okTerr && okSearch;
    });
  }

  function renderVideos() {
    if (!grid) return;
    const filtered = getFiltered();
    const start = (currentPage - 1) * pageSize;
    const page = filtered.slice(start, start + pageSize);

    const counter = document.getElementById('video-counter');
    if (counter) counter.textContent = `${filtered.length} video`;

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        
        <p>Nessun video trovato per i filtri selezionati.</p>
      </div>`;
      document.getElementById('video-pagination')?.replaceChildren();
      return;
    }

    grid.innerHTML = page.map(v => `
      <div class="video-card">
        <div class="video-thumb" onclick="openVideoModal('${sanitizeText(v.youtube_id)}')">
          <img src="${ytThumb(v.youtube_id)}" alt="${sanitizeText(v.titolo)}" loading="lazy">
          <div class="video-play-btn">
            <div class="play-icon">&#9654;</div>
          </div>
        </div>
        <div class="video-info">
          <h4>${sanitizeText(v.titolo)}</h4>
          ${v.descrizione ? `<p style="font-size:.85rem;color:#666;margin:.35rem 0;">${sanitizeText(v.descrizione.slice(0, 100))}${v.descrizione.length > 100 ? '...' : ''}</p>` : ''}
          <div class="video-meta">
            ${v.tema ? `<span class="badge" style="background:#d8f3e8;color:#1B4332;margin-right:.4rem;">${sanitizeText(v.tema)}</span>` : ''}
            ${v.regione ? `<span>${sanitizeText(v.regione)}</span>` : ''}
            ${v.istituto_nome ? `<span style="margin-left:.5rem;">${sanitizeText(v.istituto_nome)}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');

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
    searchInput.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { currentPage = 1; renderVideos(); }, 300); });
  }
}

document.addEventListener('DOMContentLoaded', initVideoTour);
