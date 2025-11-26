-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admins;
DROP POLICY IF EXISTS "Enable read access to own admin record" ON admins;
DROP POLICY IF EXISTS "Enable update for own admin record" ON admins;
DROP POLICY IF EXISTS "Enable delete for own admin record" ON admins;

-- Ensure RLS is enabled
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create new policies that allow admins to manage all records
CREATE POLICY "Enable admin read access"
ON public.admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Enable admin insert"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

CREATE POLICY "Enable admin update"
ON public.admins
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

CREATE POLICY "Enable admin delete"
ON public.admins
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins a 
    WHERE a.user_id = auth.uid()
  )
);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Enable read access for profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);