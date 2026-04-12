const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// In produzione su Render usa il disco persistente montato su /var/data
// In locale usa la cartella db/ del progetto
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname);
const DB_PATH = path.join(DATA_DIR, 'cucina_unesco.db');

// Assicura che la directory esista
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function getDbPath() { return DB_PATH; }

module.exports = { getDb, getDbPath };
