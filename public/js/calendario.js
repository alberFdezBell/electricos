// Calendario View Module
let calendarioState = {
  currentDate: new Date(),
  matches: [],
  selectedDay: null
};

// Borrador del panel visual de programación rápida
let quickMatchDraft = {
  local: { nombre: '', foto: '' },
  visitante: { nombre: '', foto: '' }
};

async function loadCalendarioView() {
  const container = document.getElementById('app-view');
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Calendario de Partidos</h2>
      </div>
    </div>

    <!-- Month Navigation Header -->
    <div class="calendar-controls card">
      <button class="btn btn-outline btn-sm" onclick="changeMonth(-1)">&larr; Anterior</button>
      <h3 id="calendarMonthTitle">Mes</h3>
      <button class="btn btn-outline btn-sm" onclick="changeMonth(1)">Siguiente &rarr;</button>
    </div>

    <!-- Month Container -->
    <div id="calendarMonthsGrid" class="calendar-months-grid">
      <div class="loading-spinner">Cargando calendario...</div>
    </div>

    <!-- Quick Match Panel (se despliega suavemente bajo el calendario) -->
    <div id="matchQuickPanelWrapper" class="match-panel-wrapper">
      <div class="match-panel card">
        <form id="matchQuickForm" onsubmit="saveQuickMatch(event)">
          <div class="match-panel-header">
            <h4><span id="qPanelTitle"><i class="fa-solid fa-calendar-days"></i> Programar Partido</span> <span id="qPanelDateLabel" class="match-panel-date">(—)</span></h4>
          </div>
          <div id="qDayMatchesPill" class="match-day-pill hidden">
            <span class="pill"><i class="fa-solid fa-thumbtack"></i> Día con partido asignado</span>
          </div>
          <input type="hidden" id="qMatchId">

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="qCompeticion">Competición *</label>
              <select id="qCompeticion" required>
                <option value="Liga">Liga</option>
                <option value="Copa Primavera">Copa Primavera</option>
                <option value="Copa Sevilla">Copa Sevilla</option>
                <option value="Amistoso">Amistoso</option>
              </select>
            </div>
            <div class="form-group flex-1">
              <label for="qJornada">Número de Jornada *</label>
              <input type="number" id="qJornada" min="1" value="1" required>
            </div>
          </div>

          <div class="quick-teams-section">
            <div class="quick-team-block">
              <span class="quick-team-label">Local</span>
              <button type="button" class="quick-team-btn" onclick="openSelectEquipoModal('panelLocal')" title="Elegir equipo local">
                <img id="qLocalImg" src="/images/default-team.webp" alt="Equipo local" onerror="this.src='/images/default-team.webp'">
                <span id="qLocalName" class="quick-team-name">Elige equipo</span>
              </button>
            </div>

            <div class="quick-vs-separator">
              <button type="button" class="quick-swap-btn" onclick="swapQuickTeams()" title="Intercambiar local y visitante"><i class="fa-solid fa-arrow-right-arrow-left"></i></button>
              <span class="quick-vs-text">VS</span>
            </div>

            <div class="quick-team-block">
              <span class="quick-team-label">Visitante</span>
              <button type="button" class="quick-team-btn" onclick="openSelectEquipoModal('panelVisitante')" title="Elegir equipo visitante">
                <img id="qVisitanteImg" src="/images/default-team.webp" alt="Equipo visitante" onerror="this.src='/images/default-team.webp'">
                <span id="qVisitanteName" class="quick-team-name">Elige equipo</span>
              </button>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="qFecha">Fecha *</label>
              <input type="date" id="qFecha" required>
            </div>
            <div class="form-group flex-1">
              <label for="qHora">Hora</label>
              <input type="time" id="qHora">
            </div>
          </div>

          <div class="form-group">
            <label for="qLugar">Campo / Lugar *</label>
            <input type="text" id="qLugar" placeholder="Ej: Polideportivo Alcosa - Campo 2" required>
          </div>

          <div id="quickMatchError" class="alert alert-error hidden"></div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="closeMatchPanel()">Cancelar</button>
            <button type="submit" id="qSaveBtn" class="btn btn-primary">Guardar Partido</button>
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
        
        <div style="margin-top: 10px;">
          <!-- Buscador a ancho completo -->
          <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
            <i class="fa-solid fa-magnifying-glass fi"></i>
            <input type="text" id="selectEquipoSearch" placeholder="Buscar equipo por nombre..." oninput="filterSelectEquipoList()" style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); font-size: 0.9rem; flex: 1;">
          </div>

          <!-- Botón Crear rápido (debajo del buscador) -->
          <div style="margin-top: 8px; text-align: right;">
            <button type="button" class="btn btn-outline btn-sm" onclick="toggleQuickCreateEquipoForm()" style="font-size: 0.8rem; padding: 4px 8px;">+ Crear rápido</button>
          </div>

          <!-- Formulario oculto de creación rápida -->
          <div id="quickCreateEquipoContainer" class="hidden card" style="padding: 12px; background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-sm); margin-top: 8px;">
            <h5 style="margin-bottom: 8px; font-size: 0.85rem; color: var(--dark-navy);"><i class="fa-solid fa-bolt"></i> Crear Equipo Rápido</h5>
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
    renderCalendar();
  } catch (err) {
    document.getElementById('calendarMonthsGrid').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function changeMonth(delta) {
  const d = calendarioState.currentDate;
  // Anclamos al día 1 para evitar saltos de mes (ej: 31 ene +1 = marzo)
  calendarioState.currentDate = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  closeMatchPanel();
  renderCalendar();
}

function renderCalendar() {
  const container = document.getElementById('calendarMonthsGrid');
  const title = document.getElementById('calendarMonthTitle');
  const baseDate = new Date(calendarioState.currentDate);

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  title.textContent = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;

  // Genera un único mes a partir de baseDate
  container.innerHTML = renderSingleMonthHTML(baseDate, monthNames);
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
              <button class="cal-pill-btn cal-pill-edit" onclick="event.stopPropagation(); openMatchEditPanel(${m.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="cal-pill-btn cal-pill-delete" onclick="event.stopPropagation(); deleteMatchCalendario(${m.id})" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        `;
      }).join('');
    }

    daysHTML += `
      <div class="cal-day ${isToday ? 'cal-today' : ''} ${dayMatches.length > 0 ? 'has-matches' : ''} ${calendarioState.selectedDay === dateStr ? 'cal-selected' : ''}" data-date="${dateStr}" onclick="openMatchPanel('${dateStr}')">
        <span class="day-number">${day}</span>
        <div class="day-matches-wrapper">${matchBadgeHTML}</div>
      </div>
    `;
  }

  return `
    <div class="month-card card">
      <div class="cal-weekdays">
        <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
      </div>
      <div class="cal-days-grid">${daysHTML}</div>
    </div>
  `;
}

