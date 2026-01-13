import React, { useState, useCallback } from 'react';
import { Save, X, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useMenuItems } from '../../hooks/useMenuItems';
import type { MenuItem } from '../../hooks/useMenuItems';

const MenuSitesPage: React.FC = () => {
  const {
    menuItems,
    hasUnsavedChanges,
    saveChanges,
    resetToDefault,
    moveItem,
    toggleVisibility,
    toggleEditMode,
    saveEdit,
    updateItem
  } = useMenuItems();

  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ 
    name: '', 
    path: '',
    is_visible: true,
    order: 0
  });

  const handleAddItem = useCallback(() => {
    if (!newItem.name || !newItem.path) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const newMenuItem: MenuItem = {
      id: `item-${Date.now()}`,
      name: newItem.name,
      path: newItem.path.startsWith('/') ? newItem.path : `/${newItem.path}`,
      is_visible: newItem.is_visible ?? true,
      order: menuItems.length > 0 ? Math.max(...menuItems.map(i => i.order)) + 1 : 0,
      icon: newItem.icon || ''
    };

    // Mise à jour via le hook useMenuItems
    updateItem(newMenuItem.id, newMenuItem);
    setNewItem({ name: '', path: '', is_visible: true });
    setIsAdding(false);
  }, [newItem, menuItems, saveChanges]);

  const handleSaveChanges = useCallback(() => {
    saveChanges();
  }, [saveChanges]);


  return (
    <div className="container mx-auto p-4 md:p-6 mt-20 md:mt-6">
      <div className="flex justify-between items-center mb-6 mt-10">
        <h1 className="text-2xl font-bold dark:text-white text-black">Gestion du menu du site</h1>
      </div>

      {/* Formulaire d'ajout masqué par défaut */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Nouvel élément de menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={newItem.name || ''}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                placeholder="Accueil"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lien <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  /
                </span>
                <input
                  type="text"
                  className="input input-bordered w-full rounded-l-none"
                  value={newItem.path || ''}
                  onChange={(e) => setNewItem({...newItem, path: e.target.value})}
                  placeholder="chemin-sans-slash"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddItem}
                className="btn btn-primary w-full"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-base-200 rounded-lg shadow-lg overflow-hidden border border-base-300">

        {menuItems.length === 0 ? (
          <div className="p-8 text-center text-base-content/70">
            Aucun élément de menu pour le moment. Commencez par en ajouter un.
          </div>
        ) : (
          <ul className="divide-y divide-base-300">
            {menuItems.map((item, index) => (
              <li 
                key={item.id} 
                className={`hover:bg-base-100 transition-colors ${index % 2 === 0 ? 'bg-base-200' : 'bg-base-100'}`}
              >
                <div className="px-4 py-3 flex items-center">
                  <div className="flex items-center flex-1">
                    <div className="flex-1">
                      {item.isEditing ? (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            className="input input-bordered input-sm w-64"
                            value={item.tempName || ''}
                            onChange={(e) => {
                              updateItem(item.id, { tempName: e.target.value });
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center">
                            <span className="text-gray-500 mr-1">/</span>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-48"
                              value={item.tempPath?.startsWith('/') ? item.tempPath.substring(1) : item.tempPath || ''}
                              onChange={(e) => {
                                updateItem(item.id, { tempPath: e.target.value });
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className={`font-medium ${!item.is_visible ? 'opacity-50' : 'text-base-content'}`}>
                            {item.name.replace(/^\/\//, '')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => moveItem(item.id, 'up')}
                        className="btn btn-ghost btn-sm btn-square hover:bg-base-300 transition-colors"
                        disabled={menuItems.findIndex(i => i.id === item.id) === 0}
                        title="Monter"
                      >
                        <ArrowUp className="w-6 h-6 hover:scale-110 transition-transform" />
                      </button>
                      <button
                        onClick={() => moveItem(item.id, 'down')}
                        className="btn btn-ghost btn-sm btn-square hover:bg-base-300 transition-colors"
                        disabled={menuItems.findIndex(i => i.id === item.id) === menuItems.length - 1}
                        title="Descendre"
                      >
                        <ArrowDown className="w-6 h-6 hover:scale-110 transition-transform" />
                      </button>
                    </div>
                    <div className="divider divider-horizontal mx-0"></div>
                    {item.isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(item)}
                          className="btn btn-ghost btn-sm text-success hover:bg-base-300 transition-colors"
                          title="Enregistrer"
                        >
                          <Save className="w-4 h-4 hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => toggleEditMode(item)}
                          className="btn btn-ghost btn-sm text-error hover:bg-base-300 transition-colors"
                          title="Annuler"
                        >
                          <X className="w-4 h-4 hover:scale-110 transition-transform" />
                        </button>
                      </>
                    ) : (
                      <>
                        <label className="relative inline-flex items-center cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={item.is_visible}
                            onChange={() => toggleVisibility(item)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500 group-hover:opacity-80"></div>
                          <span className="ml-2 text-base-content/70 group-hover:text-base-content transition-colors">
                            {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={resetToDefault}
          className="btn btn-outline btn-error flex items-center gap-2"
          disabled={!hasUnsavedChanges}
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser aux valeurs par défaut
        </button>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <div className="flex items-center px-4 text-warning">
              Vous avez des modifications non enregistrées
            </div>
          )}
          <button
            onClick={handleSaveChanges}
            className={`btn flex items-center gap-2 ${hasUnsavedChanges ? 'btn-warning' : 'btn-success'}`}
            disabled={!hasUnsavedChanges}
          >
            <Save className="w-4 h-4" />
            {hasUnsavedChanges ? 'Enregistrer les modifications' : 'Enregistré'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuSitesPage;
