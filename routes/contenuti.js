const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');
const { authIstituto, authAdmin } = require('../middleware/auth');

const router = express.Router();

const BASE_UPLOADS = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, '../uploads');

// Assicura che le directory esistano
fs.mkdirSync(path.join(BASE_UPLOADS, 'immagini'), { recursive: true });
fs.mkdirSync(path.join(BASE_UPLOADS, 'video'), { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = file.mimetype.startsWith('image/')
      ? path.join(BASE_UPLOADS, 'immagini')
      : path.join(BASE_UPLOADS, 'video');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `media_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo file non supportato'));
  }
});

// GET /api/contenuti/pubblico - Contenuti pubblici per homepage/vetrina
router.get('/pubblico', (req, res) => {
  const db = getDb();
  const { sezione, tipo, limit = 12 } = req.query;
  let sql = `SELECT c.id, c.tipo, c.sezione, c.titolo, c.corpo, c.media_url, c.youtube_id,
             i.nome as istituto_nome, i.citta, i.regione, i.id as istituto_id
             FROM contenuti c JOIN istituti i ON c.istituto_id = i.id
             WHERE c.pubblicato=1 AND i.active=1`;
  const params = [];
  if (sezione) { sql += ' AND c.sezione=?'; params.push(sezione); }
  if (tipo) { sql += ' AND c.tipo=?'; params.push(tipo); }
  sql += ' ORDER BY CASE WHEN c.media_url IS NOT NULL OR c.youtube_id IS NOT NULL THEN 0 ELSE 1 END, c.created_at DESC LIMIT ?';
  params.push(parseInt(limit));
  res.json(db.prepare(sql).all(...params));
});

// --- AREA RISERVATA ---

// GET /api/contenuti - Contenuti del proprio istituto
router.get('/', authIstituto, (req, res) => {
  const db = getDb();
  const { sezione } = req.query;
  let sql = 'SELECT * FROM contenuti WHERE istituto_id=?';
  const params = [req.istituto.id];
  if (sezione) { sql += ' AND sezione=?'; params.push(sezione); }
  sql += ' ORDER BY sezione, ordine, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// POST /api/contenuti - Crea contenuto
router.post('/', authIstituto, upload.single('media'), (req, res) => {
  const { tipo, sezione, titolo, corpo, youtube_id, pubblicato, ordine } = req.body;
  if (!tipo || !sezione || !titolo) {
    return res.status(400).json({ error: 'tipo, sezione e titolo sono obbligatori' });
  }

  let media_url = null;
  if (req.file) {
    media_url = `/uploads/${req.file.mimetype.startsWith('image/') ? 'immagini' : 'video'}/${req.file.filename}`;
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO contenuti (istituto_id, tipo, sezione, titolo, corpo, media_url, youtube_id, pubblicato, ordine) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run(req.istituto.id, tipo, sezione, titolo, corpo || null, media_url, youtube_id || null, pubblicato ? 1 : 0, ordine || 0);

  res.json({ id: result.lastInsertRowid, media_url, success: true });
});

// PUT /api/contenuti/:id - Modifica contenuto
router.put('/:id', authIstituto, upload.single('media'), (req, res) => {
  const db = getDb();
  const contenuto = db.prepare('SELECT * FROM contenuti WHERE id=? AND istituto_id=?').get(req.params.id, req.istituto.id);
  if (!contenuto) return res.status(404).json({ error: 'Contenuto non trovato' });

  const { tipo, sezione, titolo, corpo, youtube_id, pubblicato, ordine } = req.body;
  let media_url = contenuto.media_url;
  if (req.file) {
    media_url = `/uploads/${req.file.mimetype.startsWith('image/') ? 'immagini' : 'video'}/${req.file.filename}`;
    // Remove old file
    if (contenuto.media_url) {
      const oldPath = path.join(__dirname, '..', contenuto.media_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
  }

  db.prepare(
    'UPDATE contenuti SET tipo=?, sezione=?, titolo=?, corpo=?, media_url=?, youtube_id=?, pubblicato=?, ordine=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(
    tipo || contenuto.tipo,
    sezione || contenuto.sezione,
    titolo || contenuto.titolo,
    corpo !== undefined ? corpo : contenuto.corpo,
    media_url,
    youtube_id !== undefined ? youtube_id : contenuto.youtube_id,
    pubblicato !== undefined ? (pubblicato ? 1 : 0) : contenuto.pubblicato,
    ordine !== undefined ? ordine : contenuto.ordine,
    req.params.id
  );
  res.json({ success: true, media_url });
});

// PATCH /api/contenuti/:id/pubblica - Toggle pubblicazione
router.patch('/:id/pubblica', authIstituto, (req, res) => {
  const db = getDb();
  const contenuto = db.prepare('SELECT pubblicato FROM contenuti WHERE id=? AND istituto_id=?').get(req.params.id, req.istituto.id);
  if (!contenuto) return res.status(404).json({ error: 'Non trovato' });
  const newStatus = contenuto.pubblicato ? 0 : 1;
  db.prepare('UPDATE contenuti SET pubblicato=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(newStatus, req.params.id);
  res.json({ success: true, pubblicato: newStatus });
});

// DELETE /api/contenuti/:id
router.delete('/:id', authIstituto, (req, res) => {
  const db = getDb();
  const contenuto = db.prepare('SELECT * FROM contenuti WHERE id=? AND istituto_id=?').get(req.params.id, req.istituto.id);
  if (!contenuto) return res.status(404).json({ error: 'Non trovato' });
  if (contenuto.media_url) {
    const filePath = path.join(__dirname, '..', contenuto.media_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM contenuti WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Admin: GET tutti i contenuti
router.get('/admin/all', authAdmin, (req, res) => {
  const db = getDb();
  const { istituto_id, pubblicato } = req.query;
  let sql = `SELECT c.*, i.nome as istituto_nome FROM contenuti c JOIN istituti i ON c.istituto_id=i.id WHERE 1=1`;
  const params = [];
  if (istituto_id) { sql += ' AND c.istituto_id=?'; params.push(istituto_id); }
  if (pubblicato !== undefined) { sql += ' AND c.pubblicato=?'; params.push(parseInt(pubblicato)); }
  sql += ' ORDER BY c.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// Admin: PATCH pubblica/non pubblica
router.patch('/admin/:id/pubblica', authAdmin, (req, res) => {
  const db = getDb();
  const c = db.prepare('SELECT pubblicato FROM contenuti WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Non trovato' });
  db.prepare('UPDATE contenuti SET pubblicato=? WHERE id=?').run(c.pubblicato ? 0 : 1, req.params.id);
  res.json({ success: true });
});

// Admin: DELETE contenuto
router.delete('/admin/:id', authAdmin, (req, res) => {
  const db = getDb();
  const c = db.prepare('SELECT id FROM contenuti WHERE id=?').get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Non trovato' });
  db.prepare('DELETE FROM contenuti WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
