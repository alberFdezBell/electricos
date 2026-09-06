function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }

  // Allow public GET requests for spectator live match endpoints
  if (req.method === 'GET' && (
    req.originalUrl === '/api/partidos/en-directo/activo' ||
    req.originalUrl.match(/^\/api\/partidos\/\d+$/)
  )) {
    return next();
  }
  
  // Check req.originalUrl to correctly detect /api/ routes when middleware is mounted on /api
  if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autorizado. Por favor inicie sesión.' });
  }

  // Otherwise redirect browser to login page
  return res.redirect('/login');
}

module.exports = { requireAuth };
