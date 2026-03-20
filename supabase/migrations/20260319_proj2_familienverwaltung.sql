-- ============================================================
-- PROJ-2: Familienverwaltung – Database Migration
-- Creates families table, extends profiles, creates family_invitations
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

-- 2. Extend profiles table with family_id and role
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES families(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'adult', 'child'));

-- Index on profiles.family_id for join queries
CREATE INDEX IF NOT EXISTS idx_profiles_family_id ON profiles(family_id);

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

-- 4. Security-definer function to mark an invitation as used
-- This bypasses RLS so non-members can redeem an invite code
CREATE OR REPLACE FUNCTION mark_invitation_used(invitation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE family_invitations
  SET used_at = now()
  WHERE id = invitation_id
    AND used_at IS NULL;
END;
$$;

-- 5. Security-definer function to join a family (update profile)
-- Needed because the user is not yet a member when joining, so RLS on profiles
-- would block them from updating their own family_id
CREATE OR REPLACE FUNCTION join_family(target_family_id UUID, target_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET family_id = target_family_id,
      role = target_role
  WHERE user_id = auth.uid()
    AND family_id IS NULL;
END;
$$;

-- 6. Security-definer function to invalidate old codes for a family
CREATE OR REPLACE FUNCTION invalidate_family_codes(target_family_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE family_invitations
  SET expires_at = now()
  WHERE family_id = target_family_id
    AND type = 'code'
    AND used_at IS NULL
    AND expires_at > now();
END;
$$;
