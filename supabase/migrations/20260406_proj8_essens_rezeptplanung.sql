-- ============================================================
-- PROJ-8: Essens- & Rezeptplanung – Database Migration
-- Creates recipes + recipe_ingredients + meal_plan_entries
-- with RLS, Realtime, and Storage bucket for recipe images
-- Date: 2026-04-06
-- ============================================================

-- ============================================================
-- 1. recipes – one row per recipe
-- ============================================================

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_family_id ON recipes(family_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);

-- RLS: SELECT – all family members can read recipes
CREATE POLICY "recipes_select_family"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = recipes.family_id
    )
  );

-- RLS: INSERT – only adults/admins can create recipes
CREATE POLICY "recipes_insert_adult"
  ON recipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = recipes.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – only adults/admins can edit recipes
CREATE POLICY "recipes_update_adult"
  ON recipes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = recipes.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = recipes.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: DELETE – only adults/admins can delete recipes
CREATE POLICY "recipes_delete_adult"
  ON recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = recipes.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- Auto-update updated_at on recipes
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recipes_updated_at ON recipes;
CREATE TRIGGER trg_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipes_updated_at();

-- ============================================================
-- 2. recipe_ingredients – one row per ingredient
-- ============================================================

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- RLS: SELECT – family members can read ingredients of their family recipes
CREATE POLICY "recipe_ingredients_select_family"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN profiles p ON p.family_id = r.family_id
      WHERE r.id = recipe_ingredients.recipe_id
        AND p.id = auth.uid()
    )
  );

-- RLS: INSERT – only adults/admins can add ingredients
CREATE POLICY "recipe_ingredients_insert_adult"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN profiles p ON p.family_id = r.family_id
      WHERE r.id = recipe_ingredients.recipe_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – only adults/admins can update ingredients
CREATE POLICY "recipe_ingredients_update_adult"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN profiles p ON p.family_id = r.family_id
      WHERE r.id = recipe_ingredients.recipe_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN profiles p ON p.family_id = r.family_id
      WHERE r.id = recipe_ingredients.recipe_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- RLS: DELETE – only adults/admins can delete ingredients
CREATE POLICY "recipe_ingredients_delete_adult"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN profiles p ON p.family_id = r.family_id
      WHERE r.id = recipe_ingredients.recipe_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- ============================================================
-- 3. meal_plan_entries – one row per meal slot
-- ============================================================

CREATE TABLE IF NOT EXISTS meal_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,            -- ISO week string, e.g. "2026-W15"
  weekday INTEGER NOT NULL CHECK (weekday >= 0 AND weekday <= 6),  -- 0=Mon, 6=Sun
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,  -- Keep entry when recipe deleted
  free_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One entry per family/week/day/meal combination
  UNIQUE (family_id, week_key, weekday, meal_type)
);

ALTER TABLE meal_plan_entries ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_meal_plan_family_week ON meal_plan_entries(family_id, week_key);
CREATE INDEX IF NOT EXISTS idx_meal_plan_recipe_id ON meal_plan_entries(recipe_id);

-- RLS: SELECT – all family members can read meal plan
CREATE POLICY "meal_plan_select_family"
  ON meal_plan_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = meal_plan_entries.family_id
    )
  );

-- RLS: INSERT – all family members can add meal plan entries
CREATE POLICY "meal_plan_insert_family"
  ON meal_plan_entries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = meal_plan_entries.family_id
    )
  );

-- RLS: UPDATE – all family members can update meal plan entries
CREATE POLICY "meal_plan_update_family"
  ON meal_plan_entries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = meal_plan_entries.family_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = meal_plan_entries.family_id
    )
  );

-- RLS: DELETE – all family members can remove meal plan entries
CREATE POLICY "meal_plan_delete_family"
  ON meal_plan_entries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = meal_plan_entries.family_id
    )
  );

-- ============================================================
-- 4. Enable Realtime on all PROJ-8 tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE recipe_ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plan_entries;

-- ============================================================
-- 5. Storage bucket for recipe images
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Upload – only adults/admins of the family can upload
-- Files are stored as {family_id}/{uuid}.{ext}
CREATE POLICY "recipe_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('adult', 'admin')
        AND (storage.foldername(name))[1] = profiles.family_id::text
    )
  );

-- Storage RLS: Select – all family members can view images
CREATE POLICY "recipe_images_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'recipe-images'
    AND (
      -- Public bucket: anyone can read, but RLS restricts to family
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (storage.foldername(name))[1] = profiles.family_id::text
      )
    )
  );

-- Storage RLS: Delete – only adults/admins can delete images
CREATE POLICY "recipe_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('adult', 'admin')
        AND (storage.foldername(name))[1] = profiles.family_id::text
    )
  );
