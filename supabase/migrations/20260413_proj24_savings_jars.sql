-- ============================================================
-- PROJ-24: Virtuelle Taschengeld-Toepfe (Savings Jars)
-- Database Migration
-- ============================================================

-- ============================================================
-- savings_jars table
-- ============================================================

CREATE TABLE IF NOT EXISTS savings_jars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  jar_type TEXT NOT NULL CHECK (jar_type IN ('spend', 'save', 'donate', 'custom')),
  target_amount INT NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  current_amount INT NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE savings_jars ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_savings_jars_profile_id ON savings_jars(profile_id);
CREATE INDEX IF NOT EXISTS idx_savings_jars_family_id ON savings_jars(family_id);
CREATE INDEX IF NOT EXISTS idx_savings_jars_profile_family ON savings_jars(profile_id, family_id);

-- RLS: SELECT – family members can see jars
CREATE POLICY "savings_jars_select_family"
  ON savings_jars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = savings_jars.family_id
    )
  );

-- RLS: INSERT – only adults/admins can create jars
CREATE POLICY "savings_jars_insert_adult"
  ON savings_jars FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = savings_jars.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – adults/admins can update any jar in family, children can update own jars (for allocation)
CREATE POLICY "savings_jars_update_family"
  ON savings_jars FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = savings_jars.family_id
        AND (profiles.role IN ('adult', 'admin') OR savings_jars.profile_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = savings_jars.family_id
        AND (profiles.role IN ('adult', 'admin') OR savings_jars.profile_id = auth.uid())
    )
  );

-- RLS: DELETE – only adults/admins can delete jars
CREATE POLICY "savings_jars_delete_adult"
  ON savings_jars FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = savings_jars.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- ============================================================
-- jar_transactions table
-- ============================================================

CREATE TABLE IF NOT EXISTS jar_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jar_id UUID NOT NULL REFERENCES savings_jars(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('task', 'manual', 'refund')),
  source_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE jar_transactions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jar_transactions_jar_id ON jar_transactions(jar_id);
CREATE INDEX IF NOT EXISTS idx_jar_transactions_created_at ON jar_transactions(created_at);

-- RLS: SELECT – family members can see jar transactions
CREATE POLICY "jar_transactions_select_family"
  ON jar_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM savings_jars
      JOIN profiles ON profiles.family_id = savings_jars.family_id
      WHERE savings_jars.id = jar_transactions.jar_id
        AND profiles.id = auth.uid()
    )
  );

-- RLS: INSERT – family members can insert transactions (children allocate to own jars, adults to any)
CREATE POLICY "jar_transactions_insert_family"
  ON jar_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM savings_jars
      JOIN profiles ON profiles.family_id = savings_jars.family_id
      WHERE savings_jars.id = jar_transactions.jar_id
        AND profiles.id = auth.uid()
        AND (profiles.role IN ('adult', 'admin') OR savings_jars.profile_id = auth.uid())
    )
  );
