/*
  # Fix is_admin Function to Use user_roles Table
  
  This migration updates the is_admin() function to check the user_roles table
  instead of the removed admins table. Since many RLS policies depend on this function,
  we use CASCADE to drop it and then recreate all dependent policies.
  
  ## Changes
  
  1. Drop and recreate is_admin function
    - Remove reference to admins table
    - Update to check user_roles table for 'admin' role
    - Use CASCADE to handle dependent policies
  
  2. Recreate RLS policies that depend on is_admin
    - User roles policies
    - Partner categories policies
    - Partners policies
    - News policies
    - Services policies
  
  ## Security
    - Function checks user_roles table with proper role verification
    - All RLS policies are recreated with same logic
*/

-- ============================================
-- DROP AND RECREATE is_admin FUNCTION
-- ============================================

DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;

CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  -- Check if user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = user_uuid
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RECREATE USER_ROLES POLICIES
-- ============================================

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
-- RECREATE PARTNER_CATEGORIES POLICIES
-- ============================================

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
-- RECREATE PARTNERS POLICIES
-- ============================================

CREATE POLICY "Admins can read all partners"
  ON partners FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

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
-- RECREATE NEWS POLICIES
-- ============================================

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
-- RECREATE SERVICES POLICIES
-- ============================================

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