const db = require('../db/database').getDb();
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

// Map istituto_id + sezione -> query
const targets = [
  [19, 'campanello', 'focaccia ligure bread italian'],
  [19, 'storie', 'medieval port genoa historical'],
  [20, 'campanello', 'pasta handmade umbria italy'],
  [20, 'storie', 'norcia prosciutto cured meat italian'],
  [21, 'campanello', 'pasta calabrese southern italy'],
  [21, 'storie', 'red chili pepper calabria spicy'],
  [22, 'campanello', 'sfoglia pasta making rolling pin'],
  [22, 'storie', 'via emilia bologna food market'],
  [23, 'campanello', 'italian countryside village apennines'],
  [23, 'storie', 'molise mountain village italy'],
];

async function run() {
  for (const [id, sezione, q] of targets) {
    try {
      const r = await apiGet('/api/immagini/cerca?q=' + encodeURIComponent(q) + '&count=1');
      if (r && r[0] && r[0].url_regular) {
        const res = db.prepare('UPDATE contenuti SET media_url=? WHERE istituto_id=? AND sezione=? AND tipo=\'testo\'').run(r[0].url_regular, id, sezione);
        console.log('Updated', id, sezione, ':', r[0].url_regular.substring(0, 50), '- rows:', res.changes);
      } else {
        console.log('No result for', id, sezione);
      }
    } catch(e) {
      console.error('Error', id, sezione, e.message);
    }
  }
  console.log('Done');
}

run().catch(console.error);
