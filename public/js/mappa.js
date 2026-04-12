/* =====================================================
   CUCINA ITALIANA UNESCO LAB — mappa.js
   Mappa interattiva con Leaflet + OpenStreetMap
   ===================================================== */

let map, markers = [], allIstituti = [];

async function initMappa() {
  const italyBounds = L.latLngBounds([32.0, 3.0], [51.0, 22.0]);
  map = L.map('map', {
    center: [42.5, 12.5],
    zoom: 6,
    zoomControl: true,
    minZoom: 5,
    maxZoom: 16,
    maxBounds: italyBounds,
    maxBoundsViscosity: 0.7
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 16
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
      m.bindPopup(buildPopup(ist), {
        maxWidth: 310,
        autoPanPaddingTopLeft: L.point(10, 60),
        autoPanPaddingBottomRight: L.point(10, 20)
      });
      m.on('click', () => {
        map.panTo(m.getLatLng(), { animate: true, duration: 0.5 });
        loadPopupDetail(ist.id, m);
      });
      m.addTo(map);
      markers.push(m);
    });
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  function buildPopup(ist) {
    const desc = (ist.descrizione || 'Istituto alberghiero e di ristorazione').slice(0, 85);
    const tail = ist.descrizione && ist.descrizione.length > 85 ? '…' : '';
    return `
      <div style="padding:0;background:#fff;border-radius:8px;overflow:hidden;min-width:280px;">
        <div style="background:linear-gradient(135deg,#1B4332,#2D6A4F);padding:1.2rem;text-align:center;position:relative;">
          ${ist.logo ? `<img src="${ist.logo}" style="width:50px;height:50px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.6);margin-bottom:.5rem;">` : ''}
          <h4 style="color:#fff;margin:.3rem 0;font-size:1rem;">${sanitizeText(ist.nome)}</h4>
          <div style="font-size:.8rem;color:rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;gap:.3rem;">
            <span style="color:#81b99a;">●</span> ${sanitizeText(ist.citta)}, ${sanitizeText(ist.regione)}
          </div>
        </div>
        <div style="padding:1rem;">
          <p style="font-size:.83rem;color:#555;line-height:1.5;margin:.3rem 0;">${sanitizeText(desc)}${tail}</p>
          <div id="popup-detail-${ist.id}" style="margin-top:.8rem;"></div>
        </div>
        <a href="/istituto.html?id=${ist.id}" style="display:block;background:#C44B2F;color:#fff;text-align:center;padding:.65rem;text-decoration:none;font-weight:600;font-size:.85rem;transition:background .3s;" onmouseover="this.style.background='#a33b22'" onmouseout="this.style.background='#C44B2F'">Scopri l'istituto →</a>
      </div>
    `;
  }

  async function loadPopupDetail(id, marker) {
    try {
      const data = await apiFetch(`/istituti/${id}/mappa`);
      const el = document.getElementById(`popup-detail-${id}`);
      if (!el) return;
      let html = '';
      const hasImgs = data.immagini && data.immagini.length > 0;
      const hasVideo = data.video && data.video.length > 0;
      const totalContent = data.contentCount || 0;

      if (hasImgs) {
        html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:.8rem;">`;
        data.immagini.forEach(url => { html += `<img src="${url}" alt="" style="width:100%;aspect-ratio:1;border-radius:6px;object-fit:cover;" loading="lazy">`; });
        html += `</div>`;
      }
      if (hasVideo) {
        html += `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:.8rem;">`;
        data.video.forEach(v => {
          html += `<button onclick="openVideoModal('${sanitizeText(v.youtube_id)}')" style="background:none;border:none;cursor:pointer;padding:0;position:relative;">
            <img src="${ytThumb(v.youtube_id)}" style="width:80px;height:45px;border-radius:5px;object-fit:cover;">
            <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.9rem;">▶</span>
          </button>`;
        });
        html += `</div>`;
      }
      if (html) {
        html += `<div style="font-size:.75rem;color:#999;padding-top:.6rem;border-top:1px solid #eee;text-align:center;">Vai alla pagina per tutti i ${totalContent} contenut${totalContent===1?'o':'i'} ↓</div>`;
      } else if (totalContent > 0) {
        html = `<div style="font-size:.8rem;color:#666;padding:.6rem;text-align:center;">📝 <strong>${totalContent} contenut${totalContent===1?'o':'i'}</strong> caricato${totalContent===1?'':'i'}<br><span style="font-size:.75rem;color:#999;">(testi, ricette e altro)</span></div>`;
      }
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
