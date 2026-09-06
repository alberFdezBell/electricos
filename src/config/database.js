const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/electricos.db');

// Ensure directory exists
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(path.resolve(dbPath));

// Enable WAL mode and foreign keys
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (err) {
  console.warn('Pragma setup warning:', err.message);
}

// Initialize database schema
function initDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS jugadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      dorsal INTEGER UNIQUE NOT NULL,
      posicion TEXT NOT NULL CHECK(posicion IN ('Portero', 'Defensa', 'Lateral', 'Medio', 'Extremo', 'Delantero')),
      foto TEXT DEFAULT '/images/default-player.png',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS partidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competicion TEXT NOT NULL CHECK(competicion IN ('Liga', 'Copa Primavera', 'Copa Sevilla', 'Amistoso')),
      jornada INTEGER NOT NULL,
      equipo_local_nombre TEXT NOT NULL,
      equipo_local_foto TEXT NOT NULL,
      equipo_local_es_electricos INTEGER NOT NULL DEFAULT 0,
      equipo_visitante_nombre TEXT NOT NULL,
      equipo_visitante_foto TEXT NOT NULL,
      equipo_visitante_es_electricos INTEGER NOT NULL DEFAULT 0,
      fecha_hora DATETIME NOT NULL,
      lugar TEXT NOT NULL,
      formacion TEXT DEFAULT '3-3' CHECK(formacion IN ('3-3', '2-3-1', '3-2-1', '2-2-2', '3-1-2')),
      estado TEXT DEFAULT 'programado' CHECK(estado IN ('programado', '1a_parte', 'descanso', '2a_parte', 'finalizado')),
      goles_local INTEGER DEFAULT 0,
      goles_visitante INTEGER DEFAULT 0,
      segundos_transcurridos INTEGER DEFAULT 0,
      tiempo_inicio_parte DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS convocatorias (
      partido_id INTEGER NOT NULL,
      jugador_id INTEGER NOT NULL,
      PRIMARY KEY (partido_id, jugador_id),
      FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
      FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alineaciones (
      partido_id INTEGER NOT NULL,
      posicion_campo TEXT NOT NULL,
      jugador_id INTEGER NOT NULL,
      PRIMARY KEY (partido_id, posicion_campo),
      FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
      FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS eventos_partido (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      partido_id INTEGER NOT NULL,
      minuto INTEGER NOT NULL,
      segundo INTEGER DEFAULT 0,
      periodo TEXT CHECK(periodo IN ('1a_parte', 'descanso', '2a_parte')),
      es_electricos INTEGER NOT NULL DEFAULT 1,
      tipo TEXT NOT NULL CHECK(tipo IN ('gol', 'tarjeta_amarilla', 'tarjeta_roja', 'cambio')),
      jugador_id INTEGER,
      asistente_id INTEGER,
      jugador_sale_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
      FOREIGN KEY (jugador_id) REFERENCES jugadores(id) ON DELETE SET NULL,
      FOREIGN KEY (asistente_id) REFERENCES jugadores(id) ON DELETE SET NULL,
      FOREIGN KEY (jugador_sale_id) REFERENCES jugadores(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS plantillas_cartel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      estilo_json TEXT NOT NULL,
      es_predeterminada INTEGER DEFAULT 0
    );
  `;

  db.exec(schema);

  // Seed default poster design templates if empty
  const countRow = db.prepare('SELECT COUNT(*) AS total FROM plantillas_cartel').get();
  if (!countRow || countRow.total === 0) {
    const insertTemplate = db.prepare('INSERT INTO plantillas_cartel (nombre, estilo_json, es_predeterminada) VALUES (?, ?, ?)');
    insertTemplate.run(
      'Amarillo Clásico',
      JSON.stringify({
        primaryColor: '#FEF08A',
        secondaryColor: '#1E293B',
        accentColor: '#EAB308',
        textColor: '#0F172A',
        cardBg: '#FFFFFF',
        fontFamily: 'Montserrat, sans-serif'
      }),
      1
    );
    insertTemplate.run(
      'Noche Eléctrica',
      JSON.stringify({
        primaryColor: '#0F172A',
        secondaryColor: '#FEF08A',
        accentColor: '#FACC15',
        textColor: '#FFFFFF',
        cardBg: '#1E293B',
        fontFamily: 'Montserrat, sans-serif'
      }),
      0
    );
    insertTemplate.run(
      'Minimal Blanco',
      JSON.stringify({
        primaryColor: '#FFFFFF',
        secondaryColor: '#000000',
        accentColor: '#FDE047',
        textColor: '#18181B',
        cardBg: '#F4F4F5',
        fontFamily: 'Montserrat, sans-serif'
      }),
      0
    );
  }
}

initDatabase();

module.exports = db;
