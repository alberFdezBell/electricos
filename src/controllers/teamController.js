const db = require('../config/database');

/**
 * Get all teams
 */
function getAllTeams(req, res) {
  try {
    const teams = db.prepare('SELECT * FROM equipos ORDER BY nombre ASC').all();
    res.json(teams);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Error al obtener los equipos' });
  }
}

/**
 * Create new team
 */
function createTeam(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre del equipo es obligatorio' });
    }

    let foto = '';
    if (req.file) {
      foto = `/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl) {
      foto = req.body.fotoUrl;
    }

    const existing = db.prepare('SELECT id FROM equipos WHERE nombre = ?').get(nombre.trim());
    if (existing) {
      return res.status(400).json({ error: 'Ya existe un equipo con ese nombre' });
    }

    const result = db.prepare('INSERT INTO equipos (nombre, foto) VALUES (?, ?)').run(nombre.trim(), foto);
    const newTeam = db.prepare('SELECT * FROM equipos WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, team: newTeam });
  } catch (err) {
    console.error('Error creating team:', err);
    res.status(500).json({ error: 'Error al crear el equipo: ' + err.message });
  }
}

/**
 * Update team
 */
function updateTeam(req, res) {
  try {
    const id = req.params.id;
    const team = db.prepare('SELECT * FROM equipos WHERE id = ?').get(id);
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });

    const nombre = req.body.nombre ? req.body.nombre.trim() : team.nombre;
    let foto = team.foto;
    if (req.file) {
      foto = `/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl !== undefined) {
      foto = req.body.fotoUrl;
    }

    db.prepare('UPDATE equipos SET nombre = ?, foto = ? WHERE id = ?').run(nombre, foto, id);
    const updated = db.prepare('SELECT * FROM equipos WHERE id = ?').get(id);
    res.json({ success: true, team: updated });
  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ error: 'Error al actualizar el equipo' });
  }
}

/**
 * Delete team
 */
function deleteTeam(req, res) {
  try {
    const id = req.params.id;
    const team = db.prepare('SELECT * FROM equipos WHERE id = ?').get(id);
    if (!team) return res.status(404).json({ error: 'Equipo no encontrado' });

    db.prepare('DELETE FROM equipos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Equipo eliminado correctamente' });
  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
}

module.exports = {
  getAllTeams,
  createTeam,
  updateTeam,
  deleteTeam
};