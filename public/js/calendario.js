// Calendario View Module
let calendarioState = {
  currentDate: new Date(),
  matches: [],
  selectedDay: null
};

async function loadCalendarioView() {
  const container = document.getElementById('app-view');
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Calendario de Partidos</h2>
        <p class="subtitle">Haz clic en cualquier día para añadir o ver partidos</p>
      </div>
      <button class="btn btn-primary" onclick="openAddMatchModal()">+ Programar Partido</button>
    </div>

    <!-- Month Navigation Header -->
    <div class="calendar-controls card">
      <button class="btn btn-outline btn-sm" onclick="changeMonth(-1)">&larr; Anterior</button>
      <h3 id="calendarMonthTitle">Meses</h3>
      <button class="btn btn-outline btn-sm" onclick="changeMonth(1)">Siguiente &rarr;</button>
    </div>

    <!-- 3-Month Container -->
    <div id="calendarMonthsGrid" class="calendar-months-grid">
      <div class="loading-spinner">Cargando calendario...</div>
    </div>

    <!-- Modal Añadir Partido -->
    <div id="matchModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Programar Partido</h3>
          <button class="modal-close" onclick="closeMatchModal()">&times;</button>
        </div>
        <form id="matchForm" onsubmit="saveMatch(event)">
          <div class="form-group">
            <label for="mCompeticion">Competición *</label>
            <select id="mCompeticion" required>
              <option value="Liga">Liga</option>
              <option value="Copa Primavera">Copa Primavera</option>
              <option value="Copa Sevilla">Copa Sevilla</option>
              <option value="Amistoso">Amistoso</option>
            </select>
          </div>

          <div class="form-group">
            <label for="mJornada">Número de Jornada *</label>
            <input type="number" id="mJornada" min="1" value="1" required>
          </div>

          <div class="team-input-section card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4>Equipo Local</h4>
              <button type="button" class="btn btn-outline btn-sm" onclick="openSelectEquipoModal('local')">🛡️ Elegir guardado</button>
            </div>
            <div class="form-group">
              <label for="mLocalNombre">Nombre Local *</label>
              <input type="text" id="mLocalNombre" placeholder="Nombre equipo local" required>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="mLocalElectric" onchange="toggleElectricCheckbox('local')">
                Es Eléctricos FC (autorrellena escudo y nombre)
              </label>
            </div>
            <div class="form-group">
              <label for="mLocalFotoFile">Subir Escudo / Foto Local (opcional)</label>
              <input type="file" id="mLocalFotoFile" accept="image/*">
            </div>
            <div class="form-group">
              <label for="mLocalFoto">O introducir URL de escudo local</label>
              <input type="text" id="mLocalFoto" placeholder="/images/electricos.png">
            </div>
          </div>

          <div class="team-input-section card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4>Equipo Visitante</h4>
              <button type="button" class="btn btn-outline btn-sm" onclick="openSelectEquipoModal('visitante')">🛡️ Elegir guardado</button>
            </div>
            <div class="form-group">
              <label for="mVisitanteNombre">Nombre Visitante *</label>
              <input type="text" id="mVisitanteNombre" placeholder="Nombre equipo visitante" required>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="mVisitanteElectric" onchange="toggleElectricCheckbox('visitante')">
                Es Eléctricos FC (autorrellena escudo y nombre)
              </label>
            </div>
            <div class="form-group">
              <label for="mVisitanteFotoFile">Subir Escudo / Foto Visitante (opcional)</label>
              <input type="file" id="mVisitanteFotoFile" accept="image/*">
            </div>
            <div class="form-group">
              <label for="mVisitanteFoto">O introducir URL de escudo visitante</label>
              <input type="text" id="mVisitanteFoto" placeholder="/images/electricos.png">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="mFechaHora">Fecha y Hora *</label>
              <input type="datetime-local" id="mFechaHora" required>
            </div>
          </div>

          <div class="form-group">
            <label for="mLugar">Campo / Lugar *</label>
            <input type="text" id="mLugar" placeholder="Ej: Polideportivo Triana - Campo 2" required>
          </div>

          <div id="matchFormError" class="alert alert-error hidden"></div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="closeMatchModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Partido</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Editar Partido -->
    <div id="editMatchCalendarModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3>✏️ Editar Partido</h3>
          <button class="modal-close" onclick="closeEditMatchCalendarModal()">&times;</button>
        </div>
        <form id="editMatchCalendarForm" onsubmit="saveEditMatchCalendario(event)">
          <input type="hidden" id="editCalMatchId">

          <div class="form-group">
            <label for="editCalCompeticion">Competición *</label>
            <select id="editCalCompeticion" required>
              <option value="Liga">Liga</option>
              <option value="Copa Primavera">Copa Primavera</option>
              <option value="Copa Sevilla">Copa Sevilla</option>
              <option value="Amistoso">Amistoso</option>
            </select>
          </div>

          <div class="form-group">
            <label for="editCalJornada">Número de Jornada *</label>
            <input type="number" id="editCalJornada" min="1" required>
          </div>

          <div class="team-input-section card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4>Equipo Local</h4>
              <button type="button" class="btn btn-outline btn-sm" onclick="openSelectEquipoModal('editLocal')">🛡️ Elegir guardado</button>
            </div>
            <div class="form-group">
              <label for="editCalLocalNombre">Nombre Local *</label>
              <input type="text" id="editCalLocalNombre" required>
            </div>
            <div class="form-group">
              <label for="editCalLocalFotoFile">Subir nuevo escudo Local (opcional)</label>
              <input type="file" id="editCalLocalFotoFile" accept="image/*">
            </div>
            <div class="form-group">
              <label for="editCalLocalFoto">O URL escudo Local</label>
              <input type="text" id="editCalLocalFoto">
            </div>
          </div>

          <div class="team-input-section card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <h4>Equipo Visitante</h4>
              <button type="button" class="btn btn-outline btn-sm" onclick="openSelectEquipoModal('editVisitante')">🛡️ Elegir guardado</button>
            </div>
            <div class="form-group">
              <label for="editCalVisitanteNombre">Nombre Visitante *</label>
              <input type="text" id="editCalVisitanteNombre" required>
            </div>
            <div class="form-group">
              <label for="editCalVisitanteFotoFile">Subir nuevo escudo Visitante (opcional)</label>
              <input type="file" id="editCalVisitanteFotoFile" accept="image/*">
            </div>
            <div class="form-group">
              <label for="editCalVisitanteFoto">O URL escudo Visitante</label>
              <input type="text" id="editCalVisitanteFoto">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="editCalFechaHora">Fecha y Hora *</label>
              <input type="datetime-local" id="editCalFechaHora" required>
            </div>
          </div>

          <div class="form-group">
            <label for="editCalLugar">Campo / Lugar *</label>
            <input type="text" id="editCalLugar" required>
          </div>

          <div id="editCalMatchError" class="alert alert-error hidden"></div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="closeEditMatchCalendarModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Seleccionar Equipo Guardado -->
    <div id="selectEquipoModal" class="modal-backdrop hidden">
      <div class="modal-card" style="max-width: 520px;">
        <div class="modal-header">
          <h3>Seleccionar Equipo Guardado</h3>
          <button class="modal-close" onclick="closeSelectEquipoModal()">&times;</button>
        </div>
        
        <div style="margin-top: 10px; display: flex; gap: 8px; flex-direction: column;">
          <input type="text" id="selectEquipoSearch" placeholder="🔍 Buscar equipo por nombre..." oninput="filterSelectEquipoList()" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.9rem;">
          
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: var(--slate-medium);">Selecciona un equipo o crea uno rápido:</span>
            <button type="button" class="btn btn-outline btn-sm" onclick="toggleQuickCreateEquipoForm()" style="font-size: 0.8rem; padding: 4px 8px;">+ Crear rápido</button>
          </div>

          <div id="quickCreateEquipoContainer" class="hidden card" style="padding: 12px; background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-top: 4px;">
            <h5 style="margin-bottom: 8px; font-size: 0.85rem; color: var(--dark-navy);">⚡ Crear Equipo Rápido</h5>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <input type="text" id="quickEqNombre" placeholder="Nombre del equipo *" style="width: 100%; padding: 6px 10px; font-size: 0.85rem; border: 1px solid var(--border-light); border-radius: var(--radius-sm);">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <label style="font-size: 0.75rem; color: var(--slate-medium);">Escudo / Foto (opcional)</label>
                <input type="file" id="quickEqFotoFile" accept="image/*" style="font-size: 0.75rem;">
              </div>
              <div id="quickEqError" class="alert alert-error hidden" style="padding: 4px 8px; font-size: 0.8rem; margin: 0;"></div>
              <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
                <button type="button" class="btn btn-outline btn-sm" onclick="toggleQuickCreateEquipoForm()" style="font-size: 0.8rem;">Cancelar</button>
                <button type="button" class="btn btn-primary btn-sm" onclick="saveQuickEquipo()" style="font-size: 0.8rem;">Guardar y Usar</button>
              </div>
            </div>
          </div>
        </div>

        <div id="selectEquipoList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; margin-top: 12px; max-height: 300px; overflow-y: auto; padding: 4px;">
          <div class="loading-spinner">Cargando equipos...</div>
        </div>
        <div class="modal-actions" style="margin-top: 16px;">
          <button type="button" class="btn btn-outline" onclick="closeSelectEquipoModal()">Cancelar</button>
        </div>
      </div>
    </div>
  `;

  await fetchCalendarMatches();
}

async function fetchCalendarMatches() {
  try {
    const res = await fetch('/api/partidos');
    if (!res.ok) throw new Error('Error al consultar partidos');
    calendarioState.matches = await res.json();
    render3MonthsCalendar();
  } catch (err) {
    document.getElementById('calendarMonthsGrid').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function changeMonth(delta) {
  calendarioState.currentDate.setMonth(calendarioState.currentDate.getMonth() + delta);
  render3MonthsCalendar();
}

function render3MonthsCalendar() {
  const container = document.getElementById('calendarMonthsGrid');
  const title = document.getElementById('calendarMonthTitle');
  const baseDate = new Date(calendarioState.currentDate);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  title.textContent = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()} (Vista de 3 meses)`;

  // Generate 3 consecutive months starting from baseDate
  let html = '';
  for (let i = 0; i < 3; i++) {
    const mDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
    html += renderSingleMonthHTML(mDate, monthNames);
  }
  container.innerHTML = html;
}

