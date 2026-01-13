-- Create menu_items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.menu_items IS 'Table des éléments du menu de navigation du site';
COMMENT ON COLUMN public.menu_items.name IS 'Nom affiché du menu';
COMMENT ON COLUMN public.menu_items.path IS 'Chemin de la page (sans le / initial)';
COMMENT ON COLUMN public.menu_items.is_visible IS 'Indique si l''élément est visible dans le menu';
COMMENT ON COLUMN public.menu_items.icon IS 'Icône optionnelle pour l''élément de menu';
COMMENT ON COLUMN public.menu_items."order" IS 'Ordre d''affichage dans le menu';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_order ON public.menu_items("order");
CREATE INDEX IF NOT EXISTS idx_menu_items_visible ON public.menu_items(is_visible) WHERE is_visible = true;

-- Enable RLS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Enable read access for all users"
  ON public.menu_items
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for admin users"
  ON public.menu_items
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND 
             (SELECT COUNT(*) FROM user_roles ur 
              JOIN roles r ON ur.role_id = r.id 
              WHERE ur.user_id = auth.uid() AND r.name = 'admin') > 0);

CREATE POLICY "Enable update for admin users"
  ON public.menu_items
  FOR UPDATE
  USING (auth.role() = 'authenticated' AND 
        (SELECT COUNT(*) FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = auth.uid() AND r.name = 'admin') > 0);

CREATE POLICY "Enable delete for admin users"
  ON public.menu_items
  FOR DELETE
  USING (auth.role() = 'authenticated' AND 
        (SELECT COUNT(*) FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE ur.user_id = auth.uid() AND r.name = 'admin') > 0);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default menu items if the table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.menu_items LIMIT 1) THEN
    INSERT INTO public.menu_items (name, path, is_visible, "order") VALUES
      ('Accueil', '', true, 1),
      ('Services', 'services', true, 2),
      ('Recrutement', 'recrutement', true, 3),
      ('Actualités', 'actualites', true, 4),
      ('Contact', 'contact', true, 5);
  END IF;
END $$;
