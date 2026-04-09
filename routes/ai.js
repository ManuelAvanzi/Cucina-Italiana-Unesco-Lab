const express = require('express');
const { authIstituto } = require('../middleware/auth');

const router = express.Router();

// POST /api/ai/genera-testo
// Genera testo narrativo assistito per le sezioni campanello e storie
router.post('/genera-testo', authIstituto, async (req, res) => {
  const { sezione, titolo, contesto } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'API AI non configurata. Aggiungi ANTHROPIC_API_KEY nel file .env per abilitare questa funzione.'
    });
  }

  if (!titolo) return res.status(400).json({ error: 'Titolo obbligatorio' });

  const prompts = {
    campanello: `Sei un esperto di tradizioni culinarie italiane. Scrivi un testo narrativo breve (150-200 parole) e coinvolgente sulla ricetta o tradizione culinaria chiamata "${titolo}".
${contesto ? `Contesto aggiuntivo: ${contesto}` : ''}
Il tono deve essere caldo, familiare, come se stessi raccontando una storia di famiglia.
Evita elenchi puntati. Scrivi in prosa fluida in italiano. Includi dettagli sensoriali (profumi, sapori, colori).`,

    storie: `Sei uno storico della gastronomia italiana. Scrivi un breve racconto storico (150-200 parole) su "${titolo}".
${contesto ? `Contesto: ${contesto}` : ''}
Collega il piatto o l'ingrediente alla storia italiana, alle sue origini regionali e all'evoluzione nel tempo.
Usa uno stile narrativo e coinvolgente, adatto a un portale culturale UNESCO. Scrivi in italiano.`,

    artusi: `Sei un esperto della cucina di Pellegrino Artusi. Scrivi una descrizione coinvolgente (120-160 parole) della ricetta "${titolo}" nello stile di "La Scienza in cucina e l'Arte di mangiar bene".
${contesto ? `Note aggiuntive: ${contesto}` : ''}
Mantieni un tono ottocentesco ma accessibile, con qualche nota personale come faceva Artusi. Scrivi in italiano.`,

    generale: `Scrivi una descrizione culinaria italiana accattivante (100-150 parole) riguardante "${titolo}".
${contesto ? `Contesto: ${contesto}` : ''}
Tono: professionale ma appassionato. Legato alla tradizione culinaria italiana. Scrivi in italiano.`
  };

  const prompt = prompts[sezione] || prompts.generale;

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const testo = message.content[0]?.text || '';
    res.json({ testo, tokens: message.usage });
  } catch (e) {
    console.error('AI error:', e.message);
    res.status(500).json({ error: 'Errore nella generazione del testo: ' + e.message });
  }
});

// POST /api/ai/analizza-immagine
// Analizza un'immagine storica e genera un testo descrittivo (sezione Storie Culinarie)
router.post('/analizza-immagine', authIstituto, async (req, res) => {
  const { immagine_url, titolo } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ error: 'API AI non configurata.' });
  }
  if (!immagine_url) return res.status(400).json({ error: 'URL immagine obbligatorio' });

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: immagine_url }
          },
          {
            type: 'text',
            text: `Sei uno storico della gastronomia italiana. Analizza questa immagine${titolo ? ` relativa a "${titolo}"` : ''} e scrivi un testo narrativo storico di 120-150 parole che colleghi ciò che vedi alla tradizione culinaria italiana. Usa uno stile coinvolgente, adatto a un portale culturale UNESCO. Scrivi in italiano.`
          }
        ]
      }]
    });

    res.json({ testo: message.content[0]?.text || '' });
  } catch (e) {
    console.error('AI image error:', e.message);
    res.status(500).json({ error: 'Errore nell\'analisi: ' + e.message });
  }
});

module.exports = router;
