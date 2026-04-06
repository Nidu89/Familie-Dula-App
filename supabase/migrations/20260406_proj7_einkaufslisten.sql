-- ============================================================
-- PROJ-7: Einkaufslisten – Database Migration
-- Creates shopping_lists + shopping_items tables with RLS
-- Date: 2026-04-06
-- ============================================================

-- ============================================================
-- 1. shopping_lists – one row per shopping list
-- ============================================================

CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_lists_family_id ON shopping_lists(family_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_updated_at ON shopping_lists(updated_at);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_by ON shopping_lists(created_by);

-- RLS: SELECT – all family members can read lists
CREATE POLICY "shopping_lists_select_family"
  ON shopping_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = shopping_lists.family_id
    )
  );

-- RLS: INSERT – all family members can create lists
CREATE POLICY "shopping_lists_insert_family"
  ON shopping_lists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = shopping_lists.family_id
    )
  );

-- RLS: UPDATE – all family members can update list name / updated_at
CREATE POLICY "shopping_lists_update_family"
  ON shopping_lists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = shopping_lists.family_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = shopping_lists.family_id
    )
  );

-- RLS: DELETE – only adults/admins can delete entire lists
CREATE POLICY "shopping_lists_delete_adult"
  ON shopping_lists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = shopping_lists.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- Auto-update updated_at on shopping_lists
CREATE OR REPLACE FUNCTION update_shopping_lists_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER trg_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_shopping_lists_updated_at();

-- ============================================================
-- 2. shopping_items – one row per item in a shopping list
-- ============================================================

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  category TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_is_done ON shopping_items(is_done);
CREATE INDEX IF NOT EXISTS idx_shopping_items_created_by ON shopping_items(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);

-- RLS: SELECT – family members can read items of their family lists
CREATE POLICY "shopping_items_select_family"
  ON shopping_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN profiles p ON p.family_id = sl.family_id
      WHERE sl.id = shopping_items.list_id
        AND p.id = auth.uid()
    )
  );

-- RLS: INSERT – all family members can add items
CREATE POLICY "shopping_items_insert_family"
  ON shopping_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN profiles p ON p.family_id = sl.family_id
      WHERE sl.id = shopping_items.list_id
        AND p.id = auth.uid()
    )
  );

-- RLS: UPDATE – all family members can toggle items (check/uncheck)
CREATE POLICY "shopping_items_update_family"
  ON shopping_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN profiles p ON p.family_id = sl.family_id
      WHERE sl.id = shopping_items.list_id
        AND p.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN profiles p ON p.family_id = sl.family_id
      WHERE sl.id = shopping_items.list_id
        AND p.id = auth.uid()
    )
  );

-- RLS: DELETE – all family members can remove items
CREATE POLICY "shopping_items_delete_family"
  ON shopping_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN profiles p ON p.family_id = sl.family_id
      WHERE sl.id = shopping_items.list_id
        AND p.id = auth.uid()
    )
  );

-- ============================================================
-- 3. Enable Realtime on shopping tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_items;
