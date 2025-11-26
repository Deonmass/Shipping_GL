/*
  # Correction des politiques RLS

  1. Changements
    - Suppression des politiques existantes pour partners
    - Création de nouvelles politiques plus permissives
    - Mise à jour des politiques pour les personnes de contact

  2. Sécurité
    - Permettre l'insertion de partenaires avant vérification
    - Maintenir la sécurité pour la lecture et la mise à jour
*/

-- Supprimer les politiques existantes pour partners
DROP POLICY IF EXISTS "Enable read access for own data" ON partners;
DROP POLICY IF EXISTS "Enable insert access for registration" ON partners;
DROP POLICY IF EXISTS "Enable update access for own data" ON partners;
DROP POLICY IF EXISTS "Partners can read own data" ON partners;
DROP POLICY IF EXISTS "Partners can update own data" ON partners;
DROP POLICY IF EXISTS "Allow users to register as partners" ON partners;

-- Nouvelles politiques pour les partenaires
CREATE POLICY "Partners can read own data"
  ON partners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Partners can update own data"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Supprimer et recréer les politiques pour les personnes de contact
DROP POLICY IF EXISTS "Partners can read own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Partners can manage own contact persons" ON contact_persons;

CREATE POLICY "Partners can read own contact persons"
  ON contact_persons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = contact_persons.partner_id
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert contact persons"
  ON contact_persons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);