-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for own admin record" ON admins;
DROP POLICY IF EXISTS "Enable insert for admin records" ON admins;
DROP POLICY IF EXISTS "Enable update for own admin record" ON admins;
DROP POLICY IF EXISTS "Enable delete for own admin record" ON admins;

-- Create new policies that allow admin management
CREATE POLICY "Enable admin read access"
ON admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Enable admin insert"
ON admins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Enable admin update"
ON admins
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Enable admin delete"
ON admins
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);