-- ============================================================
-- PROJ-2: Bug Fixes (BUG-20 through BUG-29)
-- Applied: 2026-03-22
-- ============================================================

-- ============================================================
-- BUG-28 (CRITICAL): Replace join_family with two safer functions
-- ============================================================

-- Drop the old insecure functions
DROP FUNCTION IF EXISTS join_family(UUID, TEXT);
DROP FUNCTION IF EXISTS mark_invitation_used(UUID);

-- 1. join_family_as_creator: hardcodes role='admin', verifies families.created_by
CREATE OR REPLACE FUNCTION join_family_as_creator(target_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller actually created this family
  IF NOT EXISTS (
    SELECT 1 FROM families
    WHERE id = target_family_id
      AND created_by = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not the creator of this family';
  END IF;

  -- Verify caller has no family yet
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND family_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Already in a family';
  END IF;

  UPDATE profiles
  SET family_id = target_family_id,
      role = 'admin'
  WHERE id = auth.uid()
    AND family_id IS NULL;
END;
$$;

-- 2. redeem_invite_code: atomically finds active code, marks used, updates profile
-- Also fixes BUG-23 (race condition) via FOR UPDATE
CREATE OR REPLACE FUNCTION redeem_invite_code(invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_family_id UUID;
BEGIN
  -- Verify caller has no family yet
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND family_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Already in a family';
  END IF;

  -- Atomically find and lock the invitation
  SELECT fi.id, fi.family_id
  INTO v_invitation_id, v_family_id
  FROM family_invitations fi
  WHERE fi.type = 'code'
    AND fi.code = invite_code
    AND fi.used_at IS NULL
    AND fi.expires_at > now()
  FOR UPDATE
  LIMIT 1;

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- Mark invitation as used
  UPDATE family_invitations
  SET used_at = now()
  WHERE id = v_invitation_id;

  -- Update profile: join as adult
  UPDATE profiles
  SET family_id = v_family_id,
      role = 'adult'
  WHERE id = auth.uid()
    AND family_id IS NULL;

  RETURN v_family_id;
END;
$$;

-- ============================================================
-- BUG-22 (HIGH): Email invitation flow - new RPC + RLS
-- ============================================================

-- RPC: join_family_by_email_invitation
-- Looks up pending email invitation for caller's email, marks used, updates profile
CREATE OR REPLACE FUNCTION join_family_by_email_invitation()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_invitation_id UUID;
  v_family_id UUID;
BEGIN
  -- Get caller's email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Verify caller has no family yet
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND family_id IS NOT NULL
  ) THEN
    RETURN NULL;
  END IF;

  -- Atomically find and lock the email invitation
  SELECT fi.id, fi.family_id
  INTO v_invitation_id, v_family_id
  FROM family_invitations fi
  WHERE fi.type = 'email'
    AND fi.email = v_user_email
    AND fi.used_at IS NULL
    AND fi.expires_at > now()
  ORDER BY fi.created_at DESC
  FOR UPDATE
  LIMIT 1;

  IF v_invitation_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Mark invitation as used
  UPDATE family_invitations
  SET used_at = now()
  WHERE id = v_invitation_id;

  -- Update profile: join as adult
  UPDATE profiles
  SET family_id = v_family_id,
      role = 'adult'
  WHERE id = auth.uid()
    AND family_id IS NULL;

  RETURN v_family_id;
END;
$$;

-- RLS: allow users to see their own email invitations
CREATE POLICY "family_invitations_select_own_email"
  ON family_invitations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND type = 'email'
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND used_at IS NULL
    AND expires_at > now()
  );

-- ============================================================
-- BUG-25 (HIGH): Admin profiles UPDATE RLS for member management
-- ============================================================

-- Drop the existing self-only update policy if it exists
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create new policy that allows self-update OR admin updating family members
CREATE POLICY "profiles_update_self_or_admin"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles AS caller
      WHERE caller.id = auth.uid()
        AND caller.family_id = profiles.family_id
        AND caller.role = 'admin'
        AND profiles.family_id IS NOT NULL
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles AS caller
      WHERE caller.id = auth.uid()
        AND caller.family_id = profiles.family_id
        AND caller.role = 'admin'
        AND profiles.family_id IS NOT NULL
    )
  );

-- ============================================================
-- BUG-26 (MEDIUM): invalidate_family_codes lacks authorization
-- ============================================================

CREATE OR REPLACE FUNCTION invalidate_family_codes(target_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin of this family
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND family_id = target_family_id
      AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized to invalidate codes for this family';
  END IF;

  UPDATE family_invitations
  SET expires_at = now()
  WHERE family_id = target_family_id
    AND type = 'code'
    AND used_at IS NULL
    AND expires_at > now();
END;
$$;

-- ============================================================
-- BUG-24 (MEDIUM): Add email column to profiles
-- ============================================================

-- Add email column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill existing profiles
UPDATE profiles SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id
  AND profiles.email IS NULL;

-- Trigger to auto-set email on new profile creation
CREATE OR REPLACE FUNCTION set_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_profile_email ON profiles;
CREATE TRIGGER trg_set_profile_email
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_email();

-- Index on email for invitation lookups
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON family_invitations(email);

-- ============================================================
-- BUG-21 (MEDIUM): DELETE RLS on families for rollback
-- ============================================================

CREATE POLICY "families_delete_creator"
  ON families FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================
-- Done. BUG-20 and BUG-29 are fixed in TypeScript code.
-- BUG-27 (mark_invitation_used) is resolved by dropping the function above.
-- BUG-23 is resolved by redeem_invite_code using FOR UPDATE.
-- ============================================================
