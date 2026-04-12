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

function checkIsOwner(istitutiId) {
  try {
    const me = JSON.parse(localStorage.getItem('istituto') || 'null');
    return me && me.id === istitutiId;
  } catch { return false; }
}

function checkIsAdmin() {
  try {
    return !!localStorage.getItem('admin_token');
  } catch { return false; }
}

function addPreviewBar(istitutiId) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#1B4332;color:#fff;padding:.55rem 1.25rem;display:flex;align-items:center;justify-content:space-between;font-size:.83rem;box-shadow:0 2px 8px rgba(0,0,0,.3);';
  bar.innerHTML = `<span style="opacity:.85;">Stai visualizzando l'anteprima pubblica del tuo istituto</span><div style="display:flex;gap:1rem;"><a href="/dashboard/profilo.html" style="color:#81b99a;text-decoration:none;">Modifica profilo</a><a href="/dashboard/contenuti.html" style="color:#81b99a;text-decoration:none;font-weight:600;">Gestisci contenuti →</a></div>`;
  document.body.prepend(bar);
  document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) || 0) + 42 + 'px';
}

function addAdminBar(istitutiId) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#C44B2F;color:#fff;padding:.55rem 1.25rem;display:flex;align-items:center;justify-content:space-between;font-size:.83rem;box-shadow:0 2px 8px rgba(0,0,0,.3);';
  bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:.75rem;">
      <span style="background:rgba(255,255,255,.2);padding:.15rem .5rem;border-radius:4px;font-weight:700;font-size:.75rem;letter-spacing:.5px;">ADMIN</span>
      <span style="opacity:.9;">Stai visualizzando la pagina pubblica come amministratore</span>
    </div>
    <div style="display:flex;gap:1rem;">
      <a href="/admin/contenuti.html" style="color:#ffd4cc;text-decoration:none;">Contenuti</a>
      <a href="/admin/istituti.html" style="color:#ffd4cc;text-decoration:none;">Istituti</a>
      <a href="/admin/index.html" style="color:#fff;text-decoration:none;font-weight:600;">← Torna al pannello</a>
    </div>`;
  document.body.prepend(bar);
  document.body.style.paddingTop = (parseInt(getComputedStyle(document.body).paddingTop) || 0) + 42 + 'px';
}

async function previewDeleteContenuto(id, btn) {
  if (!confirm('Eliminare questo contenuto? L\'azione è irreversibile.')) return;
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    btn.disabled = true;
    const res = await fetch(`/api/contenuti/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) btn.closest('.card').remove();
  } catch { btn.disabled = false; }
}

function renderIstituto(data) {
  document.title = `${data.nome} — Cucina Italiana UNESCO Lab`;
  const isOwner = checkIsOwner(data.id);
  const isAdmin = checkIsAdmin();

  if (isAdmin) {
    addAdminBar(data.id);
    const crumb = document.getElementById('breadcrumb-back');
    if (crumb) { crumb.href = '/admin/istituti.html'; crumb.textContent = '← Torna al pannello admin'; }
  } else if (isOwner) {
    addPreviewBar(data.id);
    const crumb = document.getElementById('breadcrumb-back');
    if (crumb) { crumb.href = '/dashboard/profilo.html'; crumb.textContent = '← Torna alla dashboard'; }
  }

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
    const heroBg = hero.querySelector('.istituto-hero-bg');
    if (data.cover_url) {
      heroBg.style.backgroundImage = `url('${data.cover_url}')`;
      heroBg.style.backgroundSize = 'cover';
      heroBg.style.backgroundPosition = 'center';
    } else if (window.loadUnsplashImage && regioneSlug) {
      window.loadUnsplashImage('regione', regioneSlug, heroBg);
    }
  }

  // Organize content by section
  const sezioni = { artusi: [], campanello: [], storie: [], generale: [] };
  (data.contenuti || []).forEach(c => { if (sezioni[c.sezione]) sezioni[c.sezione].push(c); });

  // Render tabs
  renderSezione('artusi', sezioni.artusi, isOwner);
  renderSezione('campanello', sezioni.campanello, isOwner);
  renderSezione('storie', sezioni.storie, isOwner);
  renderSezione('generale', sezioni.generale, isOwner);

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

function renderSezione(sezione, contenuti, isOwner = false) {
  const container = document.getElementById(`tab-${sezione}`);
  if (!container) return;
  if (!contenuti.length) {
    container.innerHTML = isOwner
      ? `<div class="empty-state"><p>Nessun contenuto in questa sezione. <a href="/dashboard/contenuti.html?sezione=${sezione}" style="color:var(--verde);font-weight:600;">Aggiungi contenuto →</a></p></div>`
      : `<div class="empty-state"><p>Nessun contenuto disponibile.</p></div>`;
    return;
  }
  container.innerHTML = contenuti.map(c => renderContenuto(c, isOwner)).join('');
}

