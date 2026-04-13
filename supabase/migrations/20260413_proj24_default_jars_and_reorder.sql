-- ============================================================
-- PROJ-24: Default Jars Trigger + Reorder Support
-- ============================================================

-- ============================================================
-- 1) Function: Create 3 default jars when a child joins a family
-- Fires when a profile with role='child' gets a family_id assigned
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_jars_for_child()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when a child gets assigned to a family
  IF NEW.role = 'child'
     AND NEW.family_id IS NOT NULL
     AND (OLD.family_id IS NULL OR OLD.family_id IS DISTINCT FROM NEW.family_id)
  THEN
    INSERT INTO savings_jars (profile_id, family_id, name, jar_type, target_amount, current_amount, sort_order)
    VALUES
      (NEW.id, NEW.family_id, 'Ausgeben', 'spend',  0, 0, 0),
      (NEW.id, NEW.family_id, 'Sparen',   'save',   0, 0, 1),
      (NEW.id, NEW.family_id, 'Verschenken', 'donate', 0, 0, 2);
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on profiles update (child joins family)
DROP TRIGGER IF EXISTS trg_create_default_jars ON profiles;
CREATE TRIGGER trg_create_default_jars
  AFTER UPDATE OF family_id ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_jars_for_child();

-- Also handle case where child is inserted directly with family_id
DROP TRIGGER IF EXISTS trg_create_default_jars_insert ON profiles;
CREATE TRIGGER trg_create_default_jars_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.role = 'child' AND NEW.family_id IS NOT NULL)
  EXECUTE FUNCTION create_default_jars_for_child();

-- ============================================================
-- 2) RPC: Reorder jars for a child
-- Accepts an array of jar IDs in desired order, updates sort_order
-- ============================================================

CREATE OR REPLACE FUNCTION reorder_jars(p_jar_ids UUID[])
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_family_id UUID;
  v_caller_role TEXT;
  v_idx INT;
BEGIN
  -- Get caller's profile
  SELECT family_id, role INTO v_family_id, v_caller_role
  FROM profiles
  WHERE id = v_caller_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Nicht in einer Familie.';
  END IF;

  -- Only adults/admins can reorder
  IF v_caller_role NOT IN ('adult', 'admin') THEN
    RAISE EXCEPTION 'Nur Erwachsene duerfen Toepfe umsortieren.';
  END IF;

  -- Verify all jar IDs belong to caller's family
  IF EXISTS (
    SELECT 1 FROM unnest(p_jar_ids) AS jid
    WHERE NOT EXISTS (
      SELECT 1 FROM savings_jars
      WHERE id = jid AND family_id = v_family_id
    )
  ) THEN
    RAISE EXCEPTION 'Einer oder mehrere Toepfe gehoeren nicht zu deiner Familie.';
  END IF;

  -- Update sort_order based on array position
  FOR v_idx IN 1..array_length(p_jar_ids, 1) LOOP
    UPDATE savings_jars
    SET sort_order = v_idx - 1, updated_at = now()
    WHERE id = p_jar_ids[v_idx];
  END LOOP;
END;
$$;
