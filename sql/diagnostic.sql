-- Diagnóstico: verificar exercícios e permissões

-- 1. Quantos exercícios existem?
SELECT 'exercises' as tabela, count(*) as registros FROM exercises
UNION ALL
SELECT 'equipment', count(*) FROM equipment;

-- 2. Quantos têm user_id nulo?
SELECT 'exercises_sem_user' as descricao, count(*) FROM exercises WHERE user_id IS NULL
UNION ALL
SELECT 'equipment_sem_user', count(*) FROM equipment WHERE user_id IS NULL;

-- 3. Conceder permissões novamente
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;

-- 4. Vincular registros sem user_id ao primeiro usuário
UPDATE exercises SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;
UPDATE equipment SET user_id = (SELECT id FROM auth.users LIMIT 1) WHERE user_id IS NULL;

-- 5. Recriar políticas para garantir
DROP POLICY IF EXISTS "exercises_select" ON exercises;
DROP POLICY IF EXISTS "exercises_insert" ON exercises;
DROP POLICY IF EXISTS "exercises_update" ON exercises;
DROP POLICY IF EXISTS "exercises_delete" ON exercises;
DROP POLICY IF EXISTS "equipment_select" ON equipment;
DROP POLICY IF EXISTS "equipment_insert" ON equipment;
DROP POLICY IF EXISTS "equipment_update" ON equipment;
DROP POLICY IF EXISTS "equipment_delete" ON equipment;

CREATE POLICY "exercises_select" ON exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercises_insert" ON exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "exercises_update" ON exercises FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "exercises_delete" ON exercises FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "equipment_select" ON equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipment_insert" ON equipment FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equipment_update" ON equipment FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "equipment_delete" ON equipment FOR DELETE TO authenticated USING (user_id = auth.uid());
