const db = require('../config/database');
const { FORMACIONES_FUTBOL_7 } = require('../utils/helpers');

/**
 * Save squad call-up (convocatoria)
 */
function saveConvocatoria(req, res) {
  try {
    const partidoId = req.params.id;
    const { jugadorIds } = req.body; // Array of player IDs

    if (!Array.isArray(jugadorIds)) {
      return res.status(400).json({ error: 'Formato de convocatoria no válido' });
    }

    // Clear existing squad call-up for this match
    db.prepare('DELETE FROM convocatorias WHERE partido_id = ?').run(partidoId);

    // Insert new call-up entries
    const insertStmt = db.prepare('INSERT INTO convocatorias (partido_id, jugador_id) VALUES (?, ?)');
    for (const jugadorId of jugadorIds) {
      insertStmt.run(partidoId, jugadorId);
    }

    // Remove lineup entries for players no longer in call-up
    if (jugadorIds.length > 0) {
      const placeholders = jugadorIds.map(() => '?').join(',');
      db.prepare(`DELETE FROM alineaciones WHERE partido_id = ? AND jugador_id NOT IN (${placeholders})`).run(partidoId, ...jugadorIds);
    } else {
      db.prepare('DELETE FROM alineaciones WHERE partido_id = ?').run(partidoId);
    }

    res.json({ success: true, message: 'Convocatoria actualizada correctamente' });
  } catch (err) {
    console.error('Error saving convocatoria:', err);
    res.status(500).json({ error: 'Error al actualizar la convocatoria' });
  }
}

/**
 * Save field lineup (alineación)
 */
function saveAlineacion(req, res) {
  try {
    const partidoId = req.params.id;
    const { formacion, alineacion } = req.body; // { formacion: '3-3', alineacion: { POR: 1, DEF_IZQ: 2, ... } }

    if (!formacion || !FORMACIONES_FUTBOL_7[formacion]) {
      return res.status(400).json({ error: 'Formación no válida' });
    }

    // Update formation on match record
    db.prepare('UPDATE partidos SET formacion = ? WHERE id = ?').run(formacion, partidoId);

    // Clear existing pitch assignments
    db.prepare('DELETE FROM alineaciones WHERE partido_id = ?').run(partidoId);

    // Insert pitch positions
    if (alineacion && typeof alineacion === 'object') {
      const insertStmt = db.prepare('INSERT INTO alineaciones (partido_id, posicion_campo, jugador_id) VALUES (?, ?, ?)');
      for (const [posicion_campo, jugador_id] of Object.entries(alineacion)) {
        if (jugador_id) {
          insertStmt.run(partidoId, posicion_campo, jugador_id);
        }
      }
    }

    res.json({ success: true, message: 'Alineación guardada correctamente' });
  } catch (err) {
    console.error('Error saving alineacion:', err);
    res.status(500).json({ error: 'Error al guardar la alineación' });
  }
}

module.exports = {
  saveConvocatoria,
  saveAlineacion
};
