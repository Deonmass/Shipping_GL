/*
  # Correction des politiques RLS

  1. Changements
    - Simplification des politiques RLS pour éviter la récursion
    - Correction de la politique d'insertion pour les partenaires
    - Ajout de politiques manquantes pour les sociétés

  2. Sécurité
    - Maintien de la sécurité des données
    - Permissions appropriées pour les utilisateurs authentifiés
*/

-- Supprimer les anciennes politiques qui causent des problèmes
DROP POLICY IF EXISTS "Partners can read associated companies" ON partners;
DROP POLICY IF EXISTS "Partners can read own data" ON partners;
DROP POLICY IF EXISTS "Partners can update own data" ON partners;
DROP POLICY IF EXISTS "Allow users to register as partners" ON partners;

-- Nouvelles politiques simplifiées pour les partenaires
CREATE POLICY "Enable read access for own data"
  ON partners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for registration"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for own data"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques pour les sociétés
CREATE POLICY "Enable read access for all companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for new companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for associated companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.company_id = id
      AND partners.user_id = auth.uid()
    )
  );