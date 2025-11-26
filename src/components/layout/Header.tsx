import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRecruitmentOpen, setIsRecruitmentOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when navigating
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header 
      className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-white/90 backdrop-blur-sm py-4'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between max-w-7xl mx-auto h-[34px]">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="https://shippinggreatlakes.com/wp-content/uploads/2018/11/logo_90.png" 
              alt="SHIPPING GL" 
              className="h-[50px] w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              {t('navigation.home')}
            </Link>
            <Link 
              to="/services" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/services' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              {t('navigation.services')}
            </Link>
            <Link 
              to="/partenaires" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/partenaires' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              {t('navigation.partners')}
            </Link>

            {/* Gallery Link */}
            <Link 
              to="/actualites" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/actualites' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              {t('navigation.news')}
            </Link>

            <Link 
              to="/a-propos" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/a-propos' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              {t('navigation.about')}
            </Link>
            
            <Link 
              to="/engagement" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/engagement' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              Engagement
            </Link>
            
            <div className="relative group">
              <button 
                onClick={() => setIsRecruitmentOpen(!isRecruitmentOpen)}
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary-600 ${
                  location.pathname.startsWith('/recrutement') ? 'bg-primary-600 text-white' : 'text-gray-800'
                } px-4 py-2 rounded-lg`}
              >
                Recrutement
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isRecruitmentOpen ? 'transform rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 transition-all duration-300 ${
                  isRecruitmentOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
              >
                <Link 
                  to="/recrutement/offres" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsRecruitmentOpen(false)}
                >
                  Offres d'emploi
                </Link>
                <Link 
                  to="/recrutement/cv" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsRecruitmentOpen(false)}
                >
                  Envoyez votre CV
                </Link>
              </div>
            </div>
            
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/contact' ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />

            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 text-white hover:bg-primary-700"
                aria-label="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link to="/login" className="btn btn-outline btn-sm">
                {t('navigation.login')}
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex-1 flex justify-end flex items-center gap-4">
            <LanguageSelector />
            <button onClick={toggleMenu} className="text-gray-700">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`fixed inset-0 bg-white z-40 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="px-4 sm:px-6 h-full flex flex-col space-y-4">
          <Link 
            to="/" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            {t('navigation.home')}
          </Link>
          <Link 
            to="/services" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/services' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            {t('navigation.services')}
          </Link>
          <Link 
            to="/partenaires" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/partenaires' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            {t('navigation.partners')}
          </Link>

          {/* Mobile Gallery Link */}
          <Link 
            to="/actualites" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/actualites' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            {t('navigation.news')}
          </Link>

          <Link 
            to="/a-propos" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/a-propos' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            {t('navigation.about')}
          </Link>
          
          <Link 
            to="/engagement" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/engagement' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            Engagement
          </Link>
          
          <div className="border-l-4 border-gray-200 pl-4 ml-2">
            <p className="text-sm font-medium text-gray-500 mb-1">Recrutement</p>
            <Link 
              to="/recrutement/offres" 
              className={`block py-1 pl-2 text-base font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/recrutement/offres' ? 'text-primary-600' : 'text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Offres d'emploi
            </Link>
            <Link 
              to="/recrutement/cv" 
              className={`block py-1 pl-2 text-base font-medium transition-colors hover:text-primary-600 ${
                location.pathname === '/recrutement/cv' ? 'text-primary-600' : 'text-gray-700'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Envoyez votre CV
            </Link>
          </div>
          
          <Link 
            to="/contact" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/contact' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
          >
            Contact
          </Link>

          {user ? (
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-full py-2 text-gray-700 hover:text-primary-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary w-full">
              {t('navigation.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;