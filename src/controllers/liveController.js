const db = require('../config/database');

/**
 * Get active live match (if any match is currently in 1a_parte, descanso, or 2a_parte)
 */
function getActiveLiveMatch(req, res) {
  try {
    const activeMatch = db.prepare(`
      SELECT * FROM partidos 
      WHERE estado IN ('1a_parte', 'descanso', '2a_parte')
      ORDER BY fecha_hora DESC LIMIT 1
    `).get();

    if (!activeMatch) {
      return res.json({ active: false, match: null });
    }

    res.json({ active: true, matchId: activeMatch.id });
  } catch (err) {
    console.error('Error checking active live match:', err);
    res.status(500).json({ error: 'Error al buscar partido activo' });
  }
}

/**
 * Update match live state and time
 */
function updateLiveStatus(req, res) {
  try {
    const partidoId = req.params.id;
    const { estado, segundos_transcurridos } = req.body;

    const match = db.prepare('SELECT * FROM partidos WHERE id = ?').get(partidoId);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const stmt = db.prepare(`
      UPDATE partidos 
      SET estado = ?, segundos_transcurridos = ?, tiempo_inicio_parte = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(estado || match.estado, segundos_transcurridos || 0, partidoId);

    const updated = db.prepare('SELECT * FROM partidos WHERE id = ?').get(partidoId);
    res.json({ success: true, match: updated });
  } catch (err) {
    console.error('Error updating live status:', err);
    res.status(500).json({ error: 'Error al actualizar estado del partido' });
  }
}

/**
 * Add live match event (goal, card, substitution)
 */
function addLiveEvent(req, res) {
  try {
    const partidoId = req.params.id;
    const {
      minuto,
      periodo,
      es_electricos,
      tipo,
      jugador_id,
      asistente_id,
      jugador_sale_id
    } = req.body;

    if (!tipo || minuto === undefined) {
      return res.status(400).json({ error: 'Minuto y tipo de evento son obligatorios' });
    }

    const match = db.prepare('SELECT * FROM partidos WHERE id = ?').get(partidoId);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const isElectric = es_electricos ? 1 : 0;

    // Insert event
    const stmt = db.prepare(`
      INSERT INTO eventos_partido (
        partido_id, minuto, periodo, es_electricos, tipo,
        jugador_id, asistente_id, jugador_sale_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      partidoId,
      parseInt(minuto, 10),
      periodo || match.estado,
      isElectric,
      tipo,
      jugador_id ? parseInt(jugador_id, 10) : null,
      asistente_id ? parseInt(asistente_id, 10) : null,
      jugador_sale_id ? parseInt(jugador_sale_id, 10) : null
    );

    // If goal event, update match goal count
    if (tipo === 'gol') {
      if (isElectric) {
        if (match.equipo_local_es_electricos) {
          db.prepare('UPDATE partidos SET goles_local = goles_local + 1 WHERE id = ?').run(partidoId);
        } else {
          db.prepare('UPDATE partidos SET goles_visitante = goles_visitante + 1 WHERE id = ?').run(partidoId);
        }
      } else {
        if (match.equipo_local_es_electricos) {
          db.prepare('UPDATE partidos SET goles_visitante = goles_visitante + 1 WHERE id = ?').run(partidoId);
        } else {
          db.prepare('UPDATE partidos SET goles_local = goles_local + 1 WHERE id = ?').run(partidoId);
        }
      }
    }

    // If substitution event, update tactical pitch lineup
    if (tipo === 'cambio' && isElectric && jugador_id && jugador_sale_id) {
      db.prepare(`
        UPDATE alineaciones 
        SET jugador_id = ? 
        WHERE partido_id = ? AND jugador_id = ?
      `).run(jugador_id, partidoId, jugador_sale_id);
    }

    const updatedMatch = db.prepare('SELECT * FROM partidos WHERE id = ?').get(partidoId);
    res.json({ success: true, match: updatedMatch });
  } catch (err) {
    console.error('Error adding live event:', err);
    res.status(500).json({ error: 'Error al registrar evento' });
  }
}

/**
 * Delete / undo live event
 */
function deleteLiveEvent(req, res) {
  try {
    const { id, eventId } = req.params;
    const event = db.prepare('SELECT * FROM eventos_partido WHERE id = ? AND partido_id = ?').get(eventId, id);
    if (!event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    const match = db.prepare('SELECT * FROM partidos WHERE id = ?').get(id);

    // If deleting a goal, decrement score
    if (event.tipo === 'gol') {
      if (event.es_electricos) {
        if (match.equipo_local_es_electricos) {
          db.prepare('UPDATE partidos SET goles_local = MAX(0, goles_local - 1) WHERE id = ?').run(id);
        } else {
          db.prepare('UPDATE partidos SET goles_visitante = MAX(0, goles_visitante - 1) WHERE id = ?').run(id);
        }
      } else {
        if (match.equipo_local_es_electricos) {
          db.prepare('UPDATE partidos SET goles_visitante = MAX(0, goles_visitante - 1) WHERE id = ?').run(id);
        } else {
          db.prepare('UPDATE partidos SET goles_local = MAX(0, goles_local - 1) WHERE id = ?').run(id);
        }
      }
    }

    db.prepare('DELETE FROM eventos_partido WHERE id = ?').run(eventId);

    const updatedMatch = db.prepare('SELECT * FROM partidos WHERE id = ?').get(id);
    res.json({ success: true, match: updatedMatch });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Error al deshacer evento' });
  }
}

/**
 * Reset match completely back to 'programado' state (as if never started)
 */
function resetMatch(req, res) {
  try {
    const partidoId = req.params.id;
    const match = db.prepare('SELECT * FROM partidos WHERE id = ?').get(partidoId);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // Reset status, goals, and timer
    db.prepare(`
      UPDATE partidos 
      SET estado = 'programado', goles_local = 0, goles_visitante = 0, segundos_transcurridos = 0, tiempo_inicio_parte = NULL
      WHERE id = ?
    `).run(partidoId);

    // Delete all live events for this match
    db.prepare('DELETE FROM eventos_partido WHERE partido_id = ?').run(partidoId);

    const updated = db.prepare('SELECT * FROM partidos WHERE id = ?').get(partidoId);
    res.json({ success: true, message: 'Partido reiniciado correctamente', match: updated });
  } catch (err) {
    console.error('Error resetting match:', err);
    res.status(500).json({ error: 'Error al reiniciar el partido' });
  }
}

module.exports = {
  getActiveLiveMatch,
  updateLiveStatus,
  addLiveEvent,
  deleteLiveEvent,
  resetMatch
};
