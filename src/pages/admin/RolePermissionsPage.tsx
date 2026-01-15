import React, {useState, useEffect} from 'react';
import {useOutletContext} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Shield, Save, Plus, Trash2, AlertTriangle, X, Pencil, MoreVertical} from 'lucide-react';
import {
    UseAddRole,
    UseDeleteRole,
    UseGetRoles,
    UseUpdateRole,
    UseGetAppPermissions,
    UseGetRolesPermissions, UseUpdateRolePermissions
} from "../../services";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {permissionsOperations} from "../../constants";
import AppToast from "../../utils/AppToast.ts";
import {getAuthData} from "../../utils";

const CheckInput = ({isDark, permissions, ops, role, permission, onChange}: {
    isDark: boolean,
    permissions: any,
    ops: string,
    role: any,
    permission: any
    onChange: (value: any) => void,
}) => {

    const exists = (): boolean => {
        if(permissions && permissions[role?.id]){
            if(permissions[role?.id][permission?.id]){
                return permissions[role?.id][permission?.id]?.permission_ops?.split(",").includes(ops)
            }
        }
        return false
    }

    const toggleValue = () => {
        const perms =  permissions && permissions[role?.id]  ? permissions[role?.id][permission?.id] : [];
        let values = perms?.permission_ops
            ?.split(",")
            ?.map((v: string) => v)
            ?.filter(Boolean)

        const index = values?.indexOf(ops)
        if (index >= 0)  values.splice(index, 1)
        else {
            if(values) values.push(ops)
            else values = [`${ops}`]
        }
        onChange({
            role_id: role?.id,
            permission_id: permission?.id,
            new_permissions: values.join(",")
        })
    }

    return (
        <input
            type="checkbox"
            checked={exists()}
            onChange={() => toggleValue()}
            className={`w-5 h-5 cursor-pointer rounded-sm border-2 text-emerald-500 accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-1 ${
                isDark
                    ? 'border-emerald-400 bg-gray-800'
                    : 'border-emerald-500 bg-white'
            }`}
        />
    )
}

