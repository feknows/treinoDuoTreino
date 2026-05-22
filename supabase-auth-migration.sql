-- Migration: adicionar autenticação por usuário
-- Execute no SQL Editor do Supabase

-- Adicionar coluna user_id em todas as tabelas
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Remover políticas antigas (allow all)
DROP POLICY IF EXISTS "allow all" ON exercises;
DROP POLICY IF EXISTS "allow all" ON equipment;
DROP POLICY IF EXISTS "allow all" ON workout_sessions;
DROP POLICY IF EXISTS "allow all" ON workout_logs;

-- Criar novas políticas por usuário
CREATE POLICY "Users can manage own exercises" ON exercises
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own equipment" ON equipment
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own sessions" ON workout_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own logs" ON workout_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
