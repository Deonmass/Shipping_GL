import React, { useState, useEffect } from 'react';
import { Save, User, Lock, Bell, Globe, Shield, Key, Eye, EyeOff, XCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  interface PasswordChangeForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }

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

  const handleNotificationChange = (key: keyof typeof settings.notifications) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };
  const handleNotificationsSave = () => {
    setInitialSettings(prev => ({
      ...(prev || settings),
      notifications: { ...settings.notifications }
    }));
    toast.success('Notifications enregistrées');
  };

  const handleNotificationsReset = () => {
    if (!initialSettings) return;
    setSettings(prev => ({
      ...prev,
      notifications: { ...initialSettings.notifications }
    }));
  };

  const handleSecurityChange = (key: keyof typeof settings.security, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }));
  };

  const handleSecuritySave = () => {
    setInitialSettings(prev => ({
      ...(prev || settings),
      security: { ...settings.security }
    }));
    toast.success('Paramètres de sécurité enregistrés');
  };

  const handleSecurityReset = () => {
    if (!initialSettings) return;
    setSettings(prev => ({
      ...prev,
      security: { ...initialSettings.security }
    }));
  };

  const handleDisplayChange = (key: keyof typeof settings.display, value: string) => {
    setSettings(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
  };

  const handleDisplaySave = () => {
    setInitialSettings(prev => ({
      ...(prev || settings),
      display: { ...settings.display }
    }));
    toast.success("Préférences d'affichage enregistrées");
  };

  const handleDisplayReset = () => {
    if (!initialSettings) return;
    setSettings(prev => ({
      ...prev,
      display: { ...initialSettings.display }
    }));
  };

  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profile, setProfile] = useState({
    nom: '',
    postnom: '',
    prenom: '',
    phone: '',
    company: ''
  });
  const [initialProfile, setInitialProfile] = useState<typeof profile | null>(null);
  const [identity, setIdentity] = useState<{ fullName: string; email: string }>({
    fullName: '',
    email: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const userId = auth.user?.id;
        if (!userId) {
          setProfileLoading(false);
          return;
        }
        const email = auth.user?.email || '';

        const { data, error } = await supabase
          .from('users')
          .select('full_name, phone_number, company')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.warn('[SettingsPage] Error loading profile:', error);
        }

        let displayFullName = '';

        if (data) {
          const fullName = (data.full_name || '').trim();
          const parts = fullName.split(' ').filter(Boolean);
          const nom = parts[0] || '';
          const postnom = parts[1] || '';
          const prenom = parts.slice(2).join(' ');

          const nextProfile = {
            nom,
            postnom,
            prenom,
            phone: (data as any).phone_number || '',
            company: (data as any).company || ''
          };

          setProfile(nextProfile);
          setInitialProfile(nextProfile);
          displayFullName = fullName;
        } else {
          // Aucune entrée dans users : pré-remplir avec les infos de l'utilisateur courant
          const fallbackFullName = (auth.user?.user_metadata as any)?.full_name || auth.user?.email || '';
          const parts = fallbackFullName.trim().split(' ').filter(Boolean);
          const nom = parts[0] || '';
          const postnom = parts[1] || '';
          const prenom = parts.slice(2).join(' ');

          setProfile(prev => ({
            ...prev,
            nom,
            postnom,
            prenom
          }));

          displayFullName = fallbackFullName;
        }

        setIdentity({
          fullName: displayFullName || email,
          email
        });
      } catch (e) {
        console.error('[SettingsPage] Unexpected error loading profile:', e);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  useEffect(() => {
    if (!initialSettings) {
      setInitialSettings(settings);
    }
  }, [initialSettings, settings]);

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) return;

      const full_name = [profile.nom, profile.postnom, profile.prenom]
        .map(v => v.trim())
        .filter(Boolean)
        .join(' ');

      const { error } = await supabase
        .from('users')
        .update({
          full_name: full_name || null,
          phone_number: profile.phone || null,
          company: profile.company || null
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Profil mis à jour');
      setInitialProfile(profile);
    } catch (e: any) {
      console.error('[SettingsPage] Error saving profile:', e);
      toast.error(e.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Mot de passe mis à jour avec succès');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSave = () => {
    // Implement save functionality
    console.log('Save settings:', settings);
  };

  const handleProfileReset = () => {
    if (!initialProfile) return;
    setProfile(initialProfile);
  };

  const isProfileDirty = initialProfile
    ? JSON.stringify(profile) !== JSON.stringify(initialProfile)
    : false;

  const isNotificationsDirty = initialSettings
    ? JSON.stringify(settings.notifications) !== JSON.stringify(initialSettings.notifications)
    : false;

  const isSecurityDirty = initialSettings
    ? JSON.stringify(settings.security) !== JSON.stringify(initialSettings.security)
    : false;

  const isDisplayDirty = initialSettings
    ? JSON.stringify(settings.display) !== JSON.stringify(initialSettings.display)
    : false;

  return (
    <div>
      <div className="mb-6 mt-20">
        <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Paramètres
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Profil utilisateur */}
        <div
          className={`rounded-lg p-6 border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <User className="w-6 h-6 text-primary-500 mr-2" />
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Profil
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProfileReset}
                disabled={!isProfileDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isProfileDirty
                    ? theme === 'dark'
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Annuler les modifications"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={!isProfileDirty || profileSaving}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isProfileDirty
                    ? 'border-primary-500 text-primary-600 bg-primary-50 hover:bg-primary-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Enregistrer le profil"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          {profileLoading ? (
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Chargement du profil...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Nom
                  </label>
                  <input
                    type="text"
                    value={profile.nom}
                    onChange={(e) => setProfile(prev => ({ ...prev, nom: e.target.value }))}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Postnom
                  </label>
                  <input
                    type="text"
                    value={profile.postnom}
                    onChange={(e) => setProfile(prev => ({ ...prev, postnom: e.target.value }))}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={profile.prenom}
                    onChange={(e) => setProfile(prev => ({ ...prev, prenom: e.target.value }))}
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
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Téléphone
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Entreprise
                  </label>
                  <input
                    type="text"
                    value={profile.company}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    className={`w-full rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500 border ${
                      theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        {/* Notifications */}
        <div
          className={`rounded-lg p-6 border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Bell className="w-6 h-6 text-primary-500 mr-2" />
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNotificationsReset}
                disabled={!isNotificationsDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isNotificationsDirty
                    ? theme === 'dark'
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Annuler les modifications"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNotificationsSave}
                disabled={!isNotificationsDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isNotificationsDirty
                    ? 'border-primary-500 text-primary-600 bg-primary-50 hover:bg-primary-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Enregistrer les notifications"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Notifications par email
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Notifications bureau
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.desktop}
                  onChange={() => handleNotificationChange('desktop')}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <label className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                Notifications mobile
              </label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.notifications.mobile}
                  onChange={() => handleNotificationChange('mobile')}
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div
          className={`rounded-lg p-6 border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-primary-500 mr-2" />
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Sécurité
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSecurityReset}
                disabled={!isSecurityDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isSecurityDirty
                    ? theme === 'dark'
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Annuler les modifications"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleSecuritySave}
                disabled={!isSecurityDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isSecurityDirty
                    ? 'border-primary-500 text-primary-600 bg-primary-50 hover:bg-primary-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Enregistrer la sécurité"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
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
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
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
              <Key className="w-5 h-5 text-primary-500 mr-2" />
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
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(prev => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        newPassword: e.target.value
                      }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className={`mt-1 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.
                  </p>
                </div>
                <div>
                  <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
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
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-primary-600 hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center font-medium transition-colors"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isChangingPassword ? 'Modification...' : 'Mettre à jour le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Display */}
        <div
          className={`rounded-lg p-6 border ${
            theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Globe className="w-6 h-6 text-primary-500 mr-2" />
              <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Affichage
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDisplayReset}
                disabled={!isDisplayDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isDisplayDirty
                    ? theme === 'dark'
                      ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Annuler les modifications"
              >
                <XCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDisplaySave}
                disabled={!isDisplayDirty}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition ${
                  isDisplayDirty
                    ? 'border-primary-500 text-primary-600 bg-primary-50 hover:bg-primary-100'
                    : 'border-transparent text-gray-400 cursor-default opacity-50'
                }`}
                title="Enregistrer l'affichage"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Langue
              </label>
              <select
                className={`w-full rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={settings.display.language}
                onChange={(e) => handleDisplayChange('language', e.target.value)}
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className={`block mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Fuseau horaire
              </label>
              <select
                className={`w-full rounded-lg focus:ring-primary-500 focus:border-primary-500 border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                value={settings.display.timezone}
                onChange={(e) => handleDisplayChange('timezone', e.target.value)}
              >
                <option value="Africa/Kinshasa">Kinshasa</option>
                <option value="Africa/Lubumbashi">Lubumbashi</option>
                <option value="Africa/Dar_es_Salaam">Dar es Salaam</option>
                <option value="Africa/Nairobi">Nairobi</option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;