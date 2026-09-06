# 💻 Tutorial de Entorno de Desarrollo Local en Windows

Esta guía detalla los pasos exactos para levantar y probar la aplicación **Eléctricos FC** en tu ordenador local con Windows, de modo que puedas realizar cambios en el código y probar la interfaz sin afectar a la versión de producción.

---

## 🛠️ Requisitos Previos en Windows

1. **Docker Desktop para Windows**:
   - Descarga e instala [Docker Desktop](https://www.docker.com/products/docker-desktop/).
   - Asegúrate de tener activada la integración con WSL2 o Hyper-V y que Docker Desktop esté en ejecución.
2. **Node.js (v20 o superior)** *(Opcional para ejecutar sin Docker)*:
   - Descarga e instala [Node.js](https://nodejs.org/).
3. **Git**:
   - Para clonar el repositorio.

---

## 🚀 Opción A: Levantar con Docker Desktop (Recomendado)

### 1. Clonar el repositorio y acceder a la carpeta
Abre PowerShell o la consola de comandos de Windows (cmd) y ejecuta:

```powershell
git clone <URL_DE_TU_REPOSITORIO>
cd electricos
```

### 2. Configurar las variables de entorno de desarrollo
Copia la plantilla de variables de entorno `.env.example` a `.env`:

```powershell
Copy-Item .env.example .env
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

### 3. Compilar y levantar la aplicación con Docker Compose
Ejecuta el siguiente comando en la raíz del proyecto:

```powershell
docker compose up --build -d app
```

Este comando:
- Compilará la imagen Docker local `electricos-app:latest`.
- Creará la base de datos SQLite en `./data/electricos.db`.
- Iniciará el servidor web en el puerto `3000`.

### 4. Probar la aplicación en el navegador
Abre tu navegador e ingresa a:

```
http://localhost:3000
```

- **Usuario**: `admin`
- **Contraseña**: `electricos2026`

---

## ⚡ Opción B: Ejecución Directa con Node.js (Desarrollo Ultrarrápido)

Si deseas modificar código en vivo con recarga automática:

1. **Instalar dependencias**:
   ```powershell
   npm install
   ```

2. **Arrancar en modo desarrollo**:
   ```powershell
   npm run dev
   ```

3. Accede a `http://localhost:3000` en tu navegador.

---

## 🧪 Verificación de Cambios y Pruebas

- **Probar plantilla**: Ve a `/plantilla` y añade un jugador de prueba con foto.
- **Probar partido en directo**: Programa un partido en `/calendario` y pulsa "Empezar partido" para probar el cronómetro en vivo y los botones de acción rápida.
- **Probar carteles**: Ve a `/carteles` y descarga un cartel en formato PNG.

---

## 🛑 Detener el Entorno Local

Para apagar los contenedores locales sin borrar tus datos de prueba:

```powershell
docker compose stop
```
