/*
  # Fix Registration Schema

  1. Changes
    - Add missing indexes for performance
    - Add missing constraints
    - Fix foreign key relationships

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_company_id ON partners(company_id);
CREATE INDEX IF NOT EXISTS idx_contact_persons_partner_id ON contact_persons(partner_id);

-- Add missing constraints
ALTER TABLE partners
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN username SET NOT NULL,
  ALTER COLUMN user_id SET NOT NULL;

-- Add ON DELETE CASCADE to contact_persons foreign key if not exists
DO $$ 
BEGIN
  ALTER TABLE contact_persons 
    DROP CONSTRAINT IF EXISTS contact_persons_partner_id_fkey,
    ADD CONSTRAINT contact_persons_partner_id_fkey 
    FOREIGN KEY (partner_id) 
    REFERENCES partners(id) 
    ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;