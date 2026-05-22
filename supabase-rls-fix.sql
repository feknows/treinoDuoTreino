-- Fix RLS policies - executar no SQL Editor do Supabase
-- Permite insert com user_id NULL (que receberá DEFAULT auth.uid())

DROP POLICY IF EXISTS "own_exercise_categories" ON exercise_categories;
DROP POLICY IF EXISTS "own_exercises" ON exercises;
DROP POLICY IF EXISTS "own_equipment" ON equipment;
DROP POLICY IF EXISTS "own_templates" ON workout_templates;
DROP POLICY IF EXISTS "own_template_exercises" ON template_exercises;
DROP POLICY IF EXISTS "own_sessions" ON workout_sessions;
DROP POLICY IF EXISTS "own_session_exercises" ON session_exercises;

CREATE POLICY "own_exercise_categories" ON exercise_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

CREATE POLICY "own_exercises" ON exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

CREATE POLICY "own_equipment" ON equipment
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

CREATE POLICY "own_templates" ON workout_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

CREATE POLICY "own_template_exercises" ON template_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

CREATE POLICY "own_sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

CREATE POLICY "own_session_exercises" ON session_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));
