const express = require('express');
const { getDb } = require('../db/database');
const { authAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/museo - Items museo (pubblico)
router.get('/', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM museo_items WHERE attivo=1 ORDER BY ordine').all());
});

// POST /api/museo - Crea item museo (admin)
router.post('/', authAdmin, (req, res) => {
  const { titolo, descrizione, immagine_url, link_esterno, ordine } = req.body;
  if (!titolo) return res.status(400).json({ error: 'Titolo obbligatorio' });
  const db = getDb();
  const result = db.prepare(
    'INSERT INTO museo_items (titolo, descrizione, immagine_url, link_esterno, ordine) VALUES (?,?,?,?,?)'
  ).run(titolo, descrizione || null, immagine_url || null, link_esterno || null, ordine || 0);
  res.json({ id: result.lastInsertRowid, success: true });
});

// PUT /api/museo/:id - Modifica item museo (admin)
router.put('/:id', authAdmin, (req, res) => {
  const { titolo, descrizione, immagine_url, link_esterno, ordine, attivo } = req.body;
  const db = getDb();
  db.prepare(
    'UPDATE museo_items SET titolo=?, descrizione=?, immagine_url=?, link_esterno=?, ordine=?, attivo=? WHERE id=?'
  ).run(titolo, descrizione, immagine_url, link_esterno, ordine, attivo !== undefined ? attivo : 1, req.params.id);
  res.json({ success: true });
});

// DELETE /api/museo/:id (admin)
router.delete('/:id', authAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM museo_items WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
