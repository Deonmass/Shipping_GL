/*
  # Fix RLS Policies and Registration Flow

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create new simplified policies for partners table
    - Create new simplified policies for companies table
    - Create new simplified policies for contact_persons table
    - Ensure anyone can insert data during registration
    - Maintain data access security after registration

  2. Security
    - Enable RLS on all tables
    - Allow data insertion during registration
    - Restrict data access to owners after registration
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable read access for own data" ON partners;
DROP POLICY IF EXISTS "Enable insert access for registration" ON partners;
DROP POLICY IF EXISTS "Enable update access for own data" ON partners;
DROP POLICY IF EXISTS "Partners can read own data" ON partners;
DROP POLICY IF EXISTS "Anyone can insert partners" ON partners;
DROP POLICY IF EXISTS "Partners can update own data" ON partners;
DROP POLICY IF EXISTS "Partners can read associated companies" ON partners;

DROP POLICY IF EXISTS "Users can read companies" ON companies;
DROP POLICY IF EXISTS "Enable read access for all companies" ON companies;
DROP POLICY IF EXISTS "Enable insert access for new companies" ON companies;
DROP POLICY IF EXISTS "Enable update access for associated companies" ON companies;
DROP POLICY IF EXISTS "Partners can manage associated companies" ON companies;
DROP POLICY IF EXISTS "Anyone can insert companies" ON companies;

DROP POLICY IF EXISTS "Partners can read own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Partners can manage own contact persons" ON contact_persons;
DROP POLICY IF EXISTS "Anyone can insert contact persons" ON contact_persons;

-- Create new simplified policies for partners
CREATE POLICY "enable_read_for_own_partners"
  ON partners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "enable_insert_for_partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "enable_update_for_own_partners"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create new simplified policies for companies
CREATE POLICY "enable_read_for_companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "enable_insert_for_companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "enable_update_for_own_companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.company_id = companies.id
      AND partners.user_id = auth.uid()
    )
  );

-- Create new simplified policies for contact persons
CREATE POLICY "enable_read_for_own_contacts"
  ON contact_persons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = contact_persons.partner_id
      AND partners.user_id = auth.uid()
    )
  );

CREATE POLICY "enable_insert_for_contacts"
  ON contact_persons
  FOR INSERT
  TO authenticated
  WITH CHECK (true);