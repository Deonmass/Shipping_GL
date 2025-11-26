/*
  # Update Partner Schema Constraints

  1. Changes
    - Make gender field optional in partners table
    - Make gender field optional in contact_persons table
    - Make several fields optional in partners table

  2. Security
    - Maintain existing RLS policies
*/

-- Update partners table constraints
ALTER TABLE partners
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN profession DROP NOT NULL,
  ALTER COLUMN nif DROP NOT NULL,
  ALTER COLUMN import_export_number DROP NOT NULL,
  ALTER COLUMN country DROP NOT NULL,
  ALTER COLUMN city DROP NOT NULL;

-- Update contact_persons table constraints
ALTER TABLE contact_persons
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN position DROP NOT NULL;