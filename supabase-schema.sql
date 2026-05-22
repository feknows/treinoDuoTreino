-- Execute estas queries no SQL Editor do Supabase (https://supabase.com/dashboard/project/aqgjxbgkxetpvjqtweii/sql/new)

CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  weight_kg NUMERIC(6,2) NOT NULL,
  sets INTEGER NOT NULL CHECK (sets > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON exercises FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON equipment FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON workout_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON workout_logs FOR ALL USING (true) WITH CHECK (true);
