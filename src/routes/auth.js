const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'electricos2026';

  if (username === adminUser && password === adminPass) {
    req.session.authenticated = true;
    req.session.username = username;
    return res.json({ success: true, message: 'Inicio de sesión correcto' });
  }

  return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

router.get('/status', (req, res) => {
  const authenticated = !!(req.session && req.session.authenticated);
  return res.json({ authenticated, username: req.session ? req.session.username : null });
});

module.exports = router;
