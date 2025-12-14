# 🚀 Guía de Deployment en Vercel

Esta guía te ayudará a desplegar tu sitio de boda en Vercel.

## Prerequisitos

- Cuenta en GitHub (ya tienes el proyecto ahí)
- Cuenta en Vercel (gratuita): https://vercel.com

## Paso 1: Crear Cuenta en Vercel

1. Ve a https://vercel.com/signup
2. Selecciona **Continue with GitHub**
3. Autoriza Vercel para acceder a tu cuenta de GitHub

## Paso 2: Importar tu Proyecto

1. En el dashboard de Vercel, haz clic en **Add New...** → **Project**
2. Busca tu repositorio `weddingProject`
3. Haz clic en **Import**

## Paso 3: Configurar el Proyecto

En la pantalla de configuración:

### Framework Preset
- Selecciona: **Other** (es un sitio estático)

### Build Settings
- **Build Command**: Déjalo vacío (no necesitas build)
- **Output Directory**: Déjalo vacío o usa `./`
- **Install Command**: Déjalo vacío

### Root Directory
- Déjalo en `./` (raíz del proyecto)

## Paso 4: Deploy

1. Haz clic en **Deploy**
2. Vercel comenzará a desplegar tu sitio
3. Espera 30-60 segundos
4. ¡Tu sitio estará en vivo! 🎉

## Paso 5: Obtener tu URL

Después del deployment, verás algo como:

```
https://wedding-project-abc123.vercel.app
```

### Opciones de Dominio:

**Opción A - Usar dominio de Vercel (Gratis)**
- Tu sitio estará en: `https://tu-proyecto.vercel.app`
- Puedes cambiar el nombre del proyecto en Settings

**Opción B - Dominio Custom**
1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio (ejemplo: `luisymaria.com`)
4. Sigue las instrucciones para configurar DNS

## Paso 6: Actualizar Canonical URL

Una vez que tengas tu URL final:

1. Edita `data/site.config.json`
2. Actualiza:
   ```json
   "canonicalUrl": "https://tu-dominio-real.vercel.app"
   ```
3. Haz commit y push:
   ```bash
   git add data/site.config.json
   git commit -m "Update canonical URL"
   git push origin main
   ```
4. Vercel automáticamente re-desplegará

## Funcionalidades Automáticas de Vercel

### ✅ Auto-Deploy
- Cada vez que hagas `git push` a main, Vercel despliega automáticamente
- No necesitas hacer nada manual

### ✅ HTTPS Gratis
- Tu sitio tiene SSL automáticamente
- Seguro y confiable

### ✅ CDN Global
- Tu sitio se sirve desde servidores en todo el mundo
- Carga súper rápida para tus invitados

### ✅ Preview Deployments
- Cada Pull Request en GitHub crea un ambiente de preview
- Puedes probar cambios antes de publicarlos

## URLs Importantes

Después del deployment, tendrás acceso a:

- **Sitio principal**: `https://tu-proyecto.vercel.app/`
- **Admin Dashboard**: `https://tu-proyecto.vercel.app/admin`

⚠️ La URL del admin NO aparecerá en ningún enlace del sitio público. Solo tú sabes que existe.

## Monitoreo

Vercel te da analytics gratis:

1. Ve a tu proyecto en Vercel
2. Haz clic en **Analytics**
3. Verás:
   - Visitantes
   - Page views
   - Países de origen
   - Y más...

## Troubleshooting

### El sitio no carga correctamente
- Verifica los logs en Vercel → Deployments → [tu último deploy] → View Function Logs
- Revisa que todos los archivos estén en el repo

### Admin dashboard no funciona
- Asegúrate de que `admin.html`, `admin.css` y `modules/admin.js` estén en el repo
- Navega directamente a `/admin`

### Formulario RSVP no envía
- Verifica que Supabase esté configurado correctamente (ver `SUPABASE_SETUP.md`)
- Abre la consola del navegador (F12) para ver errores

## Comandos Útiles de Git

```bash
# Ver cambios
git status

# Agregar cambios
git add .

# Commit
git commit -m "Descripción del cambio"

# Push (esto activará auto-deploy)
git push origin main

# Ver últimos commits
git log --oneline -10
```

## Próximos Pasos

1. ✅ Comparte la URL con tus invitados
2. ✅ Prueba el formulario RSVP
3. ✅ Verifica el admin dashboard
4. ✅ (Opcional) Configura dominio custom
5. ✅ Disfruta de tu boda 🎊

---

## 🎉 ¡Felicidades!

Tu sitio de boda ahora está en producción con:
- Hosting profesional en Vercel
- Base de datos en Supabase
- Admin dashboard moderno
- Deploy automático
- SSL/HTTPS gratis
- CDN global

¡Todo listo para recibir confirmaciones de tus invitados!
