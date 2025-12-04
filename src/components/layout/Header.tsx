import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, LogOut } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../../contexts/AuthContext';
import useMenuItems from '../../hooks/useMenuItems';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { menuItems } = useMenuItems();
  
  // Fonction pour vérifier si un élément de menu est actif
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/recrutement' && location.pathname.startsWith('/recrutement'));
  };

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
            {menuItems.map((item) => (
              <Link 
                key={item.id}
                to={item.path || `/${item.name.toLowerCase()}`} 
                className={`text-sm font-medium transition-colors hover:text-primary-600 ${
                  isActive(item.path || `/${item.name.toLowerCase()}`) ? 'bg-primary-600 text-white px-4 py-2 rounded-lg' : 'text-gray-800'
                }`}
              >
                {item.name}
              </Link>
            ))}
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
        <div className="px-4 sm:px-6 h-full flex flex-col space-y-4 pt-4">
          <Link 
            to="/" 
            className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
              location.pathname === '/' ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            {t('navigation.home')}
          </Link>
          {menuItems.map((item) => (
            <Link
              key={`mobile-${item.id}`}
              to={item.path || `/${item.name.toLowerCase()}`}
              className={`text-base font-medium py-2 transition-colors hover:text-primary-600 ${
                isActive(item.path || `/${item.name.toLowerCase()}`) ? 'bg-primary-600 text-white px-4 rounded-lg' : 'text-gray-800'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}

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