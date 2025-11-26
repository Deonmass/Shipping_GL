/*
  # Update Partner Schema with Companies

  1. Changes
    - Add companies table
    - Update partners table with company relationships
    - Add constraints and relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rccm text,
  business_sector text,
  nif text,
  import_export_number text,
  is_freight_forwarder boolean DEFAULT false,
  country text,
  city text,
  street_address text,
  address_references text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add company relationship to partners
ALTER TABLE partners
  ADD COLUMN company_id uuid REFERENCES companies(id),
  ADD COLUMN is_existing_company boolean DEFAULT false;

-- Enable RLS on companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policies for companies
CREATE POLICY "Users can read companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Partners can manage associated companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.company_id = companies.id
      AND partners.user_id = auth.uid()
    )
  );

-- Update partner policies
CREATE POLICY "Partners can read associated companies"
  ON partners
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM partners p
      WHERE p.company_id = partners.company_id
      AND p.user_id = auth.uid()
    )
  );