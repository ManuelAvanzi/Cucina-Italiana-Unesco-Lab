const db = require('../db/database').getDb();
const insert = db.prepare('INSERT INTO contenuti (istituto_id, tipo, sezione, titolo, corpo, media_url, youtube_id, ordine, pubblicato) VALUES (?,?,?,?,?,?,?,?,1)');

const contenuti = [
  // LIGURIA (id=19)
  [19, 'testo', 'artusi', 'Il Pesto Genovese secondo Artusi',
   'Pellegrino Artusi descriveva il basilico ligure come il profumo del Mediterraneo in una foglia. La ricetta del pesto al mortaio e rimasta invariata per secoli: basilico DOP, pinoli, aglio, olio extravergine di oliva ligure, Parmigiano Reggiano e Pecorino. Il segreto e nel movimento circolare del pestello, che non taglia ma schiaccia le foglie, liberando gli oli essenziali senza ossidarli.',
   null, null, 1],
  [19, 'testo', 'campanello', 'La Focaccia di Recco di nonna Giuseppina',
   'Nonna Giuseppina, 78 anni, prepara la focaccia di Recco ogni domenica mattina. La pasta deve essere sottilissima, quasi trasparente, ci dice mentre stende l\'impasto con le mani. Il formaggio prescinsèua deve essere fresco, leggermente acido. Non si trova fuori dalla Liguria. La sua ricetta e tramandata di generazione in generazione dal 1921.',
   null, null, 1],
  [19, 'testo', 'storie', 'La via del sale: Genova e le rotte culinarie medievali',
   'Nel Medioevo, Genova era il crocevia delle spezie e dei sapori del mondo. I genovesi portarono in Europa la pasta essiccata, il baccala sotto sale, le acciughe conservate sotto sale. La cucina ligure nasce da questa vocazione marinara: povera di risorse terrestri, ricchissima di mare e di commercio. Il basilico fu coltivato sulle terrazze per sopperire alla scarsita di terra coltivabile.',
   null, null, 1],

  // UMBRIA (id=20)
  [20, 'testo', 'artusi', 'Il Tartufo Nero di Norcia: la gemma della cucina umbra',
   'Artusi dedico pagine memorabili al tartufo, definendolo il diamante della cucina. In Umbria, il tartufo nero di Norcia e protagonista di una tradizione culinaria millenaria. Gli studenti dell\'IPSSEOA Demo Umbria hanno reinterpretato tre ricette artusesche sostituendo il tartufo bianco con quello nero locale: le uova al tartufo, le tagliatelle e il risotto.',
   null, null, 1],
  [20, 'testo', 'campanello', 'Strangozzi al tartufo: la ricetta della famiglia Brunetti',
   'Gli strangozzi sono la pasta tipica di Spoleto e Foligno. La famiglia Brunetti li prepara dal 1935: farina di grano duro, acqua, un pizzico di sale. Niente uova. L\'impasto deve riposare mezz\'ora, poi si tira al mattarello, non troppo sottile, e si taglia a strisce irregolari. L\'irregolarita e la perfezione.',
   null, null, 1],
  [20, 'testo', 'storie', 'Norcineria umbra: l\'arte della conservazione della carne',
   'La parola norcino deriva da Norcia, citta umbra da cui partivano in inverno i maestri dell\'arte della lavorazione del maiale. Dal XIV secolo i norcini giravano tutta l\'Italia a insegnare tecniche di conservazione. Il prosciutto di Norcia IGP, la lonza, il capocollo e la salsiccia secca sono il risultato di questa tradizione millenaria.',
   null, null, 1],

  // CALABRIA (id=21)
  [21, 'testo', 'artusi', 'La Nduja di Spilinga: il fuoco della Calabria',
   'Artusi non menziona la nduja nel suo trattato, era troppo lontana dal mondo borghese fiorentino. Eppure questa salsiccia spalmabile piccantissima di Spilinga rappresenta uno dei prodotti piu originali della gastronomia italiana. Gli studenti hanno confrontato la ricetta tradizionale con le interpretazioni moderne: dalla bruschetta alla nduja al risotto, fino alla pizza con fior di latte e nduja.',
   null, null, 1],
  [21, 'testo', 'campanello', 'I Fileja di nonna Caterina: la pasta di montagna',
   'I fileja sono la pasta tipica della cucina calabrese di montagna, realizzati arrotolando un bastoncino di impasto attorno a un ferro. Nonna Caterina di Serra San Bruno li prepara con sugo di capra e peperoncino rosso di Calabria. Il ferro deve essere caldo, spiega. E l\'impasto deve essere abbastanza duro. Se e morbido, il fileja non tiene la cottura. Una pazienza che si tramanda da 200 anni.',
   null, null, 1],
  [21, 'testo', 'storie', 'Il peperoncino calabrese: storia di una identita culturale',
   'Il peperoncino arrivo in Calabria dalla Spagna nel XVI secolo e in poco tempo divenne il simbolo della cucina regionale. Povero, abbondante, conservabile: il peperoncino sostituì le spezie costose nelle cucine contadine. Oggi la Calabria e la regione italiana con il maggior numero di varieta di peperoncino: il diavolicchio, il cornetto, il peperone di Senise IGP.',
   null, null, 1],

  // EMILIA-ROMAGNA (id=22)
  [22, 'testo', 'artusi', 'I Tortellini in brodo: la ricetta canonica di Artusi',
   'Artusi nella Scienza in Cucina descrive i tortellini bolognesi come il piatto piu rappresentativo della cucina italiana. Gli studenti dell\'IPSSAR Demo Emilia-Romagna hanno ricostruito la ricetta artusiana originale: sfoglia all\'uovo tirata al mattarello, ripieno di lombo di maiale, prosciutto crudo, mortadella, Parmigiano e noce moscata. Serviti in brodo di cappone.',
   null, null, 1],
  [22, 'testo', 'campanello', 'La sfoglia della rezdora: memoria di Mirella',
   'La rezdora, la reggitrice della casa emiliana, era la maestra della sfoglia. Mirella Zanotti, 82 anni di Castelfranco Emilia, tira ancora oggi la sfoglia al mattarello su un tagliere di legno vecchio di 60 anni. Ci vogliono le braccia, non il mattarello, dice. La sfoglia di Mirella raggiunge lo spessore di carta: un\'abilita che le giovani generazioni stanno riscoprendo.',
   null, null, 1],
  [22, 'testo', 'storie', 'Via Emilia: la strada che ha unificato i sapori d\'Italia',
   'La Via Emilia, costruita dai Romani nel 187 a.C., e stata per secoli la via del commercio. Lungo i suoi 262 km si sono sedimentati i sapori di una civilta contadina e mercantile. Gli studenti hanno documentato le produzioni agroalimentari DOP e IGP di ogni tappa: Parmigiano Reggiano, Prosciutto di Parma, Culatello di Zibello, Aceto Balsamico di Modena.',
   null, null, 1],

  // MOLISE (id=23)
  [23, 'testo', 'artusi', 'I Cavatelli molisani: Artusi e la pasta di grano duro',
   'I cavatelli sono la pasta simbolo del Molise. Artusi nel suo trattato descrive paste simili del Sud Italia con la loro caratteristica di abbracciare il condimento grazie alla forma concava. Gli studenti dell\'IPSSAR Demo Molise hanno realizzato un video documentando la tecnica tradizionale: farina di grano duro Senatore Cappelli, acqua, sale. Con sugo di salsiccia molisana e cacioricotta.',
   null, null, 1],
  [23, 'testo', 'campanello', 'Il Soffritto molisano di nonna Assunta',
   'Il soffritto molisano non e il soffritto che conoscete: e un ragu di frattaglie di maiale cotto a lungo con pomodoro, peperoncino e alloro. Nonna Assunta di Isernia lo prepara la mattina del 17 gennaio, giorno di Sant\'Antonio Abate. Si faceva con quello che il maiale lasciava, racconta. Niente si buttava. Era il cibo dei poveri, oggi e una rarita.',
   null, null, 1],
  [23, 'testo', 'storie', 'Il Molise invisibile: riscoprire una cucina dimenticata',
   'Il Molise e la regione italiana meno conosciuta, spesso dimenticata anche nelle guide gastronomiche. Eppure custodisce una delle cucine piu autentiche della penisola. Gli studenti hanno realizzato un progetto di ricerca sui prodotti del Molise minore: la soppressata di Rionero Sannitico, il caciocavallo di Agnone, il farro di Capracotta, i legumi antichi delle valli del Volturno.',
   null, null, 1],
];

let count = 0;
for (const c of contenuti) {
  insert.run(...c);
  count++;
}
console.log('Created', count, 'contenuti');
