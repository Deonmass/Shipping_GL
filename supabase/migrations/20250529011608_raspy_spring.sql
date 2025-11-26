/*
  # Fix admin table RLS policies

  1. Changes
    - Remove recursive admin check from policies
    - Simplify policies to use direct user_id check
    - Keep RLS enabled for security
  
  2. Security
    - Maintain row-level security
    - Ensure admins can only access their own records
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can delete records" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can read all records" ON admins;
DROP POLICY IF EXISTS "Admins can update records" ON admins;

-- Create new simplified policies
CREATE POLICY "Enable read access for own admin record"
ON admins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for admin records"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for own admin record"
ON admins
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for own admin record"
ON admins
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);