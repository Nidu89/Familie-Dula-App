-- ============================================================
-- Active Ritual Sessions — persists which ritual is running
-- per family so all members (including children) can see it.
-- ============================================================

CREATE TABLE IF NOT EXISTS active_ritual_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
  started_by UUID NOT NULL REFERENCES profiles(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_step_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('running', 'paused', 'completed')) DEFAULT 'running',
  UNIQUE(family_id)  -- only one active session per family
);

ALTER TABLE active_ritual_sessions ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX IF NOT EXISTS idx_active_ritual_sessions_family ON active_ritual_sessions(family_id);

-- RLS: any family member can read
CREATE POLICY "active_ritual_sessions_select_family"
  ON active_ritual_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = active_ritual_sessions.family_id
    )
  );

-- RLS: only adults/admins can insert
CREATE POLICY "active_ritual_sessions_insert_adult"
  ON active_ritual_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = active_ritual_sessions.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- RLS: any family member can update (children can toggle steps)
CREATE POLICY "active_ritual_sessions_update_family"
  ON active_ritual_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = active_ritual_sessions.family_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = active_ritual_sessions.family_id
    )
  );

-- RLS: only adults/admins can delete (cancel/complete)
CREATE POLICY "active_ritual_sessions_delete_adult"
  ON active_ritual_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = active_ritual_sessions.family_id
        AND profiles.role IN ('adult', 'admin')
    )
  );

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE active_ritual_sessions;
