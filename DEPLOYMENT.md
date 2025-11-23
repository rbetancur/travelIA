# 🚀 Guía de Despliegue - TravelIA en Vercel

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Despliegue del Frontend en Vercel](#despliegue-del-frontend-en-vercel)
3. [Despliegue del Backend](#despliegue-del-backend)
4. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
5. [Dominio Personalizado](#dominio-personalizado)
6. [Verificación y Testing](#verificación-y-testing)
7. [Solución de Problemas](#solución-de-problemas)

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta en [Vercel](https://vercel.com) (gratis)
- ✅ Cuenta en [GitHub](https://github.com) (gratis)
- ✅ Tu proyecto subido a un repositorio de GitHub
- ✅ Todas las API keys necesarias (ver `SECRETS.md`)

---

## 🎨 Despliegue del Frontend en Vercel

### Paso 1: Preparar el Repositorio

1. **Asegúrate de que tu código esté en GitHub:**
   ```bash
   git add .
   git commit -m "Preparar para despliegue"
   git push origin main
   ```

### Paso 2: Conectar con Vercel

1. **Ve a [vercel.com](https://vercel.com) y haz login** con tu cuenta de GitHub

2. **Haz clic en "Add New Project"**

3. **Importa tu repositorio:**
   - Selecciona el repositorio `travelIA`
   - Vercel detectará automáticamente que es un proyecto React

4. **Configura el nombre del proyecto:**
   - En el campo **"Private Repository Name"**, cambia `travelIA` a `travelia` (todo minúsculas)
   - ⚠️ **Importante:** Vercel solo permite nombres en minúsculas, números y caracteres `.`, `_`, `-`
   - Si no cambias esto, verás un error: "A Project name can only contain up to 100 lowercase letters..."

5. **Configura el proyecto:**
   - **Framework Preset:** Create React App (detectado automáticamente)
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (automático)
   - **Output Directory:** `build` (automático)
   - **Production Branch:** Cambia de `main` a `release/v1.0.0` (si tus cambios están en una rama release)

> ⚠️ **Importante - Nombre del proyecto:** Vercel requiere que el nombre del proyecto esté en minúsculas. Si ves un error sobre el nombre, cambia `travelIA` a `travelia`.

> ⚠️ **Importante - Rama:** Si tus cambios de despliegue están en una rama `release/v1.0.0` (y no en `main`), asegúrate de cambiar la **Production Branch** a `release/v1.0.0` durante la configuración. Si no lo ves en la configuración inicial, puedes cambiarlo después en **Settings** → **Git** → **Production Branch**.

### Paso 3: Configurar Variables de Entorno

En la sección "Environment Variables", agrega:

```
REACT_APP_API_URL=https://tu-backend-url.railway.app
```

> ⚠️ **Nota:** Reemplaza `tu-backend-url.railway.app` con la URL real de tu backend después de desplegarlo.

### Paso 4: Desplegar

1. Haz clic en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel construye y despliega tu aplicación
3. ¡Listo! Tu frontend estará online en una URL como: `https://travelia-xyz.vercel.app`

---

## 🔧 Despliegue del Backend

Tienes **dos opciones** para desplegar el backend:

### Opción A: Railway (Recomendado - Más Fácil) 🚂

Railway es perfecto para FastAPI y es **gratis** con límites generosos.

#### Paso 1: Crear Cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Haz login con GitHub
3. Haz clic en "New Project"

#### Paso 2: Conectar Repositorio

1. Selecciona "Deploy from GitHub repo"
2. Elige tu repositorio `travelIA`
3. **IMPORTANTE:** Configura:
   - **Branch:** Cambia de `main` a `release/v1.0.0` (si tus cambios están en una rama release)
   - **Root Directory:** `backend`

#### Paso 3: Configurar el Proyecto

Railway detectará automáticamente que es Python. Configura:

- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Python Version:** 3.9 o superior

#### Paso 4: Variables de Entorno en Railway

En la pestaña "Variables", agrega todas las variables de `SECRETS.md`:

```
GEMINI_API_KEY=tu_api_key_aqui
OPENWEATHER_API_KEY=tu_api_key_aqui
UNSPLASH_ACCESS_KEY=tu_api_key_aqui
```

#### Paso 5: Obtener URL del Backend

1. Railway generará una URL automáticamente
2. Copia la URL (ejemplo: `https://travelia-backend.railway.app`)
3. **Actualiza la variable `REACT_APP_API_URL` en Vercel** con esta URL

---

### Opción B: Vercel Serverless Functions (Avanzado)

Si prefieres tener todo en Vercel, puedes convertir el backend a serverless functions.

#### Crear estructura para Vercel:

1. Crea `api/index.py` en la raíz del proyecto
2. Vercel ejecutará cada endpoint como función serverless

> ⚠️ **Nota:** Esta opción requiere más configuración y puede tener limitaciones con archivos grandes o procesos largos.

---

## 🔐 Configuración de Variables de Entorno

### Frontend (Vercel)

En el dashboard de Vercel → Settings → Environment Variables:

```
REACT_APP_API_URL=https://tu-backend.railway.app
```

### Backend (Railway)

En Railway → Variables:

```
GEMINI_API_KEY=tu_gemini_api_key
OPENWEATHER_API_KEY=tu_openweather_api_key
UNSPLASH_ACCESS_KEY=tu_unsplash_access_key
```

---

## 🌐 Dominio Personalizado (Opcional)

### En Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio (ejemplo: `viajeia.com`)
4. Sigue las instrucciones para configurar DNS

### En Railway:

1. Settings → Networking
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones

---

## ✅ Verificación y Testing

### 1. Verificar Frontend

1. Abre la URL de Vercel en tu navegador
2. Verifica que la interfaz carga correctamente
3. Abre la consola del navegador (F12) y verifica que no hay errores

### 2. Verificar Backend

1. Visita: `https://tu-backend.railway.app/docs`
2. Deberías ver la documentación interactiva de FastAPI
3. Prueba un endpoint simple como `/api/destinations/popular`

### 3. Probar la Aplicación Completa

1. En el frontend, intenta hacer una búsqueda de destino
2. Verifica que se conecta correctamente con el backend
3. Prueba todas las funcionalidades principales

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to backend"

**Solución:**
- Verifica que `REACT_APP_API_URL` en Vercel apunta a la URL correcta del backend
- Asegúrate de que el backend esté corriendo en Railway
- Verifica que el backend tenga CORS configurado correctamente

### Error: "CORS policy"

**Solución:**
En `backend/main.py`, verifica que CORS esté configurado así:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, usa tu dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error: "Build failed"

**Solución:**
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel para ver el error específico
- Asegúrate de que el comando `npm run build` funcione localmente

### Error: "API keys not found"

**Solución:**
- Verifica que todas las variables de entorno estén configuradas en Railway
- Asegúrate de que los nombres de las variables coincidan exactamente

---

## 📊 Monitoreo y Logs

### Vercel:
- Ve a tu proyecto → Deployments → selecciona un deployment → Logs

### Railway:
- Ve a tu proyecto → Deployments → selecciona un deployment → View Logs

---

## 🎉 ¡Listo!

Tu aplicación TravelIA ahora está online y accesible desde cualquier lugar del mundo.

**URLs importantes:**
- Frontend: `https://tu-app.vercel.app`
- Backend API: `https://tu-backend.railway.app`
- API Docs: `https://tu-backend.railway.app/docs`

---

## 💡 Próximos Pasos

1. **Configurar dominio personalizado** para una URL más profesional
2. **Configurar monitoreo** con servicios como Sentry
3. **Optimizar rendimiento** con CDN y caching
4. **Configurar CI/CD** para despliegues automáticos

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel y Railway
2. Verifica la configuración de variables de entorno
3. Consulta la documentación oficial:
   - [Vercel Docs](https://vercel.com/docs)
   - [Railway Docs](https://docs.railway.app)

