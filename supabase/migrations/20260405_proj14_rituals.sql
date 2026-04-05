-- ============================================================
-- PROJ-14: Familien-Rituale – rituals table
-- Database Migration – 2026-04-05
-- ============================================================

-- ============================================================
-- 1. rituals table
-- ============================================================

CREATE TABLE IF NOT EXISTS rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 300),
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  timer_duration_minutes INT CHECK (timer_duration_minutes IS NULL OR (timer_duration_minutes >= 1 AND timer_duration_minutes <= 120)),
  reward_points INT CHECK (reward_points IS NULL OR (reward_points >= 0 AND reward_points <= 100)),
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_rituals_family_id ON rituals(family_id);
CREATE INDEX IF NOT EXISTS idx_rituals_sort_order ON rituals(family_id, sort_order);

-- ============================================================
-- 3. RLS Policies
-- ============================================================

-- SELECT: any family member can read their family's rituals
CREATE POLICY "rituals_select_family"
  ON rituals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = rituals.family_id
    )
  );

-- INSERT: only adults/admins can create rituals
CREATE POLICY "rituals_insert_adult"
  ON rituals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = rituals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- UPDATE: only adults/admins can update rituals
CREATE POLICY "rituals_update_adult"
  ON rituals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = rituals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = rituals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- DELETE: only adults/admins can delete rituals
CREATE POLICY "rituals_delete_adult"
  ON rituals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = rituals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- ============================================================
-- 4. Auto-update updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_rituals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rituals_updated_at ON rituals;
CREATE TRIGGER trg_rituals_updated_at
  BEFORE UPDATE ON rituals
  FOR EACH ROW
  EXECUTE FUNCTION update_rituals_updated_at();

-- ============================================================
-- 5. Seed system templates for NEW families (trigger)
-- ============================================================

CREATE OR REPLACE FUNCTION seed_rituals_for_family()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO rituals (family_id, name, description, steps, timer_duration_minutes, is_system_template, sort_order)
  VALUES
    (
      NEW.id,
      'Morgenroutine',
      'Tägliche Morgenroutine für einen guten Start in den Tag.',
      '[{"id":"m1","title":"Aufstehen & Anziehen","order":0},{"id":"m2","title":"Frühstücken","order":1},{"id":"m3","title":"Zähne putzen","order":2},{"id":"m4","title":"Schulranzen packen","order":3}]'::jsonb,
      30,
      true,
      0
    ),
    (
      NEW.id,
      'Abendroutine',
      'Entspannter Übergang zum Schlafengehen.',
      '[{"id":"a1","title":"Abendessen","order":0},{"id":"a2","title":"Zimmer aufräumen","order":1},{"id":"a3","title":"Zähne putzen","order":2},{"id":"a4","title":"Pyjama anziehen","order":3},{"id":"a5","title":"Geschichte / Lesezeit","order":4}]'::jsonb,
      30,
      true,
      1
    ),
    (
      NEW.id,
      'Hausaufgaben-Routine',
      'Strukturiert durch die Hausaufgaben.',
      '[{"id":"h1","title":"Snack holen & hinsetzen","order":0},{"id":"h2","title":"Hausaufgaben erledigen","order":1},{"id":"h3","title":"Aufräumen & Mappe einpacken","order":2}]'::jsonb,
      45,
      true,
      2
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_seed_rituals ON families;
CREATE TRIGGER trg_seed_rituals
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION seed_rituals_for_family();

-- ============================================================
-- 6. Seed system templates for EXISTING families (one-time)
-- ============================================================

INSERT INTO rituals (family_id, name, description, steps, timer_duration_minutes, is_system_template, sort_order)
SELECT
  f.id,
  v.name,
  v.description,
  v.steps::jsonb,
  v.timer_duration_minutes,
  true,
  v.sort_order
FROM families f
CROSS JOIN (
  VALUES
    (
      'Morgenroutine',
      'Tägliche Morgenroutine für einen guten Start in den Tag.',
      '[{"id":"m1","title":"Aufstehen & Anziehen","order":0},{"id":"m2","title":"Frühstücken","order":1},{"id":"m3","title":"Zähne putzen","order":2},{"id":"m4","title":"Schulranzen packen","order":3}]',
      30,
      0
    ),
    (
      'Abendroutine',
      'Entspannter Übergang zum Schlafengehen.',
      '[{"id":"a1","title":"Abendessen","order":0},{"id":"a2","title":"Zimmer aufräumen","order":1},{"id":"a3","title":"Zähne putzen","order":2},{"id":"a4","title":"Pyjama anziehen","order":3},{"id":"a5","title":"Geschichte / Lesezeit","order":4}]',
      30,
      1
    ),
    (
      'Hausaufgaben-Routine',
      'Strukturiert durch die Hausaufgaben.',
      '[{"id":"h1","title":"Snack holen & hinsetzen","order":0},{"id":"h2","title":"Hausaufgaben erledigen","order":1},{"id":"h3","title":"Aufräumen & Mappe einpacken","order":2}]',
      45,
      2
    )
) AS v(name, description, steps, timer_duration_minutes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM rituals r
  WHERE r.family_id = f.id
    AND r.is_system_template = true
);
