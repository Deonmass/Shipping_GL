/*
  # Création de la table custom_roles pour les rôles personnalisés

  1. Nouvelle table
    - `custom_roles`
      - `id` (uuid, primary key)
      - `name` (text) - Nom du rôle affiché
      - `slug` (text, unique) - Identifiant unique du rôle
      - `description` (text) - Description du rôle
      - `created_by` (uuid, foreign key to auth.users) - Administrateur créateur
      - `created_at` (timestamptz) - Date de création
      - `updated_at` (timestamptz) - Date de mise à jour

  2. Sécurité
    - Enable RLS sur `custom_roles`
    - Seuls les admins peuvent créer, modifier et supprimer des rôles
    - Tous les utilisateurs authentifiés peuvent voir les rôles

  3. Notes
    - Les rôles prédéfinis (admin, user, partner) ne sont pas dans cette table
    - Cette table permet une gestion dynamique des rôles personnalisés
*/

-- Création de la table custom_roles
CREATE TABLE IF NOT EXISTS custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Tous les utilisateurs authentifiés peuvent voir les rôles
CREATE POLICY "Authenticated users can view custom roles"
  ON custom_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Seuls les admins peuvent créer des rôles
CREATE POLICY "Admins can create custom roles"
  ON custom_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent modifier des rôles
CREATE POLICY "Admins can update custom roles"
  ON custom_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent supprimer des rôles
CREATE POLICY "Admins can delete custom roles"
  ON custom_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Fonction trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_custom_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
DROP TRIGGER IF EXISTS update_custom_roles_updated_at_trigger ON custom_roles;
CREATE TRIGGER update_custom_roles_updated_at_trigger
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_roles_updated_at();

-- Modifier la table role_permissions pour supporter les rôles dynamiques
-- (La table existe déjà, on s'assure juste qu'elle peut gérer n'importe quel slug)
COMMENT ON COLUMN role_permissions.role IS 'Peut être admin, user, partner ou un slug de custom_roles';