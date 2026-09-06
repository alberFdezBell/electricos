function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  
  // If request is an API call, return 401 JSON
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autorizado. Por favor inicie sesión.' });
  }

  // Otherwise redirect browser to login page
  return res.redirect('/login');
}

module.exports = { requireAuth };
