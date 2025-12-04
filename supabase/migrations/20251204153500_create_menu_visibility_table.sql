-- Création de la table menu_visibility
CREATE TABLE IF NOT EXISTS public.menu_visibility (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT,
  is_visible BOOLEAN DEFAULT true,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT menu_visibility_name_key UNIQUE (name)
);

-- Ajout des commentaires
COMMENT ON TABLE public.menu_visibility IS 'Gestion de la visibilité des éléments du menu principal';
COMMENT ON COLUMN public.menu_visibility.name IS 'Nom affiché du menu';
COMMENT ON COLUMN public.menu_visibility.path IS 'Chemin de la route';
COMMENT ON COLUMN public.menu_visibility.is_visible IS 'Indique si le menu est visible';
COMMENT ON COLUMN public.menu_visibility.icon IS 'Icône associée au menu (optionnel)';

-- Ajout de la politique RLS (Row Level Security)
ALTER TABLE public.menu_visibility ENABLE ROW LEVEL SECURITY;

-- Politique d'accès : lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Enable read access for all authenticated users"
  ON public.menu_visibility
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique d'accès : modification réservée aux administrateurs
CREATE POLICY "Enable update for admins"
  ON public.menu_visibility
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING (is_admin());

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION public.update_menu_visibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour automatiquement le champ updated_at
CREATE TRIGGER update_menu_visibility_updated_at
BEFORE UPDATE ON public.menu_visibility
FOR EACH ROW
EXECUTE FUNCTION public.update_menu_visibility_updated_at();

-- Insertion des menus par défaut
INSERT INTO public.menu_visibility (name, path, is_visible, icon)
VALUES 
  ('Accueil', '/', true, 'home'),
  ('Services', '/services', true, 'wrench'),
  ('Actualités', '/actualites', true, 'newspaper'),
  ('Recrutement', '/recrutement', true, 'briefcase'),
  ('Contact', '/contact', true, 'mail'),
  ('Espace client', '/espace-client', true, 'user')
ON CONFLICT (name) DO NOTHING;
