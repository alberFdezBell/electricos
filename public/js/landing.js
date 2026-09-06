// Landing Page View Module
let landingState = {
  matches: [],
  filter: 'all', // 'all' or 'finalizado'
  topStats: { goleadores: [], asistentes: [] }
};

async function loadLandingView() {
  const container = document.getElementById('app-view');
  container.innerHTML = `
    <div class="landing-hero card">
      <div class="hero-brand">
        <img src="/images/electricos.png" alt="Eléctricos FC Logo">
        <div>
          <h2>Eléctricos FC — Panel de Control</h2>
          <p class="subtitle">Temporada 2026 / Fútbol 7</p>
        </div>
      </div>
      <div class="hero-actions">
        <a href="/calendario" data-link class="btn btn-primary">📅 Ver Calendario</a>
        <a href="/plantilla" data-link class="btn btn-dark">👥 Ver Plantilla</a>
      </div>
    </div>

    <!-- Top 5 Section -->
    <div class="top-stats-grid">
      <div class="card stat-card">
        <h3>⚽ Top 5 Goleadores</h3>
        <div id="topGoleadoresList" class="top-list">
          <div class="loading-spinner">Cargando datos...</div>
        </div>
      </div>

      <div class="card stat-card">
        <h3>👟 Top 5 Asistentes</h3>
        <div id="topAsistentesList" class="top-list">
          <div class="loading-spinner">Cargando datos...</div>
        </div>
      </div>
    </div>

    <!-- Matches Slider Section -->
    <div class="matches-section">
      <div class="section-header">
        <h3>Partidos del Equipo</h3>
        <button id="filterPlayedBtn" class="btn btn-outline btn-sm" onclick="toggleMatchFilter()">
          Ver solo jugados
        </button>
      </div>

      <div id="matchesSlider" class="matches-slider">
        <div class="loading-spinner">Cargando partidos...</div>
      </div>
    </div>
  `;

  await Promise.all([fetchLandingMatches(), fetchLandingTopStats()]);
}

async function fetchLandingMatches() {
  try {
    const url = landingState.filter === 'finalizado' ? '/api/partidos?filter=finalizado' : '/api/partidos';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar partidos');
    landingState.matches = await res.json();
    renderMatchesSlider();
  } catch (err) {
    document.getElementById('matchesSlider').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function fetchLandingTopStats() {
  try {
    const res = await fetch('/api/partidos/top-stats');
    if (!res.ok) throw new Error('Error al cargar tops');
    landingState.topStats = await res.json();
    renderTopStats();
  } catch (err) {
    console.error(err);
  }
}

function renderTopStats() {
  const gList = document.getElementById('topGoleadoresList');
  const aList = document.getElementById('topAsistentesList');

  if (!landingState.topStats.goleadores || landingState.topStats.goleadores.length === 0) {
    gList.innerHTML = '<p class="empty-text">Sin datos de goles todavía.</p>';
  } else {
    gList.innerHTML = landingState.topStats.goleadores.map((j, i) => `
      <div class="top-item">
        <span class="top-rank">#${i + 1}</span>
        <img src="${j.foto || '/images/electricos.png'}" class="top-avatar" onerror="this.src='/images/electricos.png'">
        <div class="top-name">${j.nombre} ${j.apellidos} <span class="dorsal-tag">#${j.dorsal}</span></div>
        <span class="top-badge">${j.goles} goles</span>
      </div>
    `).join('');
  }

  if (!landingState.topStats.asistentes || landingState.topStats.asistentes.length === 0) {
    aList.innerHTML = '<p class="empty-text">Sin datos de asistencias todavía.</p>';
  } else {
    aList.innerHTML = landingState.topStats.asistentes.map((j, i) => `
      <div class="top-item">
        <span class="top-rank">#${i + 1}</span>
        <img src="${j.foto || '/images/electricos.png'}" class="top-avatar" onerror="this.src='/images/electricos.png'">
        <div class="top-name">${j.nombre} ${j.apellidos} <span class="dorsal-tag">#${j.dorsal}</span></div>
        <span class="top-badge">${j.asistencias} asist.</span>
      </div>
    `).join('');
  }
}

function renderMatchesSlider() {
  const slider = document.getElementById('matchesSlider');
  if (!landingState.matches || landingState.matches.length === 0) {
    slider.innerHTML = '<div class="empty-state">No se han encontrado partidos programados o jugados.</div>';
    return;
  }

  slider.innerHTML = landingState.matches.map(m => {
    const compSlug = m.competicion.toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="match-card" onclick="navigateTo('${m.url}')">
        <div class="match-card-top">
          <div class="team-box">
            <img src="${m.equipo_local_foto}" alt="${m.equipo_local_nombre}" onerror="this.src='/images/electricos.png'">
            <span class="team-name">${m.equipo_local_nombre}</span>
          </div>
          <div class="score-vs">
            ${m.estado === 'finalizado' 
              ? `<span class="score">${m.goles_local} - ${m.goles_visitante}</span>`
              : '<span class="vs">VS</span>'}
          </div>
          <div class="team-box">
            <img src="${m.equipo_visitante_foto}" alt="${m.equipo_visitante_nombre}" onerror="this.src='/images/electricos.png'">
            <span class="team-name">${m.equipo_visitante_nombre}</span>
          </div>
        </div>

        <div class="match-card-bottom">
          <div class="match-date">${m.fecha_formateada}</div>
          <div class="match-footer-row">
            <span class="pill pill-${compSlug}">${m.competicion} (J${m.jornada})</span>
            <span class="match-field">📍 ${m.lugar}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleMatchFilter() {
  landingState.filter = landingState.filter === 'all' ? 'finalizado' : 'all';
  const btn = document.getElementById('filterPlayedBtn');
  btn.textContent = landingState.filter === 'finalizado' ? 'Ver todos los partidos' : 'Ver solo jugados';
  await fetchLandingMatches();
}
