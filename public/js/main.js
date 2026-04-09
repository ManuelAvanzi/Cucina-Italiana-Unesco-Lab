/* =====================================================
   CUCINA ITALIANA UNESCO LAB — main.js
   Utilities condivise e navbar responsiva
   ===================================================== */

const API = '/api';

// ---- Navbar hamburger ----
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  // Highlight active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path || (path !== '/' && a.getAttribute('href') !== '/' && path.startsWith(a.getAttribute('href')))) {
      a.classList.add('active');
    }
  });

  // Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow = window.scrollY > 10
        ? '0 2px 20px rgba(0,0,0,0.35)'
        : '0 2px 12px rgba(0,0,0,0.25)';
    }, { passive: true });
  }
});

// ---- API helpers ----
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
  return data;
}

async function apiForm(endpoint, formData, method = 'POST') {
  const token = localStorage.getItem('token');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  const res = await fetch(API + endpoint, { method, body: formData, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Errore ${res.status}`);
  return data;
}

// ---- Toast notifications ----
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:.5rem;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colors = { success: '#2D6A4F', error: '#C44B2F', info: '#1565C0', warning: '#856404' };
  toast.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:.75rem 1.25rem;border-radius:8px;font-size:.88rem;font-family:Lato,sans-serif;max-width:320px;box-shadow:0 4px 16px rgba(0,0,0,.2);animation:toastIn .3s ease;`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)'; toast.style.transition = '.3s'; setTimeout(() => toast.remove(), 300); }, duration);
}
const toastStyle = document.createElement('style');
toastStyle.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}';
document.head.appendChild(toastStyle);

// ---- Utilities ----
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ytThumb(id, quality = 'mqdefault') {
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

function ytEmbed(id) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

function sanitizeText(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

function extractYoutubeId(input) {
  const m = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : input.trim();
}

// ---- Lazy image loading ----
function initLazyImages() {
  const imgs = document.querySelectorAll('img[data-src]');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.src = e.target.dataset.src; obs.unobserve(e.target); } });
    });
    imgs.forEach(img => obs.observe(img));
  } else {
    imgs.forEach(img => img.src = img.dataset.src);
  }
}

// ---- Scroll animations (improved) ----
function initScrollAnimations() {
  const selectors = '[data-animate],[data-animate-left],[data-animate-right],[data-stagger]';
  const els = document.querySelectorAll(selectors);
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (e.target.hasAttribute('data-stagger')) {
          e.target.querySelectorAll(':scope > *').forEach(child => child.classList.add('visible'));
        } else {
          e.target.classList.add('visible');
        }
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => observer.observe(el));

  // Navbar scroll class
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50), { passive: true });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initLazyImages();
  initScrollAnimations();
});

// ---- Global video modal ----
function openVideoModal(youtubeId) {
  let modal = document.getElementById('video-global-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'video-global-modal';
    modal.className = 'video-modal-overlay';
    modal.innerHTML = `
      <div class="video-modal-inner">
        <button class="video-modal-close" onclick="closeVideoModal()">&#x2715;</button>
        <iframe id="video-modal-iframe" allowfullscreen allow="autoplay; encrypted-media"></iframe>
      </div>`;
    modal.addEventListener('click', e => { if (e.target === modal) closeVideoModal(); });
    document.body.appendChild(modal);
  }
  document.getElementById('video-modal-iframe').src = ytEmbed(youtubeId);
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal = document.getElementById('video-global-modal');
  if (modal) {
    modal.classList.remove('active');
    document.getElementById('video-modal-iframe').src = '';
    document.body.style.overflow = '';
  }
}

window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.apiFetch = apiFetch;
window.apiForm = apiForm;
window.showToast = showToast;
window.formatDate = formatDate;
window.ytThumb = ytThumb;
window.sanitizeText = sanitizeText;
