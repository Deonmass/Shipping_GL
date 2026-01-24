import React, {useState, useEffect} from 'react';
import {
    User,
    Lock,
    Shield,
    Key,
    Eye,
    EyeOff,
    LucideSettings, RefreshCcwIcon
} from 'lucide-react';
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {getAuthData, removeAuthData, setAuthUser} from "../../utils";
import {UseLogout, UseUpdateUser, UseUpdateUserPassword} from "../../services";
import AppToast from "../../utils/AppToast.ts";

interface PasswordChangeForm {
    actual_password: string,
    new_password: string,
    confirm_new_password: string
}

const SettingsPage: React.FC = () => {

    const {user: connectedUser, token, permissions} = getAuthData()
    const {mutate: LogoutUser} = UseLogout()
    const {isPending: isUpdatingUser, data: updateResult, mutate: updateUserDetail} = UseUpdateUser()
    const {isPending: isUpdatingUserPassword, data: updatePasswordResult, mutate: updateUserPassword} = UseUpdateUserPassword()

    const [settings, setSettings] = useState({
        notifications: {
            email: true,
            desktop: true,
            mobile: false
        },
        security: {
            twoFactor: false,
            sessionTimeout: '30',
            passwordExpiry: '90'
        },
        display: {
            language: 'fr',
            timezone: 'Africa/Kinshasa'
        }
    });

    const [initialSettings, setInitialSettings] = useState<typeof settings | null>(null);

    const [theme] = useState<'dark' | 'light'>(() => {
        if (typeof window === 'undefined') return 'dark';
        const saved = localStorage.getItem('admin_theme');
        return saved === 'light' ? 'light' : 'dark';
    });
    const isDark = theme === 'dark';

    const handleSecurityChange = (key: keyof typeof settings.security, value: string | boolean) => {
        setSettings(prev => ({
            ...prev,
            security: {
                ...prev.security,
                [key]: value
            }
        }));
    };

    const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
        actual_password: '',
        new_password: '',
        confirm_new_password: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [profile, setProfile] = useState(connectedUser || {
        name: "",
        username: "",
        phone: "",
        email: "",
        role_title: "",
        created_at: "",
    });


    useEffect(() => {
        if (!initialSettings) {
            setInitialSettings(settings);
        }
    }, [initialSettings, settings]);

    useEffect(() => {
        if (updateResult) {
            if (updateResult?.responseData?.error) {
                AppToast.error(theme === "dark", updateResult?.responseData?.message || "Erreur lors de la mise a jour")
            } else {
                setAuthUser({
                    user: {
                        ...connectedUser,
                        ...profile
                    },
                    token: token,
                    permissions: permissions
                })
                AppToast.success(theme === "dark", 'Informations mises à jour avec succès')
            }
        }
    }, [updateResult]);

    useEffect(() => {
        if (updatePasswordResult) {
            if (updatePasswordResult?.responseData?.error) {
                AppToast.error(theme === "dark", updatePasswordResult?.responseData?.message || "Erreur lors de la mise a jour du mot de passe")
            } else {
                AppToast.success(theme === "dark", 'Mot de passe mis à jour avec succès')
                LogoutUser({id: connectedUser?.id})
                removeAuthData()
                window.location.href = '/admin-login';
            }
        }
    }, [updatePasswordResult]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile.name || !profile.username || !profile.email || !profile.phone) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis');
            return;
        }
        updateUserDetail({
            id: connectedUser?.id,
            name: profile.name,
            email: profile.email,
            username: profile.username,
            phone: profile.phone,
        })
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passwordForm.actual_password || !passwordForm.new_password || !passwordForm.confirm_new_password) {
            AppToast.error(theme === "dark", 'Veuillez remplir tous les champs requis');
            return;
        }
        updateUserPassword({
            id: connectedUser?.id,
            ...passwordForm
        })
    };


    return (
        <div>
            <div className="mb-6 mt-20">
                <AdminPageHeader
                    Icon={<LucideSettings className={`w-7 h-7 ${isDark ? 'text-red-400' : 'text-red-600'}`}/>}
                    title="Paramètres"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 items-start">
                {/* Profil utilisateur */}
                <div
                    className={`rounded-lg p-6 border ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <User className="w-6 h-6 text-primary-500 mr-2"/>
                            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Profil
                            </h2>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSave}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Nom complet
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={profile?.name}
                                    onChange={(e) => setProfile(prev => ({...prev, name: e.target.value}))}
                                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Nom d'utilisateur
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={profile?.username}
                                    onChange={(e) => setProfile(prev => ({...prev, username: e.target.value}))}
                                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Téléphone
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={profile.phone}
                                    onChange={(e) => setProfile(prev => ({...prev, phone: e.target.value}))}
                                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Email
                                </label>
                                <input
                                    required
                                    name="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={(e) => setProfile(prev => ({...prev, email: e.target.value}))}
                                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                        theme === 'dark'
                                            ? 'bg-gray-700 border-gray-600 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label
                                    className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Role
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={profile.role_title}
                                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                        theme === 'dark'
                                            ? 'bg-gray-500 border-gray-500 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                            <div>
                                <label
                                    className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Créé le
                                </label>
                                <input
                                    type="text"
                                    disabled
                                    value={profile.created_at}
                                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                                        theme === 'dark'
                                            ? 'bg-gray-500 border-gray-500 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-5">
                            <button
                                type="submit"
                                disabled={isUpdatingUser}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center font-medium transition-colors"
                            >
                                <User className="w-4 h-4 mr-2"/>
                                {isUpdatingUser ?
                                    <RefreshCcwIcon className="animate-spin"/> : 'Mettre à jour vos informations'}
                            </button>
                        </div>
                    </form>

                </div>


                {/* Security */}
                <div
                    className={`rounded-lg p-6 border ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                    }`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Shield className="w-6 h-6 text-primary-500 mr-2"/>
                            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Sécurité
                            </h2>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                Authentification à deux facteurs
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={settings.security.twoFactor}
                                    onChange={() => handleSecurityChange('twoFactor', !settings.security.twoFactor)}
                                />
                                <div
                                    className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                        </div>
                        <div>
                            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Expiration de la session (minutes)
                            </label>
                            <select
                                className={`w-full rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                value={settings.security.sessionTimeout}
                                onChange={(e) => handleSecurityChange('sessionTimeout', e.target.value)}
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 heure</option>
                                <option value="120">2 heures</option>
                            </select>
                        </div>
                        <div>
                            <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                Expiration du mot de passe (jours)
                            </label>
                            <select
                                className={`w-full rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
                                    theme === 'dark'
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                                value={settings.security.passwordExpiry}
                                onChange={(e) => handleSecurityChange('passwordExpiry', e.target.value)}
                            >
                                <option value="30">30 jours</option>
                                <option value="60">60 jours</option>
                                <option value="90">90 jours</option>
                                <option value="180">180 jours</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-gray-700 pt-6">
                        <div className="flex items-center mb-4">
                            <Key className="w-5 h-5 text-primary-500 mr-2"/>
                            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Modifier le mot de passe
                            </h3>
                        </div>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Mot de passe actuel
                                </label>
                                <div className="relative">
                                    <input
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className={`w-full rounded-lg px-3 py-2 pr-10 focus:ring-primary-500 focus:border-primary-500 border ${
                                            theme === 'dark'
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                        value={passwordForm.actual_password}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            actual_password: e.target.value
                                        }))}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(prev => !prev)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                                    >
                                        {showCurrentPassword ? (
                                            <EyeOff className="w-4 h-4"/>
                                        ) : (
                                            <Eye className="w-4 h-4"/>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Nouveau mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            className={`w-full rounded-lg px-3 py-2 pr-10 focus:ring-primary-500 focus:border-primary-500 border ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                            value={passwordForm.new_password}
                                            onChange={(e) => setPasswordForm(prev => ({
                                                ...prev,
                                                new_password: e.target.value
                                            }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(prev => !prev)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="w-4 h-4"/>
                                            ) : (
                                                <Eye className="w-4 h-4"/>
                                            )}
                                        </button>
                                    </div>
                                    <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.
                                    </p>
                                </div>
                                <div>
                                    <label
                                        className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Confirmer le nouveau mot de passe
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            className={`w-full rounded-lg px-3 py-2 pr-10 focus:ring-primary-500 focus:border-primary-500 border ${
                                                theme === 'dark'
                                                    ? 'bg-gray-700 border-gray-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                            value={passwordForm.confirm_new_password}
                                            onChange={(e) => setPasswordForm(prev => ({
                                                ...prev,
                                                confirm_new_password: e.target.value
                                            }))}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(prev => !prev)}
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="w-4 h-4"/>
                                            ) : (
                                                <Eye className="w-4 h-4"/>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isUpdatingUserPassword}
                                    className="bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center font-medium transition-colors"
                                >
                                    <Lock className="w-4 h-4 mr-2"/>
                                    {isUpdatingUserPassword ? <RefreshCcwIcon className="animate-spin"/> : 'Mettre à jour le mot de passe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsPage;