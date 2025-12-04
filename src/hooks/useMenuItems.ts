import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface MenuItem {
  id: string;
  name: string;
  path: string;
  is_visible: boolean;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

// Menu par défaut basé sur la capture d'écran fournie avec les UUID d'origine
const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'ea4e09d6-ac1b-4752-a66d-4b6cbdf3fe2c', name: 'Accueil', path: '/', is_visible: true, icon: 'home' },
  { id: '2aa85962-79a5-4b10-b651-b7b2e860c4c3', name: 'Recrutement', path: '/recrutement', is_visible: true, icon: 'briefcase' },
  { id: '3215482c-1cbc-4bd3-a717-315ea9dbd3d4', name: 'Services', path: '/services', is_visible: true, icon: 'settings' },
  { id: 'b6f9dd5f-c337-4765-83af-533d6d97e5eb', name: 'Contact', path: '/contact', is_visible: true, icon: 'mail' },
  { id: 'd2363fd2-059e-4e40-9fc7-b6194b191033', name: 'Actualités', path: '/actualites', is_visible: true, icon: 'newspaper' },
  { id: 'db8122a8-4f46-4bf5-b5c1-14af48aa4385', name: 'Partenaires', path: '/partenaires', is_visible: true, icon: 'handshake' },
  { id: 'dbe6b88c-cc23-4121-af12-69a9e7ce5e47', name: 'À propos', path: '/a-propos', is_visible: true, icon: 'info' },
  { id: 'eed67e5e-99bf-4d18-a246-299da08c962e', name: 'Engagement', path: '/engagement', is_visible: true, icon: 'award' },
];

const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUsingDefault, setIsUsingDefault] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('menu_visibility')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Erreur lors de la récupération du menu:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          setMenuItems(data);
          setIsUsingDefault(false);
        } else {
          // Si aucun élément de menu n'est retourné, on garde le menu par défaut
          setIsUsingDefault(true);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du menu:', err);
        setError(err as Error);
        setIsUsingDefault(true);
      } finally {
        setLoading(false);
      }
    };

    // Délai artificiel pour éviter le clignotement du menu par défaut si le chargement est rapide
    const timer = setTimeout(() => {
      fetchMenuItems();
    }, 300); // 300ms de délai avant de charger le menu

    return () => clearTimeout(timer);
  }, []);

  // Pendant le chargement ou en cas d'erreur, on retourne le menu par défaut
  const itemsToDisplay = loading || isUsingDefault ? DEFAULT_MENU_ITEMS : menuItems;

  return { 
    menuItems: itemsToDisplay, 
    loading, 
    error,
    isUsingDefault
  };
};

export default useMenuItems;
