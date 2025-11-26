/*
  # Advanced Features Schema Migration
  
  1. New Tables
    - `comment_approvals` - Stores approval status for comments
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to post_comments)
      - `approved` (boolean, default false)
      - `approved_by` (uuid, foreign key to users)
      - `approved_at` (timestamptz)
      - `created_at` (timestamptz, default now())
    
    - `notifications` - Stores admin notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text) - 'like', 'comment_pending', 'newsletter_subscription'
      - `content` (text)
      - `related_id` (uuid) - ID of related entity
      - `read` (boolean, default false)
      - `created_at` (timestamptz, default now())
    
    - `newsletter_subscribers` - Stores newsletter email subscriptions
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `status` (text, default 'active') - 'active', 'unsubscribed'
      - `subscribed_at` (timestamptz, default now())
      - `unsubscribed_at` (timestamptz)
    
    - `role_permissions` - Stores granular role permissions
      - `id` (uuid, primary key)
      - `role` (text) - 'admin', 'user', 'partner'
      - `resource` (text) - 'posts', 'comments', 'users', etc.
      - `can_add` (boolean, default false)
      - `can_edit` (boolean, default false)
      - `can_delete` (boolean, default false)
      - `can_view` (boolean, default true)
      - `created_at` (timestamptz, default now())
    
    - `user_menu_access` - Stores custom menu access for specific users
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `menu_items` (jsonb) - Array of menu item IDs
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Column Additions
    - Add `is_active` to `news_posts` - Controls post visibility
    - Add `event_date` to `news_posts` - For posts linked to events
    - Add `approved` to `post_comments` - Comment approval status
    - Add `is_visible` to `post_comments` - Comment visibility control
    - Add `is_visible` to `post_likes` - Like visibility control
    - Add `is_visible` to `news_events` - Event visibility control

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated admin users
*/

-- Add new columns to existing tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_posts' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE news_posts ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_posts' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE news_posts ADD COLUMN event_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'approved'
  ) THEN
    ALTER TABLE post_comments ADD COLUMN approved boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_comments' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE post_comments ADD COLUMN is_visible boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'post_likes' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE post_likes ADD COLUMN is_visible boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_events' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE news_events ADD COLUMN is_visible boolean DEFAULT true;
  END IF;
END $$;

-- Create comment_approvals table
CREATE TABLE IF NOT EXISTS comment_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES post_comments(id) ON DELETE CASCADE,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comment_approvals ENABLE ROW LEVEL SECURITY;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  content text NOT NULL,
  related_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  status text DEFAULT 'active',
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  resource text NOT NULL,
  can_add boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_view boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, resource)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create user_menu_access table
CREATE TABLE IF NOT EXISTS user_menu_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  menu_items jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_menu_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment_approvals
CREATE POLICY "Admins can view all comment approvals"
  ON comment_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert comment approvals"
  ON comment_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update comment approvals"
  ON comment_approvals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for newsletter_subscribers
CREATE POLICY "Admins can view all subscribers"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage subscribers"
  ON newsletter_subscribers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for role_permissions
CREATE POLICY "Admins can view all role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage role permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for user_menu_access
CREATE POLICY "Users can view own menu access"
  ON user_menu_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all menu access"
  ON user_menu_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comment_approvals_comment_id ON comment_approvals(comment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_menu_access_user_id ON user_menu_access(user_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_is_active ON news_posts(is_active);
CREATE INDEX IF NOT EXISTS idx_post_comments_approved ON post_comments(approved);

-- Insert default role permissions for admin role
INSERT INTO role_permissions (role, resource, can_add, can_edit, can_delete, can_view)
VALUES 
  ('admin', 'posts', true, true, true, true),
  ('admin', 'comments', true, true, true, true),
  ('admin', 'users', true, true, true, true),
  ('admin', 'events', true, true, true, true),
  ('admin', 'categories', true, true, true, true),
  ('admin', 'likes', false, false, true, true),
  ('admin', 'newsletter', true, true, true, true),
  ('user', 'posts', false, false, false, true),
  ('user', 'comments', true, true, false, true),
  ('partner', 'posts', false, false, false, true)
ON CONFLICT (role, resource) DO NOTHING;

-- Update existing comments to be approved by default for smooth transition
UPDATE post_comments SET approved = true WHERE approved = false;
