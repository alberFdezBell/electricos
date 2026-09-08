# 🔄 Flujo de Trabajo — Eléctricos FC

Guía completa de principio a fin para hacer cambios en el código y subirlos a producción.

---

## 📋 Resumen rápido

```
GitHub → Tu PC → Cambios → GitHub → Portainer (Producción)
```

---

## 🟢 PASO 1 — Descargar el código de GitHub

> Haz esto solo la **primera vez** o si alguien más ha hecho cambios que no tienes.

Abre **PowerShell** en la carpeta del proyecto y ejecuta:

```powershell
# Primera vez (clonar el repositorio)
git clone https://github.com/alberFdezBell/electricos.git
cd electricos
```

> Si **ya tienes la carpeta** del proyecto, simplemente actualízala:

```powershell
git pull
```

✅ Ya tienes el código más reciente en tu PC.

Copia la plantilla de variables de entorno `.env.example` a `.env`:

```
copy .env.example .env
```

El contenido por defecto del archivo `.env` para desarrollo local es:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/electricos.db
SESSION_SECRET=electricos_fc_secret_key_2026
ADMIN_USER=admin
ADMIN_PASSWORD=electricos2026
CLOUDFLARE_TUNNEL_TOKEN=
```

*(Nota: En entorno local no es necesario rellenar `CLOUDFLARE_TUNNEL_TOKEN`)*.

---

## 🟡 PASO 2 — Instalar dependencias (solo si es la primera vez)

```powershell
npm install
```

> Solo necesitas hacer esto una vez, o cuando alguien añada nuevas librerías al proyecto.

---

## 🟡 PASO 3 — Iniciar el servidor local

Arranca la aplicación en tu PC con recarga automática al guardar cambios:

```powershell
npm run dev
```

Abre el navegador y ve a:

```
http://localhost:3000
```

- **Usuario**: `admin`
- **Contraseña**: `electricos2026`

> 💡 El servidor se recarga automáticamente cada vez que guardas un archivo. No necesitas reiniciarlo.

---

## 🔵 PASO 4 — Hacer los cambios

Edita los archivos que necesites. Los más habituales están en:

| Carpeta / Archivo | Qué contiene |
| :--- | :--- |
| `src/` | Lógica del servidor y rutas |
| `public/` | CSS, JavaScript del navegador e imágenes |
| `server.js` | Punto de entrada del servidor |

Comprueba tus cambios en `http://localhost:3000` antes de subir.

---

## 🟠 PASO 5 — Subir el código a GitHub

Una vez que estés satisfecho con los cambios, guárdalos en el repositorio:

## Opción A) Desde GitHub Desktop:

1. Ver qué archivos han cambiado:
   Revisa el panel izquierdo "Changes" para ver la lista de archivos modificados.

2. Añadir todos los cambios y guardarlos (Commit):
   En la esquina inferior izquierda, escribe un mensaje descriptivo en "Summary" 
   (ej: "Mejora pantalla de plantilla") y haz clic en "Commit to main".

3. Subir a GitHub:
   Haz clic en el botón "Push origin" en la barra superior.


## Opción B) Desde la terminal (Comandos Git):

```powershell
# 1. Ver qué archivos han cambiado
git status

# 2. Añadir todos los cambios
git add .

# 3. Guardar los cambios con un mensaje descriptivo
git commit -m "Describe aquí qué cambiaste, ej: Mejora pantalla de plantilla"

# 4. Subir a GitHub
git push
```

✅ El código ya está en GitHub en la rama main.

---

## 🔴 PASO 6 — Actualizar Producción en Portainer

Una vez subido el código a GitHub, actualiza el servidor de producción:

1. Entra en **Portainer** (tu panel de administración del servidor).
2. Ve a **Stacks** → selecciona el stack **electricos-fc**.
3. Haz clic en **Update the stack**.
4. Activa la casilla ✅ **Re-pull image / Force redeployment**.
5. Haz clic en **Update**.

Portainer descargará automáticamente el código de GitHub, recompilará la imagen y reiniciará la aplicación **sin borrar** la base de datos ni las fotos.

✅ ¡Producción actualizada!