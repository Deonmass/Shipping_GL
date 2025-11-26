/*
  # Create News Categories Table and Seed Categories
  
  This migration creates a dedicated news_categories table for managing
  post categories with proper structure and seeds it with predefined categories.
  
  ## New Tables
  
  1. `news_categories`
    - `id` (text, primary key) - Category slug/identifier
    - `name` (text) - Display name (will be translated via i18n)
    - `slug` (text, unique) - URL-friendly slug
    - `icon` (text) - Icon name for display
    - `description` (text) - Category description
    - `sort_order` (integer) - Display order
    - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
    - Enable RLS on news_categories table
    - Anyone can read categories (public access)
    - Only admins can manage categories
  
  ## Seed Data
    - Insert 7 predefined categories: operations, conferences, events, 
      meetings, official, awards, partnerships
    - Each category has icon mapping and sort order
*/

-- ============================================
-- STEP 1: DROP EXISTING TABLE IF EXISTS
-- ============================================

DROP TABLE IF EXISTS news_categories CASCADE;

-- ============================================
-- STEP 2: CREATE NEWS CATEGORIES TABLE
-- ============================================

CREATE TABLE news_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text DEFAULT 'tag',
  description text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view categories"
  ON news_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON news_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_news_categories_slug ON news_categories(slug);
CREATE INDEX idx_news_categories_sort_order ON news_categories(sort_order);

-- ============================================
-- STEP 3: SEED CATEGORIES
-- ============================================

INSERT INTO news_categories (id, name, slug, icon, description, sort_order)
VALUES
  ('operations', 'Operations', 'operations', 'briefcase', 'Operational updates and logistics news', 1),
  ('conferences', 'Conferences', 'conferences', 'users', 'Conference participation and industry events', 2),
  ('events', 'Events', 'events', 'calendar', 'Company events and gatherings', 3),
  ('meetings', 'Meetings', 'meetings', 'user', 'Business meetings and partnerships', 4),
  ('official', 'Official', 'official', 'megaphone', 'Official announcements and communications', 5),
  ('awards', 'Awards', 'awards', 'award', 'Awards and recognitions', 6),
  ('partnerships', 'Partnerships', 'partnerships', 'building', 'Partnership announcements', 7);