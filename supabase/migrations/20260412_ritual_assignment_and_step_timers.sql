-- ============================================================
-- Fix PROJ-14: Ritual points assignment + per-step timer support
-- R1/R2: assigned_to — which child receives points on completion
-- R3: completed_by — who completed the ritual (personalized msg)
-- R1: points_awarded — prevent double-awarding race condition
-- ============================================================

ALTER TABLE active_ritual_sessions
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS assigned_to_name TEXT,
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS points_awarded BOOLEAN NOT NULL DEFAULT false;
