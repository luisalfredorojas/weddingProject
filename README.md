# Wedding Website · Setup Guide

Este proyecto contiene un sitio de boda responsivo construido solo con HTML, CSS y JavaScript modernos.

## Estructura
- `public/`: Archivos estáticos listos para hospedar (HTML, CSS, JS, JSON, assets).
- `apps-script/`: Código de Google Apps Script para registrar RSVPs en Google Sheets.

## Requisitos previos
- Navegador moderno (Chrome, Edge, Firefox, Safari).
- Cuenta de Google con acceso a Google Sheets y Apps Script.
- (Opcional) Cuenta de Calendly si se usa el flujo de agenda.

## Configuración local
1. Clona o descarga este repositorio.
2. Abre `public/index.html` directamente en tu navegador o sirve la carpeta `public/` con un servidor estático (`python -m http.server`, `npx serve`, etc.).
3. Actualiza los archivos JSON en `public/data/` con la información de tu evento (ver sección "Personalización").

## Despliegue en hosting estático
1. Sube el contenido de `public/` a tu servicio estático preferido (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3 + CloudFront, etc.).
2. Asegúrate de habilitar HTTPS y de que las rutas relativas se sirvan desde la raíz.
3. Actualiza `canonicalUrl` en `public/data/site.config.json` con la URL pública.

## Configuración de Google Sheets & Apps Script
1. Crea una hoja en Google Sheets y nómbrala como prefieras.
2. Copia el ID de la hoja (parte entre `/d/` y `/edit` en la URL).
3. Abre **Extensiones → Apps Script** en la hoja y pega el contenido de `apps-script/Code.gs`.
4. En Apps Script, abre **Project Settings → Script properties** y define:
   - `SHEET_ID`: ID de tu hoja de cálculo.
   - `ALLOWED_ORIGIN`: URL exacta donde se hospedará el sitio (ej. `https://tu-dominio.com`).
   - `SEND_CALENDLY_EMAIL`: `true` o `false` según quieras enviar email automático al confirmar.
   - `NOTIFY_EMAIL`: Correo desde el cual se enviará y se registrará la confirmación.
   - `CALENDLY_BASE_URL`: URL de tu enlace de Calendly (obligatorio si usas correo).
5. Guarda y despliega como **Web App**:
   - Ejecutar como: **Tú (propietario)**.
   - Quién tiene acceso: **Cualquiera** o **Cualquiera con el enlace**.
6. Copia el URL de despliegue e introdúcelo en `appsScriptEndpoint` dentro de `public/data/site.config.json`.
7. (Opcional) Actualiza el enlace `calendlyBaseUrl` en `site.config.json`; se usa para el botón de Calendly y para el email.
8. Realiza un envío de prueba desde el formulario. Verifica que la fila se agregue en Sheets y que el correo se envíe (si está habilitado).

## Personalización rápida
- **Texto e idiomas**: Edita `public/data/strings.json`. Cada clave tiene traducción en español e inglés.
- **Contenido de modales**: Modifica `public/data/content.json` (HTML permitido dentro de los valores `body`).
- **Invitados**: Agrega o elimina nombres en `public/data/invitees.json`.
- **Configuración general**: Ajusta `public/data/site.config.json` (título, fecha ISO, URLs, endpoints, Calendly, redes sociales).
- **Estilos**: Cambia variables en `public/styles.css` (`:root`).
- **Medios**: Reemplaza los archivos en `public/assets/` con imágenes y videos optimizados (mismos nombres o actualiza las rutas en `index.html`).

## Flujo offline y reintentos
- Si el usuario envía el RSVP sin conexión, la solicitud se almacena en `localStorage` y se reintenta automáticamente cuando regrese la conectividad o la pestaña recupere foco.

## Pruebas recomendadas
- Envía respuestas tanto confirmando asistencia como rechazándola.
- Desconecta tu red y envía un RSVP para validar la cola offline.
- Cambia de idioma con el switch ES/EN y verifica textos.
- Verifica la navegación por teclado y lector de pantalla.

## Calendly (opcional)
- Si `sendCalendlyEmail` es `true`, Apps Script enviará un correo con el enlace de Calendly cuando la respuesta sea "Sí".
- Si prefieres no enviar correo automático, establece `sendCalendlyEmail` en `false`. El sitio mostrará un botón inline que abre el widget de Calendly usando `calendlyBaseUrl`.

## Mantenimiento
- Revisa periódicamente los registros en Google Apps Script (**Execution log**) para detectar errores.
- Vacía la cola de RSVP guardada si cambias el endpoint (limpia el almacenamiento local del navegador).
- Optimiza y comprime imágenes/videos antes de subirlos para mantener un rendimiento alto.
