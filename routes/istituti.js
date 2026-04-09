const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const { getDb } = require('../db/database');
const { authIstituto, authAdmin } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/immagini')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo immagini consentite'));
  }
});

// GET /api/istituti - Lista pubblica istituti (con contenuti pubblicati)
router.get('/', (req, res) => {
  const db = getDb();
  const { regione, search } = req.query;
  let sql = `SELECT id, nome, citta, regione, provincia, indirizzo, lat, lng, logo, descrizione, sito_web, telefono
             FROM istituti WHERE active = 1`;
  const params = [];
  if (regione) { sql += ' AND regione = ?'; params.push(regione); }
  if (search) { sql += ' AND (nome LIKE ? OR citta LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY regione, nome';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/istituti/regioni - Lista regioni disponibili
router.get('/regioni', (req, res) => {
  const db = getDb();
  const regioni = db.prepare("SELECT DISTINCT regione FROM istituti WHERE active=1 ORDER BY regione").all();
  res.json(regioni.map(r => r.regione));
});

// GET /api/istituti/:id - Dettaglio istituto pubblico
router.get('/:id', (req, res) => {
  const db = getDb();
  const istituto = db.prepare(
    'SELECT id, nome, citta, regione, provincia, indirizzo, lat, lng, logo, descrizione, sito_web, telefono FROM istituti WHERE id = ? AND active = 1'
  ).get(req.params.id);
  if (!istituto) return res.status(404).json({ error: 'Istituto non trovato' });

  const contenuti = db.prepare(
    'SELECT id, tipo, sezione, titolo, corpo, media_url, youtube_id, ordine FROM contenuti WHERE istituto_id = ? AND pubblicato = 1 ORDER BY sezione, ordine, created_at'
  ).all(req.params.id);

  res.json({ ...istituto, contenuti });
});

// GET /api/istituti/:id/mappa - Dati per marker mappa
router.get('/:id/mappa', (req, res) => {
  const db = getDb();
  const istituto = db.prepare(
    'SELECT id, nome, citta, regione, lat, lng, logo, descrizione FROM istituti WHERE id = ? AND active = 1'
  ).get(req.params.id);
  if (!istituto) return res.status(404).json({ error: 'Non trovato' });

  const imgs = db.prepare(
    "SELECT media_url FROM contenuti WHERE istituto_id=? AND tipo='immagine' AND pubblicato=1 LIMIT 3"
  ).all(req.params.id);
  const video = db.prepare(
    "SELECT youtube_id, titolo FROM contenuti WHERE istituto_id=? AND tipo='video' AND pubblicato=1 LIMIT 2"
  ).all(req.params.id);

  res.json({ ...istituto, immagini: imgs.map(i => i.media_url), video });
});

// --- AREA RISERVATA ISTITUTO ---

// GET /api/istituti/me/profilo
router.get('/me/profilo', authIstituto, (req, res) => {
  const db = getDb();
  const istituto = db.prepare(
    'SELECT id, nome, citta, regione, provincia, indirizzo, lat, lng, email, username, logo, descrizione, sito_web, telefono FROM istituti WHERE id = ?'
  ).get(req.istituto.id);
  res.json(istituto);
});

// PUT /api/istituti/me/profilo
router.put('/me/profilo', authIstituto, (req, res) => {
  const { descrizione, sito_web, telefono, indirizzo, lat, lng } = req.body;
  const db = getDb();
  db.prepare(
    'UPDATE istituti SET descrizione=?, sito_web=?, telefono=?, indirizzo=?, lat=?, lng=? WHERE id=?'
  ).run(descrizione, sito_web, telefono, indirizzo, lat, lng, req.istituto.id);
  res.json({ success: true });
});

// POST /api/istituti/me/logo
router.post('/me/logo', authIstituto, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nessun file caricato' });
  const url = `/uploads/immagini/${req.file.filename}`;
  const db = getDb();
  db.prepare('UPDATE istituti SET logo=? WHERE id=?').run(url, req.istituto.id);
  res.json({ url });
});

// PUT /api/istituti/me/password
router.put('/me/password', authIstituto, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Password non valida (min 8 caratteri)' });
  }
  const db = getDb();
  const istituto = db.prepare('SELECT password FROM istituti WHERE id=?').get(req.istituto.id);
  if (!bcrypt.compareSync(currentPassword, istituto.password)) {
    return res.status(401).json({ error: 'Password attuale non corretta' });
  }
  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE istituti SET password=? WHERE id=?').run(hash, req.istituto.id);
  res.json({ success: true });
});

// --- ADMIN: gestione istituti ---

// GET /api/istituti/admin/all
router.get('/admin/all', authAdmin, (req, res) => {
  const db = getDb();
  const list = db.prepare('SELECT id, nome, citta, regione, email, username, active, created_at FROM istituti ORDER BY regione, nome').all();
  res.json(list);
});

// POST /api/istituti/admin/create
router.post('/admin/create', authAdmin, (req, res) => {
  const { nome, citta, regione, provincia, indirizzo, lat, lng, email, username, password, descrizione } = req.body;
  if (!nome || !citta || !regione || !email || !username || !password) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as n FROM istituti').get().n;
  if (count >= 300) return res.status(400).json({ error: 'Limite massimo di 300 istituti raggiunto' });

  try {
    const hash = bcrypt.hashSync(password, 12);
    const result = db.prepare(
      'INSERT INTO istituti (nome, citta, regione, provincia, indirizzo, lat, lng, email, username, password, descrizione) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(nome, citta, regione, provincia, indirizzo, lat, lng, email, username, hash, descrizione);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username o email già esistenti' });
    throw e;
  }
});

// PUT /api/istituti/admin/:id/toggle
router.put('/admin/:id/toggle', authAdmin, (req, res) => {
  const db = getDb();
  const current = db.prepare('SELECT active FROM istituti WHERE id=?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Non trovato' });
  db.prepare('UPDATE istituti SET active=? WHERE id=?').run(current.active ? 0 : 1, req.params.id);
  res.json({ success: true, active: !current.active });
});

// DELETE /api/istituti/admin/:id
router.delete('/admin/:id', authAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM istituti WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
