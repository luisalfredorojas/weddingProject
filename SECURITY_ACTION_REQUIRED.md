# 🚨 ACCIÓN URGENTE REQUERIDA - Seguridad

## ⚠️ Service Role Key Comprometida

GitHub detectó que tu **Service Role Key de Supabase** fue expuesta públicamente en el commit anterior.

## 🔒 Pasos para Resolver (URGENTE)

### 1️⃣ Rotar la Service Role Key en Supabase

**IMPORTANTE: Haz esto AHORA mismo**

1. Ve a tu proyecto en Supabase: https://xudghwhnhslfvcskgept.supabase.co
2. Ve a **Settings** → **API**
3. En la sección **Project API keys**, busca **service_role**
4. Haz clic en el ícono de "refrescar" o "regenerate" al lado de la service_role key
5. Confirma la regeneración
6. **Copia la nueva key** y guárdala en un lugar seguro (como 1Password, LastPass, etc.)

### 2️⃣ Actualizar el Admin Dashboard

Después de rotar la key:

1. La próxima vez que accedas a `/admin`, usa la **NUEVA** Service Role Key
2. La key antigua ya no funcionará (y eso es bueno, porque está comprometida)

### 3️⃣ Hacer Push de los Cambios

Ya he removido la key expuesta del archivo `SUPABASE_SETUP.md`. 

Ejecuta estos comandos para subir los cambios:

```bash
git add SUPABASE_SETUP.md
git commit -m "Remove exposed Service Role Key for security"
git push origin main
```

### 4️⃣ Cerrar el Alert de GitHub

1. Ve a GitHub → Tu repositorio → Security → Secret scanning
2. Verifica que pusheaste los cambios
3. Marca la alerta como "resolved" o "revoked"

---

## 🛡️ Mejores Prácticas de Seguridad

### Keys que SÍ pueden estar en GitHub:
✅ **Anon Key** (supabaseAnonKey) - Es segura estar en código público
✅ **Project URL** - Es pública

### Keys que NUNCA deben estar en GitHub:
❌ **Service Role Key** - Acceso total a la base de datos
❌ **Passwords** - Cualquier password o secreto

### ¿Por qué la Anon Key es segura?

La Anon Key está diseñada para ser pública. Solo puede hacer lo que las **Row Level Security (RLS) policies** permitan. En tu caso:

- ✅ INSERT en tabla `rsvps` (formulario público)
- ❌ SELECT (lectura bloqueada para anon)
- ❌ DELETE (bloqueado)
- ❌ UPDATE (bloqueado)

### ¿Por qué la Service Role Key es peligrosa?

La Service Role Key **ignora todas las RLS policies** y tiene acceso completo a:
- Leer todos los datos
- Modificar todos los datos
- Borrar todos los datos
- Crear/modificar tablas

---

## ✅ Checklist de Seguridad

- [ ] Rotar Service Role Key en Supabase
- [ ] Guardar nueva key en gestor de passwords
- [ ] Hacer push con los cambios
- [ ] Resolver alert en GitHub
- [ ] Verificar que admin dashboard funciona con nueva key
- [ ] (Opcional) Cambiar password del admin de 'wedding2026' a algo más seguro

---

## 📚 Para el Futuro

**Archivos que NUNCA deben tener secrets:**
- `*.md` (documentación)
- `*.js` (código frontend)
- `*.json` (configuración)
- Cualquier archivo que se suba a GitHub público

**Dónde SÍ guardar secrets:**
- Variables de entorno (`.env` - no se sube a Git)
- Gestores de passwords (1Password, Bitwarden, etc.)
- Vercel Environment Variables (para producción)
- Tu cabeza/notas locales

---

## 🎯 Resultado Final

Después de seguir estos pasos:
- ✅ Service Role Key antigua invalidada
- ✅ Nueva key segura y no expuesta
- ✅ Documentación actualizada sin secrets
- ✅ GitHub alert resuelto
- ✅ Admin dashboard sigue funcionando (con nueva key)

---

**No te preocupes**: Esto es común cuando se aprende. Lo importante es que:
1. GitHub te alertó rápidamente ✅
2. Vas a rotar la key ✅
3. Ahora sabes qué keys son públicas y cuáles no ✅
