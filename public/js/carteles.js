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

// Posiciones del campo (mapa F7) — misma geometría que la vista 'Mapa de Alineación & Convocatoria'
const POSTER_FORMACIONES = {
  '3-3': [
    { id: 'POR', label: 'Portero', top: '86%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Lat. Izquierdo', top: '65%', left: '20%' },
    { id: 'DEF_CEN', label: 'Central', top: '68%', left: '50%' },
    { id: 'DEF_DER', label: 'Lat. Derecho', top: '65%', left: '80%' },
    { id: 'EXT_IZQ', label: 'Extremo Izq.', top: '36%', left: '22%' },
    { id: 'DEL_CEN', label: 'Delantero', top: '22%', left: '50%' },
    { id: 'EXT_DER', label: 'Extremo Der.', top: '36%', left: '78%' }
  ],
  '2-3-1': [
    { id: 'POR', label: 'Portero', top: '86%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Defensa Izq.', top: '68%', left: '30%' },
    { id: 'DEF_DER', label: 'Defensa Der.', top: '68%', left: '70%' },
    { id: 'MED_IZQ', label: 'Interior Izq.', top: '45%', left: '20%' },
    { id: 'MED_CEN', label: 'Medio Centro', top: '48%', left: '50%' },
    { id: 'MED_DER', label: 'Interior Der.', top: '45%', left: '80%' },
    { id: 'DEL_CEN', label: 'Delantero', top: '22%', left: '50%' }
  ],
  '3-2-1': [
    { id: 'POR', label: 'Portero', top: '86%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Lat. Izquierdo', top: '68%', left: '20%' },
    { id: 'DEF_CEN', label: 'Central', top: '70%', left: '50%' },
    { id: 'DEF_DER', label: 'Lat. Derecho', top: '68%', left: '80%' },
    { id: 'MED_IZQ', label: 'Medio Izq.', top: '44%', left: '35%' },
    { id: 'MED_DER', label: 'Medio Der.', top: '44%', left: '65%' },
    { id: 'DEL_CEN', label: 'Delantero', top: '22%', left: '50%' }
  ],
  '2-2-2': [
    { id: 'POR', label: 'Portero', top: '86%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Defensa Izq.', top: '68%', left: '30%' },
    { id: 'DEF_DER', label: 'Defensa Der.', top: '68%', left: '70%' },
    { id: 'MED_IZQ', label: 'Medio Izq.', top: '45%', left: '32%' },
    { id: 'MED_DER', label: 'Medio Der.', top: '45%', left: '68%' },
    { id: 'DEL_IZQ', label: 'Delantero Izq.', top: '22%', left: '32%' },
    { id: 'DEL_DER', label: 'Delantero Der.', top: '22%', left: '68%' }
  ],
  '3-1-2': [
    { id: 'POR', label: 'Portero', top: '86%', left: '50%' },
    { id: 'DEF_IZQ', label: 'Lat. Izquierdo', top: '68%', left: '20%' },
    { id: 'DEF_CEN', label: 'Central', top: '70%', left: '50%' },
    { id: 'DEF_DER', label: 'Lat. Derecho', top: '68%', left: '80%' },
    { id: 'MED_CEN', label: 'Pivote', top: '46%', left: '50%' },
    { id: 'DEL_IZQ', label: 'Delantero Izq.', top: '22%', left: '32%' },
    { id: 'DEL_DER', label: 'Delantero Der.', top: '22%', left: '68%' }
  ]
};

let cartelesState = {
  type: 'alineacion', // 'alineacion', 'resultado', 'anuncio'
  matches: [],
  selectedMatchId: null,
  templates: [],
  selectedTemplate: null,
  customBgUrl: '/images/placeholder-fondo.png'
};

