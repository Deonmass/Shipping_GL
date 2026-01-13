// src/hooks/useMenuItems.ts
import { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export interface MenuItem {
  id: string;
  name: string;
  path?: string;
  is_visible: boolean;
  icon?: string;
  order: number;
  isEditing?: boolean;
  tempName?: string;
  tempPath?: string;
  children?: MenuItem[];
  parentId?: string | null;
}

const STORAGE_KEY = 'site_menu_items';

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Accueil', path: '/', is_visible: true, icon: 'home', order: 0, parentId: null },
  { id: '2', name: 'Recrutement', path: '/recrutement', is_visible: true, icon: 'briefcase', order: 1, parentId: null },
  { id: '3', name: 'Services', path: '/services', is_visible: true, icon: 'settings', order: 2, parentId: null },
  { id: '4', name: 'Contact', path: '/contact', is_visible: true, icon: 'mail', order: 3, parentId: null },
  { id: '5', name: 'Actualités', path: '/actualites', is_visible: true, icon: 'newspaper', order: 4, parentId: null },
  { id: '6', name: 'Partenaires', path: '/partenaires', is_visible: true, icon: 'handshake', order: 5, parentId: null },
  { id: '7', name: 'À propos', path: '/a-propos', is_visible: true, icon: 'info', order: 6, parentId: null },
  { id: '8', name: 'Engagement', path: '/engagement', is_visible: true, icon: 'award', order: 7, parentId: null },
  
];

const loadMenuItems = (): MenuItem[] => {
  if (typeof window === 'undefined') return DEFAULT_MENU_ITEMS;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_MENU_ITEMS;
  } catch (error) {
    console.error('Failed to load menu items:', error);
    return DEFAULT_MENU_ITEMS;
  }
};

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => loadMenuItems());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sauvegarder les modifications dans le localStorage
  const saveChanges = useCallback((items?: MenuItem[]) => {
    const itemsToSave = items || menuItems;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
      if (items) {
        setMenuItems(items);
      }
      setHasUnsavedChanges(false);
      toast.success('Menu enregistré avec succès');
      return true;
    } catch (error) {
      console.error('Failed to save menu items:', error);
      toast.error('Erreur lors de la sauvegarde du menu');
      return false;
    }
  }, [menuItems]);

  // Réinitialiser aux valeurs par défaut
  const resetToDefault = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser le menu aux valeurs par défaut ?')) {
      setMenuItems(DEFAULT_MENU_ITEMS);
      saveChanges(DEFAULT_MENU_ITEMS);
      toast.success('Menu réinitialisé avec succès');
    }
  }, [saveChanges]);

  // Mettre à jour un élément du menu
  const updateItem = useCallback((id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prevItems => {
      const updateItemRecursively = (items: MenuItem[]): MenuItem[] => {
        return items.map(item => {
          if (item.id === id) {
            return { ...item, ...updates };
          }
          if (item.children) {
            return {
              ...item,
              children: updateItemRecursively(item.children)
            };
          }
          return item;
        });
      };
      
      const updated = updateItemRecursively(prevItems);
      setHasUnsavedChanges(true);
      return updated;
    });
  }, []);

  // Fonction récursive pour trouver un élément par son ID
  const findItemById = (items: MenuItem[], id: string): MenuItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Fonction récursive pour mettre à jour l'ordre des éléments
  const updateOrderRecursively = (items: MenuItem[]): MenuItem[] => {
    return items.map((item, index) => ({
      ...item,
      order: index,
      ...(item.children && { children: updateOrderRecursively(item.children) })
    }));
  };

  // Déplacer un élément
  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    setMenuItems(prevItems => {
      const findAndMove = (items: MenuItem[]): MenuItem[] => {
        // Trouver l'index de l'élément à déplacer
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
          // Si on trouve l'élément dans ce niveau
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          
          // Vérifier les limites
          if (newIndex >= 0 && newIndex < items.length) {
            const newItems = [...items];
            [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
            return newItems;
          }
          return items;
        }
        
        // Si l'élément n'est pas trouvé, chercher dans les enfants
        return items.map(item => {
          if (item.children) {
            return {
              ...item,
              children: findAndMove(item.children)
            };
          }
          return item;
        });
      };
      
      const updatedItems = findAndMove(prevItems);
      
      // Mettre à jour les ordres de manière récursive
      return updateOrderRecursively(updatedItems);
    });
  }, []);

  // Fonction pour aplatir les menus avec leurs enfants
  const getFlattenedMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.reduce<MenuItem[]>((acc, item) => {
      const newItem = { ...item };
      delete newItem.children; // Supprimer les enfants pour éviter la récursion infinie
      
      // Si l'élément a des enfants et est visible, on ajoute d'abord l'élément parent
      if (item.children && item.is_visible) {
        return [...acc, newItem, ...getFlattenedMenuItems(item.children)];
      }
      
      // Sinon, on l'ajoute seulement s'il est visible
      return item.is_visible ? [...acc, newItem] : acc;
    }, []);
  };

  // Basculer la visibilité d'un élément
  const toggleVisibility = useCallback((item: MenuItem) => {
    updateItem(item.id, { is_visible: !item.is_visible });
  }, [updateItem]);

  // Basculer le mode édition d'un élément
  const toggleEditMode = useCallback((item: MenuItem) => {
    updateItem(item.id, { 
      isEditing: !item.isEditing,
      ...(item.isEditing ? {} : { 
        tempName: item.name, 
        tempPath: item.path || '' 
      })
    });
  }, [updateItem]);

  // Enregistrer les modifications d'un élément
  const saveEdit = useCallback((item: MenuItem) => {
    if (!item.tempName || !item.tempPath) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    updateItem(item.id, {
      name: item.tempName,
      path: item.tempPath.startsWith('/') ? item.tempPath : `/${item.tempPath}`,
      isEditing: false,
      tempName: undefined,
      tempPath: undefined
    });
  }, [updateItem]);

  // Récupérer les éléments de menu visibles (aplatis)
  const visibleMenuItems = useMemo(() => {
    return getFlattenedMenuItems(menuItems);
  }, [menuItems]);

  return {
    menuItems,
    visibleMenuItems,
    hasUnsavedChanges,
    saveChanges: () => saveChanges(menuItems),
    resetToDefault,
    updateItem,
    moveItem,
    toggleVisibility,
    toggleEditMode,
    saveEdit
  };
};

export default useMenuItems;