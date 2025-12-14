# 🚀 Configuración de Supabase

Esta guía te mostrará cómo configurar la base de datos en Supabase para tu sitio de boda.

## Paso 1: Crear la Tabla en Supabase

1. Ve a tu proyecto en Supabase: https://xudghwhnhslfvcskgept.supabase.co
2. En el menú lateral, haz clic en **SQL Editor**
3. Copia y pega el contenido completo del archivo `supabase-setup.sql`
4. Haz clic en **Run** para ejecutar el SQL

**O bien, copia este SQL directamente:**

```sql
-- Create the main RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  allergies TEXT,
  attendance TEXT NOT NULL,
  songs TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  
  CONSTRAINT attendance_check CHECK (attendance IN ('yes', 'no'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rsvps_name ON rsvps(name);
CREATE INDEX IF NOT EXISTS idx_rsvps_attendance ON rsvps(attendance);
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON rsvps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public RSVP form)
CREATE POLICY "Allow public insert" ON rsvps
  FOR INSERT 
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to read all records (for admin dashboard)
CREATE POLICY "Allow authenticated read" ON rsvps
  FOR SELECT 
  TO authenticated
  USING (true);

-- Policy to allow service role full access
CREATE POLICY "Allow service role full access" ON rsvps
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);
```

## Paso 2: Verificar la Configuración

### API Keys (Ya configuradas) ✅

Las siguientes keys ya están configuradas en tu proyecto:

- **Project URL**: `https://xudghwhnhslfvcskgept.supabase.co`
- **Anon Key**: Ya configurada en `data/site.config.json`
- **Service Role Key**: Necesaria para el admin dashboard

### Service Role Key (Importante para Admin)

Cuando accedas al dashboard de admin (`/admin.html`), necesitarás:

1. **Password**: `wedding2026` (cambiar en `modules/admin.js` línea 8)
2. **Service Role Key**: Se te pedirá al hacer login
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1ZGdod2huaHNsZnZjc2tnZXB0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTc0MzE1NCwiZXhwIjoyMDgxMzE5MTU0fQ.-LNhe-LUMmKxp_CRiduUEjbLd1r5DgY81LAHvN2wUs8
   ```

⚠️ **IMPORTANTE**: La Service Role Key es SÚPER SENSIBLE. Nunca la compartas públicamente ni la subas a GitHub.

## Paso 3: Probar Localmente

1. Abre `index.html` en tu navegador
2. Completa el formulario RSVP
3. Verifica en Supabase Dashboard → Table Editor → `rsvps` que se creó el registro

## Paso 4: Acceder al Admin Dashboard

1. Navega a `/admin.html` (o `admin` con Vercel)
2. Ingresa password: `wedding2026`
3. Ingresa tu Service Role Key cuando se te pida
4. ¡Deberías ver la lista de confirmaciones!

## Paso 5: Configurar Para Producción

### Cambiar el Password del Admin

Edita `modules/admin.js`, línea 8:

```javascript
const ADMIN_PASSWORD = 'TU_PASSWORD_SEGURO_AQUI';
```

### Actualizar Canonical URL

Cuando tengas tu dominio de Vercel, actualiza en `data/site.config.json`:

```json
"canonicalUrl": "https://tu-sitio.vercel.app"
```

## Verificación de Tabla

Puedes verificar que la tabla se creó correctamente:

1. Ve a **Table Editor** en Supabase
2. Deberías ver la tabla `rsvps` con estas columnas:
   - id
   - created_at
   - name
   - allergies
   - attendance
   - songs
   - submitted_at
   - user_agent

## Troubleshooting

### Error al insertar desde el formulario:
- Verifica que la política "Allow public insert" esté habilitada
- Confirma que el `supabaseAnonKey` en `site.config.json` es correcto

### Error al ver datos en admin:
- Asegúrate de estar usando la Service Role Key correcta
- Verifica que la política "Allow service role full access" esté habilitada

### CORS errors:
- Supabase maneja CORS automáticamente, no debería haber problemas
- Si los hay, verifica en Supabase → Settings → API → CORS configuration

---

## 🎉 ¡Listo!

Tu sistema de RSVPs ahora funciona con Supabase. Ya no dependes de Google Apps Script y tienes un admin dashboard moderno para gestionar las confirmaciones.
