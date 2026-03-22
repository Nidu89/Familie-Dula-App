-- ============================================================
-- PROJ-2: Familienverwaltung – Database Migration
-- Creates families table, extends profiles, creates family_invitations
-- Updated: 2026-03-22 (reflects bug fixes from 20260322_proj2_bug_fixes.sql)
-- ============================================================

-- 1. Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on families
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Families RLS: SELECT – members of the family can read
CREATE POLICY "families_select_members"
  ON families FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.family_id = families.id
        AND profiles.id = auth.uid()
    )
  );

-- Families RLS: UPDATE – only admins can update
CREATE POLICY "families_update_admin"
  ON families FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.family_id = families.id
        AND profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.family_id = families.id
        AND profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Families RLS: INSERT – any authenticated user can create a family
CREATE POLICY "families_insert_authenticated"
  ON families FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Families RLS: DELETE – creator can delete (for rollback on failed creation)
CREATE POLICY "families_delete_creator"
  ON families FOR DELETE
  USING (created_by = auth.uid());

-- 2. Extend profiles table with family_id, role, and email
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'adult', 'child')),
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Index on profiles.family_id for join queries
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);

-- Backfill email from auth.users
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

-- Profiles RLS: UPDATE – self or admin of same family
-- (Replaces any prior self-only update policy)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

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

-- 3. Create family_invitations table
CREATE TABLE IF NOT EXISTS family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('email', 'code')) NOT NULL,
  email TEXT,
  code TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on family_invitations
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;

-- Indexes on family_invitations
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id ON family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_invitations_code ON family_invitations(code);
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON family_invitations(email);

-- family_invitations RLS: SELECT – admins of the family can read their invitations
CREATE POLICY "family_invitations_select_admin"
  ON family_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.family_id = family_invitations.family_id
        AND profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- family_invitations RLS: INSERT – admins of the family can create invitations
CREATE POLICY "family_invitations_insert_admin"
  ON family_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.family_id = family_invitations.family_id
        AND profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- family_invitations RLS: SELECT for code lookup – any authenticated user can look up
-- an active code (needed for joinFamilyByCode before they are a member)
CREATE POLICY "family_invitations_select_active_code"
  ON family_invitations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND type = 'code'
    AND used_at IS NULL
    AND expires_at > now()
  );

-- family_invitations RLS: SELECT for own email invitations
CREATE POLICY "family_invitations_select_own_email"
  ON family_invitations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND type = 'email'
    AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND used_at IS NULL
    AND expires_at > now()
  );

-- 4. Security-definer function: join as family creator (hardcodes admin role)
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

-- 5. Security-definer function: redeem invite code atomically
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

-- 6. Security-definer function: join family by email invitation
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
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND family_id IS NOT NULL
  ) THEN
    RETURN NULL;
  END IF;

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

  UPDATE family_invitations
  SET used_at = now()
  WHERE id = v_invitation_id;

  UPDATE profiles
  SET family_id = v_family_id,
      role = 'adult'
  WHERE id = auth.uid()
    AND family_id IS NULL;

  RETURN v_family_id;
END;
$$;

-- 7. Security-definer function to invalidate old codes for a family (with auth check)
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
