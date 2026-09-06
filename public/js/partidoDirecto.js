// Live Match Tracking & Real-time Action Controller

let liveState = {
  match: null,
  timerInterval: null,
  elapsedSeconds: 0,
  isRunning: false
};

/**
 * Generic route handler for /partido-en-directo
 */
async function loadPartidoDirectoGenericoView() {
  const container = document.getElementById('app-view');
  container.innerHTML = '<div class="loading-spinner">Buscando partido en directo...</div>';

  try {
    const res = await fetch('/api/partidos/en-directo/activo');
    const data = await res.json();

    if (res.ok && data.active && data.matchId) {
      // Set query parameter in URL and load match live control
      const matchRes = await fetch(`/api/partidos/${data.matchId}`);
      const match = await matchRes.json();
      window.history.replaceState({}, '', `${match.url}/partido-en-directo`);
      await loadPartidoDirectoControlView(data.matchId);
    } else {
      container.innerHTML = `
        <div class="card empty-state">
          <h2>⏱️ No hay partido en directo</h2>
          <p>No hay ningún encuentro de Eléctricos FC en juego en este momento.</p>
          <div style="margin-top: 16px;">
            <a href="/calendario" data-link class="btn btn-primary">📅 Ir al Calendario</a>
          </div>
        </div>
      `;
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

/**
 * Specific match live control view
 */
async function loadPartidoDirectoControlView(specificMatchId = null) {
  let matchId = specificMatchId;
  if (!matchId) {
    const params = new URLSearchParams(window.location.search);
    matchId = params.get('id');
  }

  if (!matchId) {
    await loadPartidoDirectoGenericoView();
    return;
  }

  const container = document.getElementById('app-view');
  container.innerHTML = '<div class="loading-spinner">Cargando datos del directo...</div>';

  try {
    const res = await fetch(`/api/partidos/${matchId}`);
    if (!res.ok) throw new Error('Partido no encontrado');
    liveState.match = await res.json();

    liveState.elapsedSeconds = liveState.match.segundos_transcurridos || 0;
    renderLivePage();
    setupTimer();
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderLivePage() {
  const m = liveState.match;
  const container = document.getElementById('app-view');

  const onPitchPlayers = (m.alineacion || []);
  const convocatoriaPlayers = (m.convocatoria || []);
  const onPitchIds = onPitchPlayers.map(p => p.id);
  const benchPlayers = convocatoriaPlayers.filter(p => !onPitchIds.includes(p.id));

  const isProgrammed = m.estado === 'programado';
  const isParte1 = m.estado === '1a_parte';
  const isDescanso = m.estado === 'descanso';
  const isParte2 = m.estado === '2a_parte';
  const isFinished = m.estado === 'finalizado';

  container.innerHTML = `
    <!-- Sticky Live Score Header -->
    <div class="live-sticky-header card">
      <div class="live-team">
        <img src="${m.equipo_local_foto}" alt="${m.equipo_local_nombre}" onerror="this.src='/images/electricos.png'">
        <span class="live-team-name">${m.equipo_local_nombre}</span>
      </div>

      <div class="live-scoreboard">
        <div class="live-score">${m.goles_local} - ${m.goles_visitante}</div>
        <div class="live-timer-badge" id="liveTimerDisplay">${formatTime(liveState.elapsedSeconds)}</div>
        <span class="live-status-text">${getStatusLabel(m.estado)}</span>
      </div>

      <div class="live-team">
        <img src="${m.equipo_visitante_foto}" alt="${m.equipo_visitante_nombre}" onerror="this.src='/images/electricos.png'">
        <span class="live-team-name">${m.equipo_visitante_nombre}</span>
      </div>
    </div>

    <!-- Match Phase Control Buttons -->
    <div class="card phase-controls-card">
      ${isProgrammed ? `
        <button class="btn btn-primary btn-block btn-lg" onclick="startParte(1)">▶️ Empezar 1ª Parte</button>
      ` : ''}

      ${isParte1 ? `
        <button class="btn btn-dark btn-block" onclick="finishParte(1)">⏸️ Finalizar 1ª Parte (Descanso)</button>
      ` : ''}

      ${isDescanso ? `
        <button class="btn btn-primary btn-block btn-lg" onclick="startParte(2)">▶️ Empezar 2ª Parte</button>
      ` : ''}

      ${isParte2 ? `
        <button class="btn btn-danger btn-block" onclick="finishPartido()">🏁 Finalizar Partido</button>
      ` : ''}

      ${isFinished ? `
        <div class="alert alert-success text-center">El partido ha finalizado. <a href="${m.url}" data-link>Ver informe completo</a></div>
      ` : ''}

      ${!isProgrammed ? `
        <div style="margin-top: 12px; border-top: 1px solid var(--border-light); padding-top: 12px;">
          <button class="btn btn-outline-danger btn-block" onclick="resetPartidoDirecto()">🔄 Reiniciar Partido (Volver al estado inicial)</button>
        </div>
      ` : ''}
    </div>

    <!-- Action Buttons (Eléctricos vs Rival) -->
    ${!isProgrammed && !isFinished ? `
      <div class="live-action-buttons-grid">
        <button class="btn btn-primary action-btn-large" onclick="openElectricActionModal()">
          ⚡ Acciones Eléctricos
        </button>
        <button class="btn btn-dark action-btn-large" onclick="openRivalActionModal()">
          🛡️ Acciones Rival
        </button>
      </div>
    ` : ''}

    <!-- Squad Status (Pitch vs Bench) -->
    <div class="live-squad-section card">
      <h3>Plantilla en Directo</h3>
      <div class="squad-split-grid">
        <div class="squad-column">
          <h4>🟢 En Campo (${onPitchPlayers.length})</h4>
          <div class="squad-mini-list">
            ${onPitchPlayers.map(p => `
              <div class="squad-mini-item">
                <span class="mini-dorsal">#${p.dorsal}</span>
                <span class="mini-name">${p.nombre} ${p.apellidos}</span>
                <span class="mini-pos">${p.posicion_campo || p.posicion}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="squad-column">
          <h4>🪑 En Banquillo (${benchPlayers.length})</h4>
          <div class="squad-mini-list">
            ${benchPlayers.map(p => `
              <div class="squad-mini-item item-bench">
                <span class="mini-dorsal">#${p.dorsal}</span>
                <span class="mini-name">${p.nombre} ${p.apellidos}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Live Event Timeline -->
    <div class="card live-timeline-card">
      <h3>Cronología del Partido en Vivo</h3>
      <div class="timeline-list" id="liveTimelineList">
        ${m.eventos && m.eventos.length > 0 ? m.eventos.map(e => `
          <div class="timeline-item">
            <span class="timeline-min">${e.minuto}'</span>
            <span class="timeline-icon">${getEventIcon(e.tipo)}</span>
            <span class="timeline-desc">${getEventDescription(e)}</span>
            ${!isFinished ? `<button class="undo-btn" onclick="undoEvent(${e.id})" title="Deshacer">&times;</button>` : ''}
          </div>
        `).join('') : '<p class="empty-text">No hay eventos registrados en este partido.</p>'}
      </div>
    </div>

    <!-- Modal Acciones Eléctricos -->
    <div id="electricActionModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Acción de Eléctricos FC ⚡</h3>
          <button class="modal-close" onclick="closeElectricActionModal()">&times;</button>
        </div>

        <div class="action-tab-buttons">
          <button class="btn btn-outline btn-sm active" id="tabGol" onclick="switchActionTab('gol')">⚽ Gol</button>
          <button class="btn btn-outline btn-sm" id="tabTarjeta" onclick="switchActionTab('tarjeta')">🟨 Tarjeta</button>
          <button class="btn btn-outline btn-sm" id="tabCambio" onclick="switchActionTab('cambio')">🔄 Cambio</button>
        </div>

        <!-- Form Gol Eléctricos -->
        <form id="formGolElectric" class="action-form" onsubmit="submitElectricGoal(event)">
          <div class="form-group">
            <label for="golScorer">Autor del Gol *</label>
            <select id="golScorer" required>
              <option value="">Selecciona autor...</option>
              ${convocatoriaPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="golAssister">Asistente (opcional)</label>
            <select id="golAssister">
              <option value="">Sin asistencia</option>
              ${convocatoriaPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Registrar Gol ⚽</button>
        </form>

        <!-- Form Tarjeta Eléctricos -->
        <form id="formTarjetaElectric" class="action-form hidden" onsubmit="submitElectricCard(event)">
          <div class="form-group">
            <label for="cardType">Tipo de Tarjeta *</label>
            <select id="cardType" required>
              <option value="tarjeta_amarilla">🟨 Tarjeta Amarilla</option>
              <option value="tarjeta_roja">🟥 Tarjeta Roja</option>
            </select>
          </div>

          <div class="form-group">
            <label for="cardPlayer">Jugador Afectado *</label>
            <select id="cardPlayer" required>
              <option value="">Selecciona jugador...</option>
              ${convocatoriaPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Registrar Tarjeta</button>
        </form>

        <!-- Form Cambio Eléctricos -->
        <form id="formCambioElectric" class="action-form hidden" onsubmit="submitElectricSub(event)">
          <div class="form-group">
            <label for="subIn">Jugador que ENTRA *</label>
            <select id="subIn" required>
              <option value="">Selecciona quién entra...</option>
              ${benchPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
            </select>
          </div>

          <div class="form-group">
            <label for="subOut">Jugador que SALE *</label>
            <select id="subOut" required>
              <option value="">Selecciona quién sale...</option>
              ${onPitchPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block">Registrar Cambio 🔄</button>
        </form>
      </div>
    </div>

    <!-- Modal Acciones Rival -->
    <div id="rivalActionModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Acción del Rival 🛡️</h3>
          <button class="modal-close" onclick="closeRivalActionModal()">&times;</button>
        </div>

        <div class="rival-action-options">
          <button class="btn btn-danger btn-block btn-lg" onclick="submitRivalAction('gol')">⚽ Gol del Rival</button>
          <button class="btn btn-primary btn-block" onclick="submitRivalAction('tarjeta_amarilla')">🟨 Tarjeta Amarilla Rival</button>
          <button class="btn btn-dark btn-block" onclick="submitRivalAction('tarjeta_roja')">🟥 Tarjeta Roja Rival</button>
          <button class="btn btn-outline btn-block" onclick="submitRivalAction('cambio')">🔄 Cambio en el Rival</button>
        </div>
      </div>
    </div>
  `;
}

function setupTimer() {
  if (liveState.timerInterval) clearInterval(liveState.timerInterval);

  const state = liveState.match.estado;
  if (state === '1a_parte' || state === '2a_parte') {
    liveState.isRunning = true;
    liveState.timerInterval = setInterval(() => {
      liveState.elapsedSeconds++;
      const timerDisplay = document.getElementById('liveTimerDisplay');
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(liveState.elapsedSeconds);
      }
    }, 1000);
  } else {
    liveState.isRunning = false;
  }
}

function getCurrentMinute() {
  const mins = Math.floor(liveState.elapsedSeconds / 60);
  if (liveState.match.estado === '2a_parte') {
    return Math.max(26, mins + 25);
  }
  return Math.max(1, mins);
}

function formatTime(totalSecs) {
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getStatusLabel(estado) {
  switch (estado) {
    case 'programado': return 'PROGRAMADO';
    case '1a_parte': return '1ª PARTE EN JUEGO';
    case 'descanso': return 'DESCANSO';
    case '2a_parte': return '2ª PARTE EN JUEGO';
    case 'finalizado': return 'FINALIZADO';
    default: return estado;
  }
}

async function startParte(parteNum) {
  const newStatus = parteNum === 1 ? '1a_parte' : '2a_parte';
  liveState.elapsedSeconds = parteNum === 1 ? 0 : 0; // Reset timer for part

  try {
    const res = await fetch(`/api/partidos/${liveState.match.id}/estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newStatus, segundos_transcurridos: liveState.elapsedSeconds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar');

    liveState.match = data.match;
    renderLivePage();
    setupTimer();
  } catch (err) {
    alert(err.message);
  }
}

async function finishParte(parteNum) {
  if (confirm('¿Finalizar la 1ª parte e ir al descanso?')) {
    try {
      liveState.elapsedSeconds = 0;
      const res = await fetch(`/api/partidos/${liveState.match.id}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'descanso', segundos_transcurridos: 0 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      liveState.match = data.match;
      renderLivePage();
      setupTimer();
    } catch (err) {
      alert(err.message);
    }
  }
}

async function finishPartido() {
  if (confirm('¿Deseas finalizar el partido definitivamente?')) {
    try {
      const res = await fetch(`/api/partidos/${liveState.match.id}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'finalizado', segundos_transcurridos: liveState.elapsedSeconds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');

      if (liveState.timerInterval) clearInterval(liveState.timerInterval);
      navigateTo(liveState.match.url);
    } catch (err) {
      alert(err.message);
    }
  }
}

async function resetPartidoDirecto() {
  if (confirm('¿Estás seguro de reiniciar el partido? El marcador, eventos y cronómetro volverán a cero como si nunca hubieses pulsado "Empezar Partido", pero se conservarán la convocatoria y alineación.')) {
    try {
      const res = await fetch(`/api/partidos/${liveState.match.id}/reiniciar`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reiniciar el partido');

      if (liveState.timerInterval) clearInterval(liveState.timerInterval);
      liveState.elapsedSeconds = 0;
      liveState.match = data.match;
      renderLivePage();
      setupTimer();
    } catch (err) {
      alert(err.message);
    }
  }
}

// Modal Handlers
function openElectricActionModal() {
  document.getElementById('electricActionModal').classList.remove('hidden');
  switchActionTab('gol');
}

function closeElectricActionModal() {
  document.getElementById('electricActionModal').classList.add('hidden');
}

function openRivalActionModal() {
  document.getElementById('rivalActionModal').classList.remove('hidden');
}

function closeRivalActionModal() {
  document.getElementById('rivalActionModal').classList.add('hidden');
}

function switchActionTab(tabName) {
  ['tabGol', 'tabTarjeta', 'tabCambio'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.remove('active');
  });

  ['formGolElectric', 'formTarjetaElectric', 'formCambioElectric'].forEach(id => {
    const form = document.getElementById(id);
    if (form) form.classList.add('hidden');
  });

  if (tabName === 'gol') {
    document.getElementById('tabGol').classList.add('active');
    document.getElementById('formGolElectric').classList.remove('hidden');
  } else if (tabName === 'tarjeta') {
    document.getElementById('tabTarjeta').classList.add('active');
    document.getElementById('formTarjetaElectric').classList.remove('hidden');
  } else if (tabName === 'cambio') {
    document.getElementById('tabCambio').classList.add('active');
    document.getElementById('formCambioElectric').classList.remove('hidden');
  }
}

async function submitElectricGoal(e) {
  e.preventDefault();
  const scorerId = document.getElementById('golScorer').value;
  const assisterId = document.getElementById('golAssister').value;

  await sendEvent({
    minuto: getCurrentMinute(),
    tipo: 'gol',
    es_electricos: true,
    jugador_id: scorerId,
    asistente_id: assisterId || null
  });
  closeElectricActionModal();
}

async function submitElectricCard(e) {
  e.preventDefault();
  const cardType = document.getElementById('cardType').value;
  const playerId = document.getElementById('cardPlayer').value;

  await sendEvent({
    minuto: getCurrentMinute(),
    tipo: cardType,
    es_electricos: true,
    jugador_id: playerId
  });
  closeElectricActionModal();
}

async function submitElectricSub(e) {
  e.preventDefault();
  const subIn = document.getElementById('subIn').value;
  const subOut = document.getElementById('subOut').value;

  await sendEvent({
    minuto: getCurrentMinute(),
    tipo: 'cambio',
    es_electricos: true,
    jugador_id: subIn,
    jugador_sale_id: subOut
  });
  closeElectricActionModal();
}

async function submitRivalAction(tipo) {
  await sendEvent({
    minuto: getCurrentMinute(),
    tipo: tipo,
    es_electricos: false
  });
  closeRivalActionModal();
}

async function sendEvent(eventPayload) {
  try {
    const res = await fetch(`/api/partidos/${liveState.match.id}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...eventPayload,
        periodo: liveState.match.estado
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar evento');

    // Refresh match data
    const refreshRes = await fetch(`/api/partidos/${liveState.match.id}`);
    liveState.match = await refreshRes.json();
    renderLivePage();
  } catch (err) {
    alert(err.message);
  }
}

async function undoEvent(eventId) {
  if (confirm('¿Deshacer este evento?')) {
    try {
      const res = await fetch(`/api/partidos/${liveState.match.id}/eventos/${eventId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al deshacer evento');

      const refreshRes = await fetch(`/api/partidos/${liveState.match.id}`);
      liveState.match = await refreshRes.json();
      renderLivePage();
    } catch (err) {
      alert(err.message);
    }
  }
}

function getEventIcon(tipo) {
  if (tipo === 'gol') return '⚽';
  if (tipo === 'tarjeta_amarilla') return '🟨';
  if (tipo === 'tarjeta_roja') return '🟥';
  if (tipo === 'cambio') return '🔄';
  return '📌';
}

function getEventDescription(e) {
  if (e.tipo === 'gol') {
    const scorer = e.jugador_nombre ? `${e.jugador_nombre} ${e.jugador_apellidos}` : (e.es_electricos ? 'Jugador Eléctricos' : 'Rival');
    const assist = e.asistente_nombre ? ` (Asist: ${e.asistente_nombre})` : '';
    return `Gol de ${scorer}${assist}`;
  }
  if (e.tipo === 'tarjeta_amarilla') {
    return `Tarjeta Amarilla (${e.jugador_nombre ? e.jugador_nombre + ' ' + e.jugador_apellidos : 'Rival'})`;
  }
  if (e.tipo === 'tarjeta_roja') {
    return `Tarjeta Roja (${e.jugador_nombre ? e.jugador_nombre + ' ' + e.jugador_apellidos : 'Rival'})`;
  }
  if (e.tipo === 'cambio') {
    return e.es_electricos ? `Cambio: Entra ${e.jugador_nombre || ''} por ${e.sale_nombre || ''}` : 'Cambio en el Rival';
  }
  return e.tipo;
}
