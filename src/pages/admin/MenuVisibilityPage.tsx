import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { RefreshCw, Eye } from 'lucide-react';
// Suppression de l'import de react-beautiful-dnd car on utilise maintenant les boutons

interface MenuItem {
  id: string;
  name: string;
  is_visible: boolean;
  path?: string;
  icon?: string;
  created_at?: string;
  updated_at?: string;
  isEditing?: boolean;
  tempName?: string;
  ordre: number;
}

const MenuVisibilityPage: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [renamingItems, setRenamingItems] = useState<Record<string, boolean>>({});
  
  // Détecter le thème du système
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Fonction pour mettre à jour le thème
    const updateTheme = () => {
      const isDark = mediaQuery.matches;
      document.documentElement.classList.toggle('dark', isDark);
    };

    // Mettre à jour le thème au chargement
    updateTheme();

    // Écouter les changements de préférence de thème
    mediaQuery.addEventListener('change', updateTheme);

    // Nettoyer l'écouteur d'événement au démontage du composant
    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_visibility')
        .select('*')
        .order('ordre', { ascending: true });

      if (error) throw error;
      
      // Si la table est vide, initialiser avec les éléments par défaut
      if (!data || data.length === 0) {
        await initializeMenuItems();
        fetchMenuItems(); // Recharger après initialisation
        return;
      }
      
      setMenuItems(data);
    } catch (error) {
      console.error('Erreur lors du chargement des menus:', error);
      toast.error('Erreur lors du chargement des menus');
    } finally {
      setLoading(false);
    }
  };

  const updateMenuOrder = async (items: MenuItem[]) => {
    try {
      const updatedItems = items.map((item, index) => ({
        ...item,
        ordre: index
      }));
      
      setMenuItems(updatedItems);
      
      const { error } = await supabase
        .from('menu_visibility')
        .upsert(updatedItems.map(({ id, name, is_visible, path, ordre }) => ({
          id,
          name,
          is_visible,
          path,
          ordre
        })));
        
      if (error) throw error;
      
      toast.success('Ordre du menu mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordre:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  };

  const selectAllItems = () => {
    if (selectedItems.size === menuItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(menuItems.map(item => item.id)));
    }
  };

  const moveItem = (direction: 'up' | 'down') => {
    const items = [...menuItems];
    const selectedIndices = menuItems
      .map((item, index) => (selectedItems.has(item.id) ? index : -1))
      .filter(index => index !== -1)
      .sort((a, b) => (direction === 'up' ? a - b : b - a));

    if (selectedIndices.length === 0) return;

    const newItems = [...items];
    
    if (direction === 'up') {
      // Déplacer vers le haut
      for (const index of selectedIndices) {
        if (index > 0 && !selectedIndices.includes(index - 1)) {
          [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        }
      }
    } else {
      // Déplacer vers le bas
      for (const index of [...selectedIndices].reverse()) {
        if (index < newItems.length - 1 && !selectedIndices.includes(index + 1)) {
          [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
      }
    }

    setMenuItems(newItems);
  };

  const saveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const updatedItems = menuItems.map((item, index) => ({
        ...item,
        ordre: index
      }));
      
      const { error } = await supabase
        .from('menu_visibility')
        .upsert(updatedItems.map(({ id, name, is_visible, path, ordre }) => ({
          id,
          name,
          is_visible,
          path,
          ordre
        })));
        
      if (error) throw error;
      
      toast.success('Ordre des menus enregistré avec succès');
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ordre:', error);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
    } finally {
      setIsSavingOrder(false);
    }
  };


  const initializeMenuItems = async () => {
    const defaultItems = [
      { name: 'Accueil', path: '/', is_visible: true, ordre: 0 },
      { name: 'Services', path: '/services', is_visible: true, ordre: 1 },
      { name: 'Actualités', path: '/actualites', is_visible: true, ordre: 2 },
      { name: 'Recrutement', path: '/recrutement', is_visible: true, ordre: 3 },
      { name: 'Contact', path: '/contact', is_visible: true, ordre: 4 },
      { name: 'Espace client', path: '/espace-client', is_visible: true, ordre: 5 },
    ];

    const { error } = await supabase
      .from('menu_visibility')
      .upsert(defaultItems, { onConflict: 'name' });

    if (error) throw error;
  };

  const toggleVisibility = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (!item) {
        console.error('Élément non trouvé avec l\'ID:', id);
        return;
      }

      const newVisibility = !item.is_visible;
      console.log('Tentative de mise à jour de la visibilité:', { id, newVisibility });
      
      // Marquer cet élément comme en cours de mise à jour
      setUpdatingItems(prev => ({ ...prev, [id]: true }));
      
      // Vérifier la session utilisateur
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }
      console.log('Utilisateur connecté:', user.email);
      
      // Vérification simplifiée pour le débogage
      console.log('Vérification des droits administrateur...');
      
      // Vérification basique de l'authentification uniquement
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }
      
      // Pour le débogage, on accepte la mise à jour si l'utilisateur est authentifié
      // À REMPLACER PAR UNE VÉRIFICATION D'ADMINISTRATEUR EN PRODUCTION
      console.warn('ATTENTION: Vérification des droits administrateur désactivée pour le débogage');
      
      // Mise à jour directe simple avec gestion des erreurs
      console.log('Tentative de mise à jour directe...');
      
      try {
        // Mise à jour directe avec retour des données mises à jour
        const { data: updatedData, error: updateError } = await supabase
          .from('menu_visibility')
          .update({ 
            is_visible: newVisibility,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();
          
        if (updateError) {
          console.error('Erreur lors de la mise à jour directe:', updateError);
          
          // Si l'erreur est liée à RLS, afficher un message d'erreur plus clair
          if (updateError.message.includes('row-level security')) {
            throw new Error('Permission refusée. Vérifiez les politiques RLS pour la table menu_visibility.');
          }
          
          throw updateError;
        }
        
        console.log('Mise à jour réussie:', updatedData);
        
        // Mise à jour de l'état local avec les données du serveur
        // Mise à jour optimiste de l'interface
        setMenuItems(prevItems => 
          prevItems.map(item => 
            item.id === id ? { ...item, ...updatedData } : item
          )
        );
        
        
        // Attendre un court instant pour que l'animation soit visible
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error('Échec de la mise à jour:', error);
        
        // Si c'est une erreur de permission, proposer une solution
        if (error instanceof Error && (error.message.includes('permission') || error.message.includes('row-level security'))) {
          console.error('Solution possible : Exécutez le script SQL suivant dans l\'éditeur SQL Supabase :');
          console.error(`-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE menu_visibility ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre les mises à jour
CREATE POLICY "Autoriser les mises à jour pour les utilisateurs authentifiés"
ON menu_visibility
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);`);
        }
        
        throw error;
      }
      
      toast.success('Visibilité mise à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(`Erreur lors de la mise à jour: ${error?.message || 'Erreur inconnue'}`);
      
      // Vérifier si c'est une erreur d'authentification ou de permission
      if (error?.message?.includes('permission denied') || error?.code === '42501') {
        console.error('Erreur de permission - Vérifiez les politiques RLS et les rôles');
      }
      
      // Annuler la mise à jour en cas d'erreur
      setMenuItems(prevItems => [...prevItems]);
    } finally {
      // Réinitialiser l'état de chargement pour cet élément
      setUpdatingItems(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };


  const saveName = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (!item || !item.tempName?.trim()) {
        toast.error('Le nom ne peut pas être vide');
        return;
      }

      setRenamingItems(prev => ({ ...prev, [id]: true }));

      // Mettre à jour dans la base de données
      const { error } = await supabase
        .from('menu_visibility')
        .update({ 
          name: item.tempName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // Mettre à jour l'état local en préservant l'ordre
      setMenuItems(currentItems => 
        currentItems.map(currentItem => 
          currentItem.id === id 
            ? { 
                ...currentItem, 
                name: item.tempName?.trim() || currentItem.name, 
                isEditing: false,
                tempName: undefined,
                updated_at: new Date().toISOString()
              } 
            : currentItem
        )
      );

      toast.success('Nom du menu mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du nom:', error);
      toast.error('Erreur lors de la mise à jour du nom');
    } finally {
      setRenamingItems(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const cancelEditing = (id: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === id 
        ? { ...item, isEditing: false, tempName: undefined } 
        : item
    ));
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const refreshData = async () => {
    setLoading(true);
    try {
      await fetchMenuItems();
      toast.success('Données actualisées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      toast.error('Erreur lors de l\'actualisation des données');
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  const activeMenuItems = menuItems.filter(item => item.is_visible);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto p-4 pt-20">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestion de la visibilité du menu</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePreview}
              className={`flex items-center px-4 py-2 ${
                isPreviewOpen 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              } rounded-md text-sm font-medium transition-colors duration-200 border border-gray-200 dark:border-gray-700`}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreviewOpen ? 'Masquer l\'aperçu' : 'Aperçu du menu'}
            </button>
            <button
              onClick={refreshData}
              className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors duration-200"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Chargement...' : 'Rafraîchir'}
            </button>
          </div>
        </div>

        {/* Aperçu compact avec animation */}
        {isPreviewOpen && (
        <div className="mb-4 p-3 bg-white rounded-md shadow-sm border border-gray-100 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between text-sm">
            {/* Logo compact */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                SG
              </div>
              <span className="font-semibold text-gray-800">SHIPPING GL</span>
            </div>
            
            {/* Menu items avec animation */}
            <div className="flex-1 flex items-center justify-center space-x-2 mx-4 overflow-x-auto py-1">
              {activeMenuItems.map((item) => (
                <span 
                  key={item.id}
                  className={`px-2 py-1 text-xs whitespace-nowrap rounded transition-all duration-200 ease-in-out transform hover:scale-105 text-gray-600 hover:text-red-600 ${updatingItems[item.id] ? 'opacity-50' : 'opacity-100'}`}
                >
                  {updatingItems[item.id] ? (
                    <span className="inline-flex items-center">
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {item.name}
                    </span>
                  ) : item.name}
                </span>
              ))}
            </div>
            
            {/* Contrôles de droite */}
            <div className="flex items-center space-x-2 text-gray-500">
              <span className="text-xs">Français</span>
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            Aperçu - {activeMenuItems.length} éléments visibles
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200 border border-gray-200 dark:border-gray-700">
        {/* Barre d'actions */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={() => moveItem('up')}
              disabled={selectedItems.size === 0}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                selectedItems.size > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600'
              } transition-colors duration-200`}
            >
              Monter
            </button>
            <button
              onClick={() => moveItem('down')}
              disabled={selectedItems.size === 0}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                selectedItems.size > 0
                  ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-600'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600'
              } transition-colors duration-200`}
            >
              Descendre
            </button>
          </div>
          <button
            onClick={saveOrder}
            disabled={isSavingOrder}
            className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center border ${
              isSavingOrder
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border-gray-200 dark:border-gray-600'
                : 'bg-green-500 text-white hover:bg-green-600 border-green-600'
            } transition-colors duration-200`}
          >
            {isSavingOrder ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              'Enregistrer l\'ordre'
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === menuItems.length && menuItems.length > 0}
                    onChange={selectAllItems}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Élément du menu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {menuItems.map((item, index) => (
                <tr 
                  key={item.id}
                  className={`${selectedItems.has(item.id) ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center group">
                      {item.isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={item.tempName || item.name}
                            onChange={(e) => setMenuItems(menuItems.map(i => 
                              i.id === item.id ? { ...i, tempName: e.target.value } : i
                            ))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveName(item.id);
                              if (e.key === 'Escape') cancelEditing(item.id);
                            }}
                            className="border rounded px-2 py-1 text-sm w-48 bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveName(item.id)}
                            disabled={renamingItems[item.id]}
                            className="text-green-500 hover:text-green-700 disabled:opacity-50"
                            title="Enregistrer"
                          >
                            {renamingItems[item.id] ? (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              '✓'
                            )}
                          </button>
                          <button
                            onClick={() => cancelEditing(item.id)}
                            disabled={renamingItems[item.id]}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                            title="Annuler"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <span>{item.name}</span>
                          <button
                            onClick={() => setMenuItems(menuItems.map(i => 
                              i.id === item.id ? { ...i, isEditing: true, tempName: i.name } : i
                            ))}
                            className="ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Renommer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.is_visible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.is_visible ? 'Visible' : 'Caché'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    <div className="flex items-center justify-end">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={item.is_visible}
                          onChange={() => toggleVisibility(item.id)}
                          disabled={updatingItems[item.id] || loading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default MenuVisibilityPage;
