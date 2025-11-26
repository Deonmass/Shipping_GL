/*
  # Create Profile Trigger and Seed Users
  
  This migration creates a trigger for automatic user profile creation
  and seeds the database with admin and test users:
  
  1. Create Trigger Function
    - Automatically creates user profile in 'users' table when auth user is created
    - Extracts data from auth.users metadata
  
  2. Admin User
    - Email: admin@shippinggl.com
    - Username: admin
    - Password: Deon@1083
    - Role: admin
  
  3. Test Users (5 users)
    - All with password: Password123!
    - Realistic French names and companies
  
  4. Implementation
    - Create or update trigger function
    - Clean existing data properly
    - Insert new users with all required fields
    - Assign appropriate roles
*/

-- ============================================
-- STEP 1: CREATE TRIGGER FUNCTION
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 2: CLEAN EXISTING DATA
-- ============================================

-- Delete all existing data in correct order
TRUNCATE user_roles CASCADE;
TRUNCATE users CASCADE;

-- Delete from auth.users
DELETE FROM auth.users;

-- ============================================
-- STEP 3: CREATE ADMIN USER
-- ============================================

DO $$
DECLARE
  admin_user_id uuid := gen_random_uuid();
  admin_email text := 'admin@shippinggl.com';
  admin_password_hash text;
BEGIN
  -- Create password hash for 'Deon@1083'
  admin_password_hash := crypt('Deon@1083', gen_salt('bf'));
  
  -- Insert into auth.users (trigger will create users entry)
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token
  ) VALUES (
    admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    admin_email,
    admin_password_hash,
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Administrateur Principal"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    ''
  );
  
  -- Update users table with additional info
  UPDATE users SET
    phone_number = '+33 1 23 45 67 89',
    company = 'SHIPPING GL'
  WHERE id = admin_user_id;
  
  -- Assign admin role
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (admin_user_id, 'admin', now());
  
  RAISE NOTICE 'Admin user created: % / Deon@1083', admin_email;
END $$;

-- ============================================
-- STEP 4: CREATE TEST USERS
-- ============================================

DO $$
DECLARE
  user1_id uuid := gen_random_uuid();
  user2_id uuid := gen_random_uuid();
  user3_id uuid := gen_random_uuid();
  user4_id uuid := gen_random_uuid();
  user5_id uuid := gen_random_uuid();
  password_hash text;
BEGIN
  -- Create password hash for 'Password123!'
  password_hash := crypt('Password123!', gen_salt('bf'));
  
  -- User 1: Jean Dupont
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud, confirmation_token, recovery_token
  ) VALUES (
    user1_id, '00000000-0000-0000-0000-000000000000',
    'jean.dupont@example.com', password_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Jean Dupont"}'::jsonb,
    false, 'authenticated', 'authenticated', '', ''
  );
  
  UPDATE users SET
    phone_number = '+33 6 12 34 56 78',
    company = 'SARL Maritime Transport'
  WHERE id = user1_id;
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (user1_id, 'user', now());
  
  -- User 2: Marie Martin
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud, confirmation_token, recovery_token
  ) VALUES (
    user2_id, '00000000-0000-0000-0000-000000000000',
    'marie.martin@example.com', password_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Marie Martin"}'::jsonb,
    false, 'authenticated', 'authenticated', '', ''
  );
  
  UPDATE users SET
    phone_number = '+33 6 23 45 67 89',
    company = 'Export International SA'
  WHERE id = user2_id;
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (user2_id, 'user', now());
  
  -- User 3: Pierre Bernard
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud, confirmation_token, recovery_token
  ) VALUES (
    user3_id, '00000000-0000-0000-0000-000000000000',
    'pierre.bernard@example.com', password_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Pierre Bernard"}'::jsonb,
    false, 'authenticated', 'authenticated', '', ''
  );
  
  UPDATE users SET
    phone_number = '+33 6 34 56 78 90',
    company = 'Logistique Express SARL'
  WHERE id = user3_id;
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (user3_id, 'user', now());
  
  -- User 4: Sophie Dubois
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud, confirmation_token, recovery_token
  ) VALUES (
    user4_id, '00000000-0000-0000-0000-000000000000',
    'sophie.dubois@example.com', password_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Sophie Dubois"}'::jsonb,
    false, 'authenticated', 'authenticated', '', ''
  );
  
  UPDATE users SET
    phone_number = '+33 6 45 67 89 01',
    company = 'Fret Maritime France'
  WHERE id = user4_id;
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (user4_id, 'user', now());
  
  -- User 5: Luc Moreau
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, role, aud, confirmation_token, recovery_token
  ) VALUES (
    user5_id, '00000000-0000-0000-0000-000000000000',
    'luc.moreau@example.com', password_hash, now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Luc Moreau"}'::jsonb,
    false, 'authenticated', 'authenticated', '', ''
  );
  
  UPDATE users SET
    phone_number = '+33 6 56 78 90 12',
    company = 'Commerce International SAS'
  WHERE id = user5_id;
  
  INSERT INTO user_roles (user_id, role, created_at)
  VALUES (user5_id, 'user', now());
  
  RAISE NOTICE '5 test users created with password: Password123!';
END $$;