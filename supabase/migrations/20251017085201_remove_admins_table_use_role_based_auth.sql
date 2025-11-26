/*
  # Remove Admins Table and Update to Role-Based Authentication
  
  This migration removes the separate admins table and updates all authentication
  to use the existing users table with role-based access control.
  
  ## Changes
  
  1. Drop Policies and Table
    - Drop all policies related to admins table
    - Drop the admins table completely
  
  2. Update News Posts Policies
    - Update policies to check user_roles for 'admin' role instead of admins table
    - Maintain all existing security controls
  
  3. Update News Events Policies
    - Update policies to check user_roles for 'admin' role
    
  ## Security
    - All admin checks now use user_roles table
    - No data loss - admin users still exist in users table with 'admin' role in user_roles
    - RLS remains enabled on all tables
*/

-- ============================================
-- STEP 1: DROP ADMINS TABLE POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can read own profile" ON admins;
DROP POLICY IF EXISTS "Admins can read other admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage admin records" ON admins;

-- ============================================
-- STEP 2: DROP ADMINS TABLE
-- ============================================

DROP TABLE IF EXISTS admins CASCADE;

-- ============================================
-- STEP 3: UPDATE NEWS POSTS POLICIES
-- ============================================

-- Drop existing admin-related policies
DROP POLICY IF EXISTS "Admins can view all posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON news_posts;

-- Create new policies that check user_roles
CREATE POLICY "Admins can view all posts"
  ON news_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create posts"
  ON news_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update posts"
  ON news_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete posts"
  ON news_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- STEP 4: UPDATE NEWS EVENTS POLICIES
-- ============================================

-- Drop existing admin-related policies
DROP POLICY IF EXISTS "Admins can create events" ON news_events;
DROP POLICY IF EXISTS "Admins can update events" ON news_events;
DROP POLICY IF EXISTS "Admins can delete events" ON news_events;

-- Create new policies that check user_roles
CREATE POLICY "Admins can create events"
  ON news_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON news_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON news_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- STEP 5: UPDATE NEWSLETTER SUBSCRIPTIONS POLICY
-- ============================================

-- Drop existing admin-related policy
DROP POLICY IF EXISTS "Admins can view subscriptions" ON newsletter_subscriptions;

-- Create new policy that checks user_roles
CREATE POLICY "Admins can view subscriptions"
  ON newsletter_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );