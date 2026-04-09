const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const BASE = 'https://api.unsplash.com';

// Dizionario keyword per ogni regione/tema
const KEYWORDS = {
  // Regioni
  toscana:           'tuscany landscape italy',
  campania:          'naples amalfi coast italy',
  sicilia:           'sicily palermo italy',
  'emilia-romagna':  'bologna emilia romagna italy food',
  lombardia:         'milan lombardy italy',
  veneto:            'venice veneto lake garda italy',
  lazio:             'rome italy food',
  puglia:            'puglia trulli italy food',
  calabria:          'calabria italy sea food',
  sardegna:          'sardinia italy sea',
  liguria:           'cinque terre liguria italy',
  piemonte:          'piedmont torino italy food',
  // Temi culinari
  pasta:             'italian pasta homemade',
  pizza:             'pizza napoletana italy',
  museo:             'italian food culture heritage table',
  hero:              'italian food rustic table',
  artusi:            'italian recipe cookbook pasta',
  campanello:        'italian family kitchen cooking',
  storie:            'italian food history vintage',
  istituto:          'culinary school chef cooking italy',
  generale:          'italian cuisine food',
};

// Cache in-memory semplice (TTL 1 ora)
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

async function fetchUnsplash(query, count = 1, orientation = 'landscape') {
  const cacheKey = `${query}:${count}:${orientation}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  if (!UNSPLASH_KEY) return null;

  const url = `${BASE}/photos/random?query=${encodeURIComponent(query)}&count=${count}&orientation=${orientation}&content_filter=high`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  const result = Array.isArray(data) ? data : [data];
  const photos = result.map(p => ({
    id: p.id,
    url_small:    p.urls?.small,
    url_regular:  p.urls?.regular,
    url_full:     p.urls?.full,
    color:        p.color,
    blur_hash:    p.blur_hash,
    alt:          p.alt_description || query,
    photographer: p.user?.name,
    photographer_url: p.user?.links?.html + '?utm_source=cucina_italiana_unesco&utm_medium=referral',
    unsplash_url: p.links?.html + '?utm_source=cucina_italiana_unesco&utm_medium=referral'
  }));
  cache.set(cacheKey, { data: photos, ts: Date.now() });
  return photos;
}

// GET /api/immagini/regione/:nome — immagine per carta regione
router.get('/regione/:nome', async (req, res) => {
  const nome = req.params.nome.toLowerCase();
  const query = KEYWORDS[nome] || `${nome} italy landscape`;
  try {
    const photos = await fetchUnsplash(query, 1);
    if (!photos) return res.json({ fallback: true, color: null });
    res.json(photos[0]);
  } catch (e) {
    res.json({ fallback: true });
  }
});

// GET /api/immagini/tema/:tema — immagine per tema culinario
router.get('/tema/:tema', async (req, res) => {
  const tema = req.params.tema.toLowerCase();
  const query = KEYWORDS[tema] || `italian ${tema} food`;
  try {
    const photos = await fetchUnsplash(query, 1);
    if (!photos) return res.json({ fallback: true });
    res.json(photos[0]);
  } catch (e) {
    res.json({ fallback: true });
  }
});

// GET /api/immagini/cerca?q=...&count=3 — ricerca libera
router.get('/cerca', async (req, res) => {
  const { q = 'italian food', count = 3, orientation = 'landscape' } = req.query;
  try {
    const photos = await fetchUnsplash(q, Math.min(parseInt(count), 6), orientation);
    if (!photos) return res.json([]);
    res.json(photos);
  } catch (e) {
    res.json([]);
  }
});

// GET /api/immagini/status — verifica se chiave configurata
router.get('/status', (req, res) => {
  res.json({ configured: !!UNSPLASH_KEY });
});

module.exports = router;
