-- ============================================================
-- PROJ-10: Fix BUG-P10-1 — Scope RPCs to calling user
-- RPCs now only operate on the caller's own data via auth.uid()
-- ============================================================

-- Scoped: only create task_due notifications for the CALLING user
CREATE OR REPLACE FUNCTION create_task_due_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_pref_enabled BOOLEAN;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  FOR v_task IN
    SELECT id, assigned_to, title
    FROM tasks
    WHERE due_date = CURRENT_DATE
      AND status != 'done'
      AND assigned_to = v_user_id
  LOOP
    SELECT enabled INTO v_pref_enabled
    FROM notification_preferences
    WHERE user_id = v_task.assigned_to
      AND notification_type = 'task_due';

    IF v_pref_enabled IS NOT NULL AND v_pref_enabled = false THEN
      CONTINUE;
    END IF;

    INSERT INTO notifications (user_id, type, title, reference_id, reference_type)
    VALUES (
      v_task.assigned_to,
      'task_due',
      v_task.title,
      v_task.id,
      'task'
    )
    ON CONFLICT (user_id, reference_id, type)
    DO UPDATE SET
      is_read = false,
      created_at = now();
  END LOOP;
END;
$$;

-- Scoped: only cleanup the CALLING user's old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  DELETE FROM notifications
  WHERE user_id = v_user_id
    AND created_at < now() - INTERVAL '30 days';
END;
$$;
