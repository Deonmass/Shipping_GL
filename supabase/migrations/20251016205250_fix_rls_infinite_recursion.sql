/*
  # Fix Infinite Recursion in RLS Policies
  
  This migration resolves infinite recursion errors in Row Level Security policies
  by implementing a secure helper function and rebuilding all affected policies.
  
  ## Problem
  Multiple RLS policies were querying the same tables they protect, causing infinite
  recursion loops when checking permissions (e.g., user_roles checking user_roles,
  admins checking admins).
  
  ## Solution
  1. **Security Helper Function**
     - Create `is_admin(user_uuid)` function with SECURITY DEFINER
     - Bypasses RLS to check admin status without recursion
     - Queries admins table directly using elevated privileges
  
  2. **Rebuilt Policies**
     - Drop all existing circular policies
     - Recreate policies using the security helper function
     - Maintain same security model without recursion
  
  ## Tables Fixed
  - user_roles: Self-referencing policy removed
  - admins: Self-referencing policies removed  
  - partners: Admin check now uses helper function
  - partner_categories: Admin check now uses helper function
  - news: Admin check now uses helper function
  - news_categories: Admin check now uses helper function
  - news_posts: Admin check now uses helper function
  - news_events: Admin check now uses helper function
  - news_comments: Maintained existing policies (no recursion)
  - news_likes: Maintained existing policies (no recursion)
  - services: Admin check now uses helper function
  
  ## Security Model Maintained
  - Public read access for published/approved content
  - Users can manage their own data
  - Only admins can manage system-wide content
  - All policies remain restrictive and secure
*/

-- ============================================
-- STEP 1: CREATE SECURITY HELPER FUNCTION
-- ============================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Create function to check if user is an admin
-- SECURITY DEFINER allows it to bypass RLS and break recursion
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user exists in admins table
  RETURN EXISTS (
    SELECT 1 
    FROM admins 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO anon;

-- ============================================
-- STEP 2: REBUILD USER_ROLES POLICIES
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;

-- Recreate policies without recursion
CREATE POLICY "Users can read own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update roles"
  ON user_roles FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete roles"
  ON user_roles FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 3: REBUILD ADMINS POLICIES
-- ============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can read own profile" ON admins;
DROP POLICY IF EXISTS "Admins can read other admins" ON admins;
DROP POLICY IF EXISTS "Admins can manage admin records" ON admins;

-- Recreate policies without recursion
CREATE POLICY "Admins can read own profile"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all admin profiles"
  ON admins FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin records"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update admin records"
  ON admins FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete admin records"
  ON admins FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 4: REBUILD PARTNER_CATEGORIES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read partner categories" ON partner_categories;
DROP POLICY IF EXISTS "Only admins can manage partner categories" ON partner_categories;

-- Recreate policies
CREATE POLICY "Anyone can read partner categories"
  ON partner_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert partner categories"
  ON partner_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update partner categories"
  ON partner_categories FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete partner categories"
  ON partner_categories FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 5: REBUILD PARTNERS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read approved partners" ON partners;
DROP POLICY IF EXISTS "Admins can read all partners" ON partners;
DROP POLICY IF EXISTS "Partners can read own profile" ON partners;
DROP POLICY IF EXISTS "Authenticated users can create partner requests" ON partners;
DROP POLICY IF EXISTS "Partners can update own profile" ON partners;
DROP POLICY IF EXISTS "Admins can update any partner" ON partners;

-- Recreate policies
CREATE POLICY "Anyone can read approved partners"
  ON partners FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Admins can read all partners"
  ON partners FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Partners can read own profile"
  ON partners FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create partner requests"
  ON partners FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update own profile"
  ON partners FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update any partner"
  ON partners FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete partners"
  ON partners FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 6: REBUILD NEWS_CATEGORIES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read news categories" ON news_categories;
DROP POLICY IF EXISTS "Only admins can manage news categories" ON news_categories;

-- Recreate policies
CREATE POLICY "Anyone can read news categories"
  ON news_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert news categories"
  ON news_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update news categories"
  ON news_categories FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete news categories"
  ON news_categories FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 7: REBUILD NEWS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read published news" ON news;
DROP POLICY IF EXISTS "Admins can read all news" ON news;
DROP POLICY IF EXISTS "Admins can create news" ON news;
DROP POLICY IF EXISTS "Admins can update news" ON news;
DROP POLICY IF EXISTS "Admins can delete news" ON news;

-- Recreate policies
CREATE POLICY "Anyone can read published news"
  ON news FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can read all news"
  ON news FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create news"
  ON news FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update news"
  ON news FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete news"
  ON news FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 8: REBUILD NEWS_POSTS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view published posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can create posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can update posts" ON news_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON news_posts;

-- Recreate policies
CREATE POLICY "Anyone can view published posts"
  ON news_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all posts"
  ON news_posts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create posts"
  ON news_posts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update posts"
  ON news_posts FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete posts"
  ON news_posts FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 9: REBUILD NEWS_EVENTS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view events" ON news_events;
DROP POLICY IF EXISTS "Admins can create events" ON news_events;
DROP POLICY IF EXISTS "Admins can update events" ON news_events;
DROP POLICY IF EXISTS "Admins can delete events" ON news_events;

-- Recreate policies
CREATE POLICY "Anyone can view events"
  ON news_events FOR SELECT
  USING (true);

CREATE POLICY "Admins can create events"
  ON news_events FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update events"
  ON news_events FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete events"
  ON news_events FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- STEP 10: REBUILD SERVICES POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active services" ON services;
DROP POLICY IF EXISTS "Admins can read all services" ON services;
DROP POLICY IF EXISTS "Only admins can manage services" ON services;

-- Recreate policies
CREATE POLICY "Anyone can read active services"
  ON services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all services"
  ON services FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- ============================================
-- VERIFICATION COMMENTS
-- ============================================

-- All policies have been rebuilt to eliminate circular references
-- The is_admin() function breaks the recursion chain by using SECURITY DEFINER
-- Security model remains intact: public reads, users manage own data, admins manage all
-- Policies are now safe from infinite recursion errors