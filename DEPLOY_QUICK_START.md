# 🚀 Despliegue Rápido - TravelIA

## ⚡ Inicio Rápido (5 minutos)

### 1️⃣ Frontend en Vercel (2 minutos)

1. Ve a [vercel.com](https://vercel.com) y haz login con GitHub
2. Click en **"Add New Project"**
3. Importa tu repositorio `travelIA`
4. **IMPORTANTE - Nombre del proyecto:**
   - En el campo **"Private Repository Name"**, cambia `travelIA` a `travelia` (todo minúsculas)
   - Vercel solo permite nombres en minúsculas, números y caracteres `.`, `_`, `-`
5. **IMPORTANTE - Cambiar rama:**
   - Después de importar, en la sección **"Configure Project"**
   - Busca el campo **"Production Branch"** o **"Branch"**
   - Cambia de `main` a `release/v1.0.0` (o la rama donde están tus cambios)
6. Configura:
   - **Root Directory:** `frontend`
   - **Framework:** Create React App (auto-detectado)
7. Agrega variable de entorno:
   ```
   REACT_APP_API_URL=https://tu-backend.railway.app
   ```
   (Actualiza esto después de desplegar el backend)
8. Click **"Create"** o **"Deploy"** ✅

**Nota:** Si no ves la opción de cambiar rama durante la configuración inicial, puedes hacerlo después:
- Ve a **Settings** → **Git** → **Production Branch**
- Cambia a `release/v1.0.0` y guarda

### 2️⃣ Backend en Railway (3 minutos)

1. Ve a [railway.app](https://railway.app) y haz login con GitHub
2. Click en **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona tu repositorio `travelIA`
4. **IMPORTANTE - Cambiar rama y directorio:**
   - En la configuración del servicio, busca **"Branch"** o **"Source"**
   - Cambia la rama de `main` a `release/v1.0.0`
   - Configura el **Root Directory** como `backend`
5. En **Variables**, agrega:
   ```
   GEMINI_API_KEY=tu_key
   OPENWEATHER_API_KEY=tu_key
   UNSPLASH_ACCESS_KEY=tu_key
   ENVIRONMENT=production
   ```
5. Railway desplegará automáticamente ✅
6. Copia la URL generada (ej: `https://travelia-backend.railway.app`)
7. **Actualiza `REACT_APP_API_URL` en Vercel** con esta URL

### 3️⃣ ¡Listo! 🎉

Tu app está online:
- Frontend: `https://tu-app.vercel.app`
- Backend: `https://tu-backend.railway.app/docs`

---

---

## 🔄 Sincronizar Nuevos Cambios

Una vez configurado el despliegue inicial, sincronizar cambios es muy simple:

### Proceso Automático (Recomendado)

Tanto **Vercel** como **Railway** detectan automáticamente los cambios cuando haces push a GitHub:

1. **Haz tus cambios localmente** en el código
2. **Commit y push a GitHub:**
   ```bash
   git add .
   git commit -m "Descripción de tus cambios"
   git push origin develop  # o la rama que uses
   ```
3. **¡Listo!** Los despliegues se activan automáticamente:
   - **Vercel** detecta cambios en `frontend/` y despliega el frontend
   - **Railway** detecta cambios en `backend/` y despliega el backend

### Verificar el Despliegue

**En Vercel:**
- Ve a tu proyecto en [vercel.com](https://vercel.com)
- En la pestaña **"Deployments"** verás el nuevo despliegue en progreso
- Espera 2-3 minutos para que termine
- El despliegue más reciente se convierte automáticamente en producción

**En Railway:**
- Ve a tu proyecto en [railway.app](https://railway.app)
- En la pestaña **"Deployments"** verás el nuevo despliegue
- Espera 1-2 minutos para que termine
- Los cambios se aplican automáticamente

### Despliegue Manual (Si es necesario)

Si necesitas forzar un despliegue manual:

**Vercel:**
- Dashboard → Tu proyecto → **"Deployments"** → **"Redeploy"** (botón en el último despliegue)

**Railway:**
- Dashboard → Tu servicio → **"Deployments"** → **"Redeploy"**

### Cambios en Variables de Entorno

Si cambias variables de entorno:

**Vercel:**
- Settings → Environment Variables → Edita y guarda
- Los cambios requieren un nuevo despliegue (se activa automáticamente)

**Railway:**
- Variables → Edita y guarda
- Railway reinicia automáticamente el servicio

### Notas Importantes

- ✅ Los despliegues son **automáticos** cuando haces push a la rama configurada
- ✅ No necesitas hacer nada manual después del push
- ✅ Los logs de despliegue están disponibles en ambos dashboards
- ⚠️ Si cambias la rama de producción, actualiza la configuración en Vercel/Railway

---

## 📚 Guía Completa

Para más detalles, consulta [DEPLOYMENT.md](./DEPLOYMENT.md)

