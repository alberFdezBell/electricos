// 7-a-side pitch formations mapping and position definitions
const FORMACIONES_FUTBOL_7 = {
  '3-3': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], grid: { top: '82%', left: '50%' } },
    { id: 'DEF_IZQ', label: 'Lateral Izq.', roles: ['Defensa', 'Lateral'], grid: { top: '65%', left: '20%' } },
    { id: 'DEF_CEN', label: 'Central', roles: ['Defensa'], grid: { top: '68%', left: '50%' } },
    { id: 'DEF_DER', label: 'Lateral Der.', roles: ['Defensa', 'Lateral'], grid: { top: '65%', left: '80%' } },
    { id: 'EXT_IZQ', label: 'Extremo Izq.', roles: ['Extremo', 'Medio'], grid: { top: '30%', left: '22%' } },
    { id: 'DEL_CEN', label: 'Delantero', roles: ['Delantero'], grid: { top: '22%', left: '50%' } },
    { id: 'EXT_DER', label: 'Extremo Der.', roles: ['Extremo', 'Medio'], grid: { top: '30%', left: '78%' } }
  ],
  '2-3-1': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], grid: { top: '82%', left: '50%' } },
    { id: 'DEF_IZQ', label: 'Defensa Izq.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '30%' } },
    { id: 'DEF_DER', label: 'Defensa Der.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '70%' } },
    { id: 'MED_IZQ', label: 'Interior Izq.', roles: ['Medio', 'Extremo'], grid: { top: '45%', left: '20%' } },
    { id: 'MED_CEN', label: 'Medio Centro', roles: ['Medio'], grid: { top: '48%', left: '50%' } },
    { id: 'MED_DER', label: 'Interior Der.', roles: ['Medio', 'Extremo'], grid: { top: '45%', left: '80%' } },
    { id: 'DEL_CEN', label: 'Delantero', roles: ['Delantero'], grid: { top: '22%', left: '50%' } }
  ],
  '3-2-1': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], grid: { top: '82%', left: '50%' } },
    { id: 'DEF_IZQ', label: 'Lateral Izq.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '20%' } },
    { id: 'DEF_CEN', label: 'Central', roles: ['Defensa'], grid: { top: '70%', left: '50%' } },
    { id: 'DEF_DER', label: 'Lateral Der.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '80%' } },
    { id: 'MED_IZQ', label: 'Medio Izq.', roles: ['Medio'], grid: { top: '44%', left: '35%' } },
    { id: 'MED_DER', label: 'Medio Der.', roles: ['Medio'], grid: { top: '44%', left: '65%' } },
    { id: 'DEL_CEN', label: 'Delantero', roles: ['Delantero'], grid: { top: '22%', left: '50%' } }
  ],
  '2-2-2': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], grid: { top: '82%', left: '50%' } },
    { id: 'DEF_IZQ', label: 'Defensa Izq.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '30%' } },
    { id: 'DEF_DER', label: 'Defensa Der.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '70%' } },
    { id: 'MED_IZQ', label: 'Medio Izq.', roles: ['Medio'], grid: { top: '45%', left: '32%' } },
    { id: 'MED_DER', label: 'Medio Der.', roles: ['Medio'], grid: { top: '45%', left: '68%' } },
    { id: 'DEL_IZQ', label: 'Delantero Izq.', roles: ['Delantero', 'Extremo'], grid: { top: '22%', left: '32%' } },
    { id: 'DEL_DER', label: 'Delantero Der.', roles: ['Delantero', 'Extremo'], grid: { top: '22%', left: '68%' } }
  ],
  '3-1-2': [
    { id: 'POR', label: 'Portero', roles: ['Portero'], grid: { top: '82%', left: '50%' } },
    { id: 'DEF_IZQ', label: 'Lateral Izq.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '20%' } },
    { id: 'DEF_CEN', label: 'Central', roles: ['Defensa'], grid: { top: '70%', left: '50%' } },
    { id: 'DEF_DER', label: 'Lateral Der.', roles: ['Defensa', 'Lateral'], grid: { top: '68%', left: '80%' } },
    { id: 'MED_CEN', label: 'Pivote', roles: ['Medio'], grid: { top: '46%', left: '50%' } },
    { id: 'DEL_IZQ', label: 'Delantero Izq.', roles: ['Delantero', 'Extremo'], grid: { top: '22%', left: '32%' } },
    { id: 'DEL_DER', label: 'Delantero Der.', roles: ['Delantero', 'Extremo'], grid: { top: '22%', left: '68%' } }
  ]
};

// Competition slugs mapping
const COMPETICIONES_SLUGS = {
  'liga': 'Liga',
  'copa-primavera': 'Copa Primavera',
  'copa-sevilla': 'Copa Sevilla',
  'amistoso': 'Amistoso'
};

const COMPETICIONES_NAMES = {
  'Liga': 'liga',
  'Copa Primavera': 'copa-primavera',
  'Copa Sevilla': 'copa-sevilla',
  'Amistoso': 'amistoso'
};

/**
 * Format ISO datetime string to Spanish date representation
 * e.g. "Jueves, 14 de septiembre de 2026, 20:00"
 */
function formatFechaEspandol(fechaHoraStr) {
  if (!fechaHoraStr) return '';
  const date = new Date(fechaHoraStr);
  if (isNaN(date.getTime())) return fechaHoraStr;

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  const diaSemana = dias[date.getDay()];
  const diaNum = date.getDate();
  const mes = meses[date.getMonth()];
  const ano = date.getFullYear();
  const horas = String(date.getHours()).padStart(2, '0');
  const minutos = String(date.getMinutes()).padStart(2, '0');

  return `${diaSemana}, ${diaNum} de ${mes} de ${ano}, ${horas}:${minutos}`;
}

/**
 * Convert string to URL-friendly slug
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^\w\-]+/g, '') // remove invalid chars
    .replace(/\-\-+/g, '-'); // collapse multiple hyphens
}

/**
 * Build clean URL for match detail page
 */
function getMatchUrl(partido) {
  const compSlug = COMPETICIONES_NAMES[partido.competicion] || 'liga';
  const jornada = partido.jornada || 1;
  const localSlug = slugify(partido.equipo_local_nombre);
  const visitanteSlug = slugify(partido.equipo_visitante_nombre);
  return `/partidos/${compSlug}/jornada-${jornada}/${localSlug}-vs-${visitanteSlug}?id=${partido.id}`;
}

module.exports = {
  FORMACIONES_FUTBOL_7,
  COMPETICIONES_SLUGS,
  COMPETICIONES_NAMES,
  formatFechaEspandol,
  slugify,
  getMatchUrl
};
