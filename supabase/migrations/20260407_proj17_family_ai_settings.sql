-- ============================================================
-- PROJ-17: KI-Assistent – Database Migration
-- Creates family_ai_settings table with RLS
-- Date: 2026-04-07
-- ============================================================

-- ============================================================
-- 1. family_ai_settings – one row per family (1:1 with families)
-- Stores the encrypted Anthropic API key.
-- ============================================================

CREATE TABLE IF NOT EXISTS family_ai_settings (
  family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  api_key_encrypted TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES profiles(id)
);

ALTER TABLE family_ai_settings ENABLE ROW LEVEL SECURITY;

-- Index on updated_by for fast lookups
CREATE INDEX IF NOT EXISTS idx_family_ai_settings_updated_by
  ON family_ai_settings(updated_by);

-- RLS: SELECT – only admins of the family can read the encrypted key
CREATE POLICY "family_ai_settings_select_admin"
  ON family_ai_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_ai_settings.family_id
        AND profiles.role IN ('admin')
    )
  );

-- RLS: INSERT – only admins can set the API key
CREATE POLICY "family_ai_settings_insert_admin"
  ON family_ai_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_ai_settings.family_id
        AND profiles.role IN ('admin')
    )
  );

-- RLS: UPDATE – only admins can update the API key
CREATE POLICY "family_ai_settings_update_admin"
  ON family_ai_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_ai_settings.family_id
        AND profiles.role IN ('admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_ai_settings.family_id
        AND profiles.role IN ('admin')
    )
  );

-- RLS: DELETE – only admins can delete the API key
CREATE POLICY "family_ai_settings_delete_admin"
  ON family_ai_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_ai_settings.family_id
        AND profiles.role IN ('admin')
    )
  );

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_family_ai_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_family_ai_settings_updated_at ON family_ai_settings;
CREATE TRIGGER trg_family_ai_settings_updated_at
  BEFORE UPDATE ON family_ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_family_ai_settings_updated_at();

-- ============================================================
-- 2. SECURITY DEFINER function to read the encrypted API key
-- for any authenticated family member (not just admins).
-- The RLS on family_ai_settings restricts direct access to admins,
-- but the assistant chat route needs to read the key for all members.
-- This function verifies the caller belongs to the family.
-- ============================================================

CREATE OR REPLACE FUNCTION get_family_ai_key(p_family_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key TEXT;
  v_caller_family_id UUID;
BEGIN
  -- Verify the caller belongs to this family
  SELECT family_id INTO v_caller_family_id
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_family_id IS NULL OR v_caller_family_id != p_family_id THEN
    RAISE EXCEPTION 'Not authorized: caller does not belong to this family';
  END IF;

  SELECT api_key_encrypted INTO v_key
  FROM family_ai_settings
  WHERE family_id = p_family_id;

  RETURN v_key;
END;
$$;
