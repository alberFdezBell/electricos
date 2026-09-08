// Equipos View Module
let equiposState = {
  equipos: []
};

async function loadEquiposView() {
  const container = document.getElementById('app-view');
  const html = `
    <div class="view-header">
      <div>
        <h2>Gestión de Equipos</h2>
        <p class="subtitle">Administra los equipos rivales y sus escudos</p>
      </div>
      <button class="btn btn-primary" onclick="openAddEquipoModal()">+ Crear Equipo</button>
    </div>

    <div id="equiposGrid" class="players-grid">
      <div class="loading-spinner">Cargando equipos...</div>
    </div>

    <!-- Modal Crear / Editar Equipo -->
    <div id="equipoModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="equipoModalTitle">Crear Nuevo Equipo</h3>
          <button class="modal-close" onclick="closeEquipoModal()">&times;</button>
        </div>
        <form id="equipoForm" onsubmit="saveEquipo(event)">
          <input type="hidden" id="eqId">

          <div class="form-group">
            <label for="eqNombre">Nombre del Equipo *</label>
            <input type="text" id="eqNombre" placeholder="Ej: Rayo de Triana" required>
          </div>

          <div class="form-group">
            <label for="eqFotoFile">Subir Escudo / Foto (opcional)</label>
            <input type="file" id="eqFotoFile" accept="image/*">
          </div>

          <div class="form-group">
            <label for="eqFotoUrl">O URL del escudo</label>
            <input type="text" id="eqFotoUrl" placeholder="https://... o /images/...">
          </div>

          <div id="equipoFormError" class="alert alert-error hidden"></div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="closeEquipoModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary" id="eqSaveBtn">Guardar Equipo</button>
          </div>
        </form>
      </div>
    </div>
  `;
  container.innerHTML = html;
  await fetchEquipos();
}

async function fetchEquipos() {
  try {
    const res = await fetch('/api/equipos');
    if (!res.ok) throw new Error('Error al cargar equipos');
    equiposState.equipos = await res.json();
    renderEquiposGrid();
  } catch (err) {
    const grid = document.getElementById('equiposGrid');
    if (grid) grid.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function renderEquiposGrid() {
  const grid = document.getElementById('equiposGrid');
  if (!grid) return;

  if (equiposState.equipos.length === 0) {
    grid.innerHTML = '<p class="empty-text">No hay equipos registrados. ¡Crea el primero!</p>';
    return;
  }

  grid.innerHTML = equiposState.equipos.map(eq => `
    <div class="player-card">
      <div class="player-card-header">
        <img src="${eq.foto || '/images/default-team.webp'}" alt="${eq.nombre}" class="player-avatar" style="border-radius: 8px; object-fit: contain; background: #f1f5f9; padding: 4px;" onerror="this.src='/images/default-team.webp'">
        <div class="player-info">
          <h3>${eq.nombre}</h3>
        </div>
      </div>
      <div class="player-card-actions" style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
        <button class="btn btn-outline btn-sm" onclick="openEditEquipoModal(${eq.id})">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="deleteEquipo(${eq.id})">🗑️ Eliminar</button>
      </div>
    </div>
  `).join('');
}

function openAddEquipoModal() {
  document.getElementById('equipoForm').reset();
  document.getElementById('eqId').value = '';
  document.getElementById('equipoModalTitle').textContent = 'Crear Nuevo Equipo';
  document.getElementById('eqSaveBtn').textContent = 'Guardar Equipo';
  document.getElementById('equipoFormError').classList.add('hidden');
  document.getElementById('equipoModal').classList.remove('hidden');
}

function openEditEquipoModal(id) {
  const eq = equiposState.equipos.find(e => e.id === id);
  if (!eq) return;
  document.getElementById('equipoForm').reset();
  document.getElementById('eqId').value = eq.id;
  document.getElementById('eqNombre').value = eq.nombre;
  document.getElementById('eqFotoUrl').value = eq.foto || '';
  document.getElementById('equipoModalTitle').textContent = 'Editar Equipo';
  document.getElementById('eqSaveBtn').textContent = 'Guardar Cambios';
  document.getElementById('equipoFormError').classList.add('hidden');
  document.getElementById('equipoModal').classList.remove('hidden');
}

function closeEquipoModal() {
  document.getElementById('equipoModal').classList.add('hidden');
}

async function saveEquipo(event) {
  event.preventDefault();
  const id = document.getElementById('eqId').value;
  const nombre = document.getElementById('eqNombre').value.trim();
  let fotoUrl = document.getElementById('eqFotoUrl').value.trim();
  const fotoFile = document.getElementById('eqFotoFile');
  const errDiv = document.getElementById('equipoFormError');

  errDiv.classList.add('hidden');

  try {
    const formData = new FormData();
    formData.append('nombre', nombre);

    if (fotoFile && fotoFile.files && fotoFile.files[0]) {
      formData.append('foto', fotoFile.files[0]);
    } else {
      formData.append('fotoUrl', fotoUrl);
    }

    const url = id ? `/api/equipos/${id}` : '/api/equipos';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar equipo');

    closeEquipoModal();
    await fetchEquipos();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.classList.remove('hidden');
  }
}

async function deleteEquipo(id) {
  const eq = equiposState.equipos.find(e => e.id === id);
  const name = eq ? eq.nombre : 'este equipo';
  if (confirm(`¿Seguro que deseas eliminar a "${name}"?`)) {
    try {
      const res = await fetch(`/api/equipos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar el equipo');
      await fetchEquipos();
    } catch (err) {
      alert(err.message);
    }
  }
}