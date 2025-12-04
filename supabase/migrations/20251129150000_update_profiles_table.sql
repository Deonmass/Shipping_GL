-- Supprimer la colonne user_id si elle existe
ALTER TABLE IF EXISTS profiles DROP COLUMN IF EXISTS user_id;

-- Ajouter les nouvelles colonnes
ALTER TABLE IF EXISTS profiles 
  ADD COLUMN IF NOT EXISTS nom_complet TEXT,
  ADD COLUMN IF NOT EXISTS telephone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Mettre à jour les politiques RLS si nécessaire
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Recréer les politiques RLS
CREATE POLICY "Enable read access for all users" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Enable update for users based on id" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Ajouter des contraintes si nécessaire
ALTER TABLE profiles ALTER COLUMN nom_complet SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
