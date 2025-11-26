/*
  # Create user_custom_roles junction table and update custom_roles schema

  1. New Tables
    - `user_custom_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `role_name` (text, reference to custom_roles.name)
      - `assigned_at` (timestamptz, default now())

  2. Schema Updates
    - Add `is_system` boolean field to custom_roles table
    - Add index on `is_system` for filtering system roles

  3. Indexes
    - Index on `user_id` for fast lookups
    - Index on `role_name` for role queries
    - Composite unique index on `user_id` and `role_name`

  4. Security
    - Enable RLS on `user_custom_roles`
    - Admins can manage all user custom role assignments
    - Users can view their own custom roles
    - Proper foreign key constraints with cascade delete

  5. Notes
    - Junction table linking users to custom roles
    - Allows many-to-many relationship between users and custom roles
    - Single assignment per user-role pair enforced by unique constraint
*/

-- Add is_system field to custom_roles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'custom_roles' AND column_name = 'is_system'
  ) THEN
    ALTER TABLE custom_roles ADD COLUMN is_system boolean DEFAULT false;
  END IF;
END $$;

-- Create user_custom_roles table
CREATE TABLE IF NOT EXISTS user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_custom_roles_user_id ON user_custom_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_custom_roles_role_name ON user_custom_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_custom_roles_is_system ON custom_roles(is_system);

-- Enable RLS
ALTER TABLE user_custom_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage user custom roles" ON user_custom_roles;
DROP POLICY IF EXISTS "Users can view own custom roles" ON user_custom_roles;

-- Create policies
CREATE POLICY "Admins can manage user custom roles"
  ON user_custom_roles
  FOR ALL
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

CREATE POLICY "Users can view own custom roles"
  ON user_custom_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
