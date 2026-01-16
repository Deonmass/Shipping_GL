import React, {useState, useEffect, useRef} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import {Menu, X, LogOut, ChevronDown, ChevronUp} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import {useAuth} from '../../contexts/AuthContext';
import useMenuItems, {MenuItem} from '../../hooks/useMenuItems';
import {UseLogoutVisitor} from "../../services";

const Header: React.FC = () => {
    const {t} = useTranslation();
    const location = useLocation();
    const {signOut, visitor} = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const {menuItems} = useMenuItems();

    const {mutate: logoutVisitor} = UseLogoutVisitor()


    // Fonction pour vérifier si un élément de menu est actif
    const isActive = (path: string = ''): boolean => {
        if (!path) return false;
        return location.pathname === path ||
            (path === '/recrutement' && location.pathname.startsWith('/recrutement')) ||
            (path === '/cotations' && location.pathname.startsWith('/cotations')) ||
            (path === '/appels-offres' && location.pathname.startsWith('/appels-offres'));
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
            logoutVisitor({})
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // État pour suivre les menus déroulants ouverts
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Gérer le clic en dehors du menu déroulant
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Vérifier si un élément a des enfants
    const hasChildren = (item: MenuItem): boolean => {
        return !!(item.children && item.children.length > 0);
    };

    // Basculer le menu déroulant
    const toggleDropdown = (id: string) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    // Gérer le clic sur un élément de menu
    const handleMenuItemClick = (item: MenuItem) => {
        if (hasChildren(item)) {
            toggleDropdown(item.id);
        } else if (item.path) {
            navigate(item.path);
            setIsMenuOpen(false);
        }
    };

    // Vérifier si un élément parent est actif
    const isParentActive = (item: MenuItem): boolean => {
        if (!item.children) return false;
        return item.children.some((child: MenuItem) => isActive(child.path || ''));
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
                            src="/logo_colored - Copie.png"
                            alt="SHIPPING GL"
                            className="h-[50px] w-auto"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {menuItems
                            .filter((item: MenuItem) => item.is_visible && !item.parentId)
                            .map((item: MenuItem) => (
                                <div key={item.id} className="relative group"
                                     ref={hasChildren(item) ? dropdownRef : null}>
                                    <button
                                        onClick={() => handleMenuItemClick(item)}
                                        className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                            isActive(item.path || '') || isParentActive(item)
                                                ? 'bg-primary-600 text-white'
                                                : 'text-gray-800 hover:bg-gray-100'
                                        }`}
                                        aria-haspopup={hasChildren(item) ? 'true' : 'false'}
                                        aria-expanded={openDropdown === item.id}
                                    >
                                        {item.name}
                                        {hasChildren(item) && (
                                            <span className="ml-1">
                        {openDropdown === item.id ? (
                            <ChevronUp className="w-4 h-4"/>
                        ) : (
                            <ChevronDown className="w-4 h-4"/>
                        )}
                      </span>
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {hasChildren(item) && (
                                        <div
                                            className={`absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50 ${
                                                openDropdown === item.id ? 'block' : 'hidden'
                                            }`}
                                        >
                                            {item.children?.map((child: MenuItem) => (
                                                <Link
                                                    key={child.id}
                                                    to={child.path || ''}
                                                    className={`block px-4 py-2 text-sm ${
                                                        isActive(child.path || '')
                                                            ? 'bg-primary-100 text-primary-900'
                                                            : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                                    onClick={() => setOpenDropdown(null)}
                                                >
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </nav>

                    {/* Right side actions */}
                    <div className="hidden md:flex items-center space-x-4">
                        <LanguageSelector/>

                        {visitor ? (
                            <div className="flex flex-row items-center gap-2 pl-4">
                                {visitor?.name?.slice(0, 13)}
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-600 text-white hover:bg-primary-700"
                                    aria-label="Déconnexion"
                                >
                                    <LogOut className="w-4 h-4"/>
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-outline btn-sm">
                                {t('navigation.login')}
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex-1 flex justify-end flex items-center gap-4">
                        <LanguageSelector/>
                        <button onClick={toggleMenu} className="text-gray-700">
                            {isMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
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
                <div className="px-4 sm:px-6 h-full flex flex-col space-y-2 pt-4 overflow-y-auto">
                    <Link
                        to="/"
                        className={`text-base font-medium py-3 px-4 rounded-lg transition-colors ${
                            location.pathname === '/' ? 'bg-primary-600 text-white' : 'text-gray-800 hover:bg-gray-100'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t('navigation.home')}
                    </Link>

                    {menuItems
                        .filter((item: MenuItem) => item.is_visible && !item.parentId)
                        .map((item: MenuItem) => (
                            <div key={`mobile-${item.id}`} className="space-y-1">
                                <button
                                    onClick={() => handleMenuItemClick(item)}
                                    className={`w-full flex justify-between items-center py-3 px-4 rounded-lg text-base font-medium ${
                                        isActive(item.path || '') || isParentActive(item)
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-800 hover:bg-gray-100'
                                    }`}
                                >
                                    <span>{item.name}</span>
                                    {hasChildren(item) && (
                                        <span className="ml-2">
                      {openDropdown === item.id ? (
                          <ChevronUp className="w-5 h-5"/>
                      ) : (
                          <ChevronDown className="w-5 h-5"/>
                      )}
                    </span>
                                    )}
                                </button>

                                {/* Mobile Dropdown Menu */}
                                {hasChildren(item) && openDropdown === item.id && (
                                    <div className="pl-4 space-y-1">
                                        {item.children?.map((child) => (
                                            <Link
                                                key={`mobile-child-${child.id}`}
                                                to={child.path || ''}
                                                className={`block py-2 px-4 text-sm rounded-lg ${
                                                    isActive(child.path || '')
                                                        ? 'bg-primary-100 text-primary-900'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                {child.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                    {visitor ? (
                        <div className="border-t border-gray-200 pt-4 space-y-2">
                           <span className="flex items-center justify-center"> {visitor?.name}</span>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center justify-center w-full py-2 text-gray-700 hover:text-primary-600"
                            >
                                <LogOut className="w-4 h-4 mr-2"/>
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