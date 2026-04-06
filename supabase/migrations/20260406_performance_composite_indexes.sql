-- Performance: Composite indexes for common query patterns
-- These replace multiple single-column index lookups with efficient composite scans.

-- Calendar events: range queries by family and date
-- Used by getEventsForRangeAction: WHERE family_id = ? AND start_at >= ? AND end_at <= ?
CREATE INDEX IF NOT EXISTS idx_calendar_events_family_date_range
  ON calendar_events(family_id, start_at DESC, end_at DESC);

-- Tasks: filtered listing by family, assignee, and status
-- Used by getTasksAction: WHERE family_id = ? AND assigned_to = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_tasks_family_assigned_status
  ON tasks(family_id, assigned_to, status);

-- Shopping items: counting done/total per list
-- Used by getShoppingListsAction embedded join and item filtering
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_done
  ON shopping_items(list_id, is_done);

-- Shopping lists: ordered listing by family
-- Used by getShoppingListsAction: WHERE family_id = ? ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_shopping_lists_family_updated
  ON shopping_lists(family_id, updated_at DESC);

-- Recipes: ordered listing by family
-- Used by getRecipesAction: WHERE family_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_recipes_family_created
  ON recipes(family_id, created_at DESC);

-- Meal plan: week lookup per family
-- Already exists as idx_meal_plan_family_week, verified for completeness.
