const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'cucina_unesco.db'));
const hash = bcrypt.hashSync('Scuola2024!', 12);

const istituti = [
  {
    nome: 'IPSSAR Pellegrino Artusi',
    citta: 'Firenze', regione: 'Toscana', provincia: 'FI',
    indirizzo: 'Via dei Servi 38, Firenze',
    lat: 43.7731, lng: 11.2566,
    email: 'info@ipssar-artusi-fi.edu.it', username: 'ipssar_firenze',
    descrizione: 'Istituto alberghiero nel cuore di Firenze, specializzato nella cucina toscana e nella tradizione rinascimentale italiana.'
  },
  {
    nome: 'IPSSEOA Federico II',
    citta: 'Napoli', regione: 'Campania', provincia: 'NA',
    indirizzo: 'Via Toledo 102, Napoli',
    lat: 40.8400, lng: 14.2513,
    email: 'info@ipsseoa-federicoii.edu.it', username: 'ipsseoa_napoli',
    descrizione: 'Prestigioso istituto partenopeo custode delle tradizioni culinarie campane: dalla pizza napoletana al ragù.'
  },
  {
    nome: 'IISS Marchesi di Villarosa',
    citta: 'Palermo', regione: 'Sicilia', provincia: 'PA',
    indirizzo: 'Corso Vittorio Emanuele 461, Palermo',
    lat: 38.1157, lng: 13.3615,
    email: 'info@iiss-villarosa.edu.it', username: 'iiss_palermo',
    descrizione: "L'istituto alberghiero piu' antico della Sicilia, dedito alla valorizzazione della cucina arabo-normanna."
  },
  {
    nome: 'IPSSAR Carnacina',
    citta: 'Bardolino', regione: 'Veneto', provincia: 'VR',
    indirizzo: 'Via Giardini 2, Bardolino',
    lat: 45.5490, lng: 10.7270,
    email: 'info@ipssar-carnacina.edu.it', username: 'ipssar_bardolino',
    descrizione: 'Sulle rive del Lago di Garda, specializzato nella cucina veneta e lacustre. Eccellenza nel settore della ristorazione.'
  }
];

