import React, {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {Link} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {User, Mail, Phone, Building2, MapPin, Calendar, Key, Edit, ArrowRight} from 'lucide-react';
import toast from 'react-hot-toast';
import {UseVisitorUpdatePassword, UseVisitorUpdateProfile} from "../services";
import {removeAuthVisitorData} from "../utils";

interface PasswordChangeForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

const ProfilePage: React.FC = () => {
    const {visitor} = useAuth();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const {isPending: isUpdatingProfile, mutate: updateProfile, data: updateProfileResult} = UseVisitorUpdateProfile()
    const {
        isPending: isUpdatingPassword,
        mutate: updatePassword,
        data: updatePasswordResult
    } = UseVisitorUpdatePassword()

    useEffect(() => {
        document.title = 'Mon Profil - SHIPPING GL';
    }, []);

    useEffect(() => {
        if (updatePasswordResult) {
            if (updatePasswordResult?.responseData?.error) {
                toast.error(updatePasswordResult?.responseData?.message || "Erreur lors de la modification de mot de passe");
            } else {
                toast.success('Mot de passe mis à jour avec succès, connectez-vous a nouveau.');
                setShowPasswordModal(false);
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                removeAuthVisitorData()
                window.location.href = "/login"
            }
        }
    }, [updatePasswordResult]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
        }

        updatePassword({
            current_password: passwordForm?.currentPassword,
            password: passwordForm?.newPassword,
            confirm_password: passwordForm?.confirmPassword,
        })
    };

    // if (loading) {
    //   return (
    //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    //       <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
    //     </div>
    //   );
    // }

    if (!visitor) {
        return (
            <motion.div
                initial={{opacity: 0}}
                animate={{opacity: 1}}
                exit={{opacity: 0}}
                transition={{duration: 0.3}}
                className="min-h-screen bg-gray-50 py-20"
            >
                <div className="container-custom">
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
                        <div className="mb-6">
                            <div
                                className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-primary-600"/>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Complétez votre profil
                            </h2>
                            <p className="text-gray-600">
                                Pour accéder à toutes les fonctionnalités, veuillez mettre à jour vos informations de
                                profil.
                            </p>
                        </div>
                        <Link
                            to="/devenir-partenaire"
                            className="btn btn-primary inline-flex items-center"
                        >
                            Mettre à jour mes informations
                            <ArrowRight className="ml-2 w-5 h-5"/>
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
        >
            <section className="relative py-20 md:py-24 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{
                        backgroundImage: 'url(https://images.pexels.com/photos/3183183/pexels-photo-3183183.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260)',
                        backgroundPosition: '50% 30%'
                    }}
                >
                    <div className="absolute inset-0 bg-primary-900 opacity-75"></div>
                </div>

                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5}}
                        className="max-w-3xl mx-auto text-center"
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Mon Profil</h1>
                        <p className="text-xl text-gray-200">
                            Gérez vos informations personnelles et suivez vos activités
                        </p>
                    </motion.div>
                </div>

                <div className="absolute bottom-0 left-0 right-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full">
                        <path
                            fill="#f9fafb"
                            fillOpacity="1"
                            d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
                        ></path>
                    </svg>
                </div>
            </section>

            <section className="py-16 bg-gray-50">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center">
                                        <div
                                            className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mr-6">
                                            {visitor?.partner_type === 'legal' ? (
                                                <Building2 className="w-10 h-10 text-primary-600"/>
                                            ) : (
                                                <User className="w-10 h-10 text-primary-600"/>
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">
                                                {visitor?.partner_type === 'legal'
                                                    ? visitor?.company
                                                    : visitor?.name}
                                            </h2>
                                            <p className="text-gray-600">
                                                Code Partenaire: #SGL{visitor?.id}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {/*<Link*/}
                                        {/*  to="/parametres"*/}
                                        {/*  className="btn btn-outline flex items-center"*/}
                                        {/*>*/}
                                        {/*  <Settings className="w-5 h-5 mr-2" />*/}
                                        {/*  Paramètres*/}
                                        {/*</Link>*/}
                                        <Link
                                            to="/devenir-partenaire"
                                            className="btn btn-primary flex items-center"
                                        >
                                            <Edit className="w-5 h-5 mr-2"/>
                                            Modifier
                                        </Link>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center text-gray-700 mb-2">
                                                <Mail className="w-5 h-5 mr-2"/>
                                                <span className="font-medium">Email</span>
                                            </div>
                                            <p className="text-gray-900">{visitor?.email}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center text-gray-700 mb-2">
                                                <Phone className="w-5 h-5 mr-2"/>
                                                <span className="font-medium">Téléphone</span>
                                            </div>
                                            <p className="text-gray-900">{visitor?.phone}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center text-gray-700 mb-2">
                                                <MapPin className="w-5 h-5 mr-2"/>
                                                <span className="font-medium">Adresse</span>
                                            </div>
                                            <p className="text-gray-900">
                                                {visitor?.address}<br/>
                                                {visitor?.city} {visitor?.country}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center text-gray-700 mb-2">
                                                <Building2 className="w-5 h-5 mr-2"/>
                                                <span className="font-medium">Type de Compte</span>
                                            </div>
                                            <p className="text-gray-900">
                                                {visitor?.partner_type === 'legal' ? 'Personne Morale' : 'Personne Physique'}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center text-gray-700 mb-2">
                                                <Calendar className="w-5 h-5 mr-2"/>
                                                <span className="font-medium">Date d'inscription</span>
                                            </div>
                                            <p className="text-gray-900">
                                                {new Date(visitor?.created_at || '').toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center text-gray-700">
                                                    <Key className="w-5 h-5 mr-2"/>
                                                    <span className="font-medium">Mot de passe</span>
                                                </div>
                                                <button
                                                    onClick={() => setShowPasswordModal(true)}
                                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                                >
                                                    Modifier
                                                </button>
                                            </div>
                                            <p className="text-gray-900 mt-2">
                                                ••••••••
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                    >
                        <h3 className="text-lg font-semibold mb-4">Modifier le mot de passe</h3>
                        <form onSubmit={handlePasswordChange}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mot de passe actuel
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            currentPassword: e.target.value
                                        }))}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            newPassword: e.target.value
                                        }))}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmer le nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({
                                            ...prev,
                                            confirmPassword: e.target.value
                                        }))}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="btn btn-outline"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isUpdatingPassword}
                                >
                                    {isUpdatingPassword ? 'Modification...' : 'Confirmer'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default ProfilePage;