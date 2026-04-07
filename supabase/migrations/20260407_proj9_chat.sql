-- ============================================================
-- PROJ-9: Chat & Kommunikation – Database Migration
-- Creates chat_channels, chat_channel_members, chat_messages,
-- chat_read_receipts tables with RLS + triggers
-- Date: 2026-04-07
-- ============================================================

-- ============================================================
-- 1. chat_channels – one row per channel (family or DM)
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('family', 'direct')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_channels_family_id ON chat_channels(family_id);
CREATE INDEX IF NOT EXISTS idx_chat_channels_type ON chat_channels(family_id, type);

-- RLS: SELECT – family members can read channels of their family
CREATE POLICY "chat_channels_select_family"
  ON chat_channels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = chat_channels.family_id
    )
  );

-- RLS: INSERT – family members can create channels (for DMs)
CREATE POLICY "chat_channels_insert_family"
  ON chat_channels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id = chat_channels.family_id
    )
  );

-- ============================================================
-- 2. chat_channel_members – membership in a channel
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_channel ON chat_channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_channel_members_user ON chat_channel_members(user_id);

-- RLS: SELECT – family members can see channel memberships
CREATE POLICY "chat_channel_members_select_family"
  ON chat_channel_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      JOIN profiles p ON p.family_id = cc.family_id
      WHERE cc.id = chat_channel_members.channel_id
        AND p.id = auth.uid()
    )
  );

-- RLS: INSERT – family members can add members (for DM creation)
CREATE POLICY "chat_channel_members_insert_family"
  ON chat_channel_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_channels cc
      JOIN profiles p ON p.family_id = cc.family_id
      WHERE cc.id = chat_channel_members.channel_id
        AND p.id = auth.uid()
    )
  );

-- ============================================================
-- 3. chat_messages – one row per message
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for pagination and realtime
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created
  ON chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender
  ON chat_messages(sender_id);

-- RLS: SELECT – channel members can read messages
-- For family channels: all family members. For DMs: only the 2 participants.
CREATE POLICY "chat_messages_select_member"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_channel_members ccm
      WHERE ccm.channel_id = chat_messages.channel_id
        AND ccm.user_id = auth.uid()
    )
  );

-- RLS: INSERT – channel members can send messages
CREATE POLICY "chat_messages_insert_member"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM chat_channel_members ccm
      WHERE ccm.channel_id = chat_messages.channel_id
        AND ccm.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. chat_read_receipts – last-read timestamp per user per channel
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

ALTER TABLE chat_read_receipts ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_read_receipts_channel_user
  ON chat_read_receipts(channel_id, user_id);

-- RLS: SELECT – users can read their own receipts
CREATE POLICY "chat_read_receipts_select_own"
  ON chat_read_receipts FOR SELECT
  USING (user_id = auth.uid());

-- RLS: INSERT – users can create their own receipts
CREATE POLICY "chat_read_receipts_insert_own"
  ON chat_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS: UPDATE – users can update their own receipts
CREATE POLICY "chat_read_receipts_update_own"
  ON chat_read_receipts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 5. Trigger: auto-create family channel when a family is created
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_family_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_channel_id UUID;
BEGIN
  -- Create the family channel
  INSERT INTO chat_channels (family_id, type)
  VALUES (NEW.id, 'family')
  RETURNING id INTO new_channel_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_create_family_channel ON families;
CREATE TRIGGER trg_auto_create_family_channel
  AFTER INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_family_channel();

-- ============================================================
-- 6. Trigger: auto-add member to family channel when joining
-- ============================================================

CREATE OR REPLACE FUNCTION auto_add_to_family_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel_id UUID;
BEGIN
  -- Only act when family_id changes from NULL to a value
  IF NEW.family_id IS NOT NULL AND (OLD.family_id IS NULL OR OLD.family_id IS DISTINCT FROM NEW.family_id) THEN
    -- Find the family channel
    SELECT id INTO v_channel_id
    FROM chat_channels
    WHERE family_id = NEW.family_id
      AND type = 'family'
    LIMIT 1;

    -- Add member to channel (if channel exists)
    IF v_channel_id IS NOT NULL THEN
      INSERT INTO chat_channel_members (channel_id, user_id)
      VALUES (v_channel_id, NEW.id)
      ON CONFLICT (channel_id, user_id) DO NOTHING;
    END IF;
  END IF;

  -- If member leaves family, remove from all family channels
  IF NEW.family_id IS NULL AND OLD.family_id IS NOT NULL THEN
    DELETE FROM chat_channel_members
    WHERE user_id = NEW.id
      AND channel_id IN (
        SELECT id FROM chat_channels WHERE family_id = OLD.family_id
      );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_to_family_channel ON profiles;
CREATE TRIGGER trg_auto_add_to_family_channel
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_to_family_channel();

-- ============================================================
-- 7. Backfill: create family channels for existing families
-- ============================================================

-- Create family channels for families that don't have one yet
INSERT INTO chat_channels (family_id, type)
SELECT f.id, 'family'
FROM families f
WHERE NOT EXISTS (
  SELECT 1 FROM chat_channels cc
  WHERE cc.family_id = f.id AND cc.type = 'family'
);

-- Add all current family members to their family channels
INSERT INTO chat_channel_members (channel_id, user_id)
SELECT cc.id, p.id
FROM chat_channels cc
JOIN profiles p ON p.family_id = cc.family_id
WHERE cc.type = 'family'
  AND NOT EXISTS (
    SELECT 1 FROM chat_channel_members ccm
    WHERE ccm.channel_id = cc.id AND ccm.user_id = p.id
  );

-- ============================================================
-- 8. Enable Realtime on chat tables
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_read_receipts;
