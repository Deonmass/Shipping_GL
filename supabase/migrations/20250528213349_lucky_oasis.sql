-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert default admin user with specified credentials
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change_token_current,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'gedeonmass44@gmail.com',
  crypt('Deon@1083', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'gedeonmass44@gmail.com'
);

-- Insert admin record
INSERT INTO public.admins (
  name,
  username,
  email,
  user_id
)
SELECT
  'Gedeon',
  'gedeon',
  'gedeonmass44@gmail.com',
  (SELECT id FROM auth.users WHERE email = 'gedeonmass44@gmail.com')
WHERE NOT EXISTS (
  SELECT 1 FROM public.admins WHERE username = 'gedeon'
);