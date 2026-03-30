-- BUG-P6-9: Prevent race condition allowing duplicate active goals per family
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_goals_one_active_per_family
  ON family_goals(family_id)
  WHERE status = 'active';
