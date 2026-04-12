require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "unpkg.com", "www.youtube.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com", "unpkg.com"],
      fontSrc: ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "*.openstreetmap.org", "*.tile.openstreetmap.org", "*.basemaps.cartocdn.com", "i.ytimg.com", "img.youtube.com", "images.unsplash.com", "plus.unsplash.com"],
      frameSrc: ["'self'", "www.youtube.com", "www.youtube-nocookie.com"],
      connectSrc: ["'self'", "nominatim.openstreetmap.org", "*.basemaps.cartocdn.com"],
    }
  }
}));

const corsOrigin = process.env.CORS_ORIGIN === '*' || !process.env.CORS_ORIGIN
  ? true  // In development accetta tutto
  : process.env.CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Troppi tentativi, riprova tra 15 minuti' } });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/admin/login', authLimiter);

// Static files — HTML senza cache, assets con cache normale
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));
// Uploads: in produzione su Render usa il disco persistente
const UPLOADS_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(UPLOADS_DIR));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/istituti', require('./routes/istituti'));
app.use('/api/contenuti', require('./routes/contenuti'));
app.use('/api/video', require('./routes/video'));
app.use('/api/museo', require('./routes/museo'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/immagini', require('./routes/immagini'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Fallback per /dashboard/ e /admin/ senza file specifico → serve index.html
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public/dashboard/index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public/admin/index.html')));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Errore interno del server' });
});

app.listen(PORT, () => {
  console.log(`\n🍝 Cucina Italiana UNESCO Lab`);
  console.log(`   Server avviato su http://localhost:${PORT}`);
  console.log(`   Premi CTRL+C per fermare\n`);
});
