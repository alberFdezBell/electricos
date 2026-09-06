const db = require('../config/database');
const { formatFechaEspandol, getMatchUrl, getMatchLiveUrl } = require('../utils/helpers');

/**
 * Get all matches with optional state filter
 */
function getAllMatches(req, res) {
  try {
    const filter = req.query.filter; // 'finalizado' or 'programado'
    let query = 'SELECT * FROM partidos';
    const params = [];

    if (filter === 'finalizado') {
      query += " WHERE estado = 'finalizado'";
    } else if (filter === 'programado') {
      query += " WHERE estado != 'finalizado'";
    }

    query += ' ORDER BY fecha_hora ASC';

    const matches = db.prepare(query).all(...params);

    const formattedMatches = matches.map(m => ({
      ...m,
      fecha_formateada: formatFechaEspandol(m.fecha_hora),
      url: getMatchUrl(m),
      url_live: getMatchLiveUrl(m)
    }));

    res.json(formattedMatches);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ error: 'Error al obtener el calendario de partidos' });
  }
}

/**
 * Get Top 5 scorers and Top 5 assisters
 */
function getTopStats(req, res) {
  try {
    const scorersQuery = `
      SELECT 
        j.id,
        j.nombre,
        j.apellidos,
        j.dorsal,
        j.foto,
        COUNT(e.id) AS goles
      FROM jugadores j
      JOIN eventos_partido e ON e.jugador_id = j.id
      WHERE e.tipo = 'gol' AND e.es_electricos = 1
      GROUP BY j.id
      ORDER BY goles DESC, j.nombre ASC
      LIMIT 5
    `;

    const assistersQuery = `
      SELECT 
        j.id,
        j.nombre,
        j.apellidos,
        j.dorsal,
        j.foto,
        COUNT(e.id) AS asistencias
      FROM jugadores j
      JOIN eventos_partido e ON e.asistente_id = j.id
      WHERE e.tipo = 'gol' AND e.es_electricos = 1
      GROUP BY j.id
      ORDER BY asistencias DESC, j.nombre ASC
      LIMIT 5
    `;

    const goleadores = db.prepare(scorersQuery).all();
    const asistentes = db.prepare(assistersQuery).all();

    res.json({ goleadores, asistentes });
  } catch (err) {
    console.error('Error fetching top stats:', err);
    res.status(500).json({ error: 'Error al calcular estadísticas principales' });
  }
}

/**
 * Get single match details by ID
 */
function getMatchById(req, res) {
  try {
    const id = req.params.id;
    const match = db.prepare('SELECT * FROM partidos WHERE id = ?').get(id);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    match.fecha_formateada = formatFechaEspandol(match.fecha_hora);
    match.url = getMatchUrl(match);
    match.url_live = getMatchLiveUrl(match);

    // Fetch squad call-up (convocatoria)
    const squadQuery = `
      SELECT j.* FROM jugadores j
      JOIN convocatorias c ON c.jugador_id = j.id
      WHERE c.partido_id = ?
      ORDER BY j.dorsal ASC
    `;
    match.convocatoria = db.prepare(squadQuery).all(id);

    // Fetch field lineup (alineación)
    const lineupQuery = `
      SELECT a.posicion_campo, j.* FROM alineaciones a
      JOIN jugadores j ON j.id = a.jugador_id
      WHERE a.partido_id = ?
    `;
    match.alineacion = db.prepare(lineupQuery).all(id);

    // Fetch timeline events (cronología)
    const eventsQuery = `
      SELECT 
        e.*,
        j.nombre AS jugador_nombre, j.apellidos AS jugador_apellidos, j.dorsal AS jugador_dorsal,
        a.nombre AS asistente_nombre, a.apellidos AS asistente_apellidos,
        js.nombre AS sale_nombre, js.apellidos AS sale_apellidos
      FROM eventos_partido e
      LEFT JOIN jugadores j ON j.id = e.jugador_id
      LEFT JOIN jugadores a ON a.id = e.asistente_id
      LEFT JOIN jugadores js ON js.id = e.jugador_sale_id
      WHERE e.partido_id = ?
      ORDER BY e.id ASC
    `;
    match.eventos = db.prepare(eventsQuery).all(id);

    res.json(match);
  } catch (err) {
    console.error('Error fetching match:', err);
    res.status(500).json({ error: 'Error al consultar partido' });
  }
}

/**
 * Create new match
 */
