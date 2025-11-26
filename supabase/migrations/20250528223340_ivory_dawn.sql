/*
  # Fix recursive RLS policies for admins table

  1. Changes
    - Drop existing recursive policies on admins table
    - Create new simplified policies that avoid recursion
    - Maintain security while preventing infinite loops

  2. Security
    - Enable RLS on admins table (already enabled)
    - Add direct user_id check policies for all operations
    - Avoid nested queries that could cause recursion
*/

-- Drop existing policies to replace them with non-recursive versions
DROP POLICY IF EXISTS "Enable admin delete" ON admins;
DROP POLICY IF EXISTS "Enable admin insert" ON admins;
DROP POLICY IF EXISTS "Enable admin read access" ON admins;
DROP POLICY IF EXISTS "Enable admin update" ON admins;

-- Create new non-recursive policies
CREATE POLICY "Enable admin read access"
ON admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable admin insert"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable admin update"
ON admins
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable admin delete"
ON admins
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);