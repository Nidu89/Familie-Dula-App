-- ============================================================
-- PROJ-4: Familienkalender
-- PROJ-5: Aufgaben & To-Dos
-- PROJ-6: Belohnungssystem
-- Database Migration – 2026-03-22
-- ============================================================

-- ============================================================
-- PROJ-6 (partial): Add points_balance to profiles
-- Done first because PROJ-5 references it
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS points_balance INT NOT NULL DEFAULT 0
  CHECK (points_balance >= 0);

-- ============================================================
-- PROJ-4: calendar_events + event_participants
-- ============================================================

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  category TEXT CHECK (category IN ('school', 'work', 'leisure', 'health', 'other')) NOT NULL DEFAULT 'other',
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  is_exception BOOLEAN NOT NULL DEFAULT false,
  reminder_minutes INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_family_id ON calendar_events(family_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_at ON calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurrence_parent ON calendar_events(recurrence_parent_id);

-- RLS: SELECT – family members can read
CREATE POLICY "calendar_events_select_family"
  ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = calendar_events.family_id
    )
  );

-- RLS: INSERT – only adults/admins
CREATE POLICY "calendar_events_insert_adult"
  ON calendar_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = calendar_events.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – only adults/admins
CREATE POLICY "calendar_events_update_adult"
  ON calendar_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = calendar_events.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = calendar_events.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: DELETE – only adults/admins
CREATE POLICY "calendar_events_delete_adult"
  ON calendar_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = calendar_events.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- event_participants
CREATE TABLE IF NOT EXISTS event_participants (
  event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, profile_id)
);

ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_event_participants_profile ON event_participants(profile_id);

-- RLS: SELECT – family members can read participants of their family events
CREATE POLICY "event_participants_select_family"
  ON event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      JOIN profiles p ON p.family_id = ce.family_id
      WHERE ce.id = event_participants.event_id
        AND p.id = auth.uid()
    )
  );

-- RLS: INSERT – adults/admins only
CREATE POLICY "event_participants_insert_adult"
  ON event_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      JOIN profiles p ON p.family_id = ce.family_id
      WHERE ce.id = event_participants.event_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- RLS: DELETE – adults/admins only
CREATE POLICY "event_participants_delete_adult"
  ON event_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events ce
      JOIN profiles p ON p.family_id = ce.family_id
      WHERE ce.id = event_participants.event_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- ============================================================
-- PROJ-5: tasks + subtasks
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'done')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  points INT CHECK (points >= 0),
  points_awarded BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  recurrence_parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  is_exception BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_family_id ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_parent ON tasks(recurrence_parent_id);

-- RLS: SELECT – family members can read
CREATE POLICY "tasks_select_family"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = tasks.family_id
    )
  );

-- RLS: INSERT – only adults/admins
CREATE POLICY "tasks_insert_adult"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = tasks.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – adults/admins can update all fields
CREATE POLICY "tasks_update_adult"
  ON tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = tasks.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = tasks.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – children can only set status to 'done' on their own tasks
-- This is handled via the award_task_points RPC (SECURITY DEFINER) instead,
-- because RLS cannot restrict which columns are updated.
-- Children complete tasks exclusively through completeTaskAction which calls the RPC.

-- RLS: DELETE – only adults/admins
CREATE POLICY "tasks_delete_adult"
  ON tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = tasks.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);

-- RLS: SELECT – family members can read subtasks of their family tasks
CREATE POLICY "subtasks_select_family"
  ON subtasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p ON p.family_id = t.family_id
      WHERE t.id = subtasks.task_id
        AND p.id = auth.uid()
    )
  );

-- RLS: INSERT – adults/admins only
CREATE POLICY "subtasks_insert_adult"
  ON subtasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p ON p.family_id = t.family_id
      WHERE t.id = subtasks.task_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – adults/admins, plus children can toggle is_done on their assigned tasks
CREATE POLICY "subtasks_update_family"
  ON subtasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p ON p.family_id = t.family_id
      WHERE t.id = subtasks.task_id
        AND p.id = auth.uid()
        AND (
          p.role IN ('adult', 'admin')
          OR (p.role = 'child' AND t.assigned_to = auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p ON p.family_id = t.family_id
      WHERE t.id = subtasks.task_id
        AND p.id = auth.uid()
        AND (
          p.role IN ('adult', 'admin')
          OR (p.role = 'child' AND t.assigned_to = auth.uid())
        )
    )
  );

-- RLS: DELETE – adults/admins only
CREATE POLICY "subtasks_delete_adult"
  ON subtasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p ON p.family_id = t.family_id
      WHERE t.id = subtasks.task_id
        AND p.id = auth.uid()
        AND p.role IN ('adult', 'admin')
    )
  );

-- Auto-update updated_at on tasks
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- ============================================================
-- PROJ-6: points_transactions
-- ============================================================

