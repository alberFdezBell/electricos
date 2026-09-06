// Match Detail & Tactical Pitch Lineup Module

let matchDetailState = {
  match: null,
  allPlayers: [],
  selectedFormation: '3-3',
  convocatoriaIds: [],
  pitchAssignments: {}, // { POR: 1, DEF_IZQ: 3, ... }
  activeSlotToAssign: null
};

const FORMACIONES_CONFIG = {
  '3-3': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], top: '82%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Lat. Izquierdo', roles: ['Defensa', 'Lateral'], top: '65%', left: '20%' },
    { id: 'DEF_CEN', label: 'Central', roles: ['Defensa'], top: '68%', left: '50%' },
    { id: 'DEF_DER', label: 'Lat. Derecho', roles: ['Defensa', 'Lateral'], top: '65%', left: '80%' },
    { id: 'EXT_IZQ', label: 'Extremo Izq.', roles: ['Extremo', 'Medio'], top: '32%', left: '22%' },
    { id: 'DEL_CEN', label: 'Delantero', roles: ['Delantero'], top: '22%', left: '50%' },
    { id: 'EXT_DER', label: 'Extremo Der.', roles: ['Extremo', 'Medio'], top: '32%', left: '78%' }
  ],
  '2-3-1': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], top: '82%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Defensa Izq.', roles: ['Defensa', 'Lateral'], top: '68%', left: '30%' },
    { id: 'DEF_DER', label: 'Defensa Der.', roles: ['Defensa', 'Lateral'], top: '68%', left: '70%' },
    { id: 'MED_IZQ', label: 'Interior Izq.', roles: ['Medio', 'Extremo'], top: '45%', left: '20%' },
    { id: 'MED_CEN', label: 'Medio Centro', roles: ['Medio'], top: '48%', left: '50%' },
    { id: 'MED_DER', label: 'Interior Der.', roles: ['Medio', 'Extremo'], top: '45%', left: '80%' },
    { id: 'DEL_CEN', label: 'Delantero', roles: ['Delantero'], top: '22%', left: '50%' }
  ],
  '3-2-1': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], top: '82%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Lat. Izquierdo', roles: ['Defensa', 'Lateral'], top: '68%', left: '20%' },
    { id: 'DEF_CEN', label: 'Central', roles: ['Defensa'], top: '70%', left: '50%' },
    { id: 'DEF_DER', label: 'Lat. Derecho', roles: ['Defensa', 'Lateral'], top: '68%', left: '80%' },
    { id: 'MED_IZQ', label: 'Medio Izq.', roles: ['Medio'], top: '44%', left: '35%' },
    { id: 'MED_DER', label: 'Medio Der.', roles: ['Medio'], top: '44%', left: '65%' },
    { id: 'DEL_CEN', label: 'Delantero', roles: ['Delantero'], top: '22%', left: '50%' }
  ],
  '2-2-2': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], top: '82%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Defensa Izq.', roles: ['Defensa', 'Lateral'], top: '68%', left: '30%' },
    { id: 'DEF_DER', label: 'Defensa Der.', roles: ['Defensa', 'Lateral'], top: '68%', left: '70%' },
    { id: 'MED_IZQ', label: 'Medio Izq.', roles: ['Medio'], top: '45%', left: '32%' },
    { id: 'MED_DER', label: 'Medio Der.', roles: ['Medio'], top: '45%', left: '68%' },
    { id: 'DEL_IZQ', label: 'Delantero Izq.', roles: ['Delantero', 'Extremo'], top: '22%', left: '32%' },
    { id: 'DEL_DER', label: 'Delantero Der.', roles: ['Delantero', 'Extremo'], top: '22%', left: '68%' }
  ],
  '3-1-2': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], top: '82%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Lat. Izquierdo', roles: ['Defensa', 'Lateral'], top: '68%', left: '20%' },
    { id: 'DEF_CEN', label: 'Central', roles: ['Defensa'], top: '70%', left: '50%' },
    { id: 'DEF_DER', label: 'Lat. Derecho', roles: ['Defensa', 'Lateral'], top: '68%', left: '80%' },
    { id: 'MED_CEN', label: 'Pivote', roles: ['Medio'], top: '46%', left: '50%' },
    { id: 'DEL_IZQ', label: 'Delantero Izq.', roles: ['Delantero', 'Extremo'], top: '22%', left: '32%' },
    { id: 'DEL_DER', label: 'Delantero Der.', roles: ['Delantero', 'Extremo'], top: '22%', left: '68%' }
  ]
};