async function loadCartelesView() {
  const container = document.getElementById('app-view');
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Generador de Carteles de Partido</h2>
        <p class="subtitle">Crea y descarga carteles de alineación, resultado y anuncio en PNG</p>
      </div>
      <button class="btn btn-primary" onclick="downloadPosterAsPNG()"><i class="fa-solid fa-download"></i> Descargar PNG</button>
    </div>

    <!-- Controls Card -->
    <div class="card poster-controls-card">
      <div class="form-row">
        <div class="form-group flex-1">
          <label for="posterTypeSelect">Tipo de Cartel:</label>
          <select id="posterTypeSelect" onchange="onPosterTypeChange(this.value)">
            <option value="alineacion">Cartel de Alineación</option>
            <option value="resultado">Cartel de Resultado</option>
            <option value="anuncio">Cartel de Anuncio de Partido</option>
          </select>
        </div>

        <div class="form-group flex-1">
          <label for="posterMatchSelect">Partido:</label>
          <select id="posterMatchSelect" onchange="onPosterMatchChange(this.value)">
            <option value="">Selecciona partido...</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group flex-1">
          <label for="posterTemplateSelect">Plantilla Visual / Tema:</label>
          <select id="posterTemplateSelect" onchange="onPosterTemplateChange(this.value)">
            <option value="amarillo">Amarillo Clásico</option>
            <option value="noche">Noche Eléctrica</option>
            <option value="minimal">Minimal Blanco</option>
          </select>
        </div>

        <div class="form-group flex-1">
          <label for="posterBgFileInput">Subir Foto de Fondo:</label>
          <input type="file" id="posterBgFileInput" accept="image/*" onchange="uploadPosterBgFile(this)">
        </div>

        <div class="form-group flex-1">
          <label for="posterBgInput">O URL de Fondo:</label>
          <input type="text" id="posterBgInput" value="/images/placeholder-fondo.png" onchange="onPosterBgChange(this.value)" placeholder="/images/placeholder-fondo.png">
        </div>
      </div>
    </div>

    <!-- Poster Canvas Container -->
    <div class="poster-wrapper">
      <div id="posterCanvasContainer" class="poster-card-canvas theme-amarillo">
        <div class="loading-spinner">Cargando datos del cartel...</div>
      </div>
    </div>
  `;

  await Promise.all([fetchPosterMatches(), fetchPosterTemplates()]);
}

async function fetchPosterMatches() {
  try {
    const res = await fetch('/api/partidos');
    if (!res.ok) throw new Error('Error al cargar partidos');
    cartelesState.matches = await res.json();

    const select = document.getElementById('posterMatchSelect');
    if (cartelesState.matches.length === 0) {
      select.innerHTML = '<option value="">No hay partidos disponibles</option>';
      return;
    }

    select.innerHTML = cartelesState.matches.map(m => `
      <option value="${m.id}">${m.equipo_local_nombre} vs ${m.equipo_visitante_nombre} (J${m.jornada})</option>
    `).join('');

    // Default select first match
    cartelesState.selectedMatchId = cartelesState.matches[0].id;
    await renderPoster();
  } catch (err) {
    console.error(err);
  }
}

async function fetchPosterTemplates() {
  try {
    const res = await fetch('/api/carteles/plantillas');
    if (!res.ok) throw new Error('Error al cargar plantillas');
    cartelesState.templates = await res.json();
  } catch (err) {
    console.error(err);
  }
}

function onPosterTypeChange(type) {
  cartelesState.type = type;
  renderPoster();
}

async function onPosterMatchChange(matchId) {
  cartelesState.selectedMatchId = parseInt(matchId, 10);
  await renderPoster();
}

function onPosterTemplateChange(theme) {
  const container = document.getElementById('posterCanvasContainer');
  container.className = `poster-card-canvas theme-${theme}`;
}

function onPosterBgChange(url) {
  cartelesState.customBgUrl = url || '/images/placeholder-fondo.png';
  const container = document.getElementById('posterCanvasContainer');
  container.style.backgroundImage = `url('${cartelesState.customBgUrl}')`;
}

async function uploadPosterBgFile(fileInput) {
  if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
  try {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');

    document.getElementById('posterBgInput').value = data.url;
    onPosterBgChange(data.url);
  } catch (err) {
    alert(err.message);
  }
}

async function renderPoster() {
  const container = document.getElementById('posterCanvasContainer');
  if (!cartelesState.selectedMatchId) {
    container.innerHTML = '<div class="empty-state">Selecciona un partido para generar el cartel.</div>';
    return;
  }

  try {
    const res = await fetch(`/api/partidos/${cartelesState.selectedMatchId}`);
    if (!res.ok) throw new Error('Partido no encontrado');
    const match = await res.json();

    container.style.backgroundImage = `url('${cartelesState.customBgUrl}')`;

    if (cartelesState.type === 'alineacion') {
      renderCartelAlineacion(container, match);
    } else if (cartelesState.type === 'resultado') {
      renderCartelResultado(container, match);
    } else if (cartelesState.type === 'anuncio') {
      renderCartelAnuncio(container, match);
    }
  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

/**
 * 1. Cartel de Alineación: titulares en el campo (formación) + suplentes en lista abajo a la derecha.
 */
function renderCartelAlineacion(container, match) {
  const formacion = match.formacion || '3-3';
  const alineacionList = match.alineacion || [];
  const convocatoriaList = match.convocatoria || [];

  // Posiciones vacías del mapa (por si algún puesto no está cubierto)
  const slotsConfig = POSTER_FORMACIONES[formacion] || POSTER_FORMACIONES['3-3'];
  const startersBySlot = new Map(alineacionList.map(a => [a.posicion_campo, a]));
  if (alineacionList[0] && !alineacionList[0].posicion_campo) {
    // Si el backend no devolvió posicion_campo, buscamos por orden de slots
    slotsConfig.forEach((slot, i) => {
      const p = alineacionList[i];
      if (p) startersBySlot.set(slot.id, p);
    });
  }

  const slotHTML = slotsConfig.map(slot => {
    const player = startersBySlot.get(slot.id);
    if (player) {
      return `
        <div class="poster-slot" style="top: ${slot.top}; left: ${slot.left};">
          <span class="poster-slot-name">${player.nombre}</span>
          <span class="poster-slot-dorsal">${player.dorsal}</span>
        </div>
      `;
    }
    return `
      <div class="poster-slot poster-slot-empty" style="top: ${slot.top}; left: ${slot.left};">
        <span class="poster-slot-name">${slot.label}</span>
        <span class="poster-slot-dorsal">—</span>
      </div>
    `;
  }).join('');

  // Suplentes = convocados que NO están en la alineación
  const starterIds = alineacionList.map(a => a.id);
  const benchList = convocatoriaList.filter(p => !starterIds.includes(p.id)).sort((a, b) => a.dorsal - b.dorsal);

  // Formato lista: "88. Alberto Martinez"
  const benchHTML = benchList.length > 0
    ? benchList.map(b => `
        <div class="poster-sub-item">
          <span class="poster-sub-dorsal">${b.dorsal}.</span>
          <span class="poster-sub-name">${b.nombre} ${b.apellidos}</span>
        </div>
      `).join('')
    : '<span class="poster-empty-bench">Sin suplentes</span>';

  container.innerHTML = `
    <div class="poster-overlay">
      <div class="poster-header">
        <img src="/images/electricos.png" class="poster-brand-logo" alt="Eléctricos FC">
        <h2 class="poster-title">ALINEACIÓN OFICIAL</h2>
        <span class="poster-subtitle">ELÉCTRICOS FC vs ${match.equipo_visitante_nombre.toUpperCase()}</span>
        <br>
      </div>

      <div class="poster-alineacion-layout">
        <!-- Campo / Mapa de Alineación -->
        <div class="poster-field-wrap">
          <div class="poster-field">
            <div class="poster-field-lines">
              <div class="poster-pitch-center-line"></div>
              <div class="poster-pitch-center-circle"></div>
              <div class="poster-pitch-penalty-top"></div>
              <div class="poster-pitch-penalty-bottom"></div>
            </div>
            <img src="/images/electricos.png" class="poster-field-logo poster-corner-bl" alt="Logo">
            <img src="/images/electricos.png" class="poster-field-logo poster-corner-tr" alt="Logo">
            ${slotHTML}
          </div>
        </div>

        <!-- Lista de suplentes debajo del campo -->
        <div class="poster-subs-section">
          <h3>SUPLENTES</h3>
          <div class="poster-subs-list">
            ${benchHTML}
          </div>
        </div>
      </div>

      <div class="poster-footer">
        <span><i class="fa-solid fa-location-dot"></i> ${match.lugar}</span>
        <span><i class="fa-solid fa-calendar-days"></i> ${match.fecha_formateada}</span>
      </div>
    </div>
  `;
}

/**
 * 2. Cartel de Resultado: Marcador final, logos y cronología de goles/asistencias de Eléctricos.
 */
function renderCartelResultado(container, match) {
  const electricosGoals = (match.eventos || []).filter(e => e.tipo === 'gol' && e.es_electricos === 1);

  container.innerHTML = `
    <div class="poster-overlay">
      <div class="poster-header">
        <img src="/images/electricos.png" class="poster-brand-logo" alt="Eléctricos FC">
        <h2 class="poster-title">RESULTADO FINAL</h2>
        <span class="poster-subtitle">${match.competicion} — Jornada ${match.jornada}</span>
      </div>
        <div class="poster-team-box">
          <img src="${match.equipo_local_foto}" onerror="this.src='/images/electricos.png'">
          <span>${match.equipo_local_nombre}</span>
        </div>

        <div class="poster-final-score">
          ${match.goles_local} - ${match.goles_visitante}
        </div>

        <div class="poster-team-box">
          <img src="${match.equipo_visitante_foto}" onerror="this.src='/images/electricos.png'">
          <span>${match.equipo_visitante_nombre}</span>
        </div>
      </div>

      <div class="poster-goals-timeline">
        <h3><i class="fa-solid fa-futbol"></i> GOLES & ASISTENCIAS (ELÉCTRICOS FC)</h3>
        <div class="poster-goals-list">
          ${electricosGoals.length > 0 ? electricosGoals.map(g => `
            <div class="poster-goal-item">
              <span class="goal-min">${formatMinuteDisplay(g.minuto, g.periodo)}</span>
              <span class="goal-scorer"><i class="fa-solid fa-futbol"></i> ${g.jugador_nombre ? g.jugador_nombre + ' ' + g.jugador_apellidos : 'Gol Eléctricos'}</span>
              ${g.asistente_nombre ? `<span class="goal-assist">(<i class="fa-solid fa-shoe-prints"></i> ${g.asistente_nombre} ${g.asistente_apellidos})</span>` : ''}
            </div>
          `).join('') : '<p class="poster-empty-bench">No se anotaron goles en este encuentro.</p>'}
        </div>
      </div>

      <div class="poster-footer">
        <span><i class="fa-solid fa-location-dot"></i> ${match.lugar}</span>
        <span><i class="fa-solid fa-calendar-days"></i> ${match.fecha_formateada}</span>
      </div>
    </div>
  `;
}

/**
 * 3. Cartel de Anuncio de Partido: Local vs Visitante, fecha, hora y lugar.
 */
function renderCartelAnuncio(container, match) {
  const compSlug = match.competicion.toLowerCase().replace(/\s+/g, '-');

  container.innerHTML = `
    <div class="poster-overlay poster-anuncio-overlay">
      <div class="poster-header">
        <img src="/images/electricos.png" class="poster-brand-logo" alt="Eléctricos FC">
        <span class="pill pill-${compSlug} poster-pill">${match.competicion} (Jornada ${match.jornada})</span>
        <h2 class="poster-title-large">PRÓXIMO PARTIDO</h2>
      </div>

      <div class="poster-versus-section">
        <div class="versus-team">
          <img src="${match.equipo_local_foto}" onerror="this.src='/images/electricos.png'">
          <h3>${match.equipo_local_nombre}</h3>
        </div>

        <div class="versus-middle">VS</div>

        <div class="versus-team">
          <img src="${match.equipo_visitante_foto}" onerror="this.src='/images/electricos.png'">
          <h3>${match.equipo_visitante_nombre}</h3>
        </div>
      </div>

      <div class="poster-announcement-details">
        <div class="detail-box">
          <span class="detail-val"><i class="fa-solid fa-calendar-days"></i> ${match.fecha_formateada}</span>
        </div>
        <div class="detail-box">
          <span class="detail-val"><i class="fa-solid fa-location-dot"></i> ${match.lugar}</span>
        </div>
      </div>
    </div>
  `;
}

async function downloadPosterAsPNG() {
  const element = document.getElementById('posterCanvasContainer');
  if (!element) {
    alert('No se encontró el cartel.');
    return;
  }

  const downloadBtn = document.querySelector('button[onclick="downloadPosterAsPNG()"]');
  const originalText = downloadBtn ? downloadBtn.innerHTML : 'Descargar PNG';
  if (downloadBtn) {
    downloadBtn.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Generando PNG...';
    downloadBtn.disabled = true;
  }

  try {
    if (typeof html2canvas === 'function') {
      element.classList.add('poster-no-radius');
      try {
        const canvas = await html2canvas(element, {
          useCORS: true,
          allowTaint: true,
          scale: 3,
          backgroundColor: null,
          logging: false
        });

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `cartel-electricos-fc-${cartelesState.type || 'poster'}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } finally {
        element.classList.remove('poster-no-radius');
      }
      return;
    }

    throw new Error('No se pudo cargar html2canvas.');
  } catch (err) {
    console.error('Error al generar PNG:', err);
    alert('Error al descargar la imagen: ' + err.message);
  } finally {
    if (downloadBtn) {
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    }
  }
}
