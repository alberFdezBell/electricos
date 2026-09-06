const db = require('../config/database');

/**
 * Get all players with calculated match statistics
 */
function getAllPlayers(req, res) {
  try {
    const query = `
      SELECT 
        j.id,
        j.nombre,
        j.apellidos,
        j.dorsal,
        j.posicion,
        j.foto,
        j.created_at,
        COALESCE(SUM(CASE WHEN e.tipo = 'gol' AND e.jugador_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS goles,
        COALESCE(SUM(CASE WHEN e.tipo = 'gol' AND e.asistente_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS asistencias,
        COALESCE(SUM(CASE WHEN e.tipo = 'tarjeta_amarilla' AND e.jugador_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS amarillas,
        COALESCE(SUM(CASE WHEN e.tipo = 'tarjeta_roja' AND e.jugador_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS rojas
      FROM jugadores j
      LEFT JOIN eventos_partido e ON (e.jugador_id = j.id OR e.asistente_id = j.id)
      GROUP BY j.id
      ORDER BY j.dorsal ASC
    `;
    const players = db.prepare(query).all();
    res.json(players);
  } catch (err) {
    console.error('Error fetching players:', err);
    res.status(500).json({ error: 'Error al obtener la plantilla de jugadores' });
  }
}

/**
 * Get single player by ID with stats
 */
function getPlayerById(req, res) {
  try {
    const id = req.params.id;
    const query = `
      SELECT 
        j.id,
        j.nombre,
        j.apellidos,
        j.dorsal,
        j.posicion,
        j.foto,
        j.created_at,
        COALESCE(SUM(CASE WHEN e.tipo = 'gol' AND e.jugador_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS goles,
        COALESCE(SUM(CASE WHEN e.tipo = 'gol' AND e.asistente_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS asistencias,
        COALESCE(SUM(CASE WHEN e.tipo = 'tarjeta_amarilla' AND e.jugador_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS amarillas,
        COALESCE(SUM(CASE WHEN e.tipo = 'tarjeta_roja' AND e.jugador_id = j.id AND e.es_electricos = 1 THEN 1 ELSE 0 END), 0) AS rojas
      FROM jugadores j
      LEFT JOIN eventos_partido e ON (e.jugador_id = j.id OR e.asistente_id = j.id)
      WHERE j.id = ?
      GROUP BY j.id
    `;
    const player = db.prepare(query).get(id);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }
    res.json(player);
  } catch (err) {
    console.error('Error fetching player:', err);
    res.status(500).json({ error: 'Error al consultar datos del jugador' });
  }
}

/**
 * Create new player
 */
function createPlayer(req, res) {
  try {
    const { nombre, apellidos, dorsal, posicion } = req.body;
    let foto = '/images/electricos.png';

    if (req.file) {
      foto = `/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl) {
      foto = req.body.fotoUrl;
    }

    if (!nombre || !apellidos || !dorsal || !posicion) {
      return res.status(400).json({ error: 'Nombre, apellidos, dorsal y posición son obligatorios' });
    }

    // Check if dorsal is already taken
    const existing = db.prepare('SELECT id FROM jugadores WHERE dorsal = ?').get(dorsal);
    if (existing) {
      return res.status(400).json({ error: `El dorsal ${dorsal} ya está asignado a otro jugador.` });
    }

    const stmt = db.prepare(`
      INSERT INTO jugadores (nombre, apellidos, dorsal, posicion, foto)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(nombre, apellidos, parseInt(dorsal, 10), posicion, foto);

    const newPlayer = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, player: newPlayer });
  } catch (err) {
    console.error('Error creating player:', err);
    res.status(500).json({ error: 'Error al crear jugador: ' + err.message });
  }
}

/**
 * Update player details
 */
function updatePlayer(req, res) {
  try {
    const id = req.params.id;
    const { nombre, apellidos, dorsal, posicion } = req.body;

    const player = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(id);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    let foto = player.foto;
    if (req.file) {
      foto = `/uploads/${req.file.filename}`;
    } else if (req.body.fotoUrl) {
      foto = req.body.fotoUrl;
    }

    if (dorsal && parseInt(dorsal, 10) !== player.dorsal) {
      const existing = db.prepare('SELECT id FROM jugadores WHERE dorsal = ? AND id != ?').get(dorsal, id);
      if (existing) {
        return res.status(400).json({ error: `El dorsal ${dorsal} ya está en uso por otro jugador.` });
      }
    }

    const stmt = db.prepare(`
      UPDATE jugadores
      SET nombre = ?, apellidos = ?, dorsal = ?, posicion = ?, foto = ?
      WHERE id = ?
    `);
    stmt.run(
      nombre || player.nombre,
      apellidos || player.apellidos,
      dorsal ? parseInt(dorsal, 10) : player.dorsal,
      posicion || player.posicion,
      foto,
      id
    );

    const updated = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(id);
    res.json({ success: true, player: updated });
  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ error: 'Error al actualizar jugador' });
  }
}

/**
 * Delete player
 */
function deletePlayer(req, res) {
  try {
    const id = req.params.id;
    const player = db.prepare('SELECT * FROM jugadores WHERE id = ?').get(id);
    if (!player) {
      return res.status(404).json({ error: 'Jugador no encontrado' });
    }

    db.prepare('DELETE FROM jugadores WHERE id = ?').run(id);
    res.json({ success: true, message: 'Jugador eliminado correctamente' });
  } catch (err) {
    console.error('Error deleting player:', err);
    res.status(500).json({ error: 'Error al eliminar jugador' });
  }
}

module.exports = {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer
};
