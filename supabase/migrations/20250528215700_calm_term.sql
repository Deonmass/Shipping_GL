/*
  # Fix RLS policies for admins table

  1. Changes
    - Update RLS policies for admins table to allow proper insertion of new admin records
    - Ensure authenticated users can create admin records
    - Maintain existing policies for read, update, and delete operations

  2. Security
    - Enable RLS on admins table
    - Add policy for authenticated users to insert admin records
    - Ensure user_id matches the authenticated user for all operations
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admins;
DROP POLICY IF EXISTS "Enable read access to own admin record" ON admins;
DROP POLICY IF EXISTS "Enable update for own admin record" ON admins;
DROP POLICY IF EXISTS "Enable delete for own admin record" ON admins;

-- Ensure RLS is enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create new policies with correct permissions
CREATE POLICY "Enable insert for authenticated users"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access to own admin record"
ON public.admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable update for own admin record"
ON public.admins
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own admin record"
ON public.admins
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);