-- Migration: adicionar tabela workout_sessions e session_id em workout_logs
-- Execute no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON workout_sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