function createMatch(req, res) {
  try {
    const {
      competicion,
      jornada,
      equipo_local_nombre,
      equipo_local_foto,
      equipo_local_es_electricos,
      equipo_visitante_nombre,
      equipo_visitante_foto,
      equipo_visitante_es_electricos,
      fecha_hora,
      lugar
    } = req.body;

    if (!competicion || !jornada || !equipo_local_nombre || !equipo_visitante_nombre || !fecha_hora || !lugar) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben completarse' });
    }

    const localIsElectric = equipo_local_es_electricos ? 1 : 0;
    const awayIsElectric = equipo_visitante_es_electricos ? 1 : 0;

    const localFoto = localIsElectric ? '/images/electricos.png' : (equipo_local_foto || '/images/electricos.png');
    const awayFoto = awayIsElectric ? '/images/electricos.png' : (equipo_visitante_foto || '/images/electricos.png');
    const localNombre = localIsElectric ? 'Eléctricos FC' : equipo_local_nombre;
    const awayNombre = awayIsElectric ? 'Eléctricos FC' : equipo_visitante_nombre;

    const stmt = db.prepare(`
      INSERT INTO partidos (
        competicion, jornada,
        equipo_local_nombre, equipo_local_foto, equipo_local_es_electricos,
        equipo_visitante_nombre, equipo_visitante_foto, equipo_visitante_es_electricos,
        fecha_hora, lugar, formacion, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '3-3', 'programado')
    `);

    const result = stmt.run(
      competicion,
      parseInt(jornada, 10),
      localNombre,
      localFoto,
      localIsElectric,
      awayNombre,
      awayFoto,
      awayIsElectric,
      fecha_hora,
      lugar
    );

    const newMatch = db.prepare('SELECT * FROM partidos WHERE id = ?').get(result.lastInsertRowid);
    newMatch.url = getMatchUrl(newMatch);

    res.status(201).json({ success: true, match: newMatch });
  } catch (err) {
    console.error('Error creating match:', err);
    res.status(500).json({ error: 'Error al crear partido: ' + err.message });
  }
}

/**
 * Update match info
 */
function updateMatch(req, res) {
  try {
    const id = req.params.id;
    const match = db.prepare('SELECT * FROM partidos WHERE id = ?').get(id);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const {
      competicion,
      jornada,
      equipo_local_nombre,
      equipo_local_foto,
      equipo_local_es_electricos,
      equipo_visitante_nombre,
      equipo_visitante_foto,
      equipo_visitante_es_electricos,
      fecha_hora,
      lugar,
      formacion,
      estado
    } = req.body;

    const localIsElectric = equipo_local_es_electricos !== undefined ? (equipo_local_es_electricos ? 1 : 0) : match.equipo_local_es_electricos;
    const awayIsElectric = equipo_visitante_es_electricos !== undefined ? (equipo_visitante_es_electricos ? 1 : 0) : match.equipo_visitante_es_electricos;

    const stmt = db.prepare(`
      UPDATE partidos SET
        competicion = ?,
        jornada = ?,
        equipo_local_nombre = ?,
        equipo_local_foto = ?,
        equipo_local_es_electricos = ?,
        equipo_visitante_nombre = ?,
        equipo_visitante_foto = ?,
        equipo_visitante_es_electricos = ?,
        fecha_hora = ?,
        lugar = ?,
        formacion = ?,
        estado = ?
      WHERE id = ?
    `);

    stmt.run(
      competicion || match.competicion,
      jornada ? parseInt(jornada, 10) : match.jornada,
      localIsElectric ? 'Eléctricos FC' : (equipo_local_nombre || match.equipo_local_nombre),
      localIsElectric ? '/images/electricos.png' : (equipo_local_foto || match.equipo_local_foto),
      localIsElectric,
      awayIsElectric ? 'Eléctricos FC' : (equipo_visitante_nombre || match.equipo_visitante_nombre),
      awayIsElectric ? '/images/electricos.png' : (equipo_visitante_foto || match.equipo_visitante_foto),
      awayIsElectric,
      fecha_hora || match.fecha_hora,
      lugar || match.lugar,
      formacion || match.formacion,
      estado || match.estado,
      id
    );

    const updated = db.prepare('SELECT * FROM partidos WHERE id = ?').get(id);
    updated.url = getMatchUrl(updated);

    res.json({ success: true, match: updated });
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).json({ error: 'Error al actualizar partido' });
  }
}

/**
 * Delete match
 */
function deleteMatch(req, res) {
  try {
    const id = req.params.id;
    db.prepare('DELETE FROM partidos WHERE id = ?').run(id);
    res.json({ success: true, message: 'Partido eliminado' });
  } catch (err) {
    console.error('Error deleting match:', err);
    res.status(500).json({ error: 'Error al eliminar partido' });
  }
}

module.exports = {
  getAllMatches,
  getTopStats,
  getMatchById,
  createMatch,
  updateMatch,
  deleteMatch
};
