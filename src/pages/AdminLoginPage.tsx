import React, {useState, useEffect} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {motion} from 'framer-motion';
import {Ship, Mail, Lock, Eye, EyeOff, ShieldCheck} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {UseLogin} from "../services";

const AdminLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const {isPending: isSubmitting, mutate: loginUser, data: loginData} = UseLogin()

    useEffect(() => {
        document.title = 'Admin Login - SHIPPING GL';
    }, []);

    useEffect(() => {
        if (loginData?.responseData) {
            if (loginData?.responseData?.error) {
                toast.error(loginData?.responseData?.message || 'Erreur lors de la vérification des informations');
                setError("loginData?.responseData?.message")
            } else {
                toast.success('Connexion réussie');
                navigate('/admin/dashboard');
            }
        }
    }, [loginData]);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("")
        loginUser({email: email, password: password})
        return
    };


    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            transition={{duration: 0.3}}
            className="min-h-screen bg-gray-900 py-20"
        >
            <div className="container-custom">
                <div
                    className="max-w-md mx-auto bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <Link to="/" className="inline-flex items-center justify-center">
                                <Ship className="w-10 h-10 text-primary-500"/>
                            </Link>
                            <div className="flex items-center justify-center mt-4 mb-2">
                                <ShieldCheck className="w-6 h-6 text-primary-500 mr-2"/>
                                <h1 className="text-2xl font-bold text-white">
                                    Administration
                                </h1>
                            </div>
                            <p className="text-gray-400">
                                Accès réservé aux administrateurs
                            </p>
                        </div>

                        {error && (
                            <div
                                className="bg-red-900/50 text-red-400 p-3 rounded-lg mb-6 text-sm border border-red-800">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="mb-6">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500"/>
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="admin@shippinggreatlakes.com"
                                        style={{height: '46px'}}
                                    />
                                </div>
                            </div>

                            <div className="mb-6">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                                    Mot de passe
                                </label>
                                <div className="relative">
                                    <div
                                        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500"/>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-10 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
                                        placeholder="••••••••"
                                        style={{height: '46px'}}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                        <button
                                            type="button"
                                            onClick={togglePasswordVisibility}
                                            className="text-gray-400 hover:text-gray-300 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mb-4 bg-primary-600 text-white rounded-lg px-4 py-2 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Connexion...' : 'Connexion Admin'}
                            </button>

                            <div className="text-center mt-4">
                                <Link to="/" className="text-sm text-gray-400 hover:text-primary-500">
                                    Retour à l'accueil
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminLoginPage;