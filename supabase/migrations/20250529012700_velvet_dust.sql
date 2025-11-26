/*
  # Fix Admin RLS Policies

  1. Changes
    - Remove existing RLS policies for admins table that cause infinite recursion
    - Create new, simplified RLS policies for admins table
      - Allow authenticated users to read admin records
      - Allow authenticated users to insert admin records
      - Allow authenticated users to update their own admin records
      - Allow authenticated users to delete their own admin records

  2. Security
    - Enable RLS on admins table
    - Add policies with direct user_id checks to prevent recursion
*/

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Enable admin delete" ON admins;
DROP POLICY IF EXISTS "Enable admin insert" ON admins;
DROP POLICY IF EXISTS "Enable admin read access" ON admins;
DROP POLICY IF EXISTS "Enable admin update" ON admins;

-- Create new simplified policies
CREATE POLICY "Enable admin read access"
ON admins
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable admin insert"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (true);

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