import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MenuItem {
  id: string;
  name: string;
  path: string;
  is_visible: boolean;
}

const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
        }
      } catch (err) {
        console.error('Erreur lors du chargement du menu:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  return { 
    menuItems, 
    loading, 
    error 
  };
};

export default useMenuItems;
