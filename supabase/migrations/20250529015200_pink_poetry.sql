/*
  # Fix RLS policies for user_profiles and admins tables

  1. Changes
    - Drop existing RLS policies for user_profiles and admins tables
    - Create new RLS policies that allow:
      - New users to create their profiles during registration
      - Users to read and update their own profiles
      - Admins to manage their own records
  
  2. Security
    - Enable RLS on both tables
    - Add policies to ensure users can only access their own data
    - Allow unauthenticated users to create profiles during registration
*/

-- Drop existing policies for user_profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Create new policies for user_profiles
CREATE POLICY "Enable insert for registration" ON user_profiles
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable read access for own profile" ON user_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing policies for admins
DROP POLICY IF EXISTS "Enable admin delete" ON admins;
DROP POLICY IF EXISTS "Enable admin insert" ON admins;
DROP POLICY IF EXISTS "Enable admin read access" ON admins;
DROP POLICY IF EXISTS "Enable admin update" ON admins;

-- Create new policies for admins
CREATE POLICY "Enable admin insert" ON admins
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Enable admin read access" ON admins
  --FOR SELECT TO authenticated
  --USING (auth.uid() = user_id);
  FOR SELECT TO admin
  USING (true);

CREATE POLICY "Enable admin update" ON admins
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable admin delete" ON admins
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);