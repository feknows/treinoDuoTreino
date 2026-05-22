-- FIX DEFINITIVO - Execute no SQL Editor do Supabase
-- Concede permissões explícitas e recria as políticas RLS

-- 0. Adicionar colunas que faltam nas tabelas existentes
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_name_key;
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_name_user_id_key;
ALTER TABLE exercises ADD CONSTRAINT exercises_name_user_id_key UNIQUE(name, user_id);

ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_name_key;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_name_user_id_key;
ALTER TABLE equipment ADD CONSTRAINT equipment_name_user_id_key UNIQUE(name, user_id);
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES exercise_categories(id) ON DELETE SET NULL;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS technique TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE equipment ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

ALTER TABLE workout_templates ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE template_exercises ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE session_exercises ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();
ALTER TABLE exercise_categories ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid();

-- 1. Conceder permissões de schema e tabelas para as roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- 2. Remover todas as políticas antigas
DROP POLICY IF EXISTS "own_exercise_categories" ON exercise_categories;
DROP POLICY IF EXISTS "own_exercises" ON exercises;
DROP POLICY IF EXISTS "own_equipment" ON equipment;
DROP POLICY IF EXISTS "own_templates" ON workout_templates;
DROP POLICY IF EXISTS "shared_templates_select" ON workout_templates;
DROP POLICY IF EXISTS "template_shares_owner" ON template_shares;
DROP POLICY IF EXISTS "template_shares_read" ON template_shares;
DROP POLICY IF EXISTS "own_template_exercises" ON template_exercises;
DROP POLICY IF EXISTS "shared_template_exercises_select" ON template_exercises;
DROP POLICY IF EXISTS "own_sessions" ON workout_sessions;
DROP POLICY IF EXISTS "own_session_exercises" ON session_exercises;
DROP POLICY IF EXISTS "read_technique_types" ON technique_types;

-- 3. Recriar políticas (mais simples)
CREATE POLICY "exercises_all" ON exercises
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "equipment_all" ON equipment
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "exercise_categories_all" ON exercise_categories
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "technique_types_read" ON technique_types
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "workout_templates_all" ON workout_templates
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workout_templates_shared" ON workout_templates
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR
    id IN (SELECT template_id FROM template_shares WHERE shared_with_email = auth.email())
  );

CREATE POLICY "template_shares_owner" ON template_shares
  FOR ALL TO authenticated USING (
    auth.uid() IN (SELECT user_id FROM workout_templates WHERE id = template_id)
  ) WITH CHECK (
    auth.uid() IN (SELECT user_id FROM workout_templates WHERE id = template_id)
  );

CREATE POLICY "template_shares_read" ON template_shares
  FOR SELECT TO authenticated USING (
    shared_with_email = auth.email() OR
    auth.uid() IN (SELECT user_id FROM workout_templates WHERE id = template_id)
  );

CREATE POLICY "template_exercises_all" ON template_exercises
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "template_exercises_shared" ON template_exercises
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR
    template_id IN (SELECT template_id FROM template_shares WHERE shared_with_email = auth.email())
  );

CREATE POLICY "workout_sessions_all" ON workout_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_exercises_all" ON session_exercises
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
