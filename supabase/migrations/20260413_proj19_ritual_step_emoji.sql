-- ============================================================
-- PROJ-19: Kindergerechte Ritual-Schritte
-- Add emoji field to ritual steps JSONB
-- ============================================================

-- The steps column is already JSONB, so no ALTER TABLE needed.
-- This migration adds emoji values to existing system template steps
-- so they display nicely out of the box.

-- Update Morgenroutine template steps with emojis
UPDATE rituals
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN step->>'id' = 'm1' THEN step || '{"emoji": "\uD83D\uDECF\uFE0F"}'::jsonb
      WHEN step->>'id' = 'm2' THEN step || '{"emoji": "\uD83C\uDF73"}'::jsonb
      WHEN step->>'id' = 'm3' THEN step || '{"emoji": "\uD83E\uDDB7"}'::jsonb
      WHEN step->>'id' = 'm4' THEN step || '{"emoji": "\uD83C\uDF92"}'::jsonb
      ELSE step || '{"emoji": "\u2B50"}'::jsonb
    END
    ORDER BY (step->>'order')::int
  )
  FROM jsonb_array_elements(steps) AS step
)
WHERE is_system_template = true
  AND name = 'Morgenroutine';

-- Update Abendroutine template steps with emojis
UPDATE rituals
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN step->>'id' = 'a1' THEN step || '{"emoji": "\uD83C\uDF7D\uFE0F"}'::jsonb
      WHEN step->>'id' = 'a2' THEN step || '{"emoji": "\uD83E\uDDF9"}'::jsonb
      WHEN step->>'id' = 'a3' THEN step || '{"emoji": "\uD83E\uDDB7"}'::jsonb
      WHEN step->>'id' = 'a4' THEN step || '{"emoji": "\uD83D\uDC55"}'::jsonb
      WHEN step->>'id' = 'a5' THEN step || '{"emoji": "\uD83D\uDCDA"}'::jsonb
      ELSE step || '{"emoji": "\u2B50"}'::jsonb
    END
    ORDER BY (step->>'order')::int
  )
  FROM jsonb_array_elements(steps) AS step
)
WHERE is_system_template = true
  AND name = 'Abendroutine';

-- Update Hausaufgaben-Routine template steps with emojis
UPDATE rituals
SET steps = (
  SELECT jsonb_agg(
    CASE
      WHEN step->>'id' = 'h1' THEN step || '{"emoji": "\uD83C\uDF4E"}'::jsonb
      WHEN step->>'id' = 'h2' THEN step || '{"emoji": "\u270F\uFE0F"}'::jsonb
      WHEN step->>'id' = 'h3' THEN step || '{"emoji": "\uD83C\uDF92"}'::jsonb
      ELSE step || '{"emoji": "\u2B50"}'::jsonb
    END
    ORDER BY (step->>'order')::int
  )
  FROM jsonb_array_elements(steps) AS step
)
WHERE is_system_template = true
  AND name = 'Hausaufgaben-Routine';

-- Also update the trigger function so new families get templates with emojis
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
      E'T\u00e4gliche Morgenroutine f\u00fcr einen guten Start in den Tag.',
      '[{"id":"m1","title":"Aufstehen & Anziehen","order":0,"emoji":"\uD83D\uDECF\uFE0F"},{"id":"m2","title":"Fr\u00fchst\u00fccken","order":1,"emoji":"\uD83C\uDF73"},{"id":"m3","title":"Z\u00e4hne putzen","order":2,"emoji":"\uD83E\uDDB7"},{"id":"m4","title":"Schulranzen packen","order":3,"emoji":"\uD83C\uDF92"}]'::jsonb,
      30,
      true,
      0
    ),
    (
      NEW.id,
      'Abendroutine',
      E'Entspannter \u00dcbergang zum Schlafengehen.',
      '[{"id":"a1","title":"Abendessen","order":0,"emoji":"\uD83C\uDF7D\uFE0F"},{"id":"a2","title":"Zimmer aufr\u00e4umen","order":1,"emoji":"\uD83E\uDDF9"},{"id":"a3","title":"Z\u00e4hne putzen","order":2,"emoji":"\uD83E\uDDB7"},{"id":"a4","title":"Pyjama anziehen","order":3,"emoji":"\uD83D\uDC55"},{"id":"a5","title":"Geschichte / Lesezeit","order":4,"emoji":"\uD83D\uDCDA"}]'::jsonb,
      30,
      true,
      1
    ),
    (
      NEW.id,
      'Hausaufgaben-Routine',
      'Strukturiert durch die Hausaufgaben.',
      '[{"id":"h1","title":"Snack holen & hinsetzen","order":0,"emoji":"\uD83C\uDF4E"},{"id":"h2","title":"Hausaufgaben erledigen","order":1,"emoji":"\u270F\uFE0F"},{"id":"h3","title":"Aufr\u00e4umen & Mappe einpacken","order":2,"emoji":"\uD83C\uDF92"}]'::jsonb,
      45,
      true,
      2
    );

  RETURN NEW;
END;
$$;
