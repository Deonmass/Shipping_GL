-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for profiles" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);
CREATE INDEX IF NOT EXISTS idx_partners_partner_code ON partners(partner_code);

-- Update partners table constraints
ALTER TABLE partners
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

-- Add ON DELETE CASCADE to partners foreign key if not exists
DO $$ 
BEGIN
  ALTER TABLE partners 
    DROP CONSTRAINT IF EXISTS partners_user_id_fkey,
    ADD CONSTRAINT partners_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;