// Upsert istituti
const ids = {};
for (const ist of istituti) {
  let row = db.prepare('SELECT id FROM istituti WHERE username=?').get(ist.username);
  if (!row) {
    const r = db.prepare(
      'INSERT INTO istituti (nome,citta,regione,provincia,indirizzo,lat,lng,email,username,password,descrizione) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).run(ist.nome, ist.citta, ist.regione, ist.provincia, ist.indirizzo, ist.lat, ist.lng, ist.email, ist.username, hash, ist.descrizione);
    ids[ist.username] = r.lastInsertRowid;
    console.log('Istituto creato:', ist.nome);
  } else {
    ids[ist.username] = row.id;
    console.log('Istituto gia\' presente:', ist.nome);
  }
}

// Seed contenuti
const contenuti = [
  // Firenze
  { u:'ipssar_firenze', tipo:'testo', sezione:'artusi', titolo:'Pappardelle al cinghiale',
    corpo:'La pappardella al cinghiale e\' il simbolo della cucina toscana di caccia. Artusi nel capitolo sulla selvaggina descriveva con passione questo piatto robusto, profumato di rosmarino e vino rosso Chianti. I nostri studenti lo preparano con cinghiale della Maremma marinato 24 ore, seguendo la ricetta originale rivisitata in chiave moderna.' },
  { u:'ipssar_firenze', tipo:'testo', sezione:'campanello', titolo:'La ribollita della Nonna Maria',
    corpo:"In ogni famiglia fiorentina esiste una versione della ribollita. La nonna Maria, che ha insegnato questa ricetta a generazioni di studenti, usa il cavolo nero dell'orto e il pane raffermo di due giorni. Il segreto? Ribollarla davvero due volte, come suggerisce il nome. Con un filo d'olio nuovo toscano sopra, e' poesia." },
  { u:'ipssar_firenze', tipo:'testo', sezione:'storie', titolo:'La cucina rinascimentale fiorentina',
    corpo:"La Firenze medicea fu la culla della cucina moderna europea. Caterina de Medici, sposando Enrico II di Francia nel 1533, porto' con se' cuochi fiorentini che rivoluzionarono la gastronomia d'oltralpe. La besciamella, i macaron, il gelato: molte specialita' attribuite alla Francia nascono qui, nelle cucine di Palazzo Vecchio." },
  // Napoli
  { u:'ipsseoa_napoli', tipo:'testo', sezione:'artusi', titolo:'Spaghetti alle vongole verace',
    corpo:"Le vongole veraci del Golfo di Napoli sono impareggiabili scriveva Artusi. Questo piatto semplice nella forma ma complesso nell'esecuzione richiede timing perfetto: le vongole vanno aperte a fuoco vivo, il vino bianco deve sfumare nel momento giusto, e gli spaghetti finiscono di cuocere nel sugo. La differenza tra un piatto mediocre e uno sublime e' di 60 secondi." },
  { u:'ipsseoa_napoli', tipo:'testo', sezione:'campanello', titolo:'Il ragu\' di casa Esposito',
    corpo:"A Napoli il ragu' non e' una salsa: e' una filosofia. Lo metti sul fuoco alle sei del mattino, regoli la fiamma al minimo, e lo assaggi ogni ora. Dopo sei ore la carne si scioglie, il sugo e' denso e profuma di tutto il palazzo. La famiglia Esposito, di Forcella, aggiunge un pezzetto di cioccolato fondente verso la fine. Nessun libro lo insegnera' mai." },
  { u:'ipsseoa_napoli', tipo:'testo', sezione:'storie', titolo:'La pizza, patrimonio UNESCO 2017',
    corpo:"Nel 2017 l'arte del pizzaiuolo napoletano e' entrata nella lista UNESCO del patrimonio immateriale dell'umanita'. Non solo una ricetta: e' un gesto, un rito, una professione tramandata di padre in figlio. La farina 00 di grano tenero, il pomodoro San Marzano DOP, la mozzarella di bufala campana: ogni elemento racconta un territorio e una storia millenaria." },
  // Palermo
  { u:'iiss_palermo', tipo:'testo', sezione:'artusi', titolo:'Pasta con le sarde alla palermitana',
    corpo:"Non c'e' piatto che rappresenti meglio la Sicilia. La pasta con le sarde e' un incontro di civilta': le sarde del mare nostrum, il finocchietto selvatico dei monti Peloritani, l'uva passa e i pinoli portati dagli Arabi, lo zafferano dai commerci medievali. E' la storia di un'isola in un piatto, cucinata dai nostri studenti con ingredienti a km zero." },
  { u:'iiss_palermo', tipo:'testo', sezione:'campanello', titolo:'Caponata: 37 varianti e una sola anima',
    corpo:"Esistono almeno 37 varianti documentate della caponata siciliana. Agrigento usa le olive verdi, Catania aggiunge i peperoni, Palermo mette il cioccolato fondente. La ricetta custodita dalla famiglia Rizzo, tramandata da quattro generazioni, usa melanzane fritte due volte e aceto di vino vecchio invecchiato dieci anni. Dolce e agro: come la Sicilia." },
  // Bardolino
  { u:'ipssar_bardolino', tipo:'testo', sezione:'artusi', titolo:'Risotto al Bardolino Classico',
    corpo:"Il riso Vialone Nano del Delta del Po incontra il Bardolino Classico DOC sulle rive del Lago di Garda. Artusi dedico' numerose pagine al risotto veneto riconoscendone la superiorita' tecnica. La mantecatura finale con burro di malga del Monte Baldo e Grana Padano stagionato 24 mesi e' il momento sacro in cui il piatto prende vita." },
  { u:'ipssar_bardolino', tipo:'testo', sezione:'storie', titolo:'Mille anni di cucina lacustre gardesana',
    corpo:"La cucina lacustre gardesana risale ai monaci benedettini che nel X secolo introdussero l'allevamento del pesce di lago. Carpione, lavarello, anguilla affumicata sul legno di ulivo: questi pesci furono per secoli il sostentamento delle comunita' rivierasche. Oggi rappresentano un patrimonio gastronomico tutelato e il nostro istituto ne e' custode fiero." }
];

let count = 0;
for (const c of contenuti) {
  const istituto_id = ids[c.u];
  if (!istituto_id) continue;
  // Evita duplicati
  const exists = db.prepare('SELECT id FROM contenuti WHERE istituto_id=? AND titolo=?').get(istituto_id, c.titolo);
  if (!exists) {
    db.prepare('INSERT INTO contenuti (istituto_id,tipo,sezione,titolo,corpo,pubblicato) VALUES (?,?,?,?,?,1)')
      .run(istituto_id, c.tipo, c.sezione, c.titolo, c.corpo);
    count++;
  }
}
console.log('Contenuti creati:', count);

// Seed video tour demo
const videoDemo = [
  { u:'ipssar_firenze',   youtube_id:'M-kDRDEpJBs', titolo:'Firenze in cucina - Tour gastronomico', territorio:'Toscana', tema:'Turismo enogastronomico' },
  { u:'ipsseoa_napoli',   youtube_id:'cNMBi6V-KFM', titolo:'Pizza Napoletana - La tradizione UNESCO', territorio:'Campania', tema:'Ricette tradizionali' },
  { u:'iiss_palermo',     youtube_id:'rAHiqU0GDNM', titolo:'Mercato di Balaro\' - I sapori di Palermo', territorio:'Sicilia', tema:'Mercati e sagre' },
  { u:'ipssar_bardolino', youtube_id:'wfpkT0ey9yA', titolo:'Lago di Garda - Cucina lacustre veneta', territorio:'Veneto', tema:'Prodotti tipici' }
];

let vcount = 0;
for (const v of videoDemo) {
  const istituto_id = ids[v.u];
  if (!istituto_id) continue;
  const exists = db.prepare('SELECT id FROM video_tour WHERE istituto_id=? AND youtube_id=?').get(istituto_id, v.youtube_id);
  if (!exists) {
    db.prepare('INSERT INTO video_tour (istituto_id,youtube_id,titolo,territorio,tema,pubblicato) VALUES (?,?,?,?,?,1)')
      .run(istituto_id, v.youtube_id, v.titolo, v.territorio, v.tema);
    vcount++;
  }
}
console.log('Video tour creati:', vcount);
db.close();
