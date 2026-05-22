-- Fix: RLS recursion (policy queries table that queries back → infinite loop)
-- Solution: SECURITY DEFINER functions bypass RLS, breaking the cycle
-- Execute no Supabase SQL Editor

-- 1. Helper: check if current user owns a template
CREATE OR REPLACE FUNCTION is_template_owner(tid UUID)
RETURNS BOOLEAN
SECURITY DEFINER STABLE LANGUAGE sql
AS $$
  SELECT EXISTS (SELECT 1 FROM workout_templates WHERE id = tid AND user_id = auth.uid());
$$;

-- 2. Helper: get template IDs shared with a given email
CREATE OR REPLACE FUNCTION get_shared_template_ids(p_email TEXT)
RETURNS SETOF UUID
SECURITY DEFINER STABLE LANGUAGE sql
AS $$
  SELECT template_id FROM template_shares WHERE shared_with_email = p_email;
$$;

-- 3. Recreate workout_templates policy
DROP POLICY IF EXISTS "shared_templates_select" ON workout_templates;
CREATE POLICY "shared_templates_select" ON workout_templates
  FOR SELECT USING (
    auth.uid() = user_id OR
    id IN (SELECT get_shared_template_ids(auth.email()))
  );

-- 4. Recreate template_shares policies
DROP POLICY IF EXISTS "template_shares_owner" ON template_shares;
DROP POLICY IF EXISTS "template_shares_read" ON template_shares;

CREATE POLICY "template_shares_owner" ON template_shares
  FOR ALL USING (is_template_owner(template_id))
  WITH CHECK (is_template_owner(template_id));

CREATE POLICY "template_shares_read" ON template_shares
  FOR SELECT USING (
    shared_with_email = auth.email() OR
    is_template_owner(template_id)
  );

-- 5. Recreate template_exercises shared select policy
DROP POLICY IF EXISTS "shared_template_exercises_select" ON template_exercises;
CREATE POLICY "shared_template_exercises_select" ON template_exercises
  FOR SELECT USING (
    auth.uid() = user_id OR
    template_id IN (SELECT get_shared_template_ids(auth.email()))
  );
