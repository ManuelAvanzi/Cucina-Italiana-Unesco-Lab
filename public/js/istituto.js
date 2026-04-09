/* =====================================================
   CUCINA ITALIANA UNESCO LAB — istituto.js
   Pagina singolo istituto con tab sections
   ===================================================== */

async function initIstitutoPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location = '/istituti.html'; return; }

  try {
    const data = await apiFetch(`/istituti/${id}`);
    renderIstituto(data);
  } catch (e) {
    document.getElementById('istituto-main').innerHTML = `
      <div class="empty-state" style="padding:6rem 1rem;">
        
        <h3>Istituto non trovato</h3>
        <p>Torna alla <a href="/istituti.html">lista istituti</a>.</p>
      </div>`;
  }
}

function renderIstituto(data) {
  document.title = `${data.nome} — Cucina Italiana UNESCO Lab`;

  // Hero
  const hero = document.getElementById('istituto-hero');
  if (hero) {
    const regioneSlug = (data.regione || '').toLowerCase().replace(/\s+/g, '-');
    hero.innerHTML = `
      <div class="istituto-hero-bg" style="position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity .6s;"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(27,67,50,.7),rgba(27,67,50,.85));"></div>
      <div class="container" style="text-align:center;position:relative;z-index:1;">
        ${data.logo ? `<img src="${data.logo}" alt="${sanitizeText(data.nome)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,.4);margin-bottom:1.25rem;">` : ''}
        <div style="font-size:.78rem;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:.5rem;">Istituto Alberghiero</div>
        <h1 style="color:#fff;margin-bottom:.5rem;">${sanitizeText(data.nome)}</h1>
        <p style="color:rgba(255,255,255,.8);font-size:1rem;">
          ${sanitizeText(data.citta)}${data.provincia ? `, ${data.provincia}` : ''} — ${sanitizeText(data.regione)}
        </p>
        ${data.descrizione ? `<p style="color:rgba(255,255,255,.7);max-width:600px;margin:1rem auto 0;font-size:.95rem;">${sanitizeText(data.descrizione)}</p>` : ''}
        <div style="margin-top:1.5rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          ${data.sito_web ? `<a href="${data.sito_web}" target="_blank" rel="noopener" class="btn btn-outline" style="font-size:.85rem;">Sito web</a>` : ''}
          ${data.email ? `<a href="mailto:${data.email}" class="btn btn-outline" style="font-size:.85rem;">Contatti</a>` : ''}
        </div>
      </div>`;
    hero.style.position = 'relative';
    hero.style.overflow = 'hidden';
    // Load Unsplash background for this region
    if (window.loadUnsplashImage && regioneSlug) {
      window.loadUnsplashImage('regione', regioneSlug, hero.querySelector('.istituto-hero-bg'));
    }
  }

  // Organize content by section
  const sezioni = { artusi: [], campanello: [], storie: [], generale: [] };
  (data.contenuti || []).forEach(c => { if (sezioni[c.sezione]) sezioni[c.sezione].push(c); });

  // Render tabs
  renderSezione('artusi', sezioni.artusi);
  renderSezione('campanello', sezioni.campanello);
  renderSezione('storie', sezioni.storie);
  renderSezione('generale', sezioni.generale);

  // Show tab if has content, else hide tab button
  ['artusi','campanello','storie','generale'].forEach(s => {
    const btn = document.querySelector(`[data-tab="${s}"]`);
    if (btn && !sezioni[s].length) btn.style.display = 'none';
  });

  // Activate first visible tab
  const firstVisible = document.querySelector('.tab-btn:not([style*="none"])');
  if (firstVisible) firstVisible.click();

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`)?.classList.add('active');
    });
  });
}

function renderSezione(sezione, contenuti) {
  const container = document.getElementById(`tab-${sezione}`);
  if (!container) return;
  if (!contenuti.length) {
    container.innerHTML = `<div class="empty-state"><p>Nessun contenuto disponibile.</p></div>`;
    return;
  }

  const html = contenuti.map(c => renderContenuto(c)).join('');
  container.innerHTML = html;
}

function renderContenuto(c) {
  const typeIcons = { testo: '', immagine: '', video: '', ricetta: '' };
  let mediaHtml = '';

  if (c.tipo === 'immagine' && c.media_url) {
    mediaHtml = `<img src="${c.media_url}" alt="${sanitizeText(c.titolo)}" style="width:100%;border-radius:10px;max-height:400px;object-fit:cover;margin-bottom:1rem;" loading="lazy">`;
  } else if (c.tipo === 'video' && c.youtube_id) {
    mediaHtml = `
      <div class="video-thumb" onclick="openVideoModal('${sanitizeText(c.youtube_id)}')" style="border-radius:10px;overflow:hidden;margin-bottom:1rem;cursor:pointer;">
        <img src="${ytThumb(c.youtube_id, 'hqdefault')}" alt="${sanitizeText(c.titolo)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;" loading="lazy">
        <div class="video-play-btn"><div class="play-icon">&#9654;</div></div>
      </div>`;
  } else if (c.media_url) {
    mediaHtml = `<video controls style="width:100%;border-radius:10px;margin-bottom:1rem;"><source src="${c.media_url}"></video>`;
  }

  return `
    <div class="card" style="margin-bottom:1.75rem;" data-animate>
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;">
          
          <h3 style="font-size:1.15rem;color:#1B4332;">${sanitizeText(c.titolo)}</h3>
        </div>
        ${mediaHtml}
        ${c.corpo ? `<div style="font-size:.95rem;line-height:1.7;color:#333;white-space:pre-wrap;">${sanitizeText(c.corpo)}</div>` : ''}
      </div>
    </div>`;
}

// ---- Lista istituti ----
async function initIstitutiList() {
  const grid = document.getElementById('istituti-grid');
  if (!grid) return;

  try {
    const list = await apiFetch('/istituti');
    const regioni = await apiFetch('/istituti/regioni');
    buildRegioniFilter(regioni, list);
    renderIstitutiGrid(list);

    document.getElementById('istituti-count').textContent = list.length;

    const searchInput = document.getElementById('istituti-search');
    if (searchInput) {
      let t;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const q = searchInput.value.toLowerCase();
          const filtered = list.filter(i => i.nome.toLowerCase().includes(q) || i.citta.toLowerCase().includes(q));
          renderIstitutiGrid(filtered);
        }, 300);
      });
    }
  } catch (e) {
    grid.innerHTML = `<p style="color:#666;text-align:center;">Errore nel caricamento degli istituti.</p>`;
  }

  function buildRegioniFilter(regioni, allList) {
    const container = document.getElementById('filter-regioni');
    if (!container) return;
    container.innerHTML = `<button class="filter-btn active" data-r="">Tutte</button>` +
      regioni.map(r => `<button class="filter-btn" data-r="${r}">${r}</button>`).join('');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const r = btn.dataset.r;
        renderIstitutiGrid(r ? allList.filter(i => i.regione === r) : allList);
      });
    });
  }

  function renderIstitutiGrid(list) {
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>Nessun istituto trovato.</p></div>`;
      return;
    }
    grid.innerHTML = list.map(i => {
      const regioneSlug = (i.regione || '').toLowerCase().replace(/\s+/g, '-');
      return `
      <a href="/istituto.html?id=${i.id}" class="card" data-regione="${sanitizeText(regioneSlug)}" style="display:block;text-decoration:none;color:inherit;" data-animate>
        <div class="ist-card-bg" style="height:140px;background:linear-gradient(135deg,#1B4332,#2D6A4F);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">
          ${i.logo ? `<img src="${i.logo}" alt="" style="width:70px;height:70px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.5);position:relative;z-index:1;">` : ''}
          <div style="position:absolute;bottom:0;left:0;right:0;height:50%;background:linear-gradient(to bottom,transparent,rgba(0,0,0,.3));z-index:2;"></div>
        </div>
        <div class="card-body">
          <div class="card-tag tag-verde">${sanitizeText(i.regione)}</div>
          <h3 style="font-size:1rem;margin-bottom:.35rem;color:#1B4332;">${sanitizeText(i.nome)}</h3>
          <p style="font-size:.85rem;color:#666;">${sanitizeText(i.citta)}${i.provincia ? `, ${i.provincia}` : ''}</p>
          ${i.descrizione ? `<p style="font-size:.82rem;color:#888;margin-top:.5rem;">${sanitizeText(i.descrizione.slice(0,90))}${i.descrizione.length>90?'...':''}</p>` : ''}
        </div>
      </a>`;
    }).join('');

    // Load Unsplash region images if available
    if (window.loadUnsplashImage) {
      grid.querySelectorAll('[data-regione]').forEach(card => {
        const bgEl = card.querySelector('.ist-card-bg');
        const regione = card.dataset.regione;
        if (bgEl && regione && !card.querySelector('img[src^="/"]')) {
          window.loadUnsplashImage('regione', regione, bgEl);
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('istituto-hero')) initIstitutoPage();
  if (document.getElementById('istituti-grid')) initIstitutiList();
});
