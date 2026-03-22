-- Bug Fix: Allow family members to see each other's profiles
-- The existing SELECT policy "Benutzer koennen ihr eigenes Profil lesen"
-- only allowed users to read their own profile (auth.uid() = id),
-- so family members were invisible in the Einstellungen > Mitglieder page.

CREATE POLICY "profiles_select_family"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles AS me
      WHERE me.id = auth.uid()
        AND me.family_id = profiles.family_id
        AND me.family_id IS NOT NULL
    )
  );
