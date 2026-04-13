-- Fix: Ritual completion points should use 'ritual_completion' type
-- instead of 'manual_add' so they display correctly in the points history.

-- 1. Add 'ritual_completion' to the CHECK constraint on points_transactions.type
ALTER TABLE points_transactions
  DROP CONSTRAINT IF EXISTS points_transactions_type_check;

ALTER TABLE points_transactions
  ADD CONSTRAINT points_transactions_type_check
    CHECK (type IN ('task_completion', 'manual_add', 'manual_deduct', 'reward_redemption', 'goal_contribution', 'ritual_completion'));

-- 2. Update existing ritual completion transactions from 'manual_add' to 'ritual_completion'
UPDATE points_transactions
SET type = 'ritual_completion'
WHERE type = 'manual_add'
  AND comment LIKE 'Ritual abgeschlossen:%';

-- 3. Update the award_ritual_completion() function to use the new type
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
  v_caller_role TEXT;
  v_target_role TEXT;
  v_new_balance INT;
BEGIN
  -- Validate inputs
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive';
  END IF;

  IF p_points > 100 THEN
    RAISE EXCEPTION 'Points exceed maximum allowed (100)';
  END IF;

  -- Get caller's family and role
  SELECT family_id, role INTO v_caller_family_id, v_caller_role
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_family_id IS NULL THEN
    RAISE EXCEPTION 'Caller not found';
  END IF;

  -- Get target's family and role
  SELECT family_id, role INTO v_family_id, v_target_role
  FROM profiles
  WHERE id = p_child_profile_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Child profile not found';
  END IF;

  -- Verify same family
  IF v_family_id <> v_caller_family_id THEN
    RAISE EXCEPTION 'Not in the same family';
  END IF;

  -- Authorization: caller must be adult/admin, OR must be awarding to themselves
  IF v_caller_role NOT IN ('adult', 'admin') AND auth.uid() <> p_child_profile_id THEN
    RAISE EXCEPTION 'Not authorized to award points';
  END IF;

  -- Target must be a child (points are only for children)
  IF v_target_role <> 'child' THEN
    RAISE EXCEPTION 'Points can only be awarded to children';
  END IF;

  -- Update balance
  UPDATE profiles
  SET points_balance = COALESCE(points_balance, 0) + p_points
  WHERE id = p_child_profile_id
  RETURNING points_balance INTO v_new_balance;

  -- Insert transaction with 'ritual_completion' type
  INSERT INTO points_transactions (profile_id, family_id, amount, type, comment, created_by)
  VALUES (p_child_profile_id, v_family_id, p_points, 'ritual_completion', p_ritual_name, auth.uid());

  RETURN json_build_object('new_balance', v_new_balance);
END;
$$;