const RolePermissionsPage: React.FC = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';

    const {user: connectedUser} = getAuthData()

    const {data: roles, isLoading: isGettingRoles, refetch: reGetRoles, isRefetching: isReGettingRoles} = UseGetRoles()
    const {data: addResult, mutate: addRole, isPending: isAddingRole} = UseAddRole()
    const {data: updateResult, mutate: updateRole, isPending: isUpdatingRole} = UseUpdateRole()
    const {data: deleteResult, mutate: deleteRole, isPending: isDeletingRole} = UseDeleteRole()
    const {data: permissions, isPending: isGettingPermissions, refetch: reGetAppPermissions, isRefetching: isReGettingAppPermissions} = UseGetAppPermissions()
    const {data: rolesPermissions, isPending: isGettingRolesPermissions, refetch: reGetRolePermissions, isRefetching: isReGettingRolePermissions} = UseGetRolesPermissions({format: "array"})
    const {data: updateRolePermissionResult, mutate: updateRolePermissions, isPending: isUpdatingRolePermissions} = UseUpdateRolePermissions()

    const [permissionStatus, setPermissionStatus] = useState<any>();
    const [selectedRole, setSelectedRole] = useState<any>('');
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [newRole, setNewRole] = useState({title: '', description: ''});
    const [showEditRoleModal, setShowEditRoleModal] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<{ id: string, title: string; description: string }>({
        id: "",
        title: '',
        description: ''
    });
    const [actionMenuRoleId, setActionMenuRoleId] = useState<string | null>(null);

    useEffect(() => {
        if (addResult) {
            if (addResult?.responseData?.error) {
                AppToast.error(isDark, addResult?.responseData?.message || "Erreur lors de l'enregistrement")
                setShowAddRoleModal(false);
            } else {
                reGetRoles()
                AppToast.success(isDark, 'Rôle créé avec succès',)
                setNewRole({title: '', description: ''});
                setShowAddRoleModal(false);
            }
        }
    }, [addResult]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(isDark, updateResult?.responseData?.message || "Erreur lors de la modification")
                setShowAddRoleModal(false);
            } else {
                reGetRoles()
                AppToast.success(isDark, 'Rôle modifié avec succès')
                setShowEditRoleModal(null);
                setEditRole({id: '', title: '', description: ''});
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (deleteResult) {
            if (deleteResult?.responseData?.error) {
                AppToast.error(isDark, deleteResult?.responseData?.message || "Erreur lors de la suppression")
                setShowDeleteConfirm(null);
            } else {
                reGetRoles()
                AppToast.success(isDark, 'Rôle supprimé avec succès')
                setSelectedRole(null)
                setShowAddRoleModal(false);
                setShowDeleteConfirm(null);
            }
        }
    }, [deleteResult]);

    useEffect(() => {
        if (updateRolePermissionResult) {
            if (updateRolePermissionResult?.responseData?.error) {
                AppToast.error(isDark, updateRolePermissionResult?.responseData?.message || "Erreur lors de la mise a jour de permissions")
                setShowDeleteConfirm(null);
            } else {
                reGetRolePermissions()
                AppToast.success(isDark, 'Les permissions du role mises a jour avec succès')
            }
        }
    }, [updateRolePermissionResult]);

    useEffect(() => {
        if (selectedRole && rolesPermissions?.responseData?.data) {
            const permissions = rolesPermissions?.responseData?.data[selectedRole?.id]
            const temp: any = {}
            if(permissions){
                Object.values(permissions)?.forEach((item: any) => {
                    if(!temp[item?.role_id]) temp[item?.role_id] = []
                    temp[`${item?.role_id}`][`${item?.permission_id}`] = {
                        role_id: item?.role_id,
                        permission_id: item?.permission_id,
                        permission_ops: item?.permission_ops,
                        created_by: connectedUser?.id,
                    }
                })
            }
            setPermissionStatus(temp)
        }
    }, [rolesPermissions, selectedRole]);

    const handleAddRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRole.title.trim()) {
            AppToast.error(isDark, 'Le nom du rôle est requis')
            return;
        }

        addRole({
            title: newRole.title,
            description: newRole.description,
        })
    };

    const handleDeleteRole = async (roleId: string) => {
        deleteRole({id: roleId, status: "-1"})
    };

    const handleEditRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editRole?.title.trim()) {
            AppToast.error(isDark, 'Le nom du rôle est requis')
            return;
        }
        updateRole({
            id: editRole?.id,
            title: editRole?.title,
            description: editRole?.description,
        })
    }

    const handleSave = async () => {
        const result  = Object.values(permissionStatus)
            .flatMap((rolePermissions: any) => Object.values(rolePermissions))
        updateRolePermissions({role_id: selectedRole?.id, permissions: result})
    };

    const onCheckInputPress = (opsValue: any) => {
        setPermissionStatus((prev: any) => {
            return {
                ...prev,
                [opsValue.role_id]: {
                    ...(prev?.[opsValue.role_id] || {}),
                    [opsValue.permission_id]: {
                        role_id: opsValue.role_id,
                        permission_id: opsValue.permission_id,
                        permission_ops: opsValue.new_permissions,
                        created_by: connectedUser?.id,
                    },
                },
            }
        })
    }


    if (isGettingRoles || isGettingPermissions || isGettingRolesPermissions || isUpdatingRolePermissions) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div
                    className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }


    return (
        <div className="p-6 space-y-6">
            <AdminPageHeader
                Icon={<Shield className="w-6 h-6 text-primary-500"/>}
                title="Gestion des Permissions"
                onRefresh={async () => {
                    await reGetRoles()
                    await reGetRolePermissions()
                    await reGetAppPermissions()
                }}
                isRefreshing={isReGettingRoles || isReGettingAppPermissions || isReGettingRolePermissions}
            />

            {/* Légende dynamique */}
            {selectedRole && (
                <div
                    className={`rounded-lg border p-4 mt-4 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    <h3
                        className={`text-lg font-semibold mb-2 ${
                            isDark ? 'text-white' : 'text-gray-900'
                        }`}
                    >
                        Permissions du rôle "{selectedRole?.title}"
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedRole?.description}
                    </p>
                </div>
            )}

            <div className="flex space-x-6">
                {/* Liste des rôles */}
                <div
                    className={`w-80 rounded-lg border p-4 flex flex-col h-min ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    <h2 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Rôles</h2>
                    <div className="space-y-2">
                        {roles?.responseData?.data?.map((role: any) => {
                            return (
                                <div
                                    key={role?.id}
                                    className={`rounded-lg border transition-colors ${
                                        selectedRole?.id === role?.id
                                            ? isDark
                                                ? 'border-primary-500 bg-primary-600/20 hover:bg-primary-600/30'
                                                : 'border-primary-600 bg-primary-50 hover:bg-primary-100'
                                            : isDark
                                                ? 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <button
                                            onClick={() => setSelectedRole(role)}
                                            className={`text-left font-medium truncate flex-1 ${
                                                isDark ? 'text-white' : 'text-gray-900'
                                            }`}
                                        >
                                            {role?.title}
                                        </button>
                                        <div className="relative flex items-center ml-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setActionMenuRoleId(prev => (prev === role ? null : role))
                                                }
                                                className={`p-1 rounded hover:bg-gray-100 ${
                                                    isDark
                                                        ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                                                        : 'text-gray-500 hover:text-gray-900'
                                                }`}
                                                title="Actions du rôle"
                                            >
                                                <MoreVertical className="w-4 h-4"/>
                                            </button>
                                            {actionMenuRoleId === role && (
                                                <div
                                                    className={`absolute right-0 top-7 w-40 rounded-lg shadow-lg z-10 border ${
                                                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className={`w-full px-3 py-2 text-sm flex items-center gap-2   hover:bg-gray-50 ${
                                                            isDark ? 'text-blue-400 hover:bg-blue-950/40' : 'text-blue-600'
                                                        }`}
                                                        onClick={() => {
                                                            setShowEditRoleModal(role.id);
                                                            setEditRole({
                                                                id: role.id,
                                                                title: role.title,
                                                                description: role.description
                                                            });
                                                            setActionMenuRoleId(null);
                                                        }}
                                                    >
                                                        <Pencil className="w-4 h-4"/>
                                                        <span>Modifier</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-red-50 ${
                                                            isDark ? 'text-red-400 hover:bg-red-950/40' : 'text-red-600'
                                                        }`}
                                                        onClick={() => {
                                                            setShowDeleteConfirm(role.id);
                                                            setActionMenuRoleId(null);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                        <span>Supprimer</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <button
                        onClick={() => setShowAddRoleModal(true)}
                        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                    >
                        <Plus className="w-4 h-4 mr-2"/>
                        Ajouter un rôle
                    </button>
                </div>

                {/* Tableau des permissions */}
                <div
                    className={`flex-1 overflow-auto rounded-lg border p-4 flex flex-col ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr>
                                <th
                                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky left-0 ${
                                        isDark
                                            ? 'text-gray-200 bg-gray-900/40'
                                            : 'text-gray-700 bg-gray-100'
                                    }`}
                                >
                                    Code
                                </th>
                                <th
                                    className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky left-0 ${
                                        isDark
                                            ? 'text-gray-200 bg-gray-900/40'
                                            : 'text-gray-700 bg-gray-100'
                                    }`}
                                >
                                    Ressource
                                </th>
                                {permissionsOperations.map(
                                    (operation) => (
                                        <th
                                            key={operation.id}
                                            className={`px-4 py-3 text-center text-xs font-medium ${
                                                isDark ? 'text-gray-200' : 'text-gray-700'
                                            }`}
                                        >
                                            {operation.title}
                                        </th>
                                    ),
                                )}
                            </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {permissions?.responseData?.data.map((permission: any) => (
                                <tr
                                    key={permission.id}
                                    className={`${isDark ? 'hover:bg-gray-700/60' : 'hover:bg-gray-50'}`}
                                >
                                    <td
                                        className={`px-6 py-4 font-medium sticky left-0 ${
                                            isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'
                                        }`}
                                    >
                                        {permission.id}
                                    </td>
                                    <td
                                        className={`px-6 py-4 font-medium sticky left-0 ${
                                            isDark ? 'text-white bg-gray-800' : 'text-gray-900 bg-white'
                                        }`}
                                    >
                                        {permission.title}
                                    </td>
                                    {permissionsOperations.map((opsField) => selectedRole ? (
                                        <td key={opsField.id} className="px-4 py-4 text-center">
                                            <CheckInput
                                                ops={opsField?.id?.toString()}
                                                permission={permission}
                                                role={selectedRole}
                                                isDark={isDark}
                                                //permissions={rolesPermissions?.responseData?.data[selectedRole?.id] ? rolesPermissions?.responseData?.data[selectedRole?.id][permission.id] : null}
                                                permissions={permissionStatus}
                                                onChange={onCheckInputPress}
                                            />
                                            {/*<input*/}
                                            {/*    type="checkbox"*/}
                                            {/*    checked={getStatus(selectedRole, permission, `${opsField.id}`)}*/}
                                            {/*    // onChange={(e) =>*/}
                                            {/*    //     handlePermissionChange(*/}
                                            {/*    //         selectedRole,*/}
                                            {/*    //         resource,*/}
                                            {/*    //         permField as keyof Permission,*/}
                                            {/*    //         e.target.checked,*/}
                                            {/*    //     )*/}
                                            {/*    // }*/}
                                            {/*    onChange={console.log}*/}
                                            {/*    className={`w-5 h-5 cursor-pointer rounded-sm border-2 text-emerald-500 accent-emerald-500 focus:ring-emerald-500 focus:ring-offset-1 ${*/}
                                            {/*        isDark*/}
                                            {/*            ? 'border-emerald-400 bg-gray-800'*/}
                                            {/*            : 'border-emerald-500 bg-white'*/}
                                            {/*    }`}*/}
                                            {/*/>*/}
                                        </td>
                                    ) : null)}
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                    <div
                        className={`flex justify-end pt-4 mt-2 border-t ${
                            isDark ? 'border-gray-700' : 'border-gray-100'
                        }`}
                    >
                        <button
                            disabled={!selectedRole}
                            onClick={handleSave}
                            className="px-5 py-2.5 bg-primary-600 rounded-lg text-white flex items-center gap-2 hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                        >
                            <Save className="w-4 h-4"/> Enregistrer les permissions
                        </button>
                    </div>
                </div>
            </div>


            {/* Modale édition rôle */}
            {showEditRoleModal && (() => {
                return (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <motion.div
                            initial={{opacity: 0, scale: 0.95}}
                            animate={{opacity: 1, scale: 1}}
                            exit={{opacity: 0, scale: 0.95}}
                            className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Modifier le rôle
                                </h2>
                                <button
                                    onClick={() => setShowEditRoleModal(null)}
                                    className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
                                >
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>
                            <form onSubmit={handleEditRole}>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${
                                                isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Nom du rôle <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={editRole.title}
                                            onChange={(e) => setEditRole({...editRole, title: e.target.value})}
                                            className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                                isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${
                                                isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}
                                        >
                                            Description
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={editRole?.description}
                                            onChange={(e) => setEditRole({...editRole, description: e.target.value})}
                                            className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                                isDark
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEditRoleModal(null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                            isDark
                                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                                    >
                                        {isUpdatingRole ? "Chargement..." : "Enregistrer"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                );
            })()}

            {/* Modale création rôle */}
            {showAddRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Créer un nouveau rôle
                            </h2>
                            <button
                                onClick={() => setShowAddRoleModal(false)}
                                className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}
                            >
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                        <form onSubmit={handleAddRole}>
                            <div className="space-y-4">
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Nom du rôle <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newRole.title}
                                        onChange={(e) => setNewRole({...newRole, title: e.target.value})}
                                        className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        placeholder="Ex: Modérateur"
                                    />
                                </div>
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${
                                            isDark ? 'text-gray-300' : 'text-gray-700'
                                        }`}
                                    >
                                        Description
                                    </label>
                                    <textarea
                                        value={newRole.description}
                                        onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                                        rows={3}
                                        className={`w-full rounded-lg px-4 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                            isDark
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        placeholder="Décrivez les responsabilités de ce rôle..."
                                    />
                                </div>
                                {/*<div className="flex items-center justify-between pt-2">*/}
                                {/*  <span*/}
                                {/*    className={`text-sm ${*/}
                                {/*      isDark ? 'text-gray-300' : 'text-gray-700'*/}
                                {/*    }`}*/}
                                {/*  >*/}
                                {/*    Rôle administrateur*/}
                                {/*  </span>*/}
                                {/*  <label className="inline-flex items-center cursor-pointer">*/}
                                {/*    <span className="relative">*/}
                                {/*      <input*/}
                                {/*        type="checkbox"*/}
                                {/*        checked={newRoleIsAdmin}*/}
                                {/*        onChange={(e) => setNewRoleIsAdmin(e.target.checked)}*/}
                                {/*        className="sr-only peer"*/}
                                {/*      />*/}
                                {/*      <div*/}
                                {/*        className="w-10 h-5 rounded-full border transition-colors peer-checked:bg-emerald-500 peer-checked:border-emerald-500 border-gray-400 bg-gray-200"*/}
                                {/*      ></div>*/}
                                {/*      <div*/}
                                {/*        className="absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform peer-checked:translate-x-5"*/}
                                {/*      ></div>*/}
                                {/*    </span>*/}
                                {/*  </label>*/}
                                {/*</div>*/}
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRoleModal(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        isDark
                                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                                >
                                    {isAddingRole ? "Chargement ..." : "Créer"}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Modale suppression rôle */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
                            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex items-center mb-4">
                            <AlertTriangle className="w-6 h-6 text-red-500 mr-2"/>
                            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Confirmer la suppression
                            </h3>
                        </div>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Êtes-vous sûr de vouloir supprimer ce rôle ? Toutes les permissions associées seront
                            également supprimées.
                            Cette action est irréversible.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                    isDark
                                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDeleteRole(showDeleteConfirm!)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                            >
                                {isDeletingRole ? "Chargement..." : "Supprimer"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default RolePermissionsPage;