async function loadPartidoDetalleView() {
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('id');

  if (!matchId) {
    document.getElementById('app-view').innerHTML = '<div class="alert alert-error">ID de partido no especificado.</div>';
    return;
  }

  const container = document.getElementById('app-view');
  container.innerHTML = '<div class="loading-spinner">Cargando datos del partido...</div>';

  try {
    const [matchRes, playersRes] = await Promise.all([
      fetch(`/api/partidos/${matchId}`),
      fetch('/api/jugadores')
    ]);

    if (!matchRes.ok) throw new Error('No se pudo encontrar el partido');
    matchDetailState.match = await matchRes.json();
    matchDetailState.allPlayers = await playersRes.json();

    // Initialize state
    matchDetailState.selectedFormation = matchDetailState.match.formacion || '3-3';
    matchDetailState.convocatoriaIds = (matchDetailState.match.convocatoria || []).map(p => p.id);
    
    matchDetailState.pitchAssignments = {};
    if (matchDetailState.match.alineacion) {
      matchDetailState.match.alineacion.forEach(item => {
        matchDetailState.pitchAssignments[item.posicion_campo] = item.id;
      });
    }

    renderMatchDetailPage();
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderMatchDetailPage() {
  const m = matchDetailState.match;
  const compSlug = m.competicion.toLowerCase().replace(/\s+/g, '-');
  const container = document.getElementById('app-view');

  const isFinished = m.estado === 'finalizado';
  const liveUrl = `${m.url}/partido-en-directo`;

  container.innerHTML = `
    <!-- Header Banner -->
    <div class="card match-detail-header">
      <div class="match-detail-top">
        <div class="team-hero">
          <img src="${m.equipo_local_foto}" alt="${m.equipo_local_nombre}" onerror="this.src='/images/electricos.png'">
          <h2>${m.equipo_local_nombre}</h2>
        </div>

        <div class="match-center-score">
          ${isFinished 
            ? `<div class="final-score-badge">${m.goles_local} - ${m.goles_visitante}</div><span class="status-tag">FINALIZADO</span>`
            : `<div class="vs-badge">VS</div><span class="status-tag">${m.estado === 'programado' ? 'PROGRAMADO' : 'EN CURSO'}</span>`}
        </div>

        <div class="team-hero">
          <img src="${m.equipo_visitante_foto}" alt="${m.equipo_visitante_nombre}" onerror="this.src='/images/electricos.png'">
          <h2>${m.equipo_visitante_nombre}</h2>
        </div>
      </div>

      <div class="match-detail-info">
        <div class="info-row">
          <span class="pill pill-${compSlug}">${m.competicion} (Jornada ${m.jornada})</span>
          <span class="match-date-str">📅 ${m.fecha_formateada}</span>
          <span class="match-field-str">📍 ${m.lugar}</span>
        </div>

        <div class="header-action-buttons">
          <button class="btn btn-outline btn-sm" onclick="openEditMatchModal()">✏️ Editar Partido</button>
          <a href="${liveUrl}" data-link class="btn btn-primary btn-sm">⚡ ${isFinished ? 'Ver Marcador en Directo' : 'Empezar Partido'}</a>
        </div>
      </div>
    </div>

    <!-- Lineup & Pitch Section -->
    <div class="card lineup-section">
      <div class="lineup-toolbar">
        <div>
          <h3>Mapa de Alineación & Convocatoria</h3>
          <p class="subtitle">Selecciona la formación y asigna los titulares para el partido</p>
        </div>

        <div class="toolbar-actions">
          <div class="form-group-inline">
            <label for="formationSelect">Formación F7:</label>
            <select id="formationSelect" onchange="onFormationChange(this.value)">
              <option value="3-3" ${matchDetailState.selectedFormation === '3-3' ? 'selected' : ''}>3-3</option>
              <option value="2-3-1" ${matchDetailState.selectedFormation === '2-3-1' ? 'selected' : ''}>2-3-1</option>
              <option value="3-2-1" ${matchDetailState.selectedFormation === '3-2-1' ? 'selected' : ''}>3-2-1</option>
              <option value="2-2-2" ${matchDetailState.selectedFormation === '2-2-2' ? 'selected' : ''}>2-2-2</option>
              <option value="3-1-2" ${matchDetailState.selectedFormation === '3-1-2' ? 'selected' : ''}>3-1-2</option>
            </select>
          </div>

          <button class="btn btn-dark btn-sm" onclick="openConvocatoriaModal()">👥 Convocatoria (${matchDetailState.convocatoriaIds.length})</button>
          <button class="btn btn-primary btn-sm" onclick="saveLineupToServer()">💾 Guardar Alineación</button>
        </div>
      </div>

      <!-- Tactical Pitch Container -->
      <div class="pitch-container">
        <div class="pitch-bg">
          <div class="pitch-lines">
            <div class="pitch-center-circle"></div>
            <div class="pitch-center-line"></div>
            <div class="pitch-penalty-area-top"></div>
            <div class="pitch-penalty-area-bottom"></div>
          </div>

          <!-- Electricos Corner Logos -->
          <img src="/images/electricos.png" class="pitch-logo-corner corner-bl" alt="Logo">
          <img src="/images/electricos.png" class="pitch-logo-corner corner-tr" alt="Logo">

          <!-- Pitch Slots -->
          <div id="pitchSlotsContainer"></div>
        </div>
      </div>
    </div>

    <!-- Timeline & Events Summary (if finished or events exist) -->
    ${(m.eventos && m.eventos.length > 0) || isFinished ? `
      <div class="card timeline-summary-card">
        <h3>Cronología Final del Partido</h3>
        <div class="timeline-list">
          ${m.eventos && m.eventos.length > 0 ? m.eventos.map(e => renderEventRowHTML(e)).join('') : '<p class="empty-text">No se registraron eventos durante el encuentro.</p>'}
        </div>
      </div>
    ` : ''}

    <!-- Modal Convocatoria -->
    <div id="convocatoriaModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Convocatoria del Partido</h3>
          <button class="modal-close" onclick="closeConvocatoriaModal()">&times;</button>
        </div>
        <p class="subtitle">Marca los jugadores convocados para este partido:</p>
        <div id="convocatoriaList" class="convocatoria-checkbox-grid"></div>
        <div class="modal-actions">
          <button class="btn btn-outline" onclick="closeConvocatoriaModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="confirmConvocatoria()">Guardar Convocatoria</button>
        </div>
      </div>
    </div>

    <!-- FIFA Player Selector Modal -->
    <div id="fifaModal" class="modal-backdrop hidden">
      <div class="modal-card fifa-modal-card">
        <div class="modal-header">
          <h3 id="fifaModalTitle">Elegir Jugador</h3>
          <button class="modal-close" onclick="closeFifaModal()">&times;</button>
        </div>
        <div id="fifaCardsSlider" class="fifa-cards-grid"></div>
      </div>
    </div>
  `;

  renderPitchSlots();
}

function renderPitchSlots() {
  const container = document.getElementById('pitchSlotsContainer');
  const slotsConfig = FORMACIONES_CONFIG[matchDetailState.selectedFormation] || FORMACIONES_CONFIG['3-3'];

  container.innerHTML = slotsConfig.map(slot => {
    const assignedPlayerId = matchDetailState.pitchAssignments[slot.id];
    const player = matchDetailState.allPlayers.find(p => p.id === assignedPlayerId);

    return `
      <div class="pitch-slot" style="top: ${slot.top}; left: ${slot.left};" onclick="openFifaSelectorModal('${slot.id}')">
        ${player ? `
          <div class="slot-player-card">
            <img src="${player.foto || '/images/electricos.png'}" class="slot-avatar" onerror="this.src='/images/electricos.png'">
            <span class="slot-dorsal">#${player.dorsal}</span>
            <span class="slot-name">${player.nombre}</span>
          </div>
        ` : `
          <div class="slot-empty">
            <span class="slot-plus">+</span>
            <span class="slot-label">${slot.label}</span>
          </div>
        `}
      </div>
    `;
  }).join('');
}

function onFormationChange(newFormation) {
  matchDetailState.selectedFormation = newFormation;
  renderPitchSlots();
}

function openConvocatoriaModal() {
  const modal = document.getElementById('convocatoriaModal');
  const container = document.getElementById('convocatoriaList');

  container.innerHTML = matchDetailState.allPlayers.map(p => {
    const isChecked = matchDetailState.convocatoriaIds.includes(p.id);
    return `
      <label class="convocatoria-item">
        <input type="checkbox" value="${p.id}" ${isChecked ? 'checked' : ''}>
        <img src="${p.foto || '/images/electricos.png'}" class="conv-avatar" onerror="this.src='/images/electricos.png'">
        <div class="conv-info">
          <span class="conv-name">#${p.dorsal} ${p.nombre} ${p.apellidos}</span>
          <span class="conv-pos">${p.posicion}</span>
        </div>
      </label>
    `;
  }).join('');

  modal.classList.remove('hidden');
}

function closeConvocatoriaModal() {
  document.getElementById('convocatoriaModal').classList.add('hidden');
}

async function confirmConvocatoria() {
  const checkboxes = document.querySelectorAll('#convocatoriaList input[type="checkbox"]:checked');
  const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.value, 10));

  matchDetailState.convocatoriaIds = selectedIds;

  try {
    const res = await fetch(`/api/partidos/${matchDetailState.match.id}/convocatoria`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jugadorIds: selectedIds })
    });
    if (!res.ok) throw new Error('Error al guardar convocatoria');

    closeConvocatoriaModal();
    renderPitchSlots();
  } catch (err) {
    alert(err.message);
  }
}

