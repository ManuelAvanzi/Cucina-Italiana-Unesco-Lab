/* =====================================================
   CUCINA ITALIANA UNESCO LAB — dashboard.js
   Shared auth + API helpers per area istituto
   ===================================================== */

const API = '/api';

async function requireAuth() {
  const token = localStorage.getItem('token');
  if (!token) { window.location = '/dashboard/login.html'; return null; }
  try {
    const res = await fetch(API + '/auth/verify', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (!data.valid || data.payload.role !== 'istituto') throw new Error();
    // Refresh istituto data
    const iRes = await fetch(API + '/istituti/me/profilo', { headers: { Authorization: 'Bearer ' + token } });
    if (!iRes.ok) throw new Error();
    const istituto = await iRes.json();
    localStorage.setItem('istituto', JSON.stringify(istituto));
    return istituto;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('istituto');
    window.location = '/dashboard/login.html';
    return null;
  }
}

async function dashFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(); return; }
  if (!res.ok) throw new Error(data.error || 'Errore ' + res.status);
  return data;
}

async function dashForm(endpoint, formData, method = 'POST') {
  const token = localStorage.getItem('token');
  const res = await fetch(API + endpoint, {
    method,
    body: formData,
    headers: token ? { Authorization: 'Bearer ' + token } : {}
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { logout(); return; }
  if (!res.ok) throw new Error(data.error || 'Errore ' + res.status);
  return data;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('istituto');
  window.location = '/dashboard/login.html';
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('active');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

function showAlert(container, msg, type = 'error') {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${esc(msg)}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4000);
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

function formatDate(s) {
  return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ytThumb(id) { return `https://img.youtube.com/vi/${id}/mqdefault.jpg`; }

window.requireAuth = requireAuth;
window.dashFetch = dashFetch;
window.dashForm = dashForm;
window.logout = logout;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.showAlert = showAlert;
window.esc = esc;
window.formatDate = formatDate;
window.ytThumb = ytThumb;
