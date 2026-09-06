# Checklist de Verificación — Web Eléctricos FC

Marca cada punto solo si funciona exactamente como se describe. Si algo falla o se comporta distinto, anótalo al lado y no lo marques — el objetivo es que al final, si todo está marcado, el sistema esté al 100%.

---

## 1. Infraestructura y despliegue

- [ ] `docker-compose up` (o despliegue en Portainer) levanta los servicios `app` y `tunnel` sin errores.
- [ ] La app es accesible desde internet a través de la URL de Cloudflare Tunnel.
- [ ] La app es accesible en local (entorno de pruebas Windows) siguiendo `DEV.md`, sin tocar el stack de producción.
- [ ] Si se para y se vuelve a arrancar el contenedor `app`, **no se pierde ningún dato** (jugadores, partidos, eventos siguen ahí).
- [ ] Si se recompila la imagen y se redespliega el stack (flujo de actualización del README), los datos de la base de datos persisten.
- [ ] El token de Cloudflare se lee correctamente desde variable de entorno (no aparece hardcodeado en ningún archivo del repo).
- [ ] Las imágenes `electricos.png` y `placeholder-fondo.png` están en las rutas documentadas y se cargan correctamente en la app.
- [ ] Subir la foto de un jugador o de un rival se guarda en el volumen persistente (sobrevive a un reinicio del contenedor).

## 2. Autenticación

- [ ] No se puede acceder a ninguna página ni endpoint de la app sin iniciar sesión primero.
- [ ] El login funciona con `ADMIN_USER` / `ADMIN_PASSWORD` definidos por variable de entorno.
- [ ] Introducir credenciales incorrectas muestra un error y no da acceso.
- [ ] La sesión se mantiene al navegar entre páginas (no pide login en cada pantalla).
- [ ] Cerrar sesión (si existe el botón) bloquea de nuevo el acceso hasta volver a loguearse.
- [ ] Tras un tiempo de inactividad o al reiniciar el navegador, sigue pidiendo login si la sesión expiró (comportamiento esperado, no un fallo de seguridad).

## 3. Plantilla (`/plantilla`)

- [ ] Se puede añadir un jugador nuevo con nombre, apellidos, dorsal, posición y foto (foto opcional).
- [ ] No deja crear dos jugadores con el mismo dorsal (o avisa del conflicto).
- [ ] Las 6 posiciones están disponibles: Portero, Defensa, Lateral, Medio, Extremo, Delantero.
- [ ] Se puede editar cualquier campo de un jugador ya creado (nombre, dorsal, posición, foto).
- [ ] Se puede borrar un jugador.
- [ ] Goles, asistencias, tarjetas amarillas y rojas **no son editables manualmente** desde este apartado.
- [ ] Los goles/asistencias/tarjetas mostrados aquí coinciden exactamente con los eventos registrados en los partidos ya jugados.
- [ ] Si se borra un jugador que ya tiene goles/eventos registrados, la app no rompe (define y comprueba el comportamiento: ¿bloquea el borrado, o mantiene el histórico?).

## 4. Landing page (`/`)

- [ ] El Top 5 de goleadores se ordena correctamente de más a menos goles y se actualiza tras cada partido.
- [ ] El Top 5 de asistentes se ordena correctamente y se actualiza tras cada partido.
- [ ] El slider de partidos se puede desplazar horizontalmente (con dedo en móvil y con ratón/trackpad en escritorio).
- [ ] Cada tarjeta del slider muestra: foto local vs foto visitante, nombre debajo de cada foto, fecha en formato "Jueves, 14 de septiembre de 2026, [hora]".
- [ ] El color de la pill de competición es correcto en cada caso: Liga = azul clarito, Copa Primavera = verde clarito, Copa Sevilla = rojo clarito, Amistoso = amarillo clarito.
- [ ] El botón/filtro de "partidos ya jugados" muestra solo los finalizados, y al desactivarlo vuelve a mostrar todos o solo los programados (comprobar el comportamiento exacto).
- [ ] Pulsar una tarjeta del slider navega a la URL correcta del partido: `/partidos/(liga|copa-primavera|copa-sevilla|amistoso)/jornada-[numero]/local-vs-visitante`.
- [ ] Los botones **Calendario** y **Plantilla** llevan a sus páginas correspondientes.
- [ ] Recargar la página (F5) en la landing no rompe nada ni pide login otra vez de forma incorrecta.

## 5. Calendario (`/calendario`)

- [ ] Se ven 3 meses y se puede navegar/deslizar a meses siguientes y anteriores.
- [ ] El día actual aparece resaltado en gris.
- [ ] Los días con partido muestran el color correcto según competición (mismos colores que las pills).
- [ ] Un día con varios partidos los muestra todos (no oculta ninguno).
- [ ] Al clicar un día se abre el modal de "añadir partido".
- [ ] En el modal se puede rellenar: equipo local, equipo visitante, hora, lugar.
- [ ] El checkbox "Eléctricos" bajo el equipo local autorrellena nombre "Eléctricos FC" y la foto fija `electricos.png`.
- [ ] El checkbox "Eléctricos" bajo el equipo visitante hace lo mismo en su campo.
- [ ] Se puede dejar la foto del equipo (local o visitante) vacía y el partido se crea igualmente.
- [ ] Al pulsar "Aceptar", el partido nuevo aparece tanto en el calendario como en el slider de la landing.
- [ ] La jornada y competición del nuevo partido son coherentes (se numeran/asignan correctamente).

## 6. Página de detalle de partido (`/partidos/...`)

- [ ] La URL generada sigue exactamente el patrón: `/partidos/(liga|copa-primavera|copa-sevilla|amistoso)/jornada-[numero]/nombre-local-vs-nombre-visitante`.
- [ ] Se muestran en grande foto local vs foto visitante.
- [ ] Se muestra la fecha en el formato correcto y el lugar del encuentro.
- [ ] Se pueden elegir las 5 formaciones: 3-3, 2-3-1, 3-2-1, 2-2-2, 3-1-2.
- [ ] Al elegir formación se abre el modal de convocatoria con checkboxes por jugador.
- [ ] Convocar/desconvocar a un jugador funciona en cualquier momento (antes o durante la configuración de la alineación), y el jugador aparece/desaparece de las listas correctamente.
- [ ] Tras la convocatoria, se muestra el campo con la formación elegida y los huecos de posición vacíos.
- [ ] Al clicar un hueco de portero, el selector solo muestra porteros convocados.
- [ ] Al clicar un hueco de defensa/lateral/medio/extremo/delantero, el selector filtra correctamente solo esa posición.
- [ ] El selector estilo FIFA muestra foto, nombre y posición de cada candidato.
- [ ] Solo se guarda la alineación final (no hace falta deshacer pasos intermedios manualmente).
- [ ] El fondo del mapa es un campo de fútbol 7 reconocible.
- [ ] El logo `electricos.png` aparece pequeño abajo a la izquierda y arriba a la derecha del mapa.
- [ ] El modo edición permite cambiar hora, lugar, equipos, fotos y cualquier otro dato del partido ya creado.
- [ ] El botón "Empezar partido" navega correctamente a la página de partido en directo con la URL `.../partido-en-directo`.
- [ ] Una vez finalizado el partido, esta misma página muestra el resultado final y la cronología completa (goles, asistencias, tarjetas, cambios con minutaje).

## 7. Partido en directo (`/partidos/.../partido-en-directo` y `/partido-en-directo`)

- [ ] El header muestra `[foto local] [goles local] - [goles visitante] [foto visitante]` actualizado en tiempo real.
- [ ] El cronómetro arranca en `00:00` y no avanza hasta pulsar "Empezar 1ª parte".
- [ ] Tras pulsar "Empezar 1ª parte", el cronómetro avanza segundo a segundo de forma fiable (sin desincronizarse tras varios minutos).
- [ ] Se desbloquean los botones "Acciones Eléctricos" y "Acciones Rival" solo tras empezar el partido.
- [ ] **Acciones Eléctricos → Cambio**: se puede elegir quién entra y quién sale, y el campo/banquillo se actualiza al instante.
- [ ] **Acciones Eléctricos → Tarjeta**: se puede elegir amarilla o roja y el jugador afectado; se refleja en su ficha y en la cronología.
- [ ] **Acciones Eléctricos → Gol**: se puede elegir goleador y, opcionalmente, asistente; suma al marcador y a las estadísticas de ambos jugadores.
- [ ] **Acciones Rival → Cambio**: se registra sin pedir más datos.
- [ ] **Acciones Rival → Tarjeta**: se puede elegir amarilla o roja sin pedir jugador.
- [ ] **Acciones Rival → Gol**: suma al marcador visitante sin pedir más datos.
- [ ] Existe un botón/opción para deshacer el último evento registrado, y funciona correctamente (revierte marcador/estadísticas).
- [ ] La línea temporal muestra todos los eventos en orden, con minutaje correcto.
- [ ] Se ve la plantilla en directo (quién está en el campo y quién en el banquillo) y se actualiza con cada cambio.
- [ ] "Finalizar 1ª parte" pide confirmación antes de aplicarse.
- [ ] Tras finalizar la 1ª parte, el cronómetro vuelve a `00:00` y el estado pasa a "Descanso".
- [ ] Durante el descanso se pueden seguir haciendo cambios de jugadores.
- [ ] "Finalizar descanso" arranca la 2ª parte: el cronómetro cuenta de nuevo y el estado pasa a "2ª parte".
- [ ] "Finalizar partido" pide confirmación antes de aplicarse.
- [ ] Al confirmar "Finalizar partido", redirige a la página de detalle del partido con el resultado final visible.
- [ ] La vista genérica `/partido-en-directo` muestra el partido en curso si lo hay, y muestra "No hay partido" si no hay ninguno en juego.
- [ ] Todos los botones de acción son suficientemente grandes y usables con una mano desde el móvil.

## 8. Generador de carteles (`/carteles`)

- [ ] **Cartel de alineación**: muestra titulares organizados según la formación real del partido, y banquillo aparte, mostrando solo número y nombre (sin fotos).
- [ ] **Cartel de resultado**: muestra el marcador final, las fotos de ambos equipos y la cronología de goles/asistencias **de los Eléctricos** con minutaje.
- [ ] **Cartel de anuncio**: muestra local vs visitante, fecha, hora y lugar correctamente.
- [ ] Se puede cambiar la imagen de fondo del cartel, y por defecto usa `placeholder-fondo.png`.
- [ ] Se puede alternar entre varias plantillas visuales (colores/formas) y el cambio se refleja al instante.
- [ ] El logo `electricos.png` aparece correctamente en los carteles donde interviene el equipo.
- [ ] El botón de descarga genera un PNG legible, sin elementos cortados ni solapados.
- [ ] Los carteles se generan correctamente tanto para partidos ya finalizados como (alineación y anuncio) para partidos aún no jugados.
- [ ] El texto de los carteles no se desborda con nombres largos o dorsales de dos dígitos.

## 9. Responsive y usabilidad general

- [ ] Todas las páginas se ven y se usan correctamente en un móvil real (no solo en el modo responsive del navegador).
- [ ] No hay scroll horizontal no deseado en ninguna página en móvil.
- [ ] Los modales (convocatoria, selector FIFA, acciones en directo, añadir partido) se pueden cerrar y no bloquean el resto de la interfaz.
- [ ] La app funciona igual de bien en al menos dos navegadores distintos (ej. Chrome y Safari/iOS).
- [ ] Los textos, botones y pills mantienen la estética amarillo clarito y blanco en toda la app, sin colores desentonados.
- [ ] Todos los textos de la interfaz están en español, sin restos de texto de prueba o en inglés.

## 10. Integridad de datos y casos límite

- [ ] Crear un partido "Eléctricos vs Eléctricos" (o casos raros similares) no rompe la app (opcional, pero conviene probarlo una vez).
- [ ] Un partido sin ningún gol registrado se puede finalizar sin error y muestra 0-0 correctamente.
- [ ] Editar el partido después de haber empezado a jugarlo no descuadra el marcador ni la alineación ya guardada.
- [ ] Refrescar la página (F5) durante un partido en directo **no reinicia el cronómetro ni pierde los eventos ya registrados**.
- [ ] Cerrar el navegador durante un partido en directo y volver a entrar más tarde recupera el estado exacto del partido (cronómetro, marcador, eventos).
- [ ] Las estadísticas de la Plantilla y del Top 5 de la Landing siempre coinciden entre sí (no hay descuadres de conteo).

## 11. Documentación

- [ ] Siguiendo el `README.md` desde cero (servidor limpio), el primer despliegue en Portainer funciona sin pasos que falten.
- [ ] El proceso de actualización de producción descrito en el README funciona en la práctica y no borra datos.
- [ ] Siguiendo el `DEV.md`, se puede levantar el entorno local en Windows sin tocar producción, con Docker Desktop.
- [ ] Las rutas de `electricos.png` y `placeholder-fondo.png` indicadas en la documentación coinciden con las rutas reales del proyecto.

---

**Criterio de aceptación final**: si todos los puntos de las secciones 1 a 11 están marcados, el sistema cumple al 100% con lo especificado y está listo para uso real en un partido.
