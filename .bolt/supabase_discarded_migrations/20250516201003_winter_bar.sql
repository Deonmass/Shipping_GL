/*
  # Quotation Management Schema

  1. New Tables
    - quotations: Main table for quotation requests
    - quotation_documents: Table for uploaded documents

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE transport_mode AS ENUM ('air', 'ocean', 'road');
CREATE TYPE movement_type AS ENUM ('import', 'export');
CREATE TYPE currency_type AS ENUM ('USD', 'EUR', 'CDF');
CREATE TYPE unit_measure AS ENUM ('cm', 'mm', 'm');
CREATE TYPE container_type AS ENUM ('dry', 'reefer', 'other');
CREATE TYPE container_size AS ENUM ('20', '40');
CREATE TYPE container_owner AS ENUM ('soc', 'coc');
CREATE TYPE customs_regime AS ENUM ('exoneration', 'full_tax');
CREATE TYPE quotation_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

-- Main quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  status quotation_status DEFAULT 'pending',
  
  -- Movement info
  movement_type movement_type NOT NULL,
  transport_mode transport_mode NOT NULL,
  
  -- General info
  nature text NOT NULL,
  origin text NOT NULL,
  final_delivery_location text NOT NULL,
  cargo_type text NOT NULL,
  dg_info text,
  client_reference text,
  currency currency_type NOT NULL,
  transit_time text NOT NULL,
  
  -- Cargo value
  fob_value numeric NOT NULL,
  insurance numeric NOT NULL,
  freight_value numeric NOT NULL,
  cif_value numeric GENERATED ALWAYS AS (fob_value + insurance + freight_value) STORED,
  
  -- Dimensions
  uom unit_measure NOT NULL,
  length numeric NOT NULL,
  width numeric NOT NULL,
  height numeric NOT NULL,
  pieces integer NOT NULL,
  volume numeric,
  gross_weight numeric NOT NULL,
  chargeable_weight numeric,
  
  -- Air freight specific
  departure_airport text,
  arrival_airport text,
  awb_number text,
  airline text,
  
  -- Ocean freight specific
  pol text,
  pod text,
  shipment_mode text,
  bl_number text,
  shipping_line text,
  container_type container_type,
  container_type_specification text,
  container_size container_size,
  container_owner_type container_owner,
  
  -- Common fields
  customs_regime customs_regime,
  incoterm text,
  importer text,
  total_batch text,
  terminal text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Documents table
CREATE TABLE IF NOT EXISTS quotation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size integer NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_documents ENABLE ROW LEVEL SECURITY;

-- Policies for quotations
CREATE POLICY "Users can read own quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quotations"
  ON quotations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for documents
CREATE POLICY "Users can read own documents"
  ON quotation_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_documents.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload documents"
  ON quotation_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quotations
      WHERE quotations.id = quotation_documents.quotation_id
      AND quotations.user_id = auth.uid()
    )
  );