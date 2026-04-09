-- ============================================================
-- PROJ-12: Kalender-Integrationen – Tables & RLS
-- ============================================================
-- Stores calendar provider connections (Google, iCloud) per user
-- and imported external events visible only to the owning user.
-- Credentials encrypted with AES-256-GCM at the application layer.
-- ============================================================

-- 1. calendar_integrations — one row per provider connection per user
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'icloud')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'disconnected')),
  credentials_encrypted TEXT NOT NULL,        -- AES-256-GCM encrypted JSON (tokens / passwords)
  selected_calendars JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of {id, name} objects
  sync_interval_minutes INT NOT NULL DEFAULT 30 CHECK (sync_interval_minutes BETWEEN 15 AND 60),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)  -- one connection per provider per user
);

-- Indexes
CREATE INDEX idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_family ON calendar_integrations(family_id);
CREATE INDEX idx_calendar_integrations_status ON calendar_integrations(status) WHERE status = 'active';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_calendar_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calendar_integrations_updated_at
  BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_calendar_integrations_updated_at();

-- RLS: each user manages only their own integrations
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integrations"
  ON calendar_integrations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own integrations"
  ON calendar_integrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations"
  ON calendar_integrations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own integrations"
  ON calendar_integrations FOR DELETE
  USING (user_id = auth.uid());

-- 2. external_calendar_events — imported events from providers
CREATE TABLE IF NOT EXISTS external_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,           -- provider's event ID (for dedup)
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT false,
  calendar_name TEXT,                        -- e.g. "Work", "Personal"
  provider TEXT NOT NULL CHECK (provider IN ('google', 'icloud')),
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (integration_id, external_event_id)  -- prevent duplicate imports
);

-- Indexes
CREATE INDEX idx_external_events_integration ON external_calendar_events(integration_id);
CREATE INDEX idx_external_events_user ON external_calendar_events(user_id);
CREATE INDEX idx_external_events_family ON external_calendar_events(family_id);
CREATE INDEX idx_external_events_start ON external_calendar_events(start_at);
CREATE INDEX idx_external_events_range ON external_calendar_events(family_id, start_at, end_at);

-- RLS: users see only their own external events, but family members can also view
-- (external events show in the shared family calendar)
ALTER TABLE external_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view external events"
  ON external_calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = external_calendar_events.family_id
    )
  );

CREATE POLICY "Users can insert own external events"
  ON external_calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own external events"
  ON external_calendar_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own external events"
  ON external_calendar_events FOR DELETE
  USING (user_id = auth.uid());

-- Enable realtime for external events (calendar view updates)
ALTER PUBLICATION supabase_realtime ADD TABLE external_calendar_events;
