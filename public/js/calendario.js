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
            <h4>Equipo Local</h4>
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
            <h4>Equipo Visitante</h4>
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
            <h4>Equipo Local</h4>
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
            <h4>Equipo Visitante</h4>
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
