-- Add custom_quote column to families table
ALTER TABLE families ADD COLUMN IF NOT EXISTS custom_quote text;