function renderSingleMonthHTML(dateObj, monthNames) {
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
  const totalDays = new Date(year, month + 1, 0).getDate();

  const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon=0, Sun=6
  const today = new Date();

  let daysHTML = '';

  // Blank offset days
  for (let b = 0; b < adjustedFirstDay; b++) {
    daysHTML += '<div class="cal-day cal-blank"></div>';
  }

  // Days of month
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

    // Find matches on this day
    const dayMatches = calendarioState.matches.filter(m => m.fecha_hora.startsWith(dateStr));

    let matchBadgeHTML = '';
    if (dayMatches.length > 0) {
      matchBadgeHTML = dayMatches.map(m => {
        const compSlug = m.competicion.toLowerCase().replace(/\s+/g, '-');
        return `
          <div class="cal-match-pill-row" onclick="event.stopPropagation()">
            <div class="cal-match-pill pill-${compSlug}" onclick="navigateTo('${m.url}')" title="${m.equipo_local_nombre} vs ${m.equipo_visitante_nombre}">
              ${m.equipo_local_nombre.slice(0, 5)} vs ${m.equipo_visitante_nombre.slice(0, 5)}
            </div>
            <div class="cal-pill-actions">
              <button class="cal-pill-btn cal-pill-edit" onclick="event.stopPropagation(); openEditMatchModalCalendario(${m.id})" title="Editar">✏️</button>
              <button class="cal-pill-btn cal-pill-delete" onclick="event.stopPropagation(); deleteMatchCalendario(${m.id})" title="Eliminar">🗑️</button>
            </div>
          </div>
        `;
      }).join('');
    }

    daysHTML += `
      <div class="cal-day ${isToday ? 'cal-today' : ''} ${dayMatches.length > 0 ? 'has-matches' : ''}" onclick="openAddMatchModalForDay('${dateStr}')">
        <span class="day-number">${day}</span>
        <div class="day-matches-wrapper">${matchBadgeHTML}</div>
      </div>
    `;
  }

  return `
    <div class="month-card card">
      <h4>${monthNames[month]} ${year}</h4>
      <div class="cal-weekdays">
        <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
      </div>
      <div class="cal-days-grid">${daysHTML}</div>
    </div>
  `;
}

