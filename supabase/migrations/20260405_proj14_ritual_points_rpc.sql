-- ============================================================
-- PROJ-14: Ritual completion points RPC
-- Allows any family member to award points on ritual completion
-- (bypasses the adult-only check in manual_points_booking)
-- ============================================================

CREATE OR REPLACE FUNCTION award_ritual_completion(
  p_child_profile_id UUID,
  p_points INT,
  p_ritual_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_id UUID;
  v_caller_family_id UUID;
  v_new_balance INT;
BEGIN
  -- Validate inputs
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;

  -- Get caller's family
  SELECT family_id INTO v_caller_family_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_family_id IS NULL THEN
    RAISE EXCEPTION 'Caller not found';
  END IF;

  -- Get child's family
  SELECT family_id INTO v_family_id
  FROM profiles
  WHERE id = p_child_profile_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Child profile not found';
  END IF;

  -- Verify same family
  IF v_family_id <> v_caller_family_id THEN
    RAISE EXCEPTION 'Not in the same family';
  END IF;

  -- Update balance
  UPDATE profiles
  SET points_balance = COALESCE(points_balance, 0) + p_points
  WHERE id = p_child_profile_id
  RETURNING points_balance INTO v_new_balance;

  -- Insert transaction
  INSERT INTO points_transactions (profile_id, family_id, amount, type, comment, created_by)
  VALUES (p_child_profile_id, v_family_id, p_points, 'manual_add', p_ritual_name, auth.uid());

  RETURN json_build_object('new_balance', v_new_balance);
END;
$$;
