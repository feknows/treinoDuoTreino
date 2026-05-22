-- Migration: warmup sets/reps agora são preenchidos na execução, não no template
-- Execute no SQL Editor do Supabase

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
