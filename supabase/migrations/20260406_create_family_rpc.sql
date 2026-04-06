-- ============================================================
-- SEC-04: Add create_family_and_join RPC to version control
-- This RPC was created manually in the Supabase Dashboard and
-- is already running in production. This migration captures it
-- so it is tracked in source control.
-- ============================================================

CREATE OR REPLACE FUNCTION create_family_and_join(family_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  new_family_id UUID;
BEGIN
  caller_id := auth.uid();

  -- Verify caller is authenticated
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Verify caller has no family yet
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = caller_id
      AND family_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Already in a family';
  END IF;

  -- Create the new family
  INSERT INTO families (name, created_by)
  VALUES (family_name, caller_id)
  RETURNING id INTO new_family_id;

  -- Join the family as admin
  UPDATE profiles
  SET family_id = new_family_id,
      role = 'admin'
  WHERE id = caller_id
    AND family_id IS NULL;

  RETURN new_family_id;
END;
$$;