function openAddMatchModalForDay(dateStr) {
  openAddMatchModal();
  if (dateStr) {
    document.getElementById('mFechaHora').value = `${dateStr}T20:00`;
  }
}

function openAddMatchModal() {
  const modal = document.getElementById('matchModal');
  document.getElementById('matchForm').reset();
  document.getElementById('matchFormError').classList.add('hidden');
  
  // Default datetime to current date + 1 day at 20:00
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const dateISO = d.toISOString().slice(0, 10);
  document.getElementById('mFechaHora').value = `${dateISO}T20:00`;

  modal.classList.remove('hidden');
}

function closeMatchModal() {
  document.getElementById('matchModal').classList.add('hidden');
}

function toggleElectricCheckbox(teamType) {
  if (teamType === 'local') {
    const isElectric = document.getElementById('mLocalElectric').checked;
    const inputName = document.getElementById('mLocalNombre');
    const inputFoto = document.getElementById('mLocalFoto');

    if (isElectric) {
      inputName.value = 'Eléctricos FC';
      inputFoto.value = '/images/electricos.png';
      inputName.readOnly = true;

      // Desmarcar visitante si estaba marcado
      const visChk = document.getElementById('mVisitanteElectric');
      if (visChk && visChk.checked) {
        visChk.checked = false;
        const visName = document.getElementById('mVisitanteNombre');
        const visFoto = document.getElementById('mVisitanteFoto');
        visName.readOnly = false;
        if (visName.value === 'Eléctricos FC') visName.value = '';
        if (visFoto.value === '/images/electricos.png') visFoto.value = '';
      }
    } else {
      inputName.readOnly = false;
      inputName.value = '';
      inputFoto.value = '';
    }
  } else if (teamType === 'visitante') {
    const isElectric = document.getElementById('mVisitanteElectric').checked;
    const inputName = document.getElementById('mVisitanteNombre');
    const inputFoto = document.getElementById('mVisitanteFoto');

    if (isElectric) {
      inputName.value = 'Eléctricos FC';
      inputFoto.value = '/images/electricos.png';
      inputName.readOnly = true;

      // Desmarcar local si estaba marcado
      const locChk = document.getElementById('mLocalElectric');
      if (locChk && locChk.checked) {
        locChk.checked = false;
        const locName = document.getElementById('mLocalNombre');
        const locFoto = document.getElementById('mLocalFoto');
        locName.readOnly = false;
        if (locName.value === 'Eléctricos FC') locName.value = '';
        if (locFoto.value === '/images/electricos.png') locFoto.value = '';
      }
    } else {
      inputName.readOnly = false;
      inputName.value = '';
      inputFoto.value = '';
    }
  }
}

