/* =====================================================
   CUCINA ITALIANA UNESCO LAB — admin.js
   ===================================================== */

const API = '/api';

async function requireAdmin() {
  const token = localStorage.getItem('admin_token');
  if (!token) { window.location = '/admin/login.html'; return null; }
  try {
    const res = await fetch(API + '/auth/verify', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (!data.valid || data.payload.role !== 'admin') throw new Error();
    return data.payload;
  } catch {
    localStorage.removeItem('admin_token');
    window.location = '/admin/login.html';
    return null;
  }
}

async function adminFetch(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { adminLogout(); return; }
  if (!res.ok) throw new Error(data.error || 'Errore ' + res.status);
  return data;
}

function adminLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin');
  window.location = '/admin/login.html';
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('active');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
}

function showAlert(containerId, msg, type = 'error') {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="alert alert-${type}">${esc(msg)}</div>`;
  setTimeout(() => { el.innerHTML = ''; }, 4500);
}

function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function formatDate(s) { return new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }); }

window.requireAdmin = requireAdmin;
window.adminFetch = adminFetch;
window.adminLogout = adminLogout;
window.toggleSidebar = toggleSidebar;
window.closeSidebar = closeSidebar;
window.showAlert = showAlert;
window.esc = esc;
window.formatDate = formatDate;
