// Live Match Tracking, Real-time Action Controller & Spectator Live Viewer

let liveState = {
  match: null,
  timerInterval: null,
  pollInterval: null,
  elapsedSeconds: 0,
  isRunning: false,
  isReadOnly: false
};

function clearLiveIntervals() {
  if (liveState.timerInterval) clearInterval(liveState.timerInterval);
  if (liveState.pollInterval) clearInterval(liveState.pollInterval);
  liveState.timerInterval = null;
  liveState.pollInterval = null;
}

/**
 * Calculates exact real-time elapsed seconds for running parts using UTC timestamp
 */
function calculateElapsedSeconds(match) {
  if (!match) return 0;

  if ((match.estado === '1a_parte' || match.estado === '2a_parte') && match.tiempo_inicio_parte) {
    try {
      const isoStr = match.tiempo_inicio_parte.includes('T')
        ? match.tiempo_inicio_parte
        : match.tiempo_inicio_parte.replace(' ', 'T') + 'Z';
      const startMs = new Date(isoStr).getTime();
      const nowMs = Date.now();
      if (!isNaN(startMs)) {
        const diffSecs = Math.max(0, Math.floor((nowMs - startMs) / 1000));
        return (match.segundos_transcurridos || 0) + diffSecs;
      }
    } catch (err) {
      console.error('Error calculating elapsed seconds:', err);
    }
  }

  return match.segundos_transcurridos || 0;
}

/**
 * Route handler for Public Spectator Live View (/directo)
 */
