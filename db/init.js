const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'cucina_unesco.db');

function initDatabase() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS istituti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      citta TEXT NOT NULL,
      regione TEXT NOT NULL,
      provincia TEXT,
      indirizzo TEXT,
      lat REAL,
      lng REAL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      logo TEXT,
      descrizione TEXT,
      sito_web TEXT,
      telefono TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contenuti (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      istituto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('testo','immagine','video','ricetta')),
      sezione TEXT NOT NULL CHECK(sezione IN ('artusi','campanello','storie','generale')),
      titolo TEXT NOT NULL,
      corpo TEXT,
      media_url TEXT,
      youtube_id TEXT,
      pubblicato INTEGER DEFAULT 0,
      ordine INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (istituto_id) REFERENCES istituti(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS video_tour (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      istituto_id INTEGER,
      youtube_id TEXT NOT NULL,
      titolo TEXT NOT NULL,
      descrizione TEXT,
      territorio TEXT,
      tema TEXT,
      pubblicato INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (istituto_id) REFERENCES istituti(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS museo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titolo TEXT NOT NULL,
      descrizione TEXT,
      immagine_url TEXT,
      link_esterno TEXT,
      ordine INTEGER DEFAULT 0,
      attivo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin account
  const adminExists = db.prepare('SELECT id FROM admin WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('Admin2024!', 12);
    db.prepare('INSERT INTO admin (username, password, email) VALUES (?, ?, ?)').run('admin', hash, 'admin@cucinaitaliana.edu.it');
    console.log('Admin creato: username=admin, password=Admin2024!');
  }

  // Seed demo istituto
  const demoExists = db.prepare('SELECT id FROM istituti WHERE username = ?').get('demo_istituto');
  if (!demoExists) {
    const hash = bcrypt.hashSync('Demo2024!', 12);
    db.prepare(`
      INSERT INTO istituti (nome, citta, regione, provincia, indirizzo, lat, lng, email, username, password, descrizione)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'IPSSAR Demo - Istituto Alberghiero',
      'Roma',
      'Lazio',
      'RM',
      'Via della Cucina Italiana 1',
      41.9028,
      12.4964,
      'demo@ipssar-demo.edu.it',
      'demo_istituto',
      hash,
      'Istituto dimostrativo per la piattaforma Cucina Italiana UNESCO Lab.'
    );
    console.log('Istituto demo creato: username=demo_istituto, password=Demo2024!');
  }

  // Seed museo item
  const museoExists = db.prepare('SELECT id FROM museo_items LIMIT 1').get();
  if (!museoExists) {
    db.prepare(`
      INSERT INTO museo_items (titolo, descrizione, immagine_url, link_esterno, ordine)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      'La Cucina Italiana - Patrimonio UNESCO',
      'Esplora il ricco patrimonio della cucina italiana riconosciuto dall\'UNESCO come patrimonio culturale immateriale dell\'umanità.',
      '/assets/museo-hero.jpg',
      'https://ich.unesco.org',
      1
    );
  }

  db.close();
  console.log('Database inizializzato con successo:', DB_PATH);
}

initDatabase();
