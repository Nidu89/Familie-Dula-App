-- ============================================================
-- PROJ-24 Fix: Atomic jar allocation + goal notifications
-- Fixes: B2 (source_type), B3 (source_id), B4 (notifications), B5 (race condition)
-- ============================================================

CREATE OR REPLACE FUNCTION allocate_points_to_jars(
  p_allocations JSONB,   -- array of {jarId, amount}
  p_source_type TEXT DEFAULT 'manual',  -- 'task' or 'manual'
  p_source_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_family_id UUID;
  v_caller_role TEXT;
  v_jar_owner UUID;
  v_points_balance INT;
  v_total_in_jars INT;
  v_unallocated INT;
  v_total_allocating INT := 0;
  v_alloc JSONB;
  v_jar_id UUID;
  v_amount INT;
  v_current_amount INT;
  v_target_amount INT;
  v_new_amount INT;
  v_jar_name TEXT;
  v_results JSONB := '[]'::jsonb;
BEGIN
  -- Validate source_type
  IF p_source_type NOT IN ('task', 'manual', 'refund') THEN
    RAISE EXCEPTION 'Ungueltiger Quelltyp.';
  END IF;

  -- Get caller profile
  SELECT family_id, role INTO v_family_id, v_caller_role
  FROM profiles WHERE id = v_caller_id;

  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Du gehoerst keiner Familie an.';
  END IF;

  -- Calculate total being allocated
  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    v_amount := (v_alloc->>'amount')::int;
    IF v_amount > 0 THEN
      v_total_allocating := v_total_allocating + v_amount;
    END IF;
  END LOOP;

  IF v_total_allocating = 0 THEN
    RAISE EXCEPTION 'Keine Punkte zum Verteilen.';
  END IF;

  -- Get the jar owner from first allocation and lock jars
  v_jar_id := (p_allocations->0->>'jarId')::uuid;
  SELECT profile_id INTO v_jar_owner FROM savings_jars WHERE id = v_jar_id AND family_id = v_family_id;

  IF v_jar_owner IS NULL THEN
    RAISE EXCEPTION 'Topf nicht gefunden.';
  END IF;

  -- Auth check: children can only allocate to own jars
  IF v_caller_role NOT IN ('adult', 'admin') AND v_jar_owner != v_caller_id THEN
    RAISE EXCEPTION 'Du kannst nur in deine eigenen Toepfe einzahlen.';
  END IF;

  -- Lock the owner's balance row to prevent concurrent allocation
  SELECT points_balance INTO v_points_balance
  FROM profiles WHERE id = v_jar_owner FOR UPDATE;

  -- Lock all jars for this child to calculate total
  SELECT COALESCE(SUM(current_amount), 0) INTO v_total_in_jars
  FROM savings_jars WHERE profile_id = v_jar_owner AND family_id = v_family_id FOR UPDATE;

  v_unallocated := GREATEST(0, v_points_balance - v_total_in_jars);

  IF v_total_allocating > v_unallocated THEN
    RAISE EXCEPTION 'Nicht genuegend unverteilte Punkte (% verfuegbar, % angefragt).', v_unallocated, v_total_allocating;
  END IF;

  -- Perform each allocation
  FOR v_alloc IN SELECT * FROM jsonb_array_elements(p_allocations) LOOP
    v_jar_id := (v_alloc->>'jarId')::uuid;
    v_amount := (v_alloc->>'amount')::int;

    IF v_amount <= 0 THEN CONTINUE; END IF;

    -- Verify jar belongs to family and get current state
    SELECT current_amount, target_amount, name
    INTO v_current_amount, v_target_amount, v_jar_name
    FROM savings_jars
    WHERE id = v_jar_id AND family_id = v_family_id;

    IF v_current_amount IS NULL THEN CONTINUE; END IF;

    v_new_amount := v_current_amount + v_amount;

    -- Update jar
    UPDATE savings_jars
    SET current_amount = v_new_amount, updated_at = now()
    WHERE id = v_jar_id;

    -- Create transaction log with correct source_type and source_id
    INSERT INTO jar_transactions (jar_id, amount, source_type, source_id)
    VALUES (v_jar_id, v_amount, p_source_type, p_source_id);

    -- Check if jar just reached its goal → create notification
    IF v_target_amount > 0
       AND v_current_amount < v_target_amount
       AND v_new_amount >= v_target_amount
    THEN
      INSERT INTO notifications (profile_id, family_id, type, title, body)
      VALUES (
        v_jar_owner,
        v_family_id,
        'reward',
        'Ziel erreicht!',
        format('Dein Topf "%s" hat das Ziel von %s Punkten erreicht!', v_jar_name, v_target_amount)
      );
    END IF;

    v_results := v_results || jsonb_build_object(
      'jarId', v_jar_id,
      'amount', v_amount,
      'newAmount', v_new_amount
    );
  END LOOP;

  RETURN v_results;
END;
$$;
