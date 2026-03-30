-- ============================================================
-- PROJ-6 Expansion: Belohnungssystem – Rewards, Achievements,
-- Family Goals, Task Categories
-- Migration – 2026-03-30
-- ============================================================

-- ============================================================
-- 1. Alter tasks table: add category + completed_at
-- ============================================================

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IN ('haushalt', 'schule', 'freizeit', 'sonstiges'));

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

-- ============================================================
-- 2. family_rewards – reward catalog
-- ============================================================

CREATE TABLE IF NOT EXISTS family_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 50),
  description TEXT CHECK (char_length(description) <= 200),
  icon_emoji TEXT NOT NULL,
  points_cost INT NOT NULL CHECK (points_cost >= 1 AND points_cost <= 9999),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE family_rewards ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_family_rewards_family_id ON family_rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_family_rewards_is_active ON family_rewards(is_active);

-- RLS: SELECT – family members can read their family's rewards
CREATE POLICY "family_rewards_select_family"
  ON family_rewards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_rewards.family_id
    )
  );

-- RLS: INSERT – only adults/admins
CREATE POLICY "family_rewards_insert_adult"
  ON family_rewards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_rewards.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – only adults/admins
CREATE POLICY "family_rewards_update_adult"
  ON family_rewards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_rewards.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_rewards.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- No DELETE policy – rewards are deactivated, not deleted

-- ============================================================
-- 3. reward_redemptions – append-only redemption log
-- ============================================================

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES family_rewards(id),
  redeemed_by UUID NOT NULL REFERENCES profiles(id),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  points_spent INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_family_id ON reward_redemptions(family_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_redeemed_by ON reward_redemptions(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_reward_id ON reward_redemptions(reward_id);

-- RLS: SELECT – family members can read their family's redemptions
CREATE POLICY "reward_redemptions_select_family"
  ON reward_redemptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = reward_redemptions.family_id
    )
  );

-- INSERT is done via SECURITY DEFINER RPC only
-- No UPDATE or DELETE policies – append-only

-- ============================================================
-- 4. achievements – predefined badge definitions (seed data)
-- ============================================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT – everyone authenticated can read
CREATE POLICY "achievements_select_all"
  ON achievements FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- No INSERT/UPDATE/DELETE – admin-seeded only

-- Seed 4 MVP badges
INSERT INTO achievements (slug, title, description, icon, criteria_type, criteria_value)
VALUES
  ('putz-profi', 'Putz-Profi', '10 Aufgaben der Kategorie Haushalt erledigt', 'cleaning', 'task_count_by_category', '{"category":"haushalt","count":10}'::jsonb),
  ('fruehaufsteher', 'Fruehaufsteher', '5 Aufgaben vor 8 Uhr erledigt', 'wb_sunny', 'task_completed_before_hour', '{"hour":8,"count":5}'::jsonb),
  ('teamplayer', 'Teamplayer', '3 Aufgaben in einer Woche erledigt', 'groups', 'tasks_per_week', '{"count":3}'::jsonb),
  ('leseratte', 'Leseratte', '10 Aufgaben der Kategorie Schule erledigt', 'auto_stories', 'task_count_by_category', '{"category":"schule","count":10}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 5. profile_achievements – earned badges
-- ============================================================

CREATE TABLE IF NOT EXISTS profile_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, achievement_id)
);

ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profile_achievements_profile ON profile_achievements(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_achievements_family ON profile_achievements(family_id);

-- RLS: SELECT – family members can read their family's achievements
CREATE POLICY "profile_achievements_select_family"
  ON profile_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = profile_achievements.family_id
    )
  );

-- INSERT is done via SECURITY DEFINER / server actions only
-- No UPDATE/DELETE

-- ============================================================
-- 6. family_goals – family community goals
-- ============================================================

CREATE TABLE IF NOT EXISTS family_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  target_points INT NOT NULL CHECK (target_points >= 100 AND target_points <= 100000),
  collected_points INT NOT NULL DEFAULT 0 CHECK (collected_points >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE family_goals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_family_goals_family_id ON family_goals(family_id);
CREATE INDEX IF NOT EXISTS idx_family_goals_status ON family_goals(status);

-- RLS: SELECT – family members can read
CREATE POLICY "family_goals_select_family"
  ON family_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_goals.family_id
    )
  );

-- RLS: INSERT – only adults/admins
CREATE POLICY "family_goals_insert_adult"
  ON family_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_goals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: UPDATE – only adults/admins
CREATE POLICY "family_goals_update_adult"
  ON family_goals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_goals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = family_goals.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- No DELETE – goals are cancelled or completed, not deleted

-- ============================================================
-- 7. goal_contributions – contribution log
-- ============================================================

CREATE TABLE IF NOT EXISTS goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES family_goals(id) ON DELETE CASCADE,
  contributed_by UUID NOT NULL REFERENCES profiles(id),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE goal_contributions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal_id ON goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_family ON goal_contributions(family_id);
CREATE INDEX IF NOT EXISTS idx_goal_contributions_contributed_by ON goal_contributions(contributed_by);

-- RLS: SELECT – family members can read
CREATE POLICY "goal_contributions_select_family"
  ON goal_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = goal_contributions.family_id
    )
  );

-- INSERT is done via SECURITY DEFINER RPC only
-- No UPDATE/DELETE – append-only

-- ============================================================
-- 8. Alter points_transactions: add reward_id, goal_id,
--    expand type CHECK
-- ============================================================

-- Add new FK columns
ALTER TABLE points_transactions
  ADD COLUMN IF NOT EXISTS reward_id UUID REFERENCES family_rewards(id) ON DELETE SET NULL;

