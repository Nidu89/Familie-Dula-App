-- ============================================================
-- PROJ-10: Benachrichtigungen – Database Migration
-- Creates notifications + notification_preferences tables
-- with RLS, triggers for calendar/task/chat events
-- Date: 2026-04-07
-- ============================================================

-- ============================================================
-- 1. notifications table
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('calendar_assigned', 'task_assigned', 'task_due', 'chat_message')),
  title TEXT NOT NULL,
  body TEXT,
  reference_id UUID,
  reference_type TEXT CHECK (reference_type IN ('calendar_event', 'task', 'chat_channel')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, reference_id, type)
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id) WHERE is_read = false;

-- RLS: SELECT – users read only their own
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

-- RLS: UPDATE – users update only their own (mark read)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS: DELETE – users delete only their own
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- No INSERT policy: only SECURITY DEFINER triggers insert notifications

-- ============================================================
-- 2. notification_preferences table
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('calendar_assigned', 'task_assigned', 'task_due', 'chat_message')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, notification_type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON notification_preferences(user_id);

-- RLS: SELECT – users read own
CREATE POLICY "notification_preferences_select_own"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

-- RLS: INSERT – users insert own
CREATE POLICY "notification_preferences_insert_own"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS: UPDATE – users update own
CREATE POLICY "notification_preferences_update_own"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 3. Trigger: notify on calendar event participant assignment
-- ============================================================

CREATE OR REPLACE FUNCTION notify_calendar_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event RECORD;
  v_pref_enabled BOOLEAN;
BEGIN
  -- Get event details
  SELECT title, created_by INTO v_event
  FROM calendar_events
  WHERE id = NEW.event_id;

  IF v_event IS NULL OR NEW.profile_id = v_event.created_by THEN
    RETURN NEW;
  END IF;

  -- Check preference (default: enabled)
  SELECT enabled INTO v_pref_enabled
  FROM notification_preferences
  WHERE user_id = NEW.profile_id
    AND notification_type = 'calendar_assigned';

  IF v_pref_enabled IS NOT NULL AND v_pref_enabled = false THEN
    RETURN NEW;
  END IF;

  -- Upsert notification
  INSERT INTO notifications (user_id, type, title, reference_id, reference_type)
  VALUES (
    NEW.profile_id,
    'calendar_assigned',
    v_event.title,
    NEW.event_id,
    'calendar_event'
  )
  ON CONFLICT (user_id, reference_id, type)
  DO UPDATE SET
    title = EXCLUDED.title,
    is_read = false,
    created_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_calendar_assigned ON event_participants;
CREATE TRIGGER trg_notify_calendar_assigned
  AFTER INSERT ON event_participants
  FOR EACH ROW
  EXECUTE FUNCTION notify_calendar_assigned();

-- ============================================================
-- 4. Trigger: notify on task assignment
-- ============================================================

CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pref_enabled BOOLEAN;
BEGIN
  -- Only if assigned_to is set and not self-assigned
  IF NEW.assigned_to IS NULL OR NEW.assigned_to = NEW.created_by THEN
    RETURN NEW;
  END IF;

  -- On UPDATE, only if assigned_to actually changed
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT DISTINCT FROM NEW.assigned_to THEN
    RETURN NEW;
  END IF;

  -- Check preference (default: enabled)
  SELECT enabled INTO v_pref_enabled
  FROM notification_preferences
  WHERE user_id = NEW.assigned_to
    AND notification_type = 'task_assigned';

  IF v_pref_enabled IS NOT NULL AND v_pref_enabled = false THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, type, title, reference_id, reference_type)
  VALUES (
    NEW.assigned_to,
    'task_assigned',
    NEW.title,
    NEW.id,
    'task'
  )
  ON CONFLICT (user_id, reference_id, type)
  DO UPDATE SET
    title = EXCLUDED.title,
    is_read = false,
    created_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_task_assigned ON tasks;
CREATE TRIGGER trg_notify_task_assigned
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- ============================================================
-- 5. Trigger: notify on new chat message
-- ============================================================

CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member RECORD;
  v_sender_name TEXT;
  v_pref_enabled BOOLEAN;
BEGIN
  -- Get sender name
  SELECT display_name INTO v_sender_name
  FROM profiles
  WHERE id = NEW.sender_id;

  -- Notify all channel members except sender
  FOR v_member IN
    SELECT user_id FROM chat_channel_members
    WHERE channel_id = NEW.channel_id
      AND user_id != NEW.sender_id
  LOOP
    -- Check preference (default: enabled)
    SELECT enabled INTO v_pref_enabled
    FROM notification_preferences
    WHERE user_id = v_member.user_id
      AND notification_type = 'chat_message';

    IF v_pref_enabled IS NOT NULL AND v_pref_enabled = false THEN
      CONTINUE;
    END IF;

    -- Upsert: one notification per channel per user
    INSERT INTO notifications (user_id, type, title, body, reference_id, reference_type)
    VALUES (
      v_member.user_id,
      'chat_message',
      COALESCE(v_sender_name, 'Unknown'),
      LEFT(NEW.content, 100),
      NEW.channel_id,
      'chat_channel'
    )
    ON CONFLICT (user_id, reference_id, type)
    DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      is_read = false,
      created_at = now();
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_chat_message ON chat_messages;
CREATE TRIGGER trg_notify_chat_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chat_message();

-- ============================================================
-- 6. Helper: create task_due notifications (called by server action)
-- ============================================================

CREATE OR REPLACE FUNCTION create_task_due_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_pref_enabled BOOLEAN;
BEGIN
  FOR v_task IN
    SELECT id, assigned_to, title
    FROM tasks
    WHERE due_date = CURRENT_DATE
      AND status != 'done'
      AND assigned_to IS NOT NULL
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

-- ============================================================
-- 7. Helper: cleanup notifications older than 30 days
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;

-- ============================================================
-- 8. Enable Realtime on notifications
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
