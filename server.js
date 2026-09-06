require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const db = require('./src/config/database');
const authRoutes = require('./src/routes/auth');
const playerRoutes = require('./src/routes/players');
const matchRoutes = require('./src/routes/matches');
const posterRoutes = require('./src/routes/posters');
const { requireAuth } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'electricos_fc_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if HTTPS with proxy
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  })
);

// Serve static assets (CSS, JS, images, uploads)
app.use(express.static(path.join(__dirname, 'public')));

// Public Auth API
app.use('/api/auth', authRoutes);

// Login HTML page (public)
app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

// Protect all remaining routes and APIs with authentication
app.use('/api', requireAuth);

// Registered API routes
app.use('/api/jugadores', playerRoutes);
app.use('/api/partidos', matchRoutes);
app.use('/api/carteles', posterRoutes);




// Placeholders for API route modules (will be implemented in subsequent blocks)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected SPA HTML pages router
app.get('*', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`⚡ Servidor de Eléctricos FC ejecutándose en http://localhost:${PORT}`);
});

module.exports = app;
