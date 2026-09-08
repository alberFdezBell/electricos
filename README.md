# ⚡ Eléctricos FC — Aplicación Web de Gestión de Equipo (Fútbol 7)

Aplicación web full-stack ligera, responsive (mobile-first) y robusta diseñada para el entrenador de **Eléctricos FC**. Permite gestionar la plantilla, programar el calendario, organizar alineaciones tácticas en campo de Fútbol 7 con selector estilo FIFA, llevar el seguimiento de partidos en directo con cronómetro y generar carteles oficiales exportables en PNG.

---

## 🖼️ Rutas Exactas de Imágenes del Proyecto

Las dos imágenes fijas obligatorias del proyecto deben colocarse en las siguientes rutas exactas dentro del repositorio:

1. **Escudo / Foto Oficial de Eléctricos FC**:
   - `public/images/electricos.png`
   - *Uso*: Se utiliza automáticamente siempre que el equipo seleccionado sea "Eléctricos FC" (en tarjetas de partidos, convocatorias, alineaciones en campo y carteles).

2. **Fondo por Defecto para Carteles**:
   - `public/images/placeholder-fondo.png`
   - *Uso*: Imagen de fondo por defecto al generar los carteles de alineación, resultado y anuncio.

---

## 🔒 Sistema de Autenticación Integrado

La aplicación incluye un sistema de protección por usuario y contraseña mediante sesión segura, listo para publicarse a internet de forma segura mediante **Cloudflare Tunnel**:
- **Usuario por defecto**: `admin`
- **Contraseña por defecto**: `electricos2026`
- Configurable en el archivo de variables de entorno mediante `ADMIN_USER` y `ADMIN_PASSWORD`.

---

## 🚀 Guía de Despliegue en Portainer (Producción)

Existen **3 métodos** para desplegar en Portainer según cómo gestiones la imagen Docker:

---

### Método 1: Despliegue mediante Repositorio Git en Portainer (RECOMENDADO)
Si tu repositorio está subido a GitHub / GitLab / Gitea:

1. En Portainer, ve a **Stacks** ➔ **Add stack**.
2. Selecciona **Repository** (en lugar de Web editor).
3. Introduce la **Repository URL** de tu proyecto (e.g. `https://github.com/tu-usuario/electricos.html.git`) y la rama (`main`).
4. Especifica el path al archivo de compose: `docker-compose.yaml`.
5. En la sección **Environment variables**, añade `CLOUDFLARE_TUNNEL_TOKEN`, `ADMIN_USER`, `ADMIN_PASSWORD` y `SESSION_SECRET`.
6. Pulsa **Deploy the stack**. Portainer clonará el repositorio, ejecutará el build automático y desplegará la app.

```yaml
version: '3.8'

services:
  app:
    build: .
    image: electricos-app:latest
    container_name: electricos_app
    restart: unless-stopped
    ports:
      - "${HOST_PORT:-3005}:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DB_PATH=/app/data/electricos.db
      - SESSION_SECRET=${SESSION_SECRET}
      - ADMIN_USER=${ADMIN_USER}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
    volumes:
      - electricos_data:/app/data
      - electricos_uploads:/app/public/uploads

  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: electricos_cloudflare_tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}

volumes:
  electricos_data:
  electricos_uploads:

  tunnel:
    image: cloudflare/cloudflared:latest
    container_name: electricos_cloudflare_tunnel
    restart: unless-stopped
    command: tunnel --no-autoupdate run
    environment:
      - TUNNEL_TOKEN=${CLOUDFLARE_TUNNEL_TOKEN}

volumes:
  electricos_data:
  electricos_uploads:
```


### Paso 3: Configurar las Variables de Entorno en Portainer
En la sección **Environment variables** del Stack en Portainer, añade las siguientes variables:

| Variable | Valor de ejemplo | Descripción |
| :--- | :--- | :--- |
| `CLOUDFLARE_TUNNEL_TOKEN` | `eyJhIjoi...` | Token del túnel de Cloudflare (obligatorio) |
| `ADMIN_USER` | `entrenador` | Usuario para iniciar sesión |
| `ADMIN_PASSWORD` | `TuClaveSegura2026` | Contraseña para iniciar sesión |
| `SESSION_SECRET` | `clave_secreta_aleatoria_123` | Clave secreta para cookies de sesión |

### Paso 4: Desplegar el Stack
Haz clic en **Deploy the stack**. Portainer creará los volúmenes persistentes (`electricos_data` y `electricos_uploads`) y arrancará los dos contenedores (`electricos_app` y `electricos_cloudflare_tunnel`).

---

## 🔄 Guía para Actualizar Producción (Sin pérdida de datos)

Cuando hagas cambios en el código fuente de la aplicación, sigue estos pasos para actualizar producción sin borrar la base de datos ni las fotos subidas:

1. **Recompilar la imagen Docker localmente**:
   ```bash
   docker build -t electricos-app:latest .
   ```
2. **Redesplegar en Portainer**:
   - Ve a **Portainer** ➔ **Stacks** ➔ **electricos-fc**.
   - Haz clic en **Update the stack**.
   - Activa la casilla **Re-pull image / Force redeployment**.
   - Haz clic en **Update**.

Portainer reiniciará el contenedor con el nuevo código manteniendo intactos los volúmenes `electricos_data` (base de datos SQLite) y `electricos_uploads` (fotos).

---

## 📱 Módulos de la Aplicación

1. **Landing Page (`/`)**: Top 5 goleadores y asistentes de la temporada + slider deslizable de partidos con badges por competición.
2. **Plantilla (`/plantilla`)**: CRUD completo de jugadores (nombre, dorsal, posición, foto) con estadísticas acumuladas.
3. **Calendario (`/calendario`)**: Vista de 3 meses de calendario + modal para añadir/programar partidos.
4. **Página de Partido**: Formaciones F7 (3-3, 2-3-1, 3-2-1, 2-2-2, 3-1-2), modal de convocatoria y selector de titulares tipo carta FIFA.
5. **Partido en Directo (`/partido-en-directo`)**: Cronómetro en vivo `MM:SS`, botones gigantes táctiles en móvil para acciones rápidas de Eléctricos y Rival, descansos y cronología en tiempo real.
6. **Generador de Carteles (`/carteles`)**: Creación de carteles de Alineación, Resultado y Anuncio con plantillas de color y descarga instantánea en PNG.
