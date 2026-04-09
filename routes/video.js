const express = require('express');
const { getDb } = require('../db/database');
const { authIstituto, authAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/video - Video tour pubblici
router.get('/', (req, res) => {
  const db = getDb();
  const { territorio, tema, limit = 20, offset = 0 } = req.query;
  let sql = `SELECT v.id, v.youtube_id, v.titolo, v.descrizione, v.territorio, v.tema, v.created_at,
             i.nome as istituto_nome, i.citta, i.regione, i.id as istituto_id
             FROM video_tour v LEFT JOIN istituti i ON v.istituto_id=i.id
             WHERE v.pubblicato=1`;
  const params = [];
  if (territorio) { sql += ' AND v.territorio LIKE ?'; params.push(`%${territorio}%`); }
  if (tema) { sql += ' AND v.tema=?'; params.push(tema); }
  sql += ' ORDER BY v.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  res.json(db.prepare(sql).all(...params));
});

// GET /api/video/temi - Lista temi disponibili
router.get('/temi', (req, res) => {
  const db = getDb();
  const temi = db.prepare("SELECT DISTINCT tema FROM video_tour WHERE pubblicato=1 AND tema IS NOT NULL ORDER BY tema").all();
  res.json(temi.map(t => t.tema));
});

// --- AREA RISERVATA ---

// GET /api/video/me - Video del proprio istituto
router.get('/me', authIstituto, (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM video_tour WHERE istituto_id=? ORDER BY created_at DESC').all(req.istituto.id));
});

// POST /api/video/me - Aggiungi video
router.post('/me', authIstituto, (req, res) => {
  const { youtube_id, titolo, descrizione, territorio, tema, pubblicato } = req.body;
  if (!youtube_id || !titolo) return res.status(400).json({ error: 'youtube_id e titolo obbligatori' });

  // Sanitize youtube_id: accetta sia l'ID che l'URL completo
  const idMatch = youtube_id.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  const cleanId = idMatch ? idMatch[1] : youtube_id.trim();

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO video_tour (istituto_id, youtube_id, titolo, descrizione, territorio, tema, pubblicato) VALUES (?,?,?,?,?,?,?)'
  ).run(req.istituto.id, cleanId, titolo, descrizione || null, territorio || null, tema || null, pubblicato ? 1 : 1);
  res.json({ id: result.lastInsertRowid, success: true });
});

// PUT /api/video/me/:id
router.put('/me/:id', authIstituto, (req, res) => {
  const db = getDb();
  const video = db.prepare('SELECT * FROM video_tour WHERE id=? AND istituto_id=?').get(req.params.id, req.istituto.id);
  if (!video) return res.status(404).json({ error: 'Non trovato' });

  const { titolo, descrizione, territorio, tema, pubblicato } = req.body;
  db.prepare(
    'UPDATE video_tour SET titolo=?, descrizione=?, territorio=?, tema=?, pubblicato=? WHERE id=?'
  ).run(
    titolo || video.titolo,
    descrizione !== undefined ? descrizione : video.descrizione,
    territorio !== undefined ? territorio : video.territorio,
    tema !== undefined ? tema : video.tema,
    pubblicato !== undefined ? (pubblicato ? 1 : 0) : video.pubblicato,
    req.params.id
  );
  res.json({ success: true });
});

// DELETE /api/video/me/:id
router.delete('/me/:id', authIstituto, (req, res) => {
  const db = getDb();
  const video = db.prepare('SELECT id FROM video_tour WHERE id=? AND istituto_id=?').get(req.params.id, req.istituto.id);
  if (!video) return res.status(404).json({ error: 'Non trovato' });
  db.prepare('DELETE FROM video_tour WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
