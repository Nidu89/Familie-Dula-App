-- PROJ-15: Add locale column to profiles for i18n support
-- Allowed values: 'de', 'en', 'fr' — default: 'en'

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en'
  CONSTRAINT profiles_locale_check CHECK (locale IN ('de', 'en', 'fr'));
