/* =====================================================
   CUCINA ITALIANA UNESCO LAB — mappa.js
   Mappa interattiva con Leaflet + OpenStreetMap
   ===================================================== */

let map, markers = [], allIstituti = [];

async function initMappa() {
  map = L.map('map', { center: [42.5, 12.5], zoom: 6, zoomControl: true });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(map);

  // Custom icon factory
  function createMarkerIcon(regione) {
    const colors = {
      'Lombardia':'#2D6A4F','Lazio':'#C44B2F','Campania':'#8B5E3C',
      'Sicilia':'#C69E72','Toscana':'#52B788','Veneto':'#1B4332',
      default: '#2D6A4F'
    };
    const color = colors[regione] || colors.default;
    return L.divIcon({
      className: '',
      html: `<div style="width:30px;height:30px;background:${color};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35);">
               <div style="position:absolute;inset:6px;background:#fff;border-radius:50%;"></div>
             </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -32]
    });
  }

  try {
    allIstituti = await apiFetch('/istituti');
    renderMarkers(allIstituti);
    buildFilters(allIstituti);
    updateCounter(allIstituti.length, allIstituti.length);
  } catch (e) {
    showToast('Errore nel caricamento degli istituti', 'error');
  }

  function renderMarkers(list) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    list.forEach(ist => {
      if (!ist.lat || !ist.lng) return;
      const m = L.marker([ist.lat, ist.lng], { icon: createMarkerIcon(ist.regione) });
      m.bindPopup(buildPopup(ist), { maxWidth: 280 });
      m.on('click', () => loadPopupDetail(ist.id, m));
      m.addTo(map);
      markers.push(m);
    });
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  function buildPopup(ist) {
    return `
      <div class="popup-header">
        <h4>${sanitizeText(ist.nome)}</h4>
        <small>${sanitizeText(ist.citta)}, ${sanitizeText(ist.regione)}</small>
      </div>
      <p style="font-size:.82rem;color:#555;margin-bottom:8px;">${sanitizeText(ist.descrizione || 'Istituto alberghiero')}</p>
      <div id="popup-detail-${ist.id}">
        <div style="height:8px;background:#e8e8e8;border-radius:4px;animation:shimmer 1.4s infinite;"></div>
      </div>
      <a href="/istituto.html?id=${ist.id}" class="popup-btn">Scopri l'istituto &rarr;</a>
    `;
  }

  async function loadPopupDetail(id, marker) {
    try {
      const data = await apiFetch(`/istituti/${id}/mappa`);
      const el = document.getElementById(`popup-detail-${id}`);
      if (!el) return;
      let html = '';
      if (data.immagini && data.immagini.length > 0) {
        html += `<div class="popup-imgs">`;
        data.immagini.forEach(url => { html += `<img src="${url}" alt="" loading="lazy">`; });
        html += `</div>`;
      }
      if (data.video && data.video.length > 0) {
        html += `<div style="display:flex;gap:6px;flex-wrap:wrap;">`;
        data.video.forEach(v => {
          html += `<button onclick="openVideoModal('${sanitizeText(v.youtube_id)}')" style="background:none;border:none;cursor:pointer;padding:0;">
            <img src="${ytThumb(v.youtube_id)}" style="width:90px;border-radius:6px;" alt="${sanitizeText(v.titolo)}">
          </button>`;
        });
        html += `</div>`;
      }
      if (!html) html = `<p style="font-size:.8rem;color:#888;">Nessun contenuto disponibile.</p>`;
      el.innerHTML = html;
      marker.update && marker.update();
    } catch {}
  }

  function buildFilters(list) {
    const regioni = [...new Set(list.map(i => i.regione))].sort();
    const filterEl = document.getElementById('mappa-filters');
    if (!filterEl) return;
    filterEl.innerHTML = `<button class="filter-btn active" data-regione="">Tutte le regioni</button>` +
      regioni.map(r => `<button class="filter-btn" data-regione="${r}">${r}</button>`).join('');
    filterEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterEl.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const regione = btn.dataset.regione;
        const filtered = regione ? allIstituti.filter(i => i.regione === regione) : allIstituti;
        renderMarkers(filtered);
        updateCounter(filtered.length, allIstituti.length);
      });
    });
  }

  function updateCounter(shown, total) {
    const el = document.getElementById('mappa-counter');
    if (el) el.textContent = `${shown} istituti${shown < total ? ' filtrati' : ''}`;
  }

  // Search
  const searchInput = document.getElementById('mappa-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = allIstituti.filter(i =>
        i.nome.toLowerCase().includes(q) ||
        i.citta.toLowerCase().includes(q) ||
        i.regione.toLowerCase().includes(q)
      );
      renderMarkers(filtered);
      updateCounter(filtered.length, allIstituti.length);
    });
  }
}

document.addEventListener('DOMContentLoaded', initMappa);
