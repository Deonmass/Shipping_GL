/*
  # Seed Default Admin User
  
  This migration creates a default admin user for initial system access:
  
  1. Default Admin Credentials
    - Username: admin
    - Password: admin123!@#
    - Email: admin@shippinggl.com
    - Full Name: System Administrator
  
  2. Implementation Steps
    - Create auth.users entry with confirmed email
    - Create corresponding admins table entry
    - Link admin to user_roles table with 'admin' role
    - Create users table entry for profile completion
  
  3. Security Notes
    - Email is automatically confirmed (no verification needed)
    - Password should be changed after first login
    - This is a one-time setup migration
    
  IMPORTANT: Default credentials are admin@shippinggl.com / admin123!@#
*/

-- ============================================
-- STEP 1: CREATE DEFAULT ADMIN USER IN AUTH
-- ============================================

-- Insert admin user into auth.users table
-- Note: We use a DO block to handle the case where user might already exist
DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@shippinggl.com';
  admin_password_hash text;
BEGIN
  -- Check if admin user already exists
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- Only create if doesn't exist
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- Create the password hash for 'admin123!@#'
    -- Using crypt function with bcrypt algorithm
    admin_password_hash := crypt('admin123!@#', gen_salt('bf'));
    
    -- Insert into auth.users
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
      now(), -- Email is confirmed immediately
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"System Administrator"}'::jsonb,
      false,
      'authenticated',
      'authenticated',
      '',
      ''
    );
    
    -- ============================================
    -- STEP 2: CREATE USERS TABLE ENTRY
    -- ============================================
    
    INSERT INTO users (
      id,
      email,
      full_name,
      phone_number,
      created_at,
      updated_at
    ) VALUES (
      admin_user_id,
      admin_email,
      'System Administrator',
      NULL,
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- ============================================
    -- STEP 3: CREATE ADMINS TABLE ENTRY
    -- ============================================
    
    INSERT INTO admins (
      user_id,
      name,
      username,
      email,
      phone_number,
      created_at
    ) VALUES (
      admin_user_id,
      'System Administrator',
      'admin',
      admin_email,
      NULL,
      now()
    )
    ON CONFLICT (username) DO NOTHING;
    
    -- ============================================
    -- STEP 4: ASSIGN ADMIN ROLE
    -- ============================================
    
    INSERT INTO user_roles (
      user_id,
      role,
      created_at
    ) VALUES (
      admin_user_id,
      'admin',
      now()
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Default admin user created successfully with email: % and password: admin123!@#', admin_email;
  ELSE
    RAISE NOTICE 'Admin user already exists with email: %', admin_email;
  END IF;
END $$;