async function loadDirectoEspectadorView() {
  clearLiveIntervals();
  liveState.isReadOnly = true;

  const container = document.getElementById('app-view');
  container.innerHTML = '<div class="loading-spinner">Buscando partido en directo...</div>';

  try {
    const res = await fetch('/api/partidos/en-directo/activo');
    const data = await res.json();

    if (res.ok && data.active && data.matchId) {
      const matchRes = await fetch(`/api/partidos/${data.matchId}`);
      liveState.match = await matchRes.json();

      liveState.elapsedSeconds = calculateElapsedSeconds(liveState.match);
      renderLivePage();
      setupTimer();

      // Poll every 5 seconds for live spectator updates
      liveState.pollInterval = setInterval(async () => {
        if (window.location.pathname !== '/directo') {
          clearInterval(liveState.pollInterval);
          return;
        }
        try {
          const pollRes = await fetch(`/api/partidos/${liveState.match.id}`);
          if (pollRes.ok) {
            liveState.match = await pollRes.json();
            renderLivePage();
            setupTimer();
          }
        } catch (e) {}
      }, 5000);
    } else {
      // Empty state for spectator view - NO URL REDIRECTS!
      container.innerHTML = `
        <div class="card empty-state" style="text-align: center; padding: 40px 20px;">
          <h2 style="font-size: 1.5rem; margin-bottom: 8px;">⏱️ No hay partidos en directo</h2>
          <p style="color: var(--slate-medium);">No hay ningún encuentro de Eléctricos FC en juego en este momento.</p>
        </div>

        <!-- Clasificación Oficial IMD Sevilla -->
        <div class="card clasificacion-card" style="margin-top: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
            <h3 style="display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin: 0;">
              <span>Clasificación</span>
              <span id="clasificacionJornadaBadgeDirecto" class="pill pill-liga" style="font-size: 0.75rem;">Cargando...</span>
            </h3>
          </div>
          <div id="clasificacionContainerDirecto" style="overflow-x: auto;">
            <div class="loading-spinner">Cargando clasificación...</div>
          </div>
        </div>
      `;
      fetchDirectoClasificacion();
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

/**
 * Route handler for Match Control View (/partido-en-directo)
 */
async function loadPartidoDirectoControlView(specificMatchId = null) {
  clearLiveIntervals();
  liveState.isReadOnly = false;

  let matchId = specificMatchId;
  if (!matchId) {
    const params = new URLSearchParams(window.location.search);
    matchId = params.get('id');
  }

  const container = document.getElementById('app-view');
  container.innerHTML = '<div class="loading-spinner">Cargando control del directo...</div>';

  try {
    if (!matchId) {
      const activeRes = await fetch('/api/partidos/en-directo/activo');
      const activeData = await activeRes.json();
      if (activeRes.ok && activeData.active && activeData.matchId) {
        matchId = activeData.matchId;
      }
    }

    if (!matchId) {
      container.innerHTML = `
        <div class="card empty-state">
          <h2>⏱️ No hay partido en directo seleccionado</h2>
          <p>Selecciona un partido del calendario para iniciarlo o gestionarlo en directo.</p>
          <div style="margin-top: 16px;">
            <a href="/calendario" data-link class="btn btn-primary">📅 Ir al Calendario</a>
          </div>
        </div>
      `;
      return;
    }

    const res = await fetch(`/api/partidos/${matchId}`);
    if (!res.ok) throw new Error('Partido no encontrado');
    liveState.match = await res.json();

    liveState.elapsedSeconds = calculateElapsedSeconds(liveState.match);
    renderLivePage();
    setupTimer();
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderLivePage() {
  const m = liveState.match;
  const container = document.getElementById('app-view');
  if (!m) return;

  const onPitchPlayers = (m.alineacion || []);
  const convocatoriaPlayers = (m.convocatoria || []);
  const onPitchIds = onPitchPlayers.map(p => p.id);
  const benchPlayers = convocatoriaPlayers.filter(p => !onPitchIds.includes(p.id));

  const isProgrammed = m.estado === 'programado';
  const isParte1 = m.estado === '1a_parte';
  const isDescanso = m.estado === 'descanso';
  const isParte2 = m.estado === '2a_parte';
  const isFinished = m.estado === 'finalizado';

  const readOnly = liveState.isReadOnly;

  container.innerHTML = `
    ${readOnly ? `
      <div class="alert alert-info text-center" style="margin-bottom: 12px; font-weight: 600;">
        🔴 Marcador en tiempo real — Vista Espectador
      </div>
    ` : ''}

    <!-- Sticky Live Score Header -->
    <div class="live-sticky-header card">
      <div class="live-team">
        <img src="${m.equipo_local_foto || '/images/default-team.webp'}" alt="${m.equipo_local_nombre}" onerror="this.src='/images/default-team.webp'">
        <span class="live-team-name">${m.equipo_local_nombre}</span>
      </div>

      <div class="live-scoreboard">
        <div class="live-score">${m.goles_local} - ${m.goles_visitante}</div>
        <div class="live-timer-badge" id="liveTimerDisplay">${formatTime(liveState.elapsedSeconds, m.estado)}</div>
        <span class="live-status-text">${getStatusLabel(m.estado)}</span>
      </div>

      <div class="live-team">
        <img src="${m.equipo_visitante_foto || '/images/default-team.webp'}" alt="${m.equipo_visitante_nombre}" onerror="this.src='/images/default-team.webp'">
        <span class="live-team-name">${m.equipo_visitante_nombre}</span>
      </div>
    </div>

    <!-- Match Phase Control Buttons (Admin Control Only) -->
    ${!readOnly ? `
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
    ` : ''}

    <!-- Action Buttons (Admin Control Only) -->
    ${!readOnly && !isProgrammed && !isFinished ? `
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
            <span class="timeline-min">${formatMinuteDisplay(e.minuto, e.periodo)}</span>
            <span class="timeline-icon">${getEventIcon(e.tipo)}</span>
            <span class="timeline-desc">${getEventDescription(e)}</span>
            ${!readOnly && !isFinished ? `<button class="undo-btn" onclick="undoEvent(${e.id})" title="Deshacer">&times;</button>` : ''}
          </div>
        `).join('') : '<p class="empty-text">No hay eventos registrados en este partido.</p>'}
      </div>
    </div>

    <!-- Clasificación Oficial IMD Sevilla -->
    <div class="card clasificacion-card" style="margin-top: 24px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
        <h3 style="display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin: 0;">
          <span>Clasificación</span>
          <span id="clasificacionJornadaBadgeDirecto" class="pill pill-liga" style="font-size: 0.75rem;">Cargando...</span>
        </h3>
      </div>
      <div id="clasificacionContainerDirecto" style="overflow-x: auto;">
        <div class="loading-spinner">Cargando clasificación...</div>
      </div>
    </div>

    <!-- Modals rendered for admin control view -->
    ${!readOnly ? `
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

            <button type="submit" class="btn btn-primary btn-block">Añadir Gol Eléctricos</button>
          </form>

          <!-- Form Tarjetas Eléctricos -->
          <form id="formTarjetaElectric" class="action-form hidden" onsubmit="submitElectricCard(event)">
            <div class="form-group">
              <label for="cardPlayer">Jugador *</label>
              <select id="cardPlayer" required>
                <option value="">Selecciona jugador...</option>
                ${convocatoriaPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="cardType">Tipo de Tarjeta *</label>
              <select id="cardType" required>
                <option value="tarjeta_amarilla">🟨 Amarilla</option>
                <option value="tarjeta_roja">🟥 Roja</option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Registrar Tarjeta</button>
          </form>

          <!-- Form Cambios Eléctricos -->
          <form id="formCambioElectric" class="action-form hidden" onsubmit="submitElectricSub(event)">
            <div class="form-group">
              <label for="subOut">Jugador que SALE (En campo) *</label>
              <select id="subOut" required>
                <option value="">Selecciona quién sale...</option>
                ${onPitchPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="subIn">Jugador que ENTRA (En banquillo) *</label>
              <select id="subIn" required>
                <option value="">Selecciona quién entra...</option>
                ${benchPlayers.map(p => `<option value="${p.id}">#${p.dorsal} ${p.nombre} ${p.apellidos}</option>`).join('')}
              </select>
            </div>

            <button type="submit" class="btn btn-primary btn-block">Registrar Cambio</button>
          </form>
        </div>
      </div>

      <!-- Modal Acciones Rival -->
      <div id="rivalActionModal" class="modal-backdrop hidden">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Acción del Equipo Rival 🛡️</h3>
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
    ` : ''}
  `;

  fetchDirectoClasificacion();
}

async function fetchDirectoClasificacion() {
  const container = document.getElementById('clasificacionContainerDirecto');
  const badge = document.getElementById('clasificacionJornadaBadgeDirecto');
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

function setupTimer() {
  if (liveState.timerInterval) clearInterval(liveState.timerInterval);

  const state = liveState.match ? liveState.match.estado : null;
  if (state === '1a_parte' || state === '2a_parte') {
    liveState.isRunning = true;
    liveState.elapsedSeconds = calculateElapsedSeconds(liveState.match);
    
    const timerDisplay = document.getElementById('liveTimerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(liveState.elapsedSeconds, state);
    }

    liveState.timerInterval = setInterval(() => {
      liveState.elapsedSeconds = calculateElapsedSeconds(liveState.match);
      const timerDisplay = document.getElementById('liveTimerDisplay');
      if (timerDisplay) {
        timerDisplay.textContent = formatTime(liveState.elapsedSeconds, state);
      }
    }, 1000);
  } else {
    liveState.isRunning = false;
    liveState.elapsedSeconds = calculateElapsedSeconds(liveState.match);
    const timerDisplay = document.getElementById('liveTimerDisplay');
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(liveState.elapsedSeconds, state);
    }
  }
}

function getCurrentMinute() {
  const mins = Math.floor(liveState.elapsedSeconds / 60);
  const state = liveState.match ? liveState.match.estado : '1a_parte';
  if (state === '2a_parte') {
    return 25 + mins;
  }
  return mins;
}

function formatMinuteDisplay(minuto, periodo) {
  if (minuto === undefined || minuto === null || minuto === '') return '';
  const min = parseInt(minuto, 10);
  if (isNaN(min)) return '';

  if (periodo === '1a_parte') {
    if (min <= 25) return `${min}'`;
    return `25 + ${min - 25}'`;
  } else if (periodo === '2a_parte') {
    if (min <= 50) return `${min}'`;
    return `50 + ${min - 50}'`;
  } else {
    if (min <= 25) return `${min}'`;
    if (min <= 50) return `${min}'`;
    return `50 + ${min - 50}'`;
  }
}

function formatTime(totalSecs, estado) {
  const currentEstado = estado || (liveState.match ? liveState.match.estado : '1a_parte');

  if (currentEstado === '1a_parte') {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins < 25) {
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      const extraMins = mins - 25;
      return `25:00 + ${extraMins}:${String(secs).padStart(2, '0')}`;
    }
  } else if (currentEstado === '2a_parte') {
    const currentTotalSecs = 1500 + totalSecs; // Segunda parte arranca en el 25' (1500 segs)
    const mins = Math.floor(currentTotalSecs / 60);
    const secs = currentTotalSecs % 60;
    if (mins < 50) {
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
      const extraMins = mins - 50;
      return `50:00 + ${extraMins}:${String(secs).padStart(2, '0')}`;
    }
  } else if (currentEstado === 'descanso') {
    return '25:00 (Descanso)';
  } else if (currentEstado === 'finalizado') {
    return '50:00 (Final)';
  }

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
  liveState.elapsedSeconds = 0;

  try {
    const res = await fetch(`/api/partidos/${liveState.match.id}/estado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newStatus, segundos_transcurridos: 0 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar parte');

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
      const res = await fetch(`/api/partidos/${liveState.match.id}/estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'descanso', segundos_transcurridos: liveState.elapsedSeconds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al finalizar parte');

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
      if (!res.ok) throw new Error(data.error || 'Error al finalizar partido');

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
  const modal = document.getElementById('electricActionModal');
  if (modal) {
    modal.classList.remove('hidden');
    switchActionTab('gol');
  }
}

function closeElectricActionModal() {
  const modal = document.getElementById('electricActionModal');
  if (modal) modal.classList.add('hidden');
}

function openRivalActionModal() {
  const modal = document.getElementById('rivalActionModal');
  if (modal) modal.classList.remove('hidden');
}

function closeRivalActionModal() {
  const modal = document.getElementById('rivalActionModal');
  if (modal) modal.classList.add('hidden');
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
    const btn = document.getElementById('tabGol');
    const form = document.getElementById('formGolElectric');
    if (btn) btn.classList.add('active');
    if (form) form.classList.remove('hidden');
  } else if (tabName === 'tarjeta') {
    const btn = document.getElementById('tabTarjeta');
    const form = document.getElementById('formTarjetaElectric');
    if (btn) btn.classList.add('active');
    if (form) form.classList.remove('hidden');
  } else if (tabName === 'cambio') {
    const btn = document.getElementById('tabCambio');
    const form = document.getElementById('formCambioElectric');
    if (btn) btn.classList.add('active');
    if (form) form.classList.remove('hidden');
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

    liveState.match = data.match;
    renderLivePage();
    setupTimer();
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al deshacer evento');

      liveState.match = data.match;
      renderLivePage();
      setupTimer();
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
