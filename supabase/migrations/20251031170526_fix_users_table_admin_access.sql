/*
  # Fix Users Table Admin Access
  
  ## Overview
  This migration adds RLS policies to allow admins to read all user profiles
  from the users table. This is necessary for the admin dashboard to display
  user information properly.
  
  ## Problem
  The current RLS policies on the users table only allow users to read their
  own profiles. When admins try to fetch user lists via the Edge Function,
  they cannot access other users' profile data even with service role permissions.
  
  ## Changes
  
  1. Users Table Policies
    - Add policy: "Admins can read all users" - allows admins to view all user profiles
    - Keep existing policies for user self-access
  
  ## Security
  - Policy checks user_roles table for admin status
  - Regular users can still only read their own profiles
  - RLS remains enabled on users table
*/

-- ============================================
-- ADD ADMIN READ ACCESS TO USERS TABLE
-- ============================================

-- Add policy for admins to read all user profiles
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- VERIFY TRIGGER FOR AUTO USER PROFILE CREATION
-- ============================================

-- Create trigger function to automatically create user profile
-- when a new user signs up via auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- BACKFILL MISSING USER PROFILES
-- ============================================

-- Insert missing user profiles for any auth.users without a profile
INSERT INTO public.users (id, email, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;