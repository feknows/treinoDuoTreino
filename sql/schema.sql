-- Schema completo - execute no SQL Editor do Supabase

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABELAS DE CATÁLOGO
CREATE TABLE IF NOT EXISTS exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES exercise_categories(id) ON DELETE SET NULL,
  technique TEXT,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- 2. TÉCNICAS (fixas, para todos os usuários)
CREATE TABLE IF NOT EXISTS technique_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT
);

INSERT INTO technique_types (name, label, description) VALUES
  ('pump_set', 'Pump Set', 'Apenas 1 série de 15-25 repetições, com intenção de jogar sangue no músculo.'),
  ('loading_set', 'Loading Set', 'Duas repetições com cargas diferentes para carregamento.'),
  ('valid_set', 'Série Válida', '1 única série, ideal 6 repetições.'),
  ('muscle_round', 'Muscle Round', '6 blocos com 4 repetições cada. Os 2 últimos podem ser Drop Sets.')
ON CONFLICT (name) DO NOTHING;

-- 3. MODELOS DE TREINO
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, shared_with_email)
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  technique_type TEXT REFERENCES technique_types(name) ON DELETE SET NULL,
  technique_config JSONB DEFAULT '{}',
  block_type TEXT NOT NULL CHECK (block_type IN ('warmup', 'main')),
  warmup_sets INT,
  warmup_reps INT,
  order_index INT NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SESSÕES DE TREINO REAL
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  notes TEXT,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, user_id)
);

CREATE TABLE IF NOT EXISTS session_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  template_exercise_id UUID REFERENCES template_exercises(id) ON DELETE SET NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  technique_type TEXT REFERENCES technique_types(name) ON DELETE SET NULL,
  technique_data JSONB DEFAULT '{}',
  block_type TEXT NOT NULL CHECK (block_type IN ('warmup', 'main')),
  warmup_data JSONB DEFAULT '{}',
  order_index INT NOT NULL DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE technique_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_exercises ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS
CREATE POLICY "own_exercise_categories" ON exercise_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_exercises" ON exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_equipment" ON equipment
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "read_technique_types" ON technique_types
  FOR SELECT USING (true);

CREATE POLICY "own_templates" ON workout_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shared_templates_select" ON workout_templates
  FOR SELECT USING (
    auth.uid() = user_id OR
    id IN (
      SELECT template_id FROM template_shares
      WHERE shared_with_email = auth.email()
    )
  );

CREATE POLICY "template_shares_owner" ON template_shares
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM workout_templates WHERE id = template_id
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM workout_templates WHERE id = template_id
    )
  );

CREATE POLICY "template_shares_read" ON template_shares
  FOR SELECT USING (
    shared_with_email = auth.email() OR
    auth.uid() IN (
      SELECT user_id FROM workout_templates WHERE id = template_id
    )
  );

CREATE POLICY "own_template_exercises" ON template_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shared_template_exercises_select" ON template_exercises
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM template_shares
      WHERE template_id = template_exercises.template_id
      AND shared_with_email = auth.email()
    )
  );

CREATE POLICY "own_sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own_session_exercises" ON session_exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. FUNÇÃO PARA INICIAR SESSÃO A PARTIR DE MODELO
CREATE OR REPLACE FUNCTION start_session_from_template(
  p_template_id UUID,
  p_date DATE
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  INSERT INTO workout_sessions (date, template_id, user_id)
  VALUES (p_date, p_template_id, v_user_id)
  RETURNING id INTO v_session_id;

  INSERT INTO session_exercises (
    session_id, template_exercise_id, exercise_id, equipment_id,
    technique_type, technique_data, block_type, warmup_data,
    order_index, completed, user_id
  )
  SELECT
    v_session_id, te.id, te.exercise_id, te.equipment_id,
    te.technique_type, te.technique_config, te.block_type,
    '{}'::jsonb,
    te.order_index, FALSE, v_user_id
  FROM template_exercises te
  WHERE te.template_id = p_template_id
  ORDER BY te.order_index;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. LIMPAR TABELAS ANTIGAS (se existirem)
DROP TABLE IF EXISTS workout_logs CASCADE;
