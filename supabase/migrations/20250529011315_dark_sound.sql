/*
  # Fix Admin RLS Policies

  1. Changes
    - Update RLS policies for admins table to allow proper admin management
    - Add policy to allow admins to read all admin records
    - Add policy to allow admins to insert new admin records
    - Add policy to allow admins to update admin records
    - Add policy to allow admins to delete admin records

  2. Security
    - Policies ensure only existing admins can manage other admins
    - All operations require the user to be an existing admin
*/

-- First ensure RLS is enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable admin delete" ON admins;
DROP POLICY IF EXISTS "Enable admin insert" ON admins;
DROP POLICY IF EXISTS "Enable admin read access" ON admins;
DROP POLICY IF EXISTS "Enable admin update" ON admins;

-- Create new policies that check if the user is an admin
CREATE POLICY "Admins can read all records"
ON admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can insert new admins"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update records"
ON admins
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete records"
ON admins
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);