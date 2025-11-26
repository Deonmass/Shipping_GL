/*
  # Delete All Users - Clean Slate
  
  ## Overview
  This migration deletes all existing users from the system to start fresh.
  It removes users from both auth.users and the users table.
  
  ## Changes
  
  1. Delete All Users
    - Remove all records from user_roles table
    - Remove all records from users table
    - Remove all auth users (cascades to related tables)
  
  ## Security
  - This is a destructive operation
  - All user data will be permanently deleted
  - RLS policies remain intact for future users
*/

-- ============================================
-- DELETE ALL EXISTING USERS
-- ============================================

-- Delete all user roles first
DELETE FROM user_roles;

-- Delete all user profiles
DELETE FROM users;

-- Note: auth.users deletion is handled via Edge Function
-- as it requires admin API access