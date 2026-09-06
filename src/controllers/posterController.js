const db = require('../config/database');

/**
 * Get all poster design templates
 */
function getTemplates(req, res) {
  try {
    const templates = db.prepare('SELECT * FROM plantillas_cartel ORDER BY id ASC').all();
    res.json(templates);
  } catch (err) {
    console.error('Error fetching poster templates:', err);
    res.status(500).json({ error: 'Error al obtener plantillas de diseño' });
  }
}

module.exports = {
  getTemplates
};
