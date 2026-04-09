const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const router = express.Router();

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

  res.json({ token, admin: { id: admin.id, username: admin.username, email: admin.email } });
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