function renderContenuto(c, isOwner = false) {
  const typeIcons = { testo: '', immagine: '', video: '', ricetta: '' };
  let mediaHtml = '';

  if (c.media_url && c.tipo !== 'video') {
    mediaHtml = `<img src="${c.media_url}" alt="${sanitizeText(c.titolo)}" style="width:100%;border-radius:10px;max-height:380px;object-fit:cover;margin-bottom:1rem;" loading="lazy">`;
  } else if (c.tipo === 'video' && c.youtube_id) {
    mediaHtml = `
      <div class="video-thumb" onclick="openVideoModal('${sanitizeText(c.youtube_id)}')" style="border-radius:10px;overflow:hidden;margin-bottom:1rem;cursor:pointer;">
        <img src="${ytThumb(c.youtube_id, 'hqdefault')}" alt="${sanitizeText(c.titolo)}" style="width:100%;aspect-ratio:16/9;object-fit:cover;" loading="lazy">
        <div class="video-play-btn"><div class="play-icon">&#9654;</div></div>
      </div>`;
  }

  const ownerActions = isOwner ? `
    <div style="display:flex;gap:.5rem;margin-top:1rem;padding-top:.75rem;border-top:1px solid #f0f0f0;">
      <a href="/dashboard/contenuti.html" onclick="sessionStorage.setItem('preview_edit_id','${c.id}');return true;" style="font-size:.78rem;padding:.3rem .75rem;border:1px solid #2D6A4F;border-radius:6px;color:#2D6A4F;text-decoration:none;font-weight:600;">Modifica</a>
      <button onclick="previewDeleteContenuto(${c.id},this)" style="font-size:.78rem;padding:.3rem .75rem;border:1px solid #C44B2F;border-radius:6px;color:#C44B2F;background:none;cursor:pointer;font-weight:600;">Elimina</button>
    </div>` : '';

  return `
    <div class="card" style="margin-bottom:1.75rem;">
      <div class="card-body">
        <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.75rem;">
          <h3 style="font-size:1.15rem;color:#1B4332;">${sanitizeText(c.titolo)}</h3>
        </div>
        ${mediaHtml}
        ${c.corpo ? `<div style="font-size:.95rem;line-height:1.7;color:#333;white-space:pre-wrap;">${sanitizeText(c.corpo)}</div>` : ''}
        ${ownerActions}
      </div>
    </div>`;
}

// ---- Lista istituti ----
async function initIstitutiList() {
  const grid = document.getElementById('istituti-grid');
  if (!grid) return;

  const urlParams = new URLSearchParams(window.location.search);
  const sezioneParam = urlParams.get('sezione') || '';

  const sezioneLabels = {
    artusi: 'A Scuola da Artusi',
    campanello: 'La Cucina del Campanello',
    storie: 'Storie Culinarie'
  };
  const sezioneDescs = {
    artusi: 'Istituti con ricette e video ispirati al trattato di Pellegrino Artusi.',
    campanello: 'Istituti con racconti e varianti familiari della cucina locale.',
    storie: 'Istituti che documentano la storia e le tradizioni culinarie del territorio.'
  };

  // Aggiorna titolo e descrizione hero se sezione attiva
  if (sezioneParam && sezioneLabels[sezioneParam]) {
    const titleEl = document.getElementById('istituti-page-title');
    const descEl  = document.getElementById('istituti-page-desc');
    if (titleEl) titleEl.textContent = sezioneLabels[sezioneParam];
    if (descEl)  descEl.innerHTML = sezioneDescs[sezioneParam] + ' <span id="istituti-count" style="color:var(--crema);font-weight:700;"></span>';
  }

  let activeSezione = sezioneParam;
  let activeRegione = '';
  let searchQ = '';
  let allList = [];

  async function loadList() {
    let url = '/istituti';
    const p = new URLSearchParams();
    if (activeSezione) p.set('sezione', activeSezione);
    if (activeRegione) p.set('regione', activeRegione);
    if (p.toString()) url += '?' + p.toString();
    return apiFetch(url);
  }

  function applySearch(list) {
    if (!searchQ) return list;
    const q = searchQ.toLowerCase();
    return list.filter(i => i.nome.toLowerCase().includes(q) || i.citta.toLowerCase().includes(q));
  }

  async function refresh() {
    try {
      allList = await loadList();
      renderIstitutiGrid(applySearch(allList));
      const countEl = document.getElementById('istituti-count');
      if (countEl) countEl.textContent = allList.length ? `— ${allList.length} iscritti` : '';
    } catch (e) {
      grid.innerHTML = `<p style="color:#666;text-align:center;">Errore nel caricamento degli istituti.</p>`;
    }
  }

  try {
    const regioni = await apiFetch('/istituti/regioni');
    buildRegioniFilter(regioni);
    buildSezioniFilter();
    await refresh();
  } catch (e) {
    grid.innerHTML = `<p style="color:#666;text-align:center;">Errore nel caricamento degli istituti.</p>`;
  }

  const searchInput = document.getElementById('istituti-search');
  if (searchInput) {
    let t;
    searchInput.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { searchQ = searchInput.value; renderIstitutiGrid(applySearch(allList)); }, 300);
    });
  }

  function buildSezioniFilter() {
    const container = document.getElementById('filter-sezioni');
    if (!container) return;
    container.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.s === activeSezione) btn.classList.add('active');
      else btn.classList.remove('active');
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSezione = btn.dataset.s;
        await refresh();
      });
    });
  }

  function buildRegioniFilter(regioni) {
    const container = document.getElementById('filter-regioni');
    if (!container) return;
    container.innerHTML = `<button class="filter-btn active" data-r="">Tutte</button>` +
      regioni.map(r => `<button class="filter-btn" data-r="${r}">${r}</button>`).join('');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeRegione = btn.dataset.r;
        await refresh();
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
      <a href="/istituto.html?id=${i.id}" class="card" data-regione="${sanitizeText(regioneSlug)}" style="display:block;text-decoration:none;color:inherit;">
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

window.previewDeleteContenuto = previewDeleteContenuto;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('istituto-hero')) initIstitutoPage();
  if (document.getElementById('istituti-grid')) initIstitutiList();
});
