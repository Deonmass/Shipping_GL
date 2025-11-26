/*
  # Partner Management Schema

  1. New Tables
    - partners: Main table for both physical and legal partners
    - contact_persons: Table for contact persons (for legal partners)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE partner_type AS ENUM ('physical', 'legal');
CREATE TYPE partner_status AS ENUM ('pending', 'active', 'rejected');
CREATE TYPE gender_type AS ENUM ('male', 'female');

-- Main partners table
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code text UNIQUE NOT NULL,
  partner_type partner_type NOT NULL,
  status partner_status DEFAULT 'pending',
  
  -- Physical person fields
  first_name text,
  last_name text,
  gender gender_type,
  profession text,
  profile_photo text,
  
  -- Legal person fields
  company_name text,
  rccm text,
  business_sector text,
  is_freight_forwarder boolean DEFAULT false,
  
  -- Common fields
  email text UNIQUE,
  phone text,
  nif text,
  import_export_number text,
  
  -- Address fields
  country text NOT NULL,
  city text NOT NULL,
  street_address text,
  address_references text,
  
  -- Auth fields
  username text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Contact persons for legal partners
CREATE TABLE IF NOT EXISTS contact_persons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender gender_type NOT NULL,
  email text,
  phone text,
  position text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_persons ENABLE ROW LEVEL SECURITY;

-- Policies for partners
CREATE POLICY "Partners can read own data"
  ON partners
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can update own data"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to register as partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for contact persons
CREATE POLICY "Partners can read own contact persons"
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

CREATE POLICY "Partners can manage own contact persons"
  ON contact_persons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.id = contact_persons.partner_id
      AND partners.user_id = auth.uid()
    )
  );