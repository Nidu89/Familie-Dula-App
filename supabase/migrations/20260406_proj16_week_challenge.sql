-- ============================================================
-- PROJ-16: Wochen-Challenge als pinnable Aufgabe
-- Adds week_challenge_task_id to families table
-- and a SECURITY DEFINER RPC to pin/unpin tasks
-- ============================================================

-- 1. Add the week_challenge_task_id column to families
ALTER TABLE families
  ADD COLUMN week_challenge_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- 2. Create a SECURITY DEFINER RPC function for pinning/unpinning
CREATE OR REPLACE FUNCTION pin_week_challenge(p_task_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_profile RECORD;
  v_task_family_id UUID;
BEGIN
  -- Get caller's profile
  SELECT id, family_id, role
  INTO v_caller_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_profile IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_caller_profile.family_id IS NULL THEN
    RAISE EXCEPTION 'Not in a family';
  END IF;

  -- Only adults and admins can pin/unpin
  IF v_caller_profile.role NOT IN ('adult', 'admin') THEN
    RAISE EXCEPTION 'Not authorized: only adults and admins can pin challenges';
  END IF;

  -- If p_task_id is NULL, unpin (set to NULL)
  IF p_task_id IS NULL THEN
    UPDATE families
    SET week_challenge_task_id = NULL
    WHERE id = v_caller_profile.family_id;

    RETURN json_build_object('success', true, 'action', 'unpinned');
  END IF;

  -- Verify the task exists and belongs to the same family
  SELECT family_id INTO v_task_family_id
  FROM tasks
  WHERE id = p_task_id;

  IF v_task_family_id IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task_family_id <> v_caller_profile.family_id THEN
    RAISE EXCEPTION 'Task does not belong to your family';
  END IF;

  -- Pin the task
  UPDATE families
  SET week_challenge_task_id = p_task_id
  WHERE id = v_caller_profile.family_id;

  RETURN json_build_object('success', true, 'action', 'pinned');
END;
$$;
