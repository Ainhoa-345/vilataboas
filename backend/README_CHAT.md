Guía rápida: configurar y probar el chatbot con Gemini (Generative AI)

Resumen rápido
1. Crear una clave (API key) para Google Generative AI (Gemini) en Google Cloud.
2. Copiar `backend/.env.example` → `backend/.env` y añadir `GEMINI_API_KEY=...`.
3. Instalar dependencias y arrancar el backend.
4. Probar el endpoint `/api/chat/message` y ajustar el frontend si hace falta.

Pasos detallados

1) Obtener la API key de Gemini
- Entra en Google Cloud Console:
  - Habilita la API correspondiente a Generative AI (Generative Models / Vertex AI según la consola).
  - Ve a "Credentials" → "Create credentials" → "API key".
  - Copia la API key.

2) Guardar la clave en tu entorno (local)
- Desde la carpeta `backend/`:
  - Copia el ejemplo:
    ```bash
    cd /home/a22ainhoavt/vilataboas/backend
    cp .env.example .env
    ```
  - Edita `.env` y pega la clave:
    ```text
    GEMINI_API_KEY=TU_API_KEY_AQUI
    ```
  - (Opcional) añade `RESEND_API_KEY` si quieres que el backend envíe correos.

3) Instalar dependencias (si no lo has hecho)

```bash
cd /home/a22ainhoavt/vilataboas/backend
npm install
```

4) Arrancar el backend
- Usando el script que está en `package.json`:

```bash
cd /home/a22ainhoavt/vilataboas/backend
npm run start
# o (arranque con la env in-line)
GEMINI_API_KEY="TU_API_KEY_AQUI" npm run start
```

Salida esperada
- En la consola verás que el servidor Express se ha arrancado:
  "Server Express está corriendo en el puerto: 5000"
- Si la inicialización de Gemini falla verás una advertencia como:
  "No se pudo inicializar Gemini AI: <mensaje>"

5) Probar el endpoint manualmente (curl)

```bash
curl -s -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Hola, ¿cómo estás?","history": []}' | jq
```
- Respuesta esperada cuando funciona: `{ "success": true, "response": "<texto del asistente>" }`
- Si no hay `GEMINI_API_KEY` configurada, el backend devolverá un `fallback` con texto predefinido.

6) Asegurar frontend (ChatWidget)
- El frontend llama a `${API_BASE}/api/chat/message` usando `VITE_API_BASE`.
- Si usas dev local, crea `frontend/.env` o `frontend/.env.local` con:

```
VITE_API_BASE=http://localhost:5000
```
- Reinicia el servidor dev del frontend:

```bash
cd /home/a22ainhoavt/vilataboas/frontend
npm install
npm run dev
```

7) Depuración rápida (si hay errores)
- Revisa la salida del backend (la terminal donde ejecutaste `npm run start`) para errores como:
  - Errores de inicialización del cliente de Google: clave inválida o permisos insuficientes.
  - Errores de facturación: habilita billing en Google Cloud.
  - Errores CORS: `server.js` ya permite `http://localhost:5173`; si tu frontend está en otro host, ajusta las opciones de CORS.
- Comprueba la petición que envía el frontend (herramientas devtools → Red) y la respuesta JSON.
- Si ves `"success": false` con `details` en la respuesta, copia el `details` para diagnosticar más.

8) Mensajes frecuentes y soluciones
- "No se pudo inicializar Gemini AI": revisa la clave, que la API esté habilitada y el paquete `@google/generative-ai` esté instalado.
- "El bot responde con fallback": significa que `process.env.GEMINI_API_KEY` no estaba definida al arrancar el servidor.
- "CORS blocked": ajusta `app.use(cors(...))` en `backend/server/server.js` para incluir la origen del frontend.

Siguientes pasos (opcional)
- Para producción: usar Service Account y credenciales seguras, no usar API keys públicas. Considera rotación de claves y almacenamiento en un gestor de secretos.
- Mejorar: enviar el historial (history) desde el frontend para conversaciones contextuales.

Si quieres, hago ahora una de estas acciones por ti:
- 1) Crear `backend/.env` con placeholders (no la clave real) y dejar listo para que pegues la clave.
- 2) Ejecutar pasos de instalación/arranque aquí (no puedo ejecutar comandos con tus credenciales, pero te doy los comandos exactos).
- 3) Revisar logs si pegas aquí la salida del servidor tras arrancarlo.

Dime cuál prefieres y te lo hago o te guío en el siguiente comando que ejecutes.