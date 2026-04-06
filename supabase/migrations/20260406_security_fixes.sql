-- ============================================================
-- Security fixes: SEC-01, SEC-02, SEC-03
-- 1. Ensure profiles RLS is enabled (idempotent)
-- 2. Prevent role/family_id self-escalation via trigger
-- 3. Harden award_ritual_completion RPC
-- ============================================================

-- SEC-01: Ensure profiles RLS is enabled
-- (This is idempotent — safe to run even if already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SEC-02: Prevent non-admin users from changing their own role or family_id
-- The existing profiles_update_self_or_admin policy allows self-updates on ALL columns.
-- This trigger blocks escalation by preventing non-admins from modifying sensitive columns.
CREATE OR REPLACE FUNCTION prevent_profile_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- Get the caller's current role
  SELECT role INTO v_caller_role
  FROM profiles
  WHERE id = auth.uid();

  -- If the caller is an admin, allow all changes
  IF v_caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot change their own role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Only admins can change roles';
  END IF;

  -- Non-admins cannot change their own family_id
  IF OLD.family_id IS DISTINCT FROM NEW.family_id THEN
    RAISE EXCEPTION 'Only admins can change family membership';
  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists to make idempotent
DROP TRIGGER IF EXISTS trg_prevent_profile_escalation ON profiles;

CREATE TRIGGER trg_prevent_profile_escalation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_profile_escalation();


-- SEC-03: Replace award_ritual_completion with hardened version
-- - Validates that the caller is an adult/admin OR is awarding to themselves
-- - Caps points at 100 (matches ritual max in Zod schema)
-- - Validates that p_child_profile_id has role = 'child'
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

  -- Cap points at 100 (max allowed for rituals)
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

  -- Insert transaction
  INSERT INTO points_transactions (profile_id, family_id, amount, type, comment, created_by)
  VALUES (p_child_profile_id, v_family_id, p_points, 'manual_add', p_ritual_name, auth.uid());

  RETURN json_build_object('new_balance', v_new_balance);
END;
$$;
