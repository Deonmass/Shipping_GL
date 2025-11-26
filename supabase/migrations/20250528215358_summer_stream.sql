/*
  # Fix admin RLS policy recursion

  1. Changes
    - Remove recursive admin policy that was causing infinite loops
    - Add new policy based on user_id match for basic operations
    - Enable RLS on admins table
    - Add policies for CRUD operations

  2. Security
    - Policies ensure users can only access their own admin record
    - Maintains data isolation between different admin users
*/

-- First enable RLS on the admins table (in case it wasn't enabled)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can read all admins" ON admins;
DROP POLICY IF EXISTS "Admins can update admins" ON admins;

-- Create new non-recursive policies
CREATE POLICY "Enable read access to own admin record"
ON admins FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for authenticated users"
ON admins FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own admin record"
ON admins FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own admin record"
ON admins FOR DELETE
TO authenticated
USING (auth.uid() = user_id);