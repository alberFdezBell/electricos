// Plantilla View Module
let plantillaState = {
  jugadores: [],
  editingId: null
};

async function loadPlantillaView() {
  const container = document.getElementById('app-view');
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Plantilla del Equipo</h2>
        <p class="subtitle">Gestión de jugadores y estadísticas de temporada</p>
      </div>
      <button class="btn btn-primary" onclick="openPlayerModal()">+ Añadir Jugador</button>
    </div>

    <div id="plantillaList" class="player-grid">
      <div class="loading-spinner">Cargando plantilla...</div>
    </div>

    <!-- Modal Jugador -->
    <div id="playerModal" class="modal-backdrop hidden">
      <div class="modal-card">
        <div class="modal-header">
          <h3 id="modalTitle">Añadir Jugador</h3>
          <button class="modal-close" onclick="closePlayerModal()">&times;</button>
        </div>
        <form id="playerForm" onsubmit="savePlayer(event)">
          <input type="hidden" id="playerId">
          
          <div class="form-group">
            <label for="pNombre">Nombre *</label>
            <input type="text" id="pNombre" required placeholder="Ej: Carlos">
          </div>

          <div class="form-group">
            <label for="pApellidos">Apellidos *</label>
            <input type="text" id="pApellidos" required placeholder="Ej: Gómez">
          </div>

          <div class="form-row">
            <div class="form-group flex-1">
              <label for="pDorsal">Dorsal *</label>
              <input type="number" id="pDorsal" min="1" max="99" required placeholder="10">
            </div>
            
            <div class="form-group flex-1">
              <label for="pPosicion">Posición *</label>
              <select id="pPosicion" required>
                <option value="Portero">Portero</option>
                <option value="Defensa">Defensa</option>
                <option value="Lateral">Lateral</option>
                <option value="Medio">Medio</option>
                <option value="Extremo">Extremo</option>
                <option value="Delantero">Delantero</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="pFotoFile">Foto de perfil (opcional)</label>
            <input type="file" id="pFotoFile" accept="image/*">
          </div>

          <div id="playerFormError" class="alert alert-error hidden"></div>

          <div class="modal-actions">
            <button type="button" class="btn btn-outline" onclick="closePlayerModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar Jugador</button>
          </div>
        </form>
      </div>
    </div>
  `;

  await fetchJugadores();
}

async function fetchJugadores() {
  try {
    const res = await fetch('/api/jugadores');
    if (!res.ok) throw new Error('Error al cargar la plantilla');
    plantillaState.jugadores = await res.json();
    renderPlantillaList();
  } catch (err) {
    document.getElementById('plantillaList').innerHTML = `
      <div class="alert alert-error">${err.message}</div>
    `;
  }
}

function renderPlantillaList() {
  const list = document.getElementById('plantillaList');
  if (!plantillaState.jugadores || plantillaState.jugadores.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No hay jugadores en la plantilla todavía.</p>
        <button class="btn btn-primary btn-sm" onclick="openPlayerModal()">Añadir el primer jugador</button>
      </div>
    `;
    return;
  }

  list.innerHTML = plantillaState.jugadores.map(j => `
    <div class="player-card">
      <div class="player-card-header">
        <span class="player-dorsal">#${j.dorsal}</span>
        <img src="${j.foto || '/images/default-icon.webp'}" alt="${j.nombre}" class="player-avatar" onerror="this.src='/images/default-icon.webp'">
        <div class="player-info">
          <h3>${j.nombre} ${j.apellidos}</h3>
          <span class="player-position-badge">${j.posicion}</span>
        </div>
      </div>

      <div class="player-stats-row">
        <div class="stat-box">
          <span class="stat-value"><i class="fa-solid fa-futbol"></i> ${j.goles}</span>
          <span class="stat-label">Goles</span>
        </div>
        <div class="stat-box">
          <span class="stat-value"><i class="fa-solid fa-shoe-prints"></i> ${j.asistencias}</span>
          <span class="stat-label">Asist.</span>
        </div>
        <div class="stat-box">
          <span class="stat-value"><i class="fa-solid fa-square fi-yellow"></i> ${j.amarillas}</span>
          <span class="stat-label">Amarillas</span>
        </div>
        <div class="stat-box">
          <span class="stat-value"><i class="fa-solid fa-square fi-red"></i> ${j.rojas}</span>
          <span class="stat-label">Rojas</span>
        </div>
      </div>

      <div class="player-actions">
        <button class="btn btn-outline btn-sm" onclick="openPlayerModal(${j.id})">Editar</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeletePlayer(${j.id}, '${j.nombre} ${j.apellidos}')">Borrar</button>
      </div>
    </div>
  `).join('');
}

function openPlayerModal(id = null) {
  plantillaState.editingId = id;
  const modal = document.getElementById('playerModal');
  const title = document.getElementById('modalTitle');
  const form = document.getElementById('playerForm');
  const errDiv = document.getElementById('playerFormError');

  errDiv.classList.add('hidden');
  form.reset();

  if (id) {
    title.textContent = 'Editar Jugador';
    const player = plantillaState.jugadores.find(j => j.id === id);
    if (player) {
      document.getElementById('playerId').value = player.id;
      document.getElementById('pNombre').value = player.nombre;
      document.getElementById('pApellidos').value = player.apellidos;
      document.getElementById('pDorsal').value = player.dorsal;
      document.getElementById('pPosicion').value = player.posicion;
    }
  } else {
    title.textContent = 'Añadir Jugador';
    document.getElementById('playerId').value = '';
  }

  modal.classList.remove('hidden');
}

function closePlayerModal() {
  document.getElementById('playerModal').classList.add('hidden');
}

async function savePlayer(event) {
  event.preventDefault();
  const id = document.getElementById('playerId').value;
  const nombre = document.getElementById('pNombre').value.trim();
  const apellidos = document.getElementById('pApellidos').value.trim();
  const dorsal = document.getElementById('pDorsal').value;
  const posicion = document.getElementById('pPosicion').value;
  const fileInput = document.getElementById('pFotoFile');
  const errDiv = document.getElementById('playerFormError');

  errDiv.classList.add('hidden');

  const formData = new FormData();
  formData.append('nombre', nombre);
  formData.append('apellidos', apellidos);
  formData.append('dorsal', dorsal);
  formData.append('posicion', posicion);
  if (fileInput.files[0]) {
    formData.append('foto', fileInput.files[0]);
  }

  try {
    const url = id ? `/api/jugadores/${id}` : '/api/jugadores';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method: method,
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar jugador');

    closePlayerModal();
    await fetchJugadores();
  } catch (err) {
    errDiv.textContent = err.message;
    errDiv.classList.remove('hidden');
  }
}

async function confirmDeletePlayer(id, name) {
  if (confirm(`¿Estás seguro de que quieres borrar a ${name}?`)) {
    try {
      const res = await fetch(`/api/jugadores/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      await fetchJugadores();
    } catch (err) {
      alert(err.message);
    }
  }
}