ALTER TABLE points_transactions
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES family_goals(id) ON DELETE SET NULL;

-- Drop old type CHECK constraint and add expanded one
ALTER TABLE points_transactions
  DROP CONSTRAINT IF EXISTS points_transactions_type_check;

ALTER TABLE points_transactions
  ADD CONSTRAINT points_transactions_type_check
    CHECK (type IN ('task_completion', 'manual_add', 'manual_deduct', 'reward_redemption', 'goal_contribution'));

CREATE INDEX IF NOT EXISTS idx_points_transactions_reward ON points_transactions(reward_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_goal ON points_transactions(goal_id);

-- ============================================================
-- 9. RPC: redeem_reward – atomic reward redemption
-- ============================================================

CREATE OR REPLACE FUNCTION redeem_reward(p_reward_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller RECORD;
  v_reward RECORD;
  v_new_balance INT;
BEGIN
  -- Get caller profile
  SELECT id, family_id, role, points_balance
  INTO v_caller
  FROM profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get reward (lock for consistency)
  SELECT id, family_id, title, points_cost, is_active
  INTO v_reward
  FROM family_rewards
  WHERE id = p_reward_id
  FOR UPDATE;

  IF v_reward IS NULL THEN
    RAISE EXCEPTION 'Reward not found';
  END IF;

  -- Verify same family
  IF v_caller.family_id != v_reward.family_id THEN
    RAISE EXCEPTION 'Not authorized – different family';
  END IF;

  -- Verify reward is active
  IF NOT v_reward.is_active THEN
    RAISE EXCEPTION 'Reward is not active';
  END IF;

  -- Check sufficient balance
  IF v_caller.points_balance < v_reward.points_cost THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Deduct points from caller
  UPDATE profiles
  SET points_balance = points_balance - v_reward.points_cost
  WHERE id = v_caller.id
  RETURNING points_balance INTO v_new_balance;

  -- Insert redemption record
  INSERT INTO reward_redemptions (reward_id, redeemed_by, family_id, points_spent)
  VALUES (p_reward_id, v_caller.id, v_caller.family_id, v_reward.points_cost);

  -- Insert points transaction
  INSERT INTO points_transactions (profile_id, family_id, amount, type, reward_id, created_by)
  VALUES (v_caller.id, v_caller.family_id, -v_reward.points_cost, 'reward_redemption', p_reward_id, v_caller.id);

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'reward_title', v_reward.title,
    'points_spent', v_reward.points_cost
  );
END;
$$;

-- ============================================================
-- 10. RPC: contribute_to_goal – atomic goal contribution
-- ============================================================

CREATE OR REPLACE FUNCTION contribute_to_goal(p_goal_id UUID, p_amount INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller RECORD;
  v_goal RECORD;
  v_clamped_amount INT;
  v_new_balance INT;
  v_goal_completed BOOLEAN := false;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Get caller profile (lock for update)
  SELECT id, family_id, role, points_balance
  INTO v_caller
  FROM profiles
  WHERE id = auth.uid()
  FOR UPDATE;

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get goal (lock for update)
  SELECT id, family_id, title, target_points, collected_points, status
  INTO v_goal
  FROM family_goals
  WHERE id = p_goal_id
  FOR UPDATE;

  IF v_goal IS NULL THEN
    RAISE EXCEPTION 'Goal not found';
  END IF;

  -- Verify same family
  IF v_caller.family_id != v_goal.family_id THEN
    RAISE EXCEPTION 'Not authorized – different family';
  END IF;

  -- Verify goal is active
  IF v_goal.status != 'active' THEN
    RAISE EXCEPTION 'Goal is not active';
  END IF;

  -- Clamp amount: min of (requested, caller balance, remaining goal points)
  v_clamped_amount := LEAST(
    p_amount,
    v_caller.points_balance,
    v_goal.target_points - v_goal.collected_points
  );

  IF v_clamped_amount <= 0 THEN
    RAISE EXCEPTION 'No points available to contribute';
  END IF;

  -- Deduct from caller
  UPDATE profiles
  SET points_balance = points_balance - v_clamped_amount
  WHERE id = v_caller.id
  RETURNING points_balance INTO v_new_balance;

  -- Add to goal
  UPDATE family_goals
  SET collected_points = collected_points + v_clamped_amount
  WHERE id = p_goal_id;

  -- Insert contribution record
  INSERT INTO goal_contributions (goal_id, contributed_by, family_id, amount)
  VALUES (p_goal_id, v_caller.id, v_caller.family_id, v_clamped_amount);

  -- Insert points transaction
  INSERT INTO points_transactions (profile_id, family_id, amount, type, goal_id, created_by)
  VALUES (v_caller.id, v_caller.family_id, -v_clamped_amount, 'goal_contribution', p_goal_id, v_caller.id);

  -- Check if goal is now completed
  IF (v_goal.collected_points + v_clamped_amount) >= v_goal.target_points THEN
    UPDATE family_goals
    SET status = 'completed', completed_at = now()
    WHERE id = p_goal_id;

    v_goal_completed := true;
  END IF;

  RETURN jsonb_build_object(
    'new_balance', v_new_balance,
    'amount_contributed', v_clamped_amount,
    'goal_completed', v_goal_completed
  );
END;
$$;

-- ============================================================
-- 11. Update award_task_points to also set completed_at
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

  -- Set status to done and completed_at
  UPDATE tasks
  SET status = 'done', completed_at = now()
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
-- 12. Enable Realtime on new tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE family_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE family_rewards;
