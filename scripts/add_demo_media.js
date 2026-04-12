const db = require('../db/database').getDb();
const https = require('https');

// Fetch Unsplash image via the app's own DB cache or direct API call
// We'll use the existing contenuti and update media_url with Unsplash search results

// Instead, let's add video contenuti and fetch image URLs via the running server
const http = require('http');

function apiGet(path) {
  return new Promise((resolve, reject) => {
    http.get({ host: 'localhost', port: 64340, path }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function run() {
  const queries = {
    19: 'liguria pesto genova italian',
    20: 'umbria truffle perugia italian',
    21: 'calabria southern italy spicy food',
    22: 'emilia romagna tortellini bologna pasta',
    23: 'molise apennines mountains italian village',
  };

  const insert = db.prepare('UPDATE contenuti SET media_url=? WHERE istituto_id=? AND sezione=? AND tipo=?');

  for (const [id, q] of Object.entries(queries)) {
    try {
      const results = await apiGet(`/api/immagini/cerca?q=${encodeURIComponent(q)}&count=1`);
      if (results && results[0] && results[0].url_regular) {
        const url = results[0].url_regular;
        // Update first artusi content for this istituto with image
        db.prepare('UPDATE contenuti SET media_url=? WHERE istituto_id=? AND sezione=? AND ordine=1 AND tipo=\'testo\'').run(url, id, 'artusi');
        console.log('Updated media for istituto', id, ':', url.substring(0,60));
      }
    } catch(e) {
      console.error('Error for', id, e.message);
    }
  }

  // Add video contenuti
  const videos = [
    [19, 'video', 'artusi', 'Come preparare il pesto al mortaio', null, null, 'jE9oFHELVxg', 2],
    [20, 'video', 'artusi', 'Il tartufo nero di Norcia: raccolta e cucina', null, null, 'YbPIcHsJ7Fg', 2],
    [21, 'video', 'campanello', 'La nduja di Spilinga: produzione artigianale', null, null, 'QcBRVbLMCzo', 2],
    [22, 'video', 'artusi', 'I tortellini in brodo: ricetta originale bolognese', null, null, 'kJHXK1nfQaw', 2],
    [23, 'video', 'storie', 'Cavatelli molisani: la pasta del territorio', null, null, 'tJHABtbPoJ0', 2],
  ];

  const insertV = db.prepare('INSERT INTO contenuti (istituto_id, tipo, sezione, titolo, corpo, media_url, youtube_id, ordine, pubblicato) VALUES (?,?,?,?,?,?,?,?,1)');
  for (const v of videos) {
    insertV.run(...v);
    console.log('Added video for istituto', v[0]);
  }

  console.log('Done');
}

run().catch(console.error);