async function uploadImageFile(fileInput) {
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return null;
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');
  return data.url;
}

async function saveMatch(event) {
  event.preventDefault();
  const competicion = document.getElementById('mCompeticion').value;
  const jornada = document.getElementById('mJornada').value;
  const equipo_local_nombre = document.getElementById('mLocalNombre').value.trim();
  const equipo_local_es_electricos = document.getElementById('mLocalElectric').checked;
  let equipo_local_foto = document.getElementById('mLocalFoto').value.trim();
  const equipo_visitante_nombre = document.getElementById('mVisitanteNombre').value.trim();
  const equipo_visitante_es_electricos = document.getElementById('mVisitanteElectric').checked;
  let equipo_visitante_foto = document.getElementById('mVisitanteFoto').value.trim();
  const fecha_hora = document.getElementById('mFechaHora').value;
  const lugar = document.getElementById('mLugar').value.trim();
  const errDiv = document.getElementById('matchFormError');

  errDiv.classList.add('hidden');

  try {
    // Check for uploaded file images
    const localFile = document.getElementById('mLocalFotoFile');
    const visitanteFile = document.getElementById('mVisitanteFotoFile');

    if (localFile && localFile.files[0]) {
      const uploadedUrl = await uploadImageFile(localFile);
      if (uploadedUrl) equipo_local_foto = uploadedUrl;
    }

    if (visitanteFile && visitanteFile.files[0]) {
      const uploadedUrl = await uploadImageFile(visitanteFile);
      if (uploadedUrl) equipo_visitante_foto = uploadedUrl;
    }

    const res = await fetch('/api/partidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competicion,
        jornada,
        equipo_local_nombre,
        equipo_local_es_electricos,
        equipo_local_foto,
        equipo_visitante_nombre,
        equipo_visitante_es_electricos,
        equipo_visitante_foto,
        fecha_hora,
        lugar
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar el partido');

    closeMatchModal();
    await fetchCalendarMatches();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.classList.remove('hidden');
  }
}

/* ── Calendar inline edit / delete ─────────────────────────── */

async function openEditMatchModalCalendario(matchId) {
  try {
    const res = await fetch(`/api/partidos/${matchId}`);
    if (!res.ok) throw new Error('No se pudo cargar el partido');
    const m = await res.json();

    document.getElementById('editCalMatchId').value = m.id;
    document.getElementById('editCalCompeticion').value = m.competicion;
    document.getElementById('editCalJornada').value = m.jornada;
    document.getElementById('editCalLocalNombre').value = m.equipo_local_nombre;
    document.getElementById('editCalLocalFoto').value = m.equipo_local_foto || '';
    document.getElementById('editCalVisitanteNombre').value = m.equipo_visitante_nombre;
    document.getElementById('editCalVisitanteFoto').value = m.equipo_visitante_foto || '';
    document.getElementById('editCalFechaHora').value = m.fecha_hora ? m.fecha_hora.slice(0, 16) : '';
    document.getElementById('editCalLugar').value = m.lugar;
    document.getElementById('editCalMatchError').classList.add('hidden');
    document.getElementById('editCalLocalFotoFile').value = '';
    document.getElementById('editCalVisitanteFotoFile').value = '';

    document.getElementById('editMatchCalendarModal').classList.remove('hidden');
  } catch (err) {
    alert(err.message);
  }
}

function closeEditMatchCalendarModal() {
  document.getElementById('editMatchCalendarModal').classList.add('hidden');
}

async function saveEditMatchCalendario(event) {
  event.preventDefault();
  const matchId = document.getElementById('editCalMatchId').value;
  const competicion = document.getElementById('editCalCompeticion').value;
  const jornada = document.getElementById('editCalJornada').value;
  const equipo_local_nombre = document.getElementById('editCalLocalNombre').value.trim();
  let equipo_local_foto = document.getElementById('editCalLocalFoto').value.trim();
  const equipo_visitante_nombre = document.getElementById('editCalVisitanteNombre').value.trim();
  let equipo_visitante_foto = document.getElementById('editCalVisitanteFoto').value.trim();
  const fecha_hora = document.getElementById('editCalFechaHora').value;
  const lugar = document.getElementById('editCalLugar').value.trim();
  const errDiv = document.getElementById('editCalMatchError');

  errDiv.classList.add('hidden');

  try {
    const localFile = document.getElementById('editCalLocalFotoFile');
    if (localFile && localFile.files[0]) {
      const url = await uploadImageFile(localFile);
      if (url) equipo_local_foto = url;
    }

    const visitanteFile = document.getElementById('editCalVisitanteFotoFile');
    if (visitanteFile && visitanteFile.files[0]) {
      const url = await uploadImageFile(visitanteFile);
      if (url) equipo_visitante_foto = url;
    }

    const res = await fetch(`/api/partidos/${matchId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competicion, jornada,
        equipo_local_nombre, equipo_local_foto,
        equipo_visitante_nombre, equipo_visitante_foto,
        fecha_hora, lugar
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar el partido');

    closeEditMatchCalendarModal();
    await fetchCalendarMatches();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.classList.remove('hidden');
  }
}

async function deleteMatchCalendario(matchId) {
  if (confirm('¿Eliminar este partido permanentemente? Se borrarán la convocatoria, alineación y eventos registrados.')) {
    try {
      const res = await fetch(`/api/partidos/${matchId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar el partido');
      await fetchCalendarMatches();
    } catch (err) {
      alert(err.message);
    }
  }
}

let targetSelectEquipoField = null;
let allEquiposForSelect = [];

async function openSelectEquipoModal(targetField) {
  targetSelectEquipoField = targetField;
  const modal = document.getElementById('selectEquipoModal');
  const container = document.getElementById('selectEquipoList');
  const searchInput = document.getElementById('selectEquipoSearch');
  
  if (searchInput) searchInput.value = '';
  document.getElementById('quickCreateEquipoContainer').classList.add('hidden');
  document.getElementById('quickEqNombre').value = '';
  document.getElementById('quickEqFotoFile').value = '';
  document.getElementById('quickEqError').classList.add('hidden');

  modal.classList.remove('hidden');
  container.innerHTML = '<div class="loading-spinner">Cargando equipos...</div>';

  try {
    const res = await fetch('/api/equipos');
    if (!res.ok) throw new Error('Error al cargar equipos');
    allEquiposForSelect = await res.json();
    renderSelectEquipoList(allEquiposForSelect);
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error" style="grid-column: 1/-1;">${err.message}</div>`;
  }
}

function renderSelectEquipoList(list) {
  const container = document.getElementById('selectEquipoList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = '<p class="empty-text" style="grid-column: 1/-1;">No se encontraron equipos.</p>';
    return;
  }

  container.innerHTML = list.map(eq => `
    <div class="card" onclick="selectEquipoForMatch('${eq.nombre.replace(/'/g, "\\'")}', '${(eq.foto || '').replace(/'/g, "\\'")}')" style="cursor: pointer; text-align: center; padding: 12px; transition: transform 0.15s, border-color 0.15s; border: 1px solid var(--border-light);" onmouseover="this.style.borderColor='var(--accent-gold)'; this.style.transform='scale(1.02)';" onmouseout="this.style.borderColor='var(--border-light)'; this.style.transform='scale(1)';">
      <img src="${eq.foto || '/images/default-team.webp'}" alt="${eq.nombre}" style="width: 48px; height: 48px; object-fit: contain; margin: 0 auto 8px auto; display: block; background: #f1f5f9; padding: 4px; border-radius: 8px;" onerror="this.src='/images/default-team.webp'">
      <strong style="font-size: 0.85rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${eq.nombre}</strong>
    </div>
  `).join('');
}

function filterSelectEquipoList() {
  const query = document.getElementById('selectEquipoSearch').value.trim().toLowerCase();
  if (!query) {
    renderSelectEquipoList(allEquiposForSelect);
    return;
  }
  const filtered = allEquiposForSelect.filter(e => e.nombre.toLowerCase().includes(query));
  renderSelectEquipoList(filtered);
}

function toggleQuickCreateEquipoForm() {
  const form = document.getElementById('quickCreateEquipoContainer');
  form.classList.toggle('hidden');
}

async function saveQuickEquipo() {
  const nombreInput = document.getElementById('quickEqNombre');
  const fileInput = document.getElementById('quickEqFotoFile');
  const errDiv = document.getElementById('quickEqError');

  const nombre = nombreInput.value.trim();
  if (!nombre) {
    errDiv.textContent = 'El nombre del equipo es obligatorio';
    errDiv.classList.remove('hidden');
    return;
  }

  errDiv.classList.add('hidden');

  try {
    const formData = new FormData();
    formData.append('nombre', nombre);
    if (fileInput && fileInput.files && fileInput.files[0]) {
      formData.append('foto', fileInput.files[0]);
    }

    const res = await fetch('/api/equipos', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear equipo');

    const newTeam = data.team;
    selectEquipoForMatch(newTeam.nombre, newTeam.foto || '');
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.classList.remove('hidden');
  }
}

function closeSelectEquipoModal() {
  document.getElementById('selectEquipoModal').classList.add('hidden');
}

function selectEquipoForMatch(nombre, foto) {
  if (targetSelectEquipoField === 'local') {
    document.getElementById('mLocalNombre').value = nombre;
    document.getElementById('mLocalFoto').value = foto;
    const chk = document.getElementById('mLocalElectric');
    if (chk) { chk.checked = false; document.getElementById('mLocalNombre').readOnly = false; }
  } else if (targetSelectEquipoField === 'visitante') {
    document.getElementById('mVisitanteNombre').value = nombre;
    document.getElementById('mVisitanteFoto').value = foto;
    const chk = document.getElementById('mVisitanteElectric');
    if (chk) { chk.checked = false; document.getElementById('mVisitanteNombre').readOnly = false; }
  } else if (targetSelectEquipoField === 'editLocal') {
    document.getElementById('editCalLocalNombre').value = nombre;
    document.getElementById('editCalLocalFoto').value = foto;
  } else if (targetSelectEquipoField === 'editVisitante') {
    document.getElementById('editCalVisitanteNombre').value = nombre;
    document.getElementById('editCalVisitanteFoto').value = foto;
  }
  closeSelectEquipoModal();
}

