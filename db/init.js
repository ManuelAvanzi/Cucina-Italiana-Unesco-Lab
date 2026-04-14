const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'cucina_unesco.db');

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
      cover_url TEXT,
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
      must_change_password INTEGER DEFAULT 1,
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

  // ── MIGRATIONS ─────────────────────────────────────────────────────────────
  // Aggiunge colonne mancanti su DB già esistenti (idempotente)
  const existingCols = db.prepare("PRAGMA table_info(istituti)").all().map(c => c.name);
  if (!existingCols.includes('cover_url')) {
    db.prepare("ALTER TABLE istituti ADD COLUMN cover_url TEXT").run();
  }

  // Seed admin account
  const adminExists = db.prepare('SELECT id FROM admin WHERE username = ?').get('admin');
  if (!adminExists) {
    const hash = bcrypt.hashSync('Admin2024!', 12);
    db.prepare('INSERT INTO admin (username, password, email) VALUES (?, ?, ?)').run('admin', hash, 'admin@cucinaitaliana.edu.it');
    console.log('Admin creato con credenziali di default.');
  }

  // Reset password admin se RESET_ADMIN_PW=1 (rimuovere la variabile dopo il login)
  if (process.env.RESET_ADMIN_PW === '1') {
    const hash = bcrypt.hashSync('Admin2024!', 12);
    db.prepare('UPDATE admin SET password = ?, must_change_password = 1 WHERE username = ?').run(hash, 'admin');
    console.log('Password admin resettata a default (Admin2024!).');
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
    console.log('Istituto demo creato con credenziali di default.');
  }

  // Seed museo item
  const museoExists = db.prepare('SELECT id FROM museo_items LIMIT 1').get();
  if (!museoExists) {
    db.prepare(`INSERT INTO museo_items (titolo, descrizione, immagine_url, link_esterno, ordine) VALUES (?, ?, ?, ?, ?)`).run(
      'La Cucina Italiana - Patrimonio UNESCO',
      'Esplora il ricco patrimonio della cucina italiana riconosciuto dall\'UNESCO come patrimonio culturale immateriale dell\'umanità.',
      '/assets/museo-hero.jpg', 'https://ich.unesco.org', 1
    );
  }

  // ── SEED ISTITUTI DEMO ──────────────────────────────────────────────────────
  const seedIstituti = [
    { nome:'IPSSAR Pellegrino Artusi', citta:'Firenze', regione:'Toscana', provincia:'FI', indirizzo:'Via dei Servi 38, Firenze', lat:43.7731, lng:11.2566, email:'info@ipssar-artusi-fi.edu.it', username:'ipssar_firenze', password:'Demo2024!', descrizione:'Istituto alberghiero con tradizione centenaria nel cuore di Firenze. Specializzato nella cucina toscana e nella tradizione rinascimentale.' },
    { nome:'IPSSEOA Federico II', citta:'Napoli', regione:'Campania', provincia:'NA', indirizzo:'Via Toledo 102, Napoli', lat:40.84, lng:14.2513, email:'info@ipsseoa-federicoii.edu.it', username:'ipsseoa_napoli', password:'Demo2024!', descrizione:'Prestigioso istituto partenopeo custode delle tradizioni culinarie campane: dalla pizza napoletana al ragù, passando per i dolci della tradizione.' },
    { nome:'IISS Marchesi di Villarosa', citta:'Palermo', regione:'Sicilia', provincia:'PA', indirizzo:'Corso Vittorio Emanuele 461, Palermo', lat:38.1157, lng:13.3615, email:'info@iiss-villarosa.edu.it', username:'iiss_palermo', password:'Demo2024!', descrizione:'L\'istituto alberghiero più antico della Sicilia, dedito alla valorizzazione della cucina arabo-normanna e dei prodotti tipici dell\'isola.' },
    { nome:'IPSSAR Carnacina', citta:'Bardolino', regione:'Veneto', provincia:'VR', indirizzo:'Via Giardini 2, Bardolino', lat:45.549, lng:10.727, email:'info@ipssar-carnacina.edu.it', username:'ipssar_bardolino', password:'Demo2024!', descrizione:'Sulle rive del Lago di Garda, specializzato nella cucina veneta e lagunare. Eccellenza nel settore della ristorazione lacustre e del vino.' },
    { nome:'IPSSEOA Giolitti - Colombatto', citta:'Torino', regione:'Piemonte', provincia:'TO', indirizzo:'Via Massena 13, Torino', lat:45.0705, lng:7.6868, email:'giolitti.torino@demo.it', username:'giolitti_torino', password:'Demo2024!', descrizione:'Storico istituto alberghiero torinese fondato nel 1960. Forma professionisti della ristorazione con radici nella grande tradizione culinaria piemontese: dal vitello tonnato al bunet, dai tajarin al tartufo d\'Alba.', sito_web:'https://www.giolitti.edu.it', telefono:'+39 011 562 1234' },
    { nome:'IPSAR Ciusa', citta:'Nuoro', regione:'Sardegna', provincia:'NU', indirizzo:'Via Convento 9, Nuoro', lat:40.3211, lng:9.3289, email:'ciusa.nuoro@demo.it', username:'ciusa_nuoro', password:'Demo2024!', descrizione:'L\'IPSAR Ciusa di Nuoro è il punto di riferimento per la formazione enogastronomica della Sardegna centrale. Custodisce e trasmette le tradizioni culinarie sarde: dal porceddu al pane carasau, dai culurgiones al sebadas con miele amaro.', sito_web:'https://www.ipsarciusa.edu.it', telefono:'+39 0784 200 123' },
    { nome:'IPSSAR Varnelli', citta:'Macerata', regione:'Marche', provincia:'MC', indirizzo:'Via Roma 12, Macerata', lat:43.2985, lng:13.4531, email:'varnelli.macerata@demo.it', username:'varnelli_macerata', password:'Demo2024!', descrizione:'L\'IPSSAR Varnelli di Macerata è l\'istituto alberghiero di riferimento per le Marche centrali. Porta in tavola l\'anima culinaria marchigiana: dai vincisgrassi al brodetto di Porto Recanati, dalle olive ascolane al vincotto di fichi.', sito_web:'https://www.ipssar-varnelli.edu.it', telefono:'+39 0733 230 456' },
    { nome:'IPSSAR Demo Liguria', citta:'Genova', regione:'Liguria', provincia:'GE', indirizzo:'Via Garibaldi 12, Genova', lat:44.4056, lng:8.9463, email:'demo.liguria@cucinaitaliana.edu.it', username:'demo_liguria', password:'Demo2024!', descrizione:'Istituto alberghiero genovese custode delle tradizioni culinarie liguri: dal pesto alla focaccia, dalle trofie al basilico ai fritti del mare.' },
    { nome:'IPSSEOA Demo Umbria', citta:'Perugia', regione:'Umbria', provincia:'PG', indirizzo:'Corso Vannucci 8, Perugia', lat:43.1122, lng:12.3888, email:'demo.umbria@cucinaitaliana.edu.it', username:'demo_umbria', password:'Demo2024!', descrizione:'Istituto alberghiero perugino che valorizza la cucina umbra: tartufo nero, norcineria, strangozzi e torta al testo.' },
    { nome:'IPSEOA Demo Calabria', citta:'Reggio Calabria', regione:'Calabria', provincia:'RC', indirizzo:'Via Marina 5, Reggio Calabria', lat:38.1157, lng:15.6441, email:'demo.calabria@cucinaitaliana.edu.it', username:'demo_calabria', password:'Demo2024!', descrizione:'Istituto alberghiero calabrese che porta in tavola la tradizione più autentica del Sud: nduja, peperoncino, fileja e pitta.' },
    { nome:'IPSSAR Demo Emilia-Romagna', citta:'Bologna', regione:'Emilia-Romagna', provincia:'BO', indirizzo:'Via Indipendenza 22, Bologna', lat:44.4949, lng:11.3426, email:'demo.emilia@cucinaitaliana.edu.it', username:'demo_emilia', password:'Demo2024!', descrizione:'Istituto alberghiero bolognese che custodisce l\'arte della sfoglia e i grandi classici emiliani: tortellini, tagliatelle al ragù, mortadella e Parmigiano Reggiano.' },
    { nome:'IPSSAR Demo Molise', citta:'Campobasso', regione:'Molise', provincia:'CB', indirizzo:'Via Roma 3, Campobasso', lat:41.5603, lng:14.6588, email:'demo.molise@cucinaitaliana.edu.it', username:'demo_molise', password:'Demo2024!', descrizione:'Istituto alberghiero molisano che riscopre la cucina appenninica: cavatelli, soffritto molisano, sagne e salsicce artigianali.' },
    { nome:'IPSSAR DEMO TEST - Istituto Verifica', citta:'Padova', regione:'Veneto', provincia:'PD', indirizzo:'Via Roma 1, Padova', lat:45.4001793, lng:11.8831573, email:'demo@ipssar-demo-test.edu.it', username:'demo_test_padova', password:'Demo2024!', descrizione:'Istituto di test per la verifica del flusso completo di registrazione. Specializzato in cucina veneta tradizionale e innovazione gastronomica.' },
  ];

  const insertIstituto = db.prepare(`INSERT OR IGNORE INTO istituti (nome, citta, regione, provincia, indirizzo, lat, lng, email, username, password, descrizione, sito_web, telefono) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const i of seedIstituti) {
    if (!db.prepare('SELECT id FROM istituti WHERE username = ?').get(i.username)) {
      insertIstituto.run(i.nome, i.citta, i.regione, i.provincia||null, i.indirizzo||null, i.lat||null, i.lng||null, i.email, i.username, bcrypt.hashSync(i.password, 10), i.descrizione||null, i.sito_web||null, i.telefono||null);
    }
  }

  // ── SEED CONTENUTI DEMO ─────────────────────────────────────────────────────
  const contenutiCount = db.prepare('SELECT COUNT(*) as n FROM contenuti').get().n;
  if (contenutiCount === 0) {
    const getId = (username) => db.prepare('SELECT id FROM istituti WHERE username = ?').get(username)?.id;
    const ins = db.prepare(`INSERT INTO contenuti (istituto_id, tipo, sezione, titolo, corpo, media_url, pubblicato, ordine) VALUES (?,?,?,?,?,?,1,1)`);
    const seedC = [
      // Firenze (ipssar_firenze)
      ['ipssar_firenze','testo','artusi','Pappardelle al cinghiale','La pappardella al cinghiale è il simbolo della cucina toscana di caccia. Artusi nel capitolo sulla selvaggina descriveva con passione questo piatto robusto, profumato di rosmarino e vino rosso Chianti.',null],
      ['ipssar_firenze','testo','campanello','La ribollita della Nonna Maria','In ogni famiglia fiorentina esiste una versione della ribollita. La nonna Maria usa il cavolo nero dell\'orto e il pane raffermo di due giorni. Il segreto? Ribollarla davvero due volte, come suggerisce il nome.',null],
      ['ipssar_firenze','testo','storie','La cucina rinascimentale fiorentina','La Firenze medicea fu la culla della cucina moderna europea. Caterina de Medici, sposando Enrico II di Francia nel 1533, portò con sé cuochi fiorentini che rivoluzionarono la gastronomia d\'oltralpe.',null],
      // Napoli (ipsseoa_napoli)
      ['ipsseoa_napoli','testo','artusi','Spaghetti alle vongole verace','Le vongole veraci del Golfo di Napoli sono impareggiabili. Questo piatto semplice nella forma ma complesso nell\'esecuzione richiede timing perfetto: le vongole vanno aperte a fuoco vivo.',null],
      ['ipsseoa_napoli','testo','campanello','Il ragù di casa Esposito','A Napoli il ragù non è una salsa: è una filosofia. Lo metti sul fuoco alle sei del mattino, regoli la fiamma al minimo, e lo assaggi ogni ora. Dopo sei ore la carne si scioglie.',null],
      ['ipsseoa_napoli','testo','storie','La pizza, patrimonio UNESCO 2017','Nel 2017 l\'arte del pizzaiuolo napoletano è entrata nella lista UNESCO. Non solo una ricetta: è un gesto, un rito, una professione tramandata di padre in figlio.',null],
      // Palermo (iiss_palermo)
      ['iiss_palermo','testo','artusi','Pasta con le sarde alla palermitana','La pasta con le sarde è un incontro di civiltà: le sarde del mare nostrum, il finocchietto selvatico, l\'uva passa e i pinoli portati dagli Arabi, lo zafferano dai commerci medievali.',null],
      ['iiss_palermo','testo','campanello','Caponata: 37 varianti e una sola anima','Esistono almeno 37 varianti documentate della caponata siciliana. La ricetta custodita dalla famiglia Rizzo usa melanzane fritte due volte e aceto di vino vecchio invecchiato dieci anni.',null],
      // Bardolino (ipssar_bardolino)
      ['ipssar_bardolino','testo','artusi','Risotto al Bardolino Classico','Il riso Vialone Nano del Delta del Po incontra il Bardolino Classico DOC sulle rive del Lago di Garda. La mantecatura finale con burro di malga è il momento sacro.',null],
      ['ipssar_bardolino','testo','storie','Mille anni di cucina lacustre gardesana','La cucina lacustre gardesana risale ai monaci benedettini del X secolo. Carpione, lavarello, anguilla affumicata sul legno di ulivo: questi pesci furono per secoli il sostentamento delle comunità.',null],
      // Torino (giolitti_torino)
      ['giolitti_torino','testo','artusi','Bagna Cauda secondo Artusi','La bagna cauda è il simbolo dell\'identità culinaria piemontese. Artusi la descrive come salsa calda per intingere verdure crude: acciughe, aglio e olio d\'oliva cotti a fuoco lentissimo.',null],
      ['giolitti_torino','testo','campanello','Tajarin al tartufo: la variante di nonna Giovanna','In casa Ferraris i tajarin si fanno con 40 tuorli per chilo di farina. Mai l\'uovo intero ripeteva nonna Giovanna. Il sugo è di burro di montagna, salvia e lamelle di tartufo bianco d\'Asti.',null],
      // Nuoro (ciusa_nuoro)
      ['ciusa_nuoro','testo','artusi','Sebadas: il dolce sardo che Artusi non conobbe','Le sebadas sono il dessert più iconico della Sardegna: sfoglia di semola ripiena di formaggio pecorino fresco, fritta e irrorata di miele amaro di corbezzolo.',null],
      ['ciusa_nuoro','testo','storie','Il pane carasau e la civiltà dei pastori','Il pane carasau nasce dall\'esigenza dei pastori sardi di portare con sé un pane che durasse mesi durante la transumanza. Sfoglie di semola cotte due volte: un patrimonio che sopravvive intatto.',null],
      // Macerata (varnelli_macerata)
      ['varnelli_macerata','testo','campanello','Le olive ascolane di nonna Rina','Ogni famiglia di Ascoli Piceno ha la sua ricetta. Nonna Rina ci ha aperto il suo quaderno ingiallito. Il segreto: carni miste rosolate con cipolla dorata, profumate con noce moscata e Marsala.',
        'https://images.unsplash.com/photo-1751158949988-fcc5c3e3e91f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['varnelli_macerata','ricetta','artusi','Vincisgrassi - il ragù marchigiano secondo Artusi','I vincisgrassi sono la lasagna marchigiana per eccellenza. La nostra versione segue la ricetta del Settecento: sfoglia all\'uovo, ragù di rigaglie di pollo, prosciutto di Carpegna e besciamella al Vin Santo.',
        'https://images.unsplash.com/photo-1608033114294-c24268b7f916?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      // Genova (demo_liguria)
      ['demo_liguria','testo','artusi','Il Pesto Genovese secondo Artusi','Artusi descriveva il basilico ligure come il profumo del Mediterraneo in una foglia. La ricetta del pesto al mortaio è rimasta invariata per secoli.',
        'https://images.unsplash.com/photo-1538596313828-41d729090199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_liguria','testo','campanello','La Focaccia di Recco di nonna Giuseppina','La pasta deve essere sottilissima, quasi trasparente. Il formaggio prescinsèua deve essere fresco, leggermente acido. Non si trova fuori dalla Liguria.',
        'https://images.unsplash.com/photo-1745360687545-5e777feae744?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_liguria','testo','storie','La via del sale: Genova e le rotte culinarie medievali','Nel Medioevo Genova era il crocevia delle spezie. I genovesi portarono in Europa la pasta essiccata, il baccalà, le acciughe sotto sale.',
        'https://images.unsplash.com/photo-1766776964188-85398ef8c2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      // Perugia (demo_umbria)
      ['demo_umbria','testo','artusi','Il Tartufo Nero di Norcia: la gemma della cucina umbra','Artusi dedicò pagine memorabili al tartufo, definendolo il diamante della cucina. In Umbria il tartufo nero di Norcia è protagonista di una tradizione millenaria.',
        'https://images.unsplash.com/photo-1666713866563-6c1e4d051e96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_umbria','testo','campanello','Strangozzi al tartufo: la ricetta della famiglia Brunetti','Gli strangozzi sono la pasta tipica di Spoleto. La famiglia Brunetti li prepara dal 1935: farina di grano duro, acqua, un pizzico di sale. L\'irregolarità è la perfezione.',
        'https://images.unsplash.com/photo-1668253850779-ec682e468e10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_umbria','testo','storie','Norcineria umbra: l\'arte della conservazione della carne','La parola norcino deriva da Norcia, città da cui partivano i maestri dell\'arte della lavorazione del maiale. Dal XIV secolo i norcini giravano tutta l\'Italia.',
        'https://images.unsplash.com/photo-1768758908192-64475ef3750a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      // Calabria (demo_calabria)
      ['demo_calabria','testo','artusi','La Nduja di Spilinga: il fuoco della Calabria','Questa salsiccia spalmabile piccantissima di Spilinga rappresenta uno dei prodotti più originali della gastronomia italiana.',
        'https://images.unsplash.com/photo-1668946406806-d3e52ecb1afb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_calabria','testo','campanello','I Fileja di nonna Caterina: la pasta di montagna','I fileja sono la pasta tipica calabrese, realizzati arrotolando un bastoncino di impasto attorno a un ferro. Nonna Caterina di Serra San Bruno li prepara con sugo di capra.',
        'https://images.unsplash.com/photo-1621371204796-08671d998076?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_calabria','testo','storie','Il peperoncino calabrese: storia di una identità culturale','Il peperoncino arrivò in Calabria dalla Spagna nel XVI secolo. Oggi la Calabria è la regione italiana con il maggior numero di varietà.',
        'https://images.unsplash.com/photo-1668946406806-d3e52ecb1afb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      // Bologna (demo_emilia)
      ['demo_emilia','testo','artusi','I Tortellini in brodo: la ricetta canonica di Artusi','Artusi descrive i tortellini bolognesi come il piatto più rappresentativo della cucina italiana. Sfoglia all\'uovo, ripieno di lombo di maiale, prosciutto e mortadella.',
        'https://images.unsplash.com/photo-1747852628136-e612ace24a23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_emilia','testo','campanello','La sfoglia della rezdora: memoria di Mirella','La rezdora era la maestra della sfoglia. Mirella Zanotti, 82 anni di Castelfranco Emilia, tira ancora oggi la sfoglia al mattarello su un tagliere di 60 anni.',
        'https://images.unsplash.com/photo-1590118681330-cc529d8c2032?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_emilia','testo','storie','Via Emilia: la strada che ha unificato i sapori d\'Italia','La Via Emilia, costruita dai Romani nel 187 a.C., è stata per secoli la via del commercio. Lungo i suoi 262 km si sono sedimentati i sapori di una civiltà contadina.',null],
      // Campobasso (demo_molise)
      ['demo_molise','testo','artusi','I Cavatelli molisani: Artusi e la pasta di grano duro','I cavatelli sono la pasta simbolo del Molise. Farina di grano duro Senatore Cappelli, acqua, sale. Con sugo di salsiccia molisana e cacioricotta.',
        'https://images.unsplash.com/photo-1664660973710-b6c814edc795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_molise','testo','campanello','Il Soffritto molisano di nonna Assunta','Il soffritto molisano non è il soffritto che conoscete: è un ragù di frattaglie di maiale cotto a lungo con pomodoro, peperoncino e alloro.',
        'https://images.unsplash.com/photo-1664660973710-b6c814edc795?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_molise','testo','storie','Il Molise invisibile: riscoprire una cucina dimenticata','Il Molise è la regione italiana meno conosciuta. Eppure custodisce una delle cucine più autentiche della penisola.',
        'https://images.unsplash.com/photo-1768327507555-373451f6bb8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      // Padova demo test (demo_test_padova)
      ['demo_test_padova','ricetta','artusi','Risotto alla Padovana secondo Artusi','La nostra versione utilizza riso Vialone Nano delle risaie veronesi, brodo di gallina padovana e radicchio rosso di Treviso.',
        'https://images.unsplash.com/photo-1579551596261-be842fb67618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_test_padova','testo','artusi','I Bigoli in salsa di Artusi','I bigoli, pasta lunga e grossa tipica del Veneto, vengono conditi con una salsa di cipolle e acciughe secondo la ricetta artusiana.',
        'https://images.unsplash.com/photo-1592312406332-ceea6e9ee8fb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_test_padova','testo','campanello','La Polenta di nonna Rosa','Nonna Rosa prepara la polenta ogni domenica: il paiolo di rame, il fuoco lento, i 45 minuti di mescolamento continuo. La serve con sopressa vicentina e funghi porcini.',
        'https://images.unsplash.com/photo-1646678258645-f00383ce6929?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_test_padova','ricetta','campanello','Fegato alla veneziana - la variante di zia Maria','Zia Maria aggiunge un pizzico di cannella e una spruzzata di aceto balsamico. Le cipolle devono cuocere per almeno un\'ora prima di aggiungere il fegato.',
        'https://images.unsplash.com/photo-1577308856961-8e9ec50d0c67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_test_padova','testo','storie','La via del sale: Padova crocevia commerciale','Nel XIV secolo Padova era un crocevia fondamentale per il commercio del sale e delle spezie. I mercanti veneziani portavano le spezie orientali.',
        'https://images.unsplash.com/photo-1651565505046-1794f5417a76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
      ['demo_test_padova','testo','storie','Le osterie padovane e la cucina universitaria','Dal 1222, anno di fondazione dell\'Università, le osterie padovane sono diventate luoghi di incontro tra studenti di tutta Europa.',
        'https://images.unsplash.com/photo-1564801629778-eabf6ed7d440?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'],
    ];
    for (const [username, tipo, sezione, titolo, corpo, media_url] of seedC) {
      const istituto_id = getId(username);
      if (istituto_id) ins.run(istituto_id, tipo, sezione, titolo, corpo, media_url);
    }
  }

  // ── SEED VIDEO TOUR DEMO ────────────────────────────────────────────────────
  const videoCount = db.prepare('SELECT COUNT(*) as n FROM video_tour').get().n;
  if (videoCount === 0) {
    const getId = (username) => db.prepare('SELECT id FROM istituti WHERE username = ?').get(username)?.id;
    const insV = db.prepare(`INSERT INTO video_tour (istituto_id, youtube_id, titolo, descrizione, territorio, tema, pubblicato) VALUES (?,?,?,?,?,?,1)`);
    const seedV = [
      ['ipssar_firenze',   'w9AKF746aOg', 'Polenta e Coniglio alla Toscana', null, 'Toscana', 'Turismo enogastronomico'],
      ['ipsseoa_napoli',   'GyB3w0jULx8', 'Cucina Siciliana - Le tradizioni di Pasqua', null, 'Campania', 'Ricette tradizionali'],
      ['iiss_palermo',     'MpYYxcF_KFM', 'Cavatelli con Fagioli - Pasta tradizionale', null, 'Sicilia', 'Mercati e sagre'],
      ['ipssar_bardolino', 'nTC3thumFNg', 'Pasta fatta a mano dall\'Emilia Romagna', null, 'Veneto', 'Prodotti tipici'],
      ['varnelli_macerata','qMAtITMvQUE', 'Tagliatini con Fagioli alla Toscana', 'Un viaggio attraverso i sapori autentici delle Marche: dai vincisgrassi di Macerata alle olive ascolane.', 'Marche', 'Turismo enogastronomico'],
      ['demo_test_padova', 'I3nQuf73WLM', 'Tagliatelle al Ragù - Cucina Veneta Tradizionale', 'Anna prepara le tagliatelle fatte a mano con ragù di carne alla padovana. Una ricetta tramandata dalla sua famiglia da oltre tre generazioni.', 'Padova, Veneto', 'Ricette tradizionali'],
    ];
    for (const [username, youtube_id, titolo, descrizione, territorio, tema] of seedV) {
      const istituto_id = getId(username);
      if (istituto_id) insV.run(istituto_id, youtube_id, titolo, descrizione, territorio, tema);
    }
  }

  db.close();
  console.log('Database inizializzato con successo:', DB_PATH);
}

initDatabase();
