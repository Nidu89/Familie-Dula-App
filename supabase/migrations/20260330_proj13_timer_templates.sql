-- ============================================================
-- PROJ-13: Familien-Timer – timer_templates table
-- Database Migration – 2026-03-30
-- ============================================================

-- ============================================================
-- timer_templates table
-- ============================================================

CREATE TABLE IF NOT EXISTS timer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) <= 50),
  duration_seconds INT NOT NULL CHECK (duration_seconds >= 60 AND duration_seconds <= 3600),
  is_system_default BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE timer_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_timer_templates_family_id ON timer_templates(family_id);
CREATE INDEX IF NOT EXISTS idx_timer_templates_created_by ON timer_templates(created_by);

-- ============================================================
-- RLS Policies
-- ============================================================

-- SELECT: any family member can read their family's templates
CREATE POLICY "timer_templates_select_family"
  ON timer_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = timer_templates.family_id
    )
  );

-- INSERT: only adults/admins can create templates
CREATE POLICY "timer_templates_insert_adult"
  ON timer_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = timer_templates.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- UPDATE: only adults/admins can update templates
CREATE POLICY "timer_templates_update_adult"
  ON timer_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = timer_templates.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = timer_templates.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- DELETE: only adults/admins can delete templates
CREATE POLICY "timer_templates_delete_adult"
  ON timer_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = timer_templates.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- ============================================================
-- DB Trigger: seed 3 default templates when a new family is created
-- ============================================================

CREATE OR REPLACE FUNCTION seed_timer_templates_for_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  -- Find the admin/adult who created this family (first profile linked to it)
  -- Since the family was just created, we use auth.uid() which is the creator
  v_creator_id := auth.uid();

  -- If auth.uid() is NULL (e.g., called from a service role context), fall back
  IF v_creator_id IS NULL THEN
    SELECT id INTO v_creator_id
    FROM profiles
    WHERE family_id = NEW.id
    LIMIT 1;
  END IF;

  -- Only seed if we have a valid creator
  IF v_creator_id IS NOT NULL THEN
    INSERT INTO timer_templates (family_id, name, duration_seconds, is_system_default, created_by)
    VALUES
      (NEW.id, 'Anziehen',      600,  true, v_creator_id),
      (NEW.id, 'Fruehstueck',   900,  true, v_creator_id),
      (NEW.id, 'Hausaufgaben', 1800, true, v_creator_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_timer_templates ON families;
CREATE TRIGGER trg_seed_timer_templates
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION seed_timer_templates_for_family();
