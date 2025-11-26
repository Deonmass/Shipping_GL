/*
  # Grant Auth Schema Access for Admin Users
  
  ## Overview
  This migration grants necessary permissions to access auth.users table
  for the admin-users Edge Function to work properly.
  
  ## Changes
  
  1. Grant Permissions
    - Grant USAGE on auth schema to service role
    - Grant SELECT on auth.users to service role
    - Ensure service role can list users for admin dashboard
  
  ## Security
  - Only service role gets these permissions
  - Regular authenticated users do NOT get access to auth schema
  - RLS policies on users table remain in place
*/

-- Grant USAGE on auth schema to service role
GRANT USAGE ON SCHEMA auth TO service_role;

-- Grant SELECT on auth.users to service role
GRANT SELECT ON auth.users TO service_role;

-- Grant SELECT on auth.identities to service role (used by auth.admin)
GRANT SELECT ON auth.identities TO service_role;

-- Grant SELECT on auth.sessions to service role
GRANT SELECT ON auth.sessions TO service_role;