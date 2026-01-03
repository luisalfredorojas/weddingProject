-- ========================================
-- Política RLS para lectura pública de nombres confirmados
-- ========================================
-- 
-- Propósito: Permitir que el formulario RSVP público filtre invitados
-- que ya confirmaron, evitando que aparezcan en el autocomplete.
--
-- IMPORTANTE: Esta política permite leer la columna 'name' de la tabla
-- rsvps usando la anon key (pública). Ejecutar en Supabase SQL Editor.
-- ========================================

-- Verificar que RLS esté habilitado (ya debería estarlo)
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir lectura pública solo de la columna 'name'
-- Nota: Supabase RLS no permite restringir a nivel de columna directamente,
-- por lo que esta política permite leer todos los campos pero el cliente
-- solo solicita 'name' en el SELECT.

-- Si ya existe una política de lectura pública, esta puede entrar en conflicto
-- Verifica primero con: SELECT * FROM pg_policies WHERE tablename = 'rsvps';

-- Opción 1: Política simple (permite leer toda la tabla con anon key)
CREATE POLICY "Allow public read for confirmed names" ON rsvps
  FOR SELECT 
  TO anon
  USING (true);

-- ========================================
-- Opción 2 (MÁS SEGURA): Usar una vista
-- ========================================
-- Si prefieres más seguridad y solo exponer nombres:

-- 1. Crear vista con solo nombres únicos
CREATE OR REPLACE VIEW public.confirmed_names AS
  SELECT DISTINCT name FROM rsvps;

-- 2. Dar acceso de lectura solo a la vista
GRANT SELECT ON confirmed_names TO anon;

-- Luego modificar modules/supabase.js para usar:
-- const response = await fetch(`${supabaseUrl}/rest/v1/confirmed_names`...

-- ========================================
-- Notas de Seguridad
-- ========================================
-- 
-- Opción 1: Expone todos los campos de rsvps (nombre, alergias, canciones, etc.)
-- pero el cliente solo pide 'name'. Sin embargo, alguien técnico podría
-- hacer un request manual y ver otros campos.
--
-- Opción 2: Solo expone nombres, más seguro. Requiere actualizar el fetch
-- en supabase.js para apuntar a /confirmed_names en vez de /rsvps?select=name
--
-- Recomendación: Usar Opción 2 (vista) si la privacidad es importante.
-- ========================================
