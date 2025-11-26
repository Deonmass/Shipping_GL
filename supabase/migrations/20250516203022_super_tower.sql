/*
  # Quotations Schema

  1. New Tables
    - quotations: Main table for quotation requests
    - quotation_documents: Table for storing document references

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create quotations table
CREATE TABLE IF NOT EXISTS quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL,
  movement_type text NOT NULL,
  transport_mode text NOT NULL,
  nature text NOT NULL,
  origin text NOT NULL,
  final_delivery_location text NOT NULL,
  cargo_type text NOT NULL,
  dg_info text,
  client_reference text,
  currency text,
  transit_time text,
  fob_value numeric,
  insurance numeric,
  freight_value numeric,
  cif_value numeric,
  uom text,
  length numeric,
  width numeric,
  height numeric,
  pieces integer,
  volume numeric,
  gross_weight numeric,
  chargeable_weight numeric,
  
  -- Air freight specific
  departure_airport text,
  arrival_airport text,
  awb_number text,
  airline text,
  terminal text,
  
  -- Ocean freight specific
  pol text,
  pod text,
  shipment_mode text,
  bl_number text,
  shipping_line text,
  container_type text,
  container_type_specification text,
  container_size text,
  container_owner_type text,
  
  -- Common fields
  customs_regime text,
  incoterm text,
  importer text,
  total_batch text,
  
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id)
);

-- Create quotation documents table
CREATE TABLE IF NOT EXISTS quotation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid REFERENCES quotations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_documents ENABLE ROW LEVEL SECURITY;

-- Policies for quotations
CREATE POLICY "Users can create quotations"
  ON quotations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own quotations"
  ON quotations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for quotation documents
CREATE POLICY "Users can read own quotation documents"
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

CREATE POLICY "Users can upload documents to own quotations"
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