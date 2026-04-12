const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const router = express.Router();

// POST /api/auth/register - Registrazione nuovo istituto
router.post('/register', (req, res) => {
  const { nome, username, password, email, citta, regione, provincia } = req.body;
  if (!nome || !username || !password || !email || !citta || !regione) {
    return res.status(400).json({ error: 'Compila tutti i campi obbligatori' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La password deve essere di almeno 8 caratteri' });
  }

  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as n FROM istituti').get().n;
  if (count >= 300) {
    return res.status(400).json({ error: 'Limite massimo di 300 istituti raggiunto' });
  }
  if (db.prepare('SELECT id FROM istituti WHERE username = ?').get(username)) {
    return res.status(400).json({ error: 'Username già in uso' });
  }
  if (db.prepare('SELECT id FROM istituti WHERE email = ?').get(email)) {
    return res.status(400).json({ error: 'Email già registrata' });
  }

  const hash = bcrypt.hashSync(password, 12);
  const result = db.prepare(
    'INSERT INTO istituti (nome, username, password, email, citta, regione, provincia, active) VALUES (?,?,?,?,?,?,?,1)'
  ).run(nome, username, hash, email, citta, regione, provincia || null);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username, nome, role: 'istituto' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.status(201).json({
    token,
    istituto: { id: result.lastInsertRowid, nome, citta, regione, username, email, logo: null }
  });
});

// POST /api/auth/login - Login istituto
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password richiesti' });
  }

  const db = getDb();
  const istituto = db.prepare('SELECT * FROM istituti WHERE username = ? AND active = 1').get(username);
  if (!istituto || !bcrypt.compareSync(password, istituto.password)) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  const token = jwt.sign(
    { id: istituto.id, username: istituto.username, nome: istituto.nome, role: 'istituto' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    istituto: {
      id: istituto.id,
      nome: istituto.nome,
      citta: istituto.citta,
      regione: istituto.regione,
      username: istituto.username,
      email: istituto.email,
      logo: istituto.logo
    }
  });
});

// POST /api/auth/admin/login - Login admin
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password richiesti' });
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, admin: { id: admin.id, username: admin.username, email: admin.email, must_change_password: !!admin.must_change_password } });
});

// PUT /api/auth/admin/password - Cambio password admin
router.put('/admin/password', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autenticato' });
  let payload;
  try {
    payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Accesso negato' });
  } catch {
    return res.status(401).json({ error: 'Token non valido' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'La nuova password deve essere di almeno 8 caratteri' });
  }

  const db = getDb();
  const admin = db.prepare('SELECT * FROM admin WHERE id = ?').get(payload.id);
  if (!admin || !bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Password attuale non corretta' });
  }

  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE admin SET password = ?, must_change_password = 0 WHERE id = ?').run(hash, payload.id);
  res.json({ success: true });
});

// GET /api/auth/verify - Verifica token
router.get('/verify', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ valid: false });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    res.json({ valid: true, payload });
  } catch {
    res.status(401).json({ valid: false });
  }
});

module.exports = router;
