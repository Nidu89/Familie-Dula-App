-- Add category column to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category TEXT
  CHECK (category IN ('household', 'school', 'shopping', 'leisure', 'health', 'other'))
  DEFAULT NULL;

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
