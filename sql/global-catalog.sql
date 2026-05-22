-- Tornar catálogo de exercícios e equipamentos global
-- Execute no SQL Editor do Supabase

-- 1. Remover constraints UNIQUE antigas que incluíam user_id
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_name_user_id_key;
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_name_key;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_name_user_id_key;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_name_key;

-- 2. Adicionar UNIQUE só no nome (global)
ALTER TABLE exercises ADD CONSTRAINT exercises_name_unique UNIQUE(name);
ALTER TABLE equipment ADD CONSTRAINT equipment_name_unique UNIQUE(name);

-- 3. Remover políticas antigas de exercises/equipment
DROP POLICY IF EXISTS "exercises_all" ON exercises;
DROP POLICY IF EXISTS "equipment_all" ON equipment;
DROP POLICY IF EXISTS "own_exercise_categories" ON exercise_categories;
DROP POLICY IF EXISTS "own_exercises" ON exercises;
DROP POLICY IF EXISTS "own_equipment" ON equipment;

-- 4. Novas políticas globais
CREATE POLICY "exercises_select" ON exercises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "exercises_insert" ON exercises
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "exercises_update" ON exercises
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "exercises_delete" ON exercises
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "equipment_select" ON equipment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "equipment_insert" ON equipment
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "equipment_update" ON equipment
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "equipment_delete" ON equipment
  FOR DELETE TO authenticated USING (user_id = auth.uid());