function openFifaSelectorModal(slotId) {
  matchDetailState.activeSlotToAssign = slotId;
  const modal = document.getElementById('fifaModal');
  const title = document.getElementById('fifaModalTitle');
  const grid = document.getElementById('fifaCardsSlider');

  const slotsConfig = FORMACIONES_CONFIG[matchDetailState.selectedFormation];
  const slotInfo = slotsConfig.find(s => s.id === slotId);

  title.textContent = `Elegir ${slotInfo ? slotInfo.label : 'Jugador'}`;

  // Filter candidate players: MUST be in convocatoria
  let candidates = matchDetailState.allPlayers.filter(p => matchDetailState.convocatoriaIds.includes(p.id));

  // Filter candidates by slot roles if matching roles exist
  if (slotInfo && slotInfo.roles && slotInfo.roles.length > 0) {
    const filteredByRole = candidates.filter(p => slotInfo.roles.includes(p.posicion));
    if (filteredByRole.length > 0) {
      candidates = filteredByRole;
    }
  }

  if (candidates.length === 0) {
    grid.innerHTML = '<div class="empty-state">No hay jugadores convocados para esta posición. Revisa la convocatoria.</div>';
  } else {
    grid.innerHTML = `
      <div class="fifa-card empty-card" onclick="selectPlayerForSlot(null)">
        <div class="fifa-card-inner">
          <span class="empty-icon">🚫</span>
          <span>Vaciar Hueco</span>
        </div>
      </div>
      ${candidates.map(p => `
        <div class="fifa-card" onclick="selectPlayerForSlot(${p.id})">
          <div class="fifa-card-inner">
            <span class="fifa-rating">#${p.dorsal}</span>
            <span class="fifa-pos">${p.posicion.slice(0, 3).toUpperCase()}</span>
            <img src="${p.foto || '/images/electricos.png'}" class="fifa-photo" onerror="this.src='/images/electricos.png'">
            <div class="fifa-name">${p.nombre}</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  modal.classList.remove('hidden');
}

function closeFifaModal() {
  document.getElementById('fifaModal').classList.add('hidden');
}

function selectPlayerForSlot(playerId) {
  const slotId = matchDetailState.activeSlotToAssign;
  if (slotId) {
    if (playerId === null) {
      delete matchDetailState.pitchAssignments[slotId];
    } else {
      matchDetailState.pitchAssignments[slotId] = playerId;
    }
    renderPitchSlots();
  }
  closeFifaModal();
}

async function saveLineupToServer() {
  try {
    const res = await fetch(`/api/partidos/${matchDetailState.match.id}/alineacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formacion: matchDetailState.selectedFormation,
        alineacion: matchDetailState.pitchAssignments
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar alineación');

    alert('¡Alineación guardada con éxito!');
  } catch (err) {
    alert(err.message);
  }
}

function renderEventRowHTML(e) {
  let icon = '⚽';
  let text = '';

  if (e.tipo === 'gol') {
    icon = '⚽';
    const scorer = e.jugador_nombre ? `${e.jugador_nombre} ${e.jugador_apellidos}` : (e.es_electricos ? 'Jugador Eléctricos' : 'Rival');
    const assist = e.asistente_nombre ? ` (Asist: ${e.asistente_nombre} ${e.asistente_apellidos})` : '';
    text = `Gol de ${scorer}${assist}`;
  } else if (e.tipo === 'tarjeta_amarilla') {
    icon = '🟨';
    const player = e.jugador_nombre ? `${e.jugador_nombre} ${e.jugador_apellidos}` : 'Rival';
    text = `Tarjeta Amarilla para ${player}`;
  } else if (e.tipo === 'tarjeta_roja') {
    icon = '🟥';
    const player = e.jugador_nombre ? `${e.jugador_nombre} ${e.jugador_apellidos}` : 'Rival';
    text = `Tarjeta Roja para ${player}`;
  } else if (e.tipo === 'cambio') {
    icon = '🔄';
    if (e.es_electricos) {
      text = `Cambio: Entra ${e.jugador_nombre || ''} y sale ${e.sale_nombre || ''}`;
    } else {
      text = `Cambio en el Rival`;
    }
  }

  return `
    <div class="timeline-item">
      <span class="timeline-min">${e.minuto}'</span>
      <span class="timeline-icon">${icon}</span>
      <span class="timeline-desc">${text}</span>
    </div>
  `;
}