CREATE TABLE IF NOT EXISTS points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('task_completion', 'manual_add', 'manual_deduct')),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  comment TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_points_transactions_profile ON points_transactions(profile_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_family ON points_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);

-- RLS: SELECT – children see own, adults/admins see all in family
CREATE POLICY "points_transactions_select_own_child"
  ON points_transactions FOR SELECT
  USING (
    profile_id = auth.uid()
  );

CREATE POLICY "points_transactions_select_family_adult"
  ON points_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = points_transactions.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: INSERT – adults/admins for manual entries (task_completion via RPC)
CREATE POLICY "points_transactions_insert_adult"
  ON points_transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = points_transactions.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- No UPDATE or DELETE policies – append-only

-- ============================================================
-- PROJ-5/6: award_task_points – atomic DB function
-- Sets tasks.points_awarded=true, inserts points_transaction,
-- updates profiles.points_balance, all in one transaction.
-- SECURITY DEFINER so children can call it.
-- ============================================================

CREATE OR REPLACE FUNCTION award_task_points(p_task_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_caller_profile RECORD;
  v_new_balance INT;
BEGIN
  -- Get caller profile
  SELECT id, family_id, role
  INTO v_caller_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller_profile IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock and get the task
  SELECT t.id, t.family_id, t.assigned_to, t.status, t.points, t.points_awarded
  INTO v_task
  FROM tasks t
  WHERE t.id = p_task_id
  FOR UPDATE;

  IF v_task IS NULL THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  -- Verify caller belongs to the same family
  IF v_caller_profile.family_id != v_task.family_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Children can only complete tasks assigned to them
  IF v_caller_profile.role = 'child' AND v_task.assigned_to != auth.uid() THEN
    RAISE EXCEPTION 'Children can only complete their own assigned tasks';
  END IF;

  -- Set status to done
  UPDATE tasks
  SET status = 'done'
  WHERE id = p_task_id;

  -- Award points if applicable
  IF v_task.points IS NOT NULL
     AND v_task.points > 0
     AND v_task.points_awarded = false
     AND v_task.assigned_to IS NOT NULL THEN

    -- Mark points as awarded
    UPDATE tasks
    SET points_awarded = true
    WHERE id = p_task_id;

    -- Update the assignee's balance
    UPDATE profiles
    SET points_balance = points_balance + v_task.points
    WHERE id = v_task.assigned_to
    RETURNING points_balance INTO v_new_balance;

    -- Insert transaction record
    INSERT INTO points_transactions (profile_id, family_id, amount, type, task_id, created_by)
    VALUES (v_task.assigned_to, v_task.family_id, v_task.points, 'task_completion', p_task_id, auth.uid());

    RETURN jsonb_build_object(
      'status', 'done',
      'points_awarded', true,
      'points', v_task.points,
      'new_balance', v_new_balance
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'done',
    'points_awarded', false
  );
END;
$$;

-- ============================================================
-- PROJ-6: manual_points_booking – atomic DB function
-- For adults/admins to manually add or deduct points.
-- ============================================================

CREATE OR REPLACE FUNCTION manual_points_booking(
  p_profile_id UUID,
  p_amount INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller RECORD;
  v_target RECORD;
  v_type TEXT;
  v_effective_amount INT;
  v_new_balance INT;
BEGIN
  -- Get caller
  SELECT id, family_id, role
  INTO v_caller
  FROM profiles
  WHERE id = auth.uid();

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_caller.role NOT IN ('adult', 'admin') THEN
    RAISE EXCEPTION 'Only adults or admins can book points manually';
  END IF;

  -- Get target profile (lock for update)
  SELECT id, family_id, points_balance
  INTO v_target
  FROM profiles
  WHERE id = p_profile_id
  FOR UPDATE;

  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Target profile not found';
  END IF;

  IF v_caller.family_id != v_target.family_id THEN
    RAISE EXCEPTION 'Not authorized – different family';
  END IF;

  -- Determine type and effective amount
  IF p_amount > 0 THEN
    v_type := 'manual_add';
    v_effective_amount := p_amount;
  ELSIF p_amount < 0 THEN
    v_type := 'manual_deduct';
    -- Clamp: cannot go below 0
    v_effective_amount := GREATEST(p_amount, -v_target.points_balance);
  ELSE
    RAISE EXCEPTION 'Amount must not be zero';
  END IF;

  -- Update balance
  UPDATE profiles
  SET points_balance = points_balance + v_effective_amount
  WHERE id = p_profile_id
  RETURNING points_balance INTO v_new_balance;

  -- Insert transaction
  INSERT INTO points_transactions (profile_id, family_id, amount, type, comment, created_by)
  VALUES (p_profile_id, v_caller.family_id, v_effective_amount, v_type, p_comment, auth.uid());

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'amount_applied', v_effective_amount,
    'type', v_type
  );
END;
$$;

-- ============================================================
-- Enable Realtime on new tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE points_transactions;