/* ── Panel visual de programación rápida (inline) ────────────── */

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '(—)';
  const parts = dateStr.split('-');
  return `(${parts[2]}-${parts[1]}-${parts[0]})`;
}

function openMatchPanel(dateStr, match) {
  const wrapper = document.getElementById('matchQuickPanelWrapper');
  if (!wrapper) return;

  const isEdit = !!match;

  // Clic en el día ya seleccionado (sin edición) → cierra el panel
  if (!isEdit && dateStr && calendarioState.selectedDay === dateStr && wrapper.classList.contains('open')) {
    closeMatchPanel();
    return;
  }

  // Reset del formulario y del borrador de equipos
  document.getElementById('matchQuickForm').reset();
  document.getElementById('quickMatchError').classList.add('hidden');
  document.getElementById('qMatchId').value = '';
  quickMatchDraft.local = { nombre: '', foto: '' };
  quickMatchDraft.visitante = { nombre: '', foto: '' };

  calendarioState.selectedDay = dateStr || null;

  if (isEdit) {
    // ── Modo edición: rellena con los datos del partido
    document.getElementById('qMatchId').value = match.id;
    document.getElementById('qPanelTitle').innerHTML = '<i class="fa-solid fa-pen"></i> Editar Partido';
    document.getElementById('qSaveBtn').textContent = 'Guardar Cambios';
    document.getElementById('qCompeticion').value = match.competicion;
    document.getElementById('qJornada').value = match.jornada;
    quickMatchDraft.local = { nombre: match.equipo_local_nombre, foto: match.equipo_local_foto || '' };
    quickMatchDraft.visitante = { nombre: match.equipo_visitante_nombre, foto: match.equipo_visitante_foto || '' };
    if (match.fecha_hora) {
      document.getElementById('qFecha').value = match.fecha_hora.slice(0, 10);
      document.getElementById('qHora').value = match.fecha_hora.slice(11, 16);
    }
    document.getElementById('qLugar').value = match.lugar || '';
  } else {
    // ── Modo nuevo: fecha = día pulsado (o mañana), hora por defecto = hora actual
    document.getElementById('qPanelTitle').innerHTML = '<i class="fa-solid fa-calendar-days"></i> Programar Partido';
    document.getElementById('qSaveBtn').textContent = 'Guardar Partido';
    const now = new Date();
    let d = new Date();
    if (dateStr) {
      const p = dateStr.split('-');
      d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    } else {
      d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    }
    document.getElementById('qFecha').value =
      `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    document.getElementById('qHora').value = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
  }

  updateQuickTeamButtons();
  updateSelectedDayHighlight();
  updatePanelDateLabel();

  wrapper.classList.add('open');
  wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function openMatchEditPanel(matchId) {
  try {
    const res = await fetch(`/api/partidos/${matchId}`);
    if (!res.ok) throw new Error('No se pudo cargar el partido');
    const m = await res.json();
    openMatchPanel(m.fecha_hora ? m.fecha_hora.slice(0, 10) : null, m);
  } catch (err) {
    alert(err.message);
  }
}

function closeMatchPanel() {
  const wrapper = document.getElementById('matchQuickPanelWrapper');
  if (wrapper) wrapper.classList.remove('open');
  calendarioState.selectedDay = null;
  updateSelectedDayHighlight();
}

function updateSelectedDayHighlight() {
  document.querySelectorAll('.cal-day').forEach(el => el.classList.remove('cal-selected'));
  if (calendarioState.selectedDay) {
    const el = document.querySelector(`.cal-day[data-date="${calendarioState.selectedDay}"]`);
    if (el) el.classList.add('cal-selected');
  }
}

function updatePanelDateLabel() {
  const fechaInput = document.getElementById('qFecha');
  const label = document.getElementById('qPanelDateLabel');
  const dateStr = calendarioState.selectedDay || (fechaInput ? fechaInput.value : '');
  if (label) label.textContent = formatDateLabel(dateStr);

  const pill = document.getElementById('qDayMatchesPill');
  const hasMatches = calendarioState.selectedDay &&
    calendarioState.matches.some(m => m.fecha_hora.startsWith(calendarioState.selectedDay));
  if (pill) {
    if (hasMatches) pill.classList.remove('hidden');
    else pill.classList.add('hidden');
  }
}

function updateQuickTeamButtons() {
  const local = quickMatchDraft.local;
  const visitante = quickMatchDraft.visitante;

  const localImg = document.getElementById('qLocalImg');
  const visitanteImg = document.getElementById('qVisitanteImg');
  const localName = document.getElementById('qLocalName');
  const visitanteName = document.getElementById('qVisitanteName');

  if (localImg) localImg.src = local.foto || '/images/default-team.webp';
  if (visitanteImg) visitanteImg.src = visitante.foto || '/images/default-team.webp';
  if (localName) localName.textContent = local.nombre || 'Elige equipo';
  if (visitanteName) visitanteName.textContent = visitante.nombre || 'Elige equipo';
}

function swapQuickTeams() {
  const tmp = quickMatchDraft.local;
  quickMatchDraft.local = quickMatchDraft.visitante;
  quickMatchDraft.visitante = tmp;
  updateQuickTeamButtons();
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

async function saveQuickMatch(event) {
  event.preventDefault();

  const matchId = document.getElementById('qMatchId').value;
  const competicion = document.getElementById('qCompeticion').value;
  const jornada = document.getElementById('qJornada').value;
  const equipo_local_nombre = quickMatchDraft.local.nombre;
  const equipo_local_foto = quickMatchDraft.local.foto;
  const equipo_visitante_nombre = quickMatchDraft.visitante.nombre;
  const equipo_visitante_foto = quickMatchDraft.visitante.foto;
  const fecha = document.getElementById('qFecha').value;
  let hora = document.getElementById('qHora').value;
  const lugar = document.getElementById('qLugar').value.trim();
  const errDiv = document.getElementById('quickMatchError');

  errDiv.classList.add('hidden');

  if (!equipo_local_nombre || !equipo_visitante_nombre) {
    errDiv.textContent = 'Selecciona el equipo local y el visitante';
    errDiv.classList.remove('hidden');
    return;
  }

  if (!fecha) {
    errDiv.textContent = 'Indica la fecha del partido';
    errDiv.classList.remove('hidden');
    return;
  }

  if (!hora) {
    const n = new Date();
    hora = `${pad2(n.getHours())}:${pad2(n.getMinutes())}`;
  }
  const fecha_hora = `${fecha}T${hora}`;

  try {
    const res = await fetch(matchId ? `/api/partidos/${matchId}` : '/api/partidos', {
      method: matchId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        competicion,
        jornada,
        equipo_local_nombre,
        equipo_local_es_electricos: equipo_local_nombre === 'Eléctricos FC',
        equipo_local_foto,
        equipo_visitante_nombre,
        equipo_visitante_es_electricos: equipo_visitante_nombre === 'Eléctricos FC',
        equipo_visitante_foto,
        fecha_hora,
        lugar
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar el partido');

    closeMatchPanel();
    await fetchCalendarMatches();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.classList.remove('hidden');
  }
}

/* ── Calendar inline delete ─────────────────────────────────── */

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

const ELECTRICOS_FIXED_TEAM = { nombre: 'Eléctricos FC', foto: '/images/electricos.png' };

function normalizeText(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function renderEquipoCardHTML(eq) {
  const safeName = String(eq.nombre || '').replace(/'/g, "\\'");
  const safeFoto = String(eq.foto || '').replace(/'/g, "\\'");
  return `
    <div class="card" onclick="selectEquipoForMatch('${safeName}', '${safeFoto}')" style="cursor: pointer; text-align: center; padding: 12px; transition: transform 0.15s, border-color 0.15s; border: 1px solid var(--border-light);" onmouseover="this.style.borderColor='var(--accent-gold)'; this.style.transform='scale(1.02)';" onmouseout="this.style.borderColor='var(--border-light)'; this.style.transform='scale(1)';">
      <img src="${eq.foto || '/images/default-team.webp'}" alt="${eq.nombre}" style="width: 48px; height: 48px; object-fit: contain; margin: 0 auto 8px auto; display: block; background: #f1f5f9; padding: 4px; border-radius: 8px;" onerror="this.src='/images/default-team.webp'">
      <strong style="font-size: 0.85rem; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${eq.nombre}</strong>
    </div>
  `;
}

function renderSelectEquipoList(list, query = '') {
  const container = document.getElementById('selectEquipoList');
  if (!container) return;

  const normQuery = normalizeText(query);

  // Opción permanente de Eléctricos FC: siempre arriba, solo aparece si la búsqueda la contiene
  const showElectricos = !normQuery || normalizeText(ELECTRICOS_FIXED_TEAM.nombre).includes(normQuery);
  const electricosHTML = showElectricos ? renderEquipoCardHTML(ELECTRICOS_FIXED_TEAM) : '';

  // Evita duplicar Eléctricos FC si además existe como equipo guardado en la BD
  const normElectricos = normalizeText(ELECTRICOS_FIXED_TEAM.nombre);
  const filtered = list.filter(eq => {
    if (normalizeText(eq.nombre) === normElectricos) return false;
    if (!normQuery) return true;
    return normalizeText(eq.nombre).includes(normQuery);
  });

  const otrosHTML = filtered.map(eq => renderEquipoCardHTML(eq)).join('');
  const emptyText = (!showElectricos && filtered.length === 0)
    ? '<p class="empty-text" style="grid-column: 1/-1;">No se encontraron equipos.</p>'
    : '';

  container.innerHTML = electricosHTML + otrosHTML + emptyText;
}

function filterSelectEquipoList() {
  const query = document.getElementById('selectEquipoSearch').value.trim();
  renderSelectEquipoList(allEquiposForSelect, query);
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
  if (targetSelectEquipoField === 'panelLocal') {
    quickMatchDraft.local = { nombre, foto };
    // El mismo equipo no puede ser local y visitante a la vez
    if (quickMatchDraft.visitante.nombre && quickMatchDraft.visitante.nombre === nombre) {
      quickMatchDraft.visitante = { nombre: '', foto: '' };
    }
    updateQuickTeamButtons();
  } else if (targetSelectEquipoField === 'panelVisitante') {
    quickMatchDraft.visitante = { nombre, foto };
    // El mismo equipo no puede ser local y visitante a la vez
    if (quickMatchDraft.local.nombre && quickMatchDraft.local.nombre === nombre) {
      quickMatchDraft.local = { nombre: '', foto: '' };
    }
    updateQuickTeamButtons();
  }
  closeSelectEquipoModal();
}

