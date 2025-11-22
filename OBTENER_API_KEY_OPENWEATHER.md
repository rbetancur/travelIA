# 🔑 Cómo Obtener una API Key Válida de OpenWeatherMap

## ⚠️ Problema Actual

Tu API key actual (`cc21e5de64f21a487c2af69fb373a4e0`) no es válida o no está activada.

## 📋 Pasos para Obtener una Nueva API Key

### 1. Ve al sitio de OpenWeatherMap

Abre tu navegador y ve a:
**https://openweathermap.org/api**

### 2. Regístrate o Inicia Sesión

- Si no tienes cuenta: Haz clic en **"Sign Up"** (arriba a la derecha)
- Si ya tienes cuenta: Haz clic en **"Sign In"**

### 3. Completa el Registro (si es nuevo)

- **Username**: Elige un nombre de usuario
- **Email**: Tu correo electrónico (IMPORTANTE: debe ser válido)
- **Password**: Crea una contraseña segura
- Acepta los términos y condiciones
- Haz clic en **"Create Account"**

### 4. Confirma tu Email

- **Revisa tu correo electrónico** (también revisa spam)
- Busca el email de OpenWeatherMap
- **Haz clic en el enlace de confirmación**
- Esto es CRÍTICO: sin confirmar el email, la API key no funcionará

### 5. Obtén tu API Key

1. Ve a: **https://home.openweathermap.org/api_keys**
2. Verás una API key llamada **"Default"** o similar
3. **Copia la API key completa** (debería tener 32 caracteres)
   - Ejemplo: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### 6. Configura la API Key

**Opción A: Temporal (solo esta sesión)**
```bash
export OPENWEATHER_API_KEY=tu_nueva_api_key_aqui
```

**Opción B: Permanente (recomendado)**

**Linux/Mac (zsh):**
```bash
# Agregar a .zshrc
echo 'export OPENWEATHER_API_KEY=tu_nueva_api_key_aqui' >> ~/.zshrc

# Para la sesión actual (evita error de compdef)
export OPENWEATHER_API_KEY=tu_nueva_api_key_aqui

# O simplemente abre una nueva terminal
```

**Linux/Mac (bash):**
```bash
echo 'export OPENWEATHER_API_KEY=tu_nueva_api_key_aqui' >> ~/.bashrc
source ~/.bashrc
```

**Windows (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('OPENWEATHER_API_KEY', 'tu_nueva_api_key_aqui', 'User')
```

### 7. Valida la API Key

Usa el script de validación:

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python3 test_openweather.py
```

O prueba manualmente con curl:

```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=TU_NUEVA_API_KEY&units=metric"
```

Si funciona, deberías ver datos JSON con información del clima de Londres.

## ⏰ Tiempo de Activación

**IMPORTANTE**: Después de confirmar tu email, la API key puede tardar **hasta 2 horas** en activarse completamente.

Si acabas de confirmar el email:
1. Espera unos minutos
2. Prueba la API key con el script de validación
3. Si sigue sin funcionar, espera hasta 2 horas

## ✅ Verificación Exitosa

Cuando la API key sea válida, verás:

```
✅ API key VÁLIDA y FUNCIONANDO
   Ciudad de prueba: London
   Temperatura: 15.5°C
```

## 🔒 Seguridad

**NUNCA** compartas tu API key públicamente. Si la expusiste:
1. Ve a https://home.openweathermap.org/api_keys
2. Elimina la API key expuesta
3. Genera una nueva
4. Configúrala de nuevo

## 🆘 Problemas Comunes

### "Invalid API key" después de confirmar email
- **Solución**: Espera hasta 2 horas. La activación no es instantánea.

### No recibí el email de confirmación
- **Solución**: 
  - Revisa la carpeta de spam
  - Verifica que el email esté correcto
  - Solicita un nuevo email de confirmación desde el sitio

### La API key tiene menos de 32 caracteres
- **Solución**: Asegúrate de copiar la API key completa. Debería tener exactamente 32 caracteres.

### "429 Too Many Requests"
- **Solución**: Has excedido el límite de solicitudes. Espera unos minutos.

## 📞 Más Ayuda

- Documentación oficial: https://openweathermap.org/api
- FAQ: https://openweathermap.org/faq
- Panel de API Keys: https://home.openweathermap.org/api_keys

