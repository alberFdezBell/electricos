// Landing Page View Module
let landingState = {
  matches: [],
  filter: { jugados: true, noJugados: true }, // checkboxes: 'jugados' y 'noJugados'
  topStats: { goleadores: [], asistentes: [] }
};

async function loadLandingView() {
  const container = document.getElementById('app-view');
  container.innerHTML = `
    <!-- Clasificación Oficial IMD Sevilla -->
    <div class="card clasificacion-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <h3 style="display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin: 0;">
          <span>Clasificación</span>
          <span id="clasificacionJornadaBadge" class="pill pill-liga" style="font-size: 0.75rem;">Cargando...</span>
        </h3>
      </div>
      <div id="clasificacionContainer" style="overflow-x: auto;">
        <div class="loading-spinner">Cargando clasificación en directo...</div>
      </div>
    </div>

    <!-- Top 5 Section -->
    <div class="top-stats-grid">
      <div class="card stat-card">
        <h3>Top 5 Goleadores</h3>
        <div id="topGoleadoresList" class="top-list">
          <div class="loading-spinner">Cargando datos...</div>
        </div>
      </div>

      <div class="card stat-card">
        <h3>Top 5 Asistentes</h3>
        <div id="topAsistentesList" class="top-list">
          <div class="loading-spinner">Cargando datos...</div>
        </div>
      </div>
    </div>

    <!-- Matches Slider Section -->
    <div class="matches-section">
      <div class="section-header">
        <h3>Partidos del Equipo</h3>
        <div class="filter-dropdown">
          <button id="filterToggleBtn" class="btn btn-outline btn-sm" onclick="toggleFilterMenu(event)">
            <i class="fa-solid fa-filter"></i> Filtros
          </button>
          <div id="filterMenu" class="filter-menu hidden">
            <div class="filter-menu-title">Mostrar partidos:</div>
            <label class="filter-checkbox">
              <input type="checkbox" id="filterJugados" checked onchange="onMatchFilterChange()">
              <span>Jugados</span>
            </label>
            <label class="filter-checkbox">
              <input type="checkbox" id="filterNoJugados" checked onchange="onMatchFilterChange()">
              <span>No jugados</span>
            </label>
          </div>
        </div>
      </div>

      <div id="matchesSlider" class="matches-slider">
        <div class="loading-spinner">Cargando partidos...</div>
      </div>
    </div>
  `;

  await Promise.all([fetchLandingMatches(), fetchLandingTopStats(), fetchLandingClasificacion()]);
}

async function fetchLandingClasificacion() {
  const container = document.getElementById('clasificacionContainer');
  const badge = document.getElementById('clasificacionJornadaBadge');
  if (!container) return;

  try {
    const res = await fetch('/api/partidos/clasificacion');
    if (!res.ok) throw new Error('No se pudo cargar la clasificación');
    const data = await res.json();

    if (badge) badge.textContent = data.titulo || 'Clasificación';

    if (!data.equipos || data.equipos.length === 0) {
      container.innerHTML = '<p class="empty-text">No hay datos de clasificación disponibles.</p>';
      return;
    }

    container.innerHTML = `
      <table class="clasificacion-table">
        <thead>
          <tr>
            <th class="th-pos"> </th>
            <th class="th-team">Equipo</th>
            <th>PJ</th>
            <th>PG</th>
            <th>PE</th>
            <th>PP</th>
            <th>PNP</th>
            <th>TF</th>
            <th>TC</th>
            <th>DIF</th>
            <th class="th-pts">PTS</th>
          </tr>
        </thead>
        <tbody>
          ${data.equipos.map(eq => {
            const dif = eq.tf - eq.tc;
            const difFormatted = dif > 0 ? `+${dif}` : `${dif}`;
            const rowClass = eq.isElectricos ? 'row-electricos' : '';
            return `
              <tr class="${rowClass}">
                <td class="td-pos">${eq.isElectricos ? ' ' : ''}${eq.posicion}</td>
                <td class="td-team">${eq.equipo}</td>
                <td>${eq.pj}</td>
                <td>${eq.pg}</td>
                <td>${eq.pe}</td>
                <td>${eq.pp}</td>
                <td>${eq.pnp}</td>
                <td>${eq.tf}</td>
                <td>${eq.tc}</td>
                <td class="td-dif">${difFormatted}</td>
                <td class="td-pts"><strong>${eq.puntos}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    if (container) container.innerHTML = `<div class="alert alert-error" style="font-size: 0.85rem;">${err.message}</div>`;
  }
}

async function fetchLandingMatches() {
  try {
    const f = landingState.filter;

    // Ningún filtro seleccionado → vacío
    if (!f.jugados && !f.noJugados) {
      landingState.matches = [];
      renderMatchesSlider();
      return;
    }

    // Ambos → todos los partidos; uno solo → API con filtro
    let url = '/api/partidos';
    if (f.jugados && !f.noJugados) {
      url = '/api/partidos?filter=finalizado';
    } else if (!f.jugados && f.noJugados) {
      url = '/api/partidos?filter=programado';
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al cargar partidos');
    landingState.matches = await res.json();
    renderMatchesSlider();
  } catch (err) {
    document.getElementById('matchesSlider').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

/* ── Menú de filtros (checkbox: Jugados / No jugados) ───────── */
let filterOutsideHandlerRegistered = false;

function toggleFilterMenu(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('filterMenu');
  if (!menu) return;
  const opening = menu.classList.contains('hidden');
  menu.classList.toggle('hidden');
  if (opening) registerFilterOutsideClose();
}

function registerFilterOutsideClose() {
  if (filterOutsideHandlerRegistered) return;
  filterOutsideHandlerRegistered = true;
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('filterMenu');
    if (!menu || menu.classList.contains('hidden')) return;
    if (!e.target.closest('.filter-dropdown')) menu.classList.add('hidden');
  });
}

async function onMatchFilterChange() {
  landingState.filter.jugados = document.getElementById('filterJugados').checked;
  landingState.filter.noJugados = document.getElementById('filterNoJugados').checked;
  await fetchLandingMatches();
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
        <img src="${j.foto || '/images/default-icon.webp'}" class="top-avatar" onerror="this.src='/images/default-icon.webp'">
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
        <img src="${j.foto || '/images/default-icon.webp'}" class="top-avatar" onerror="this.src='/images/default-icon.webp'">
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
            <img src="${m.equipo_local_foto || '/images/default-team.webp'}" alt="${m.equipo_local_nombre}" onerror="this.src='/images/default-team.webp'">
            <span class="team-name">${m.equipo_local_nombre}</span>
          </div>
          <div class="score-vs">
            ${m.estado === 'finalizado' 
              ? `<span class="score">${m.goles_local} - ${m.goles_visitante}</span>`
              : '<span class="vs">VS</span>'}
          </div>
          <div class="team-box">
            <img src="${m.equipo_visitante_foto || '/images/default-team.webp'}" alt="${m.equipo_visitante_nombre}" onerror="this.src='/images/default-team.webp'">
            <span class="team-name">${m.equipo_visitante_nombre}</span>
          </div>
        </div>

        <div class="match-card-bottom">
          <div class="match-date">${m.fecha_formateada}</div>
          <div class="match-footer-row">
            <span class="pill pill-${compSlug}">${m.competicion} (J${m.jornada})</span>
            <span class="match-field"><i class="fa-solid fa-location-dot fi"></i> ${m.lugar}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
