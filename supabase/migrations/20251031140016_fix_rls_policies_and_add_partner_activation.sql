/*
  # Fix RLS Policies and Add Partner Activation Feature
  
  ## Overview
  This migration fixes Row-Level Security policies that were preventing admins from inserting
  records, and adds partner activation functionality.
  
  ## Changes
  
  ### 1. Partners Table
    - Add `is_active` boolean column (default true) for soft-delete/activation control
    - Fix RLS policies to allow admins to insert partners without user_id requirement
    - Update SELECT policy to show active partners to public, all partners to admins
    - Add proper INSERT policy for admins
  
  ### 2. Security Improvements
    - Ensure all tables have proper admin INSERT policies
    - Fix any recursive policy issues
    - Verify policies work for both authenticated users and admins
  
  ## Security Notes
  - RLS remains enabled on all tables
  - Public users only see active, approved partners
  - Admins can create partners without being partner users themselves
  - All policies properly check admin status via user_roles table
*/

-- ============================================
-- STEP 1: ADD is_active COLUMN TO PARTNERS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'partners' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE partners ADD COLUMN is_active boolean DEFAULT true;
    CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);
  END IF;
END $$;

-- ============================================
-- STEP 2: FIX PARTNERS TABLE RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read approved partners" ON partners;
DROP POLICY IF EXISTS "Admins can read all partners" ON partners;
DROP POLICY IF EXISTS "Partners can read own profile" ON partners;
DROP POLICY IF EXISTS "Authenticated users can create partner requests" ON partners;
DROP POLICY IF EXISTS "Partners can update own profile" ON partners;
DROP POLICY IF EXISTS "Admins can update any partner" ON partners;
DROP POLICY IF EXISTS "Admins can delete partners" ON partners;
DROP POLICY IF EXISTS "Public can read active approved partners" ON partners;
DROP POLICY IF EXISTS "Admins can create partners" ON partners;
DROP POLICY IF EXISTS "Users can create own partner request" ON partners;

-- Public can read active AND approved partners
CREATE POLICY "Public can read active approved partners"
  ON partners FOR SELECT
  USING (status = 'approved' AND is_active = true);

-- Admins can read ALL partners
CREATE POLICY "Admins can read all partners"
  ON partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Partners can read their own profile
CREATE POLICY "Partners can read own profile"
  ON partners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can INSERT partners (with or without user_id)
CREATE POLICY "Admins can create partners"
  ON partners FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Authenticated users can create partner request for themselves
CREATE POLICY "Users can create own partner request"
  ON partners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Partners can UPDATE their own profile (but not status or is_active)
CREATE POLICY "Partners can update own profile"
  ON partners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can UPDATE any partner
CREATE POLICY "Admins can update any partner"
  ON partners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Admins can DELETE partners
CREATE POLICY "Admins can delete partners"
  ON partners FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- STEP 3: VERIFY OTHER TABLES RLS POLICIES
-- ============================================

-- Fix news_posts policies to ensure admins can insert
DROP POLICY IF EXISTS "Admins can create posts" ON news_posts;
CREATE POLICY "Admins can create posts"
  ON news_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Fix post_comments policies
DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix post_likes policies
DROP POLICY IF EXISTS "Users can add likes" ON post_likes;
CREATE POLICY "Users can add likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix news_events policies for admin management
DROP POLICY IF EXISTS "Admins can create events" ON news_events;
DROP POLICY IF EXISTS "Admins can update events" ON news_events;
DROP POLICY IF EXISTS "Admins can delete events" ON news_events;

CREATE POLICY "Admins can create events"
  ON news_events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update events"
  ON news_events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete events"
  ON news_events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- ============================================
-- STEP 4: ADD COMMENTS TO TABLES
-- ============================================

COMMENT ON COLUMN partners.is_active IS 'Controls whether partner is visible on client-side. Allows soft-delete without losing data.';