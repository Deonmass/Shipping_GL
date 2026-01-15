import React, {useState, useEffect} from 'react';
import {Link, useLocation, Outlet, useNavigate} from 'react-router-dom';
import {
    BarChart3, Users, FileText, Settings,
    Bell, Search, LogOut, Handshake, ClipboardEditIcon,
    MessageSquare, Heart, Calendar, Tags, TrendingUp, ChevronDown, ChevronRight,
    Mail, Menu, CheckCircle2, Sun, Moon, User, Home, X, Wrench, Building2,
    ClipboardList,
    UserRoundSearch, CircleUserRoundIcon, Table2Icon
} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {formatDistanceToNow} from 'date-fns';
import {fr} from 'date-fns/locale';
import './AdminMenu.css';
import {HasOneOfPermissions, HasPermission} from "../../utils/PermissionChecker.ts";
import {appPermissions} from "../../constants/appPermissions.ts";
import {UseLogout} from "../../services";
import {getAuthData, removeAuthData} from "../../utils";
import AppToast from "../../utils/AppToast.ts";
import {appOps} from "../../constants";

const ADMIN_UI_VERSION = '2025-11-21-menu-layout-v1';

const AdminLayout: React.FC = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [tablesExpanded, setTablesExpanded] = useState(() => {
        const saved = localStorage.getItem('adminMenu_tables_expanded');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [usersExpanded, setUsersExpanded] = useState(() => {
        const saved = localStorage.getItem('adminMenu_users_expanded');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [notificationCount, setNotificationCount] = useState(0);
    const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
    const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResultsOpen, setSearchResultsOpen] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('admin_theme');
        return saved === 'light' ? 'light' : 'dark';
    });

    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [isSidebarHoverOpen, setIsSidebarHoverOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const {user: connectedUser} = getAuthData()

    const {mutate: LogoutUser} = UseLogout()

    useEffect(() => {
        localStorage.setItem('adminMenu_tables_expanded', JSON.stringify(tablesExpanded));
    }, [tablesExpanded]);

    useEffect(() => {
        localStorage.setItem('adminMenu_users_expanded', JSON.stringify(usersExpanded));
    }, [usersExpanded]);

    // Generate an "update" notification once per UI version so admins are informed of layout/menu changes
    useEffect(() => {
        const maybeInsertUpdateNotification = async () => {
            try {
                const localKey = `admin_ui_version_seen_${ADMIN_UI_VERSION}`;
                if (typeof window !== 'undefined' && localStorage.getItem(localKey) === '1') {
                    return;
                }

                const {data: auth} = await supabase.auth.getUser();
                const adminUserId = auth.user?.id || null;

                const {error} = await supabase.from('admin_notifications').insert({
                    user_id: adminUserId,
                    type: 'update',
                    title: 'Mise à jour de l\'interface admin',
                    message:
                        'La structure du menu admin a été mise à jour (groupes Utilisateurs / Tables / Notifications / Mises à jour).',
                    data: {ui_version: ADMIN_UI_VERSION},
                    is_read: false,
                });

                if (error) {
                    console.warn('[AdminLayout] Error inserting update notification:', error);
                    return;
                }

                if (typeof window !== 'undefined') {
                    localStorage.setItem(localKey, '1');
                }
            } catch (e) {
                console.warn('[AdminLayout] Unexpected error inserting update notification:', e);
            }
        };

        maybeInsertUpdateNotification();
    }, []);

    useEffect(() => {
        localStorage.setItem('admin_theme', theme);
    }, [theme]);



    const handleLogout = async () => {
        try {
            LogoutUser({id: connectedUser?.id})
            removeAuthData()
            AppToast.success(true, 'Déconnexion réussie');
            navigate('/admin-login');
        } catch (error: any) {
            console.error('Error logging out:', error);
            AppToast.error(true, 'Erreur lors de la déconnexion');
        }
    };

    const tableItems = [
        {
            key: appPermissions.services,
            path: '/admin/services',
            icon: Wrench,
            label: 'Services',
            keywords: ['services', 'service']
        },
        {
            key: appPermissions.partners,
            path: '/admin/partners',
            icon: Handshake,
            label: 'Partenaires',
            keywords: ['partenaire', 'partner']
        },
        {
            key: appPermissions.jobOffers,
            path: '/admin/offres-emploi',
            icon: ClipboardEditIcon,
            label: "Offres d'emploi",
            keywords: ['offres', 'emploi', "recrutement"]
        },
        {
            key: appPermissions.devis,
            path: '/admin/quote-requests',
            icon: Mail,
            label: 'Demandes de devis',
            keywords: ['devis', 'quote', 'demande de devis']
        },
        {
            key: appPermissions.posts,
            path: '/admin/posts',
            icon: FileText,
            label: 'Posts',
            keywords: ['articles', 'news']
        },
        {
            key: appPermissions.comments,
            path: '/admin/comments',
            icon: MessageSquare,
            label: 'Commentaires',
            keywords: ['commentaires']
        },
        {
            key: appPermissions.likes,
            path: '/admin/likes',
            icon: Heart,
            label: 'Likes',
            keywords: ['likes']
        },
        {
            key: appPermissions.events,
            path: '/admin/events',
            icon: Calendar,
            label: 'Événements',
            keywords: ['événement', 'event']
        },
        {
            key: appPermissions.newsletter,
            path: '/admin/newsletter',
            icon: Mail,
            label: 'Newsletter',
            keywords: ['email', 'newsletter']
        },
    ];

    const searchItems = [
        {
            key: appPermissions.dashboard,
            label: 'Dashboard',
            path: '/admin/dashboard',
            keywords: ['accueil', 'home']
        },
        {
            key: appPermissions.users,
            label: 'Utilisateurs',
            path: '/admin/users',
            keywords: ['users', 'comptes']
        },
        {
            key: appPermissions.appPermissions,
            label: 'Permissions des rôles',
            path: '/admin/users/permissions',
            keywords: ['rôles', 'droits']
        },
        {
            key: appPermissions.reports,
            label: 'Rapports',
            path: '/admin/reports',
            keywords: ['rapports', 'statistiques']
        },
        {
            key: appPermissions.settings,
            label: 'Paramètres',
            path: '/admin/settings',
            keywords: ['paramètres', 'configuration']
        },
        {
            key: appPermissions.notifications,
            label: 'Notifications',
            path: '/admin/notifications',
            keywords: ['notifications']
        },
        // Items du bloc "tables"
        ...tableItems,
    ];

    const effectiveSearchItems = searchItems.filter((item) => !item.key || HasPermission(item.key));

    const filteredSearchItems = searchQuery
        ? effectiveSearchItems.filter((item) => {
            const q = searchQuery.toLowerCase();
            return (
                item.label.toLowerCase().includes(q) ||
                item.keywords.some((k) => k.toLowerCase().includes(q))
            );
        })
        : [];

    const userItems = [
        {key: appPermissions.users, path: '/admin/users', icon: Users, label: 'Utilisateurs'},
        {
            key: appPermissions.users_permissions,
            path: '/admin/users/permissions',
            icon: Settings,
            label: 'Permissions des rôles'
        },
        {
            key: appPermissions.team,
            path: '/admin/team',
            icon: CircleUserRoundIcon,
            label: 'Equipe Dirigeante',
            keywords: ['equipe', 'membre']
        },
        {
            key: appPermissions.offices,
            path: '/admin/offices',
            icon: Building2,
            label: 'Bureaux',
            keywords: ['bureaux']
        },
        {
            key: appPermissions.categories,
            path: '/admin/categories',
            icon: Tags,
            label: 'Catégories',
            keywords: ['catégorie']
        },
        {
            key: appPermissions.visitor_accounts,
            path: '/admin/visitors',
            icon: UserRoundSearch,
            label: 'Comptes Visiteurs',
            keywords: ['visiteurs', 'utilisateurs']
        },
        {
            key: appPermissions.menu_visibility,
            path: '/admin/menu-sites',
            icon: Menu,
            label: 'Menu du Site',
            keywords: ['menu', 'site', "visibilité"]
        }
    ];

    const toggleTheme = () => {
        setTheme((prev) => {
            const next = prev === 'dark' ? 'light' : 'dark';
            if (typeof window !== 'undefined') {
                localStorage.setItem('admin_theme', next);
                window.dispatchEvent(new Event('admin_theme_change'));
            }
            return next;
        });
    };

    const sidebarExpanded = isSidebarOpen || isSidebarHoverOpen;

    const logoSrc = sidebarExpanded
        ? theme === 'dark'
            ? '/logo_white.png'
            : '/logo_colored - Copie.png'
        : theme === 'dark'
            ? '/logo_glob_white.png'
            : '/logo_glob_red.png';

    return (
        <div
            className={`min-h-screen flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-slate-50 text-gray-900'}`}>
            {/* Mobile overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-30 md:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
                onClick={() => setIsSidebarOpen(false)}
            />

            <aside
                className={`fixed top-0 left-0 z-40 h-screen transition-all transform duration-300 ${
                    sidebarExpanded ? 'w-64 translate-x-0' : 'w-20 -translate-x-full md:translate-x-0'
                } ${theme === 'dark' ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}
                onMouseEnter={() => setIsSidebarHoverOpen(true)}
                onMouseLeave={() => setIsSidebarHoverOpen(false)}
            >
                <div className="h-full px-3 py-4 flex flex-col">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <img src={logoSrc} alt="Shipping GL" className="h-17 w-auto mt-[-10px]"/>
                    </div>

                    <ul className="space-y-2 flex-1 overflow-y-auto">
                        {/* <li>
              <Link to="/" className="flex items-center p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700">
                <ArrowLeft className="w-5 h-5" />
                <span className="ml-3">Retour au site</span>
              </Link>
            </li> */}

                        {HasPermission(appPermissions.dashboard) && (
                            <li className="relative">
                                <Link
                                    to="/admin/dashboard"
                                    className={`flex items-center ${
                                        sidebarExpanded ? 'justify-start' : 'justify-center'
                                    } p-2 rounded-lg ${
                                        location.pathname === '/admin/dashboard'
                                            ? 'admin-menu-active'
                                            : `admin-menu-item ${theme}`
                                    }`}
                                >
                                    <BarChart3
                                        className="w-5 h-5"
                                    />
                                    {sidebarExpanded && (
                                        <span className="ml-3 whitespace-nowrap hidden md:inline">Dashboard</span>
                                    )}
                                </Link>
                            </li>
                        )}

                        {/* Users group */}
                        {userItems.filter(item => HasPermission(item.key)) && (
                            <li className="relative">
                                <button
                                    onClick={() => setUsersExpanded(!usersExpanded)}
                                    className={`w-full flex items-center ${
                                        sidebarExpanded ? 'justify-between' : 'justify-center'
                                    } p-2 rounded-lg ${
                                        `admin-menu-item ${theme}`
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <Users className="w-5 h-5"/>
                                        {sidebarExpanded && (
                                            <span
                                                className="ml-3 whitespace-nowrap hidden md:inline">Général</span>
                                        )}
                                    </div>
                                    {sidebarExpanded && (
                                        <span className="hidden md:inline">
                      {usersExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                    </span>
                                    )}
                                </button>
                                {usersExpanded && (
                                    <ul className="mt-2 space-y-1">
                                        {userItems
                                            .filter(item => HasPermission(item.key))
                                            .map((item) => (
                                                <li key={item.path} className="relative">
                                                    <Link
                                                        to={item.path}
                                                        className={`flex items-center ${
                                                            sidebarExpanded ? 'justify-start pl-6' : 'justify-center'
                                                        } p-2 rounded-lg text-sm ${
                                                            location.pathname === item.path
                                                                ? 'admin-menu-active'
                                                                : sidebarExpanded
                                                                    ? `admin-submenu-item ${theme}`
                                                                    : theme === 'dark'
                                                                        ? 'text-primary-400 hover:text-white hover:bg-gray-700'
                                                                        : 'text-primary-600 hover:text-primary-700 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        <item.icon className="w-4 h-4"/>
                                                        {sidebarExpanded && (
                                                            <span
                                                                className="ml-3 whitespace-nowrap hidden md:inline">{item.label}</span>
                                                        )}
                                                    </Link>
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </li>
                        )}

                        {/* Tables group - Always visible */}
                        {tableItems.filter(item => HasPermission(item?.key)) && (
                            <li className="relative mt-2">
                                <button
                                    onClick={() => setTablesExpanded(!tablesExpanded)}
                                    className={`w-full flex items-center ${
                                        sidebarExpanded ? 'justify-between' : 'justify-center'
                                    } p-2 rounded-lg ${
                                        `admin-menu-item ${theme}`
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <Table2Icon className="w-5 h-5"/>
                                        {sidebarExpanded && (
                                            <span className="ml-3 whitespace-nowrap hidden md:inline">Tables</span>
                                        )}
                                    </div>
                                    {sidebarExpanded && (
                                        <span className="hidden md:inline">
                      {tablesExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                    </span>
                                    )}
                                </button>

                                {tablesExpanded && (
                                    <ul className="mt-2 space-y-1">
                                        {tableItems
                                            .filter(item => HasPermission(item?.key))
                                            .map((item) => {
                                                const isQuoteRequests = item.key === 'quote_requests';

                                                return (
                                                    <li key={item.path} className="relative">
                                                        <Link
                                                            to={item.path}
                                                            className={`flex items-center ${
                                                                sidebarExpanded ? 'justify-start pl-6' : 'justify-center'
                                                            } p-2 rounded-lg text-sm ${
                                                                location.pathname === item.path
                                                                    ? 'text-white bg-red-600'
                                                                    : sidebarExpanded
                                                                        ? theme === 'dark'
                                                                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                                                            : 'text-gray-700 hover:text-gray-900 hover:bg-slate-100'
                                                                        : theme === 'dark'
                                                                            ? 'text-primary-400 hover:text-white hover:bg-gray-700'
                                                                            : 'text-primary-600 hover:text-primary-700 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <item.icon className="w-4 h-4"/>
                                                            {sidebarExpanded && (
                                                                <span
                                                                    className="ml-3 whitespace-nowrap flex-1 flex items-center justify-between">
                                  <span>{item.label}</span>
                                                                    {isQuoteRequests && quoteBadge > 0 && (
                                                                        <span
                                                                            className="ml-2 inline-flex items-center justify-center min-w-[1.4rem] px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-600 text-white">
                                      {quoteBadge > 9 ? '9+' : quoteBadge}
                                    </span>
                                                                    )}
                                </span>
                                                            )}
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                    </ul>
                                )}
                            </li>
                        )}


                        {/* Menu Cotations & AO */}
                        <li className="relative mt-2">
                            {HasOneOfPermissions([{id: appPermissions.cotation, ops: appOps.read}, {
                                id: appPermissions.appelOffre,
                                ops: appOps.read
                            }]) ? <button
                                onClick={() => setActiveMenu(activeMenu === 'cotations' ? '' : 'cotations')}
                                className={`w-full flex items-center ${
                                    sidebarExpanded ? 'justify-between' : 'justify-center'
                                } p-2 rounded-lg ${
                                    activeMenu === 'cotations' ||
                                    location.pathname.startsWith('/admin/cotations') ||
                                    location.pathname.startsWith('/admin/appels-offres')
                                        ? theme === 'dark'
                                            ? 'bg-blue-900/40 text-blue-300'
                                            : 'bg-blue-50 text-blue-600'
                                        : `admin-menu-item ${theme}`
                                }`}
                            >
                                <div className="flex items-center">
                                    <FileText className="w-5 h-5"/>
                                    {sidebarExpanded && (
                                        <span className="ml-3 whitespace-nowrap hidden md:inline">
                                            Cotations & AO
                                        </span>
                                    )}
                                </div>
                                {sidebarExpanded && (
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${
                                            activeMenu === 'cotations' ? 'transform rotate-180' : ''
                                        }`}
                                    />
                                )}
                            </button> : null}

                            {/* Sous-menus */}
                            {HasOneOfPermissions([{id: appPermissions.cotation, ops: appOps.read}, {
                                id: appPermissions.appelOffre,
                                ops: appOps.read
                            }]) && activeMenu === 'cotations' && sidebarExpanded &&  (
                                <ul className="mt-1 space-y-1">
                                    {HasPermission(appPermissions.cotation) ? <li>
                                        <Link
                                            to="/admin/cotations"
                                            className={`flex items-center ${sidebarExpanded ? 'justify-start pl-6' : 'justify-center'} p-2 rounded-lg text-sm ${
                                                location.pathname === '/admin/cotations'
                                                    ? 'text-white bg-red-600'
                                                    : theme === 'dark'
                                                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                                        : 'text-gray-700 hover:text-gray-900 hover:bg-slate-100'
                                            }`}
                                        >
                                            <FileText className="w-4 h-4 mr-2"/>
                                            <span>Cotations</span>
                                        </Link>
                                    </li> : null}
                                    {HasPermission(appPermissions.appelOffre) ? <li>
                                        <Link
                                            to="/admin/appels-offres"
                                            className={`flex items-center ${sidebarExpanded ? 'justify-start pl-6' : 'justify-center'} p-2 rounded-lg text-sm ${
                                                location.pathname === '/admin/appels-offres'
                                                    ? 'text-white bg-red-600'
                                                    : theme === 'dark'
                                                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                                        : 'text-gray-700 hover:text-gray-900 hover:bg-slate-100'
                                            }`}
                                        >
                                            <ClipboardList className="w-4 h-4 mr-2"/>
                                            <span>Appels d'offres</span>
                                        </Link>
                                    </li> : null}
                                </ul>
                            )}
                        </li>

                        {HasPermission(appPermissions.reports) && (
                            <li className="relative">
                                <Link
                                    to="/admin/reports"
                                    className={`flex items-center ${
                                        sidebarExpanded ? 'justify-start' : 'justify-center'
                                    } p-2 rounded-lg ${
                                        location.pathname === '/admin/reports'
                                            ? 'text-white bg-red-600'
                                            : theme === 'dark'
                                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <TrendingUp className="w-5 h-5"/>
                                    {sidebarExpanded && (
                                        <span className="ml-3 whitespace-nowrap hidden md:inline">Rapports</span>
                                    )}
                                </Link>
                            </li>
                        )}

                        {HasPermission(appPermissions.settings) && (
                            <li className="relative">
                                <Link
                                    to="/admin/settings"
                                    className={`flex items-center ${
                                        sidebarExpanded ? 'justify-start' : 'justify-center'
                                    } p-2 rounded-lg ${
                                        location.pathname === '/admin/settings'
                                            ? 'text-white bg-red-600'
                                            : theme === 'dark'
                                                ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                                : 'text-gray-700 hover:text-gray-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <Settings className="w-5 h-5"/>
                                    {sidebarExpanded && (
                                        <span className="ml-3 whitespace-nowrap hidden md:inline">Paramètres</span>
                                    )}
                                </Link>
                            </li>
                        )}

                    </ul>

                    <div
                        className={`mt-auto pt-4 border-t ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}
                    >
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center ${
                                sidebarExpanded ? 'justify-start' : 'justify-center'
                            } p-2 rounded-lg ${
                                theme === 'dark'
                                    ? 'text-red-300 hover:bg-red-900/40'
                                    : 'text-red-600 hover:bg-red-50'
                            }`}
                        >
                            <LogOut className="w-5 h-5"/>
                            {sidebarExpanded && (
                                <span className="ml-3 whitespace-nowrap hidden md:inline">
                  Déconnexion
                </span>
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/')}
                            className={`w-full flex items-center ${
                                sidebarExpanded ? 'justify-start' : 'justify-center'
                            } p-2 rounded-lg mt-2 ${
                                theme === 'dark'
                                    ? 'text-red-300 hover:bg-red-900/40'
                                    : 'text-red-600 hover:bg-red-50'
                            }`}
                        >
                            <Home className="w-5 h-5"/>
                            {sidebarExpanded && (
                                <span className="ml-3 whitespace-nowrap hidden md:inline">
                  Retour au site
                </span>

                            )}
                        </button>

                        {/* Signature du compteur */}
                        <div
                            className={`mt-3 text-center ${!sidebarExpanded ? 'px-1' : 'px-3'} ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} text-[8px]`}>
                            <div className="border-t border-gray-600/20 pt-2">
                                <div>Powered by DigitalEdge</div>
                                <div className="font-medium">Deon Mass</div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <div className={`flex-1 ${sidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
                {(showNotificationsMenu || showProfileMenu) && (
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                            setShowNotificationsMenu(false);
                            setShowProfileMenu(false);
                        }}
                    />
                )}

                <div
                    className={`fixed top-0 right-0 left-0 z-50 p-4 flex items-center border-b ${
                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    } ${sidebarExpanded ? 'md:left-64' : 'md:left-20'}`}
                >
                    <div className="flex items-center gap-3 flex-1">
                        <button
                            className={`p-2 rounded-lg border relative overflow-hidden transition-colors ${
                                theme === 'dark'
                                    ? 'border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-200'
                                    : 'border-gray-200 bg-white hover:bg-slate-100 text-gray-700'
                            }`}
                            onClick={() => setIsSidebarOpen((s) => !s)}
                            aria-label="Basculer le menu latéral"
                        >
              <span className="block w-5 h-5 relative">
                <Menu
                    className={`w-5 h-5 absolute inset-0 transform transition-all duration-900 ease-in-out ${
                        isSidebarOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
                    }`}
                />
                <X
                    className={`w-5 h-5 absolute inset-0 transform transition-all duration-900 ease-in-out ${
                        isSidebarOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
                    }`}
                />
              </span>
                        </button>

                        {/* Notifications + Profile buttons + menus */}
                        <div className="flex items-center gap-0">
                            {/* Notifications button + menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotificationsMenu((v) => !v)}
                                    className={`w-9 h-9 flex items-center justify-center rounded-full relative transition-colors ${
                                        theme === 'dark'
                                            ? 'text-gray-400 hover:text-white hover:bg-gray-700/70'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-slate-100'
                                    }`}
                                    title="Notifications"
                                >
                                    <Bell className="w-5 h-5"/>
                                    {notificationCount > 0 && (
                                        <span
                                            className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                                    )}
                                </button>

                                <div
                                    className={`absolute right-0 top-full mt-2 w-80 rounded-lg shadow-lg z-50 border transform origin-top-right transition-all duration-[600ms] ease-out ${
                                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    } ${
                                        showNotificationsMenu
                                            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                    }`}
                                >
                                    <div
                                        className={`px-4 py-3 border-b flex items-center justify-between ${
                                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                                        }`}
                                    >
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Notifications
                    </span>
                                        {notificationCount > 0 && (
                                            <span
                                                className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {notificationCount} non lue(s)
                      </span>
                                        )}
                                    </div>

                                    {recentNotifications.length === 0 ? (
                                        <div
                                            className={`px-4 py-4 text-sm flex items-center gap-2 ${
                                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                            }`}
                                        >
                                            <Bell className="w-4 h-4"/>
                                            <span>Aucune notification récente</span>
                                        </div>
                                    ) : (
                                        <ul
                                            className={`max-h-80 overflow-y-auto divide-y ${
                                                theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'
                                            }`}
                                        >
                                            {recentNotifications.map((notif) => {
                                                const notifType: string = notif.type || 'other';


                                                const typeColor = theme === 'dark'
                                                    ? notifType === 'like'
                                                        ? 'bg-pink-600/20 text-pink-300 border-pink-500/60'
                                                        : notifType === 'comment'
                                                            ? 'bg-sky-600/20 text-sky-300 border-sky-500/60'
                                                            : notifType === 'post'
                                                                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/60'
                                                                : notifType === 'partner'
                                                                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/60'
                                                                    : 'bg-amber-600/20 text-amber-300 border-amber-500/60'
                                                    : notifType === 'like'
                                                        ? 'bg-pink-500 text-white border-pink-500'
                                                        : notifType === 'comment'
                                                            ? 'bg-sky-500 text-white border-sky-500'
                                                            : notifType === 'post'
                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                : notifType === 'partner'
                                                                    ? 'bg-indigo-500 text-white border-indigo-500'
                                                                    : 'bg-amber-500 text-white border-amber-500';

                                                return (
                                                    <li
                                                        key={notif.id}
                                                        className={`px-4 py-3 flex items-start gap-2 ${
                                                            theme === 'dark' ? 'hover:bg-gray-700/60' : 'hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className="mt-1">
                                                            {!notif.is_read && (
                                                                <span
                                                                    className="inline-block w-2 h-2 rounded-full bg-primary-500"/>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div
                                                                className="flex items-center justify-between gap-2 mb-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${typeColor}`}>
                                  {notif.type}
                                </span>
                                                                <span
                                                                    className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {notif.created_at
                                      ? formatDistanceToNow(new Date(notif.created_at), {addSuffix: true, locale: fr})
                                      : ''}
                                </span>
                                                            </div>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1">
                                                                    <div
                                                                        className={`text-sm truncate ${
                                                                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                                                                        }`}
                                                                    >
                                                                        {(notif.data && (notif.data as any).user_name) || notif.title}
                                                                    </div>
                                                                    <div
                                                                        className={`text-xs line-clamp-2 ${
                                                                            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                                                                        }`}
                                                                    >
                                                                        {notif.message}
                                                                    </div>
                                                                </div>
                                                                {!notif.is_read && (
                                                                    <button
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            try {
                                                                                const {error} = await supabase
                                                                                    .from('admin_notifications')
                                                                                    .update({is_read: true})
                                                                                    .eq('id', notif.id);

                                                                                if (error) {
                                                                                    console.warn('[AdminLayout] Error marking notification as read from menu:', error);
                                                                                    return;
                                                                                }

                                                                                setRecentNotifications((prev) =>
                                                                                    prev.map((n) =>
                                                                                        n.id === notif.id ? {
                                                                                            ...n,
                                                                                            is_read: true
                                                                                        } : n
                                                                                    )
                                                                                );
                                                                                setNotificationCount((prev) => (prev > 0 ? prev - 1 : 0));
                                                                            } catch (err) {
                                                                                console.error('[AdminLayout] Unexpected error marking notification as read from menu:', err);
                                                                            }
                                                                        }}
                                                                        className="ml-2 mt-1 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                                                                        title="Marquer comme lue"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4"/>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}

                                    <button
                                        onClick={() => {
                                            setShowNotificationsMenu(false);
                                            navigate('/admin/notifications');
                                        }}
                                        className={`w-full text-center text-sm border-t py-2.5 ${
                                            theme === 'dark'
                                                ? 'text-primary-400 hover:text-primary-300 border-gray-700'
                                                : 'text-primary-600 hover:text-primary-500 border-gray-200'
                                        }`}
                                    >
                                        Voir toutes les notifications
                                    </button>
                                </div>
                            </div>

                            {/* Profile button + menu */}
                            <div className="relative ml-3">
                                <button
                                    onClick={() => setShowProfileMenu((v) => !v)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full border border-transparent hover:border-primary-500 hover:bg-black/10 transition-colors"
                                    title={connectedUser?.name}
                                >
                                    <User
                                        className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}/>
                                </button>

                                <div
                                    className={`absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg z-50 border transform origin-top-right transition-all duration-[600ms] ease-out ${
                                        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    } ${
                                        showProfileMenu
                                            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                                    }`}
                                >
                                    <div
                                        className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'}`}>
                                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Connecté en tant que
                                        </p>
                                        <p
                                            className={`text-sm font-medium truncate ${
                                                theme === 'dark' ? 'text-white' : 'text-gray-900'
                                            }`}
                                        >
                                            {connectedUser?.name}
                                        </p>
                                        {connectedUser?.email && (
                                            <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                                {connectedUser?.email}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            toggleTheme();
                                            setShowProfileMenu(false);
                                        }}
                                        className={`w-full flex items-center px-4 py-2.5 text-sm border-b ${
                                            theme === 'dark'
                                                ? 'text-gray-200 hover:bg-gray-700/80 border-gray-700/50'
                                                : 'text-gray-800 hover:bg-slate-100 border-gray-200'
                                        }`}
                                    >
                                        {theme === 'dark' ? (
                                            <Sun className="w-4 h-4 mr-2"/>
                                        ) : (
                                            <Moon className="w-4 h-4 mr-2"/>
                                        )}
                                        {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/admin/settings?tab=profile');
                                        }}
                                        className={`w-full flex items-center px-4 py-2.5 text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-200 hover:bg-gray-700/80'
                                                : 'text-gray-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <User className="w-4 h-4 mr-2"/>
                                        Profil
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/admin/settings');
                                        }}
                                        className={`w-full flex items-center px-4 py-2.5 text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-200 hover:bg-gray-700/80'
                                                : 'text-gray-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Settings className="w-4 h-4 mr-2"/>
                                        Paramètres
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            navigate('/');
                                        }}
                                        className={`w-full flex items-center px-4 py-2.5 text-sm ${
                                            theme === 'dark'
                                                ? 'text-gray-200 hover:bg-gray-700/80'
                                                : 'text-gray-800 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Home className="w-4 h-4 mr-2"/>
                                        Retour au site
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowProfileMenu(false);
                                            handleLogout();
                                        }}
                                        className={`w-full flex items-center px-4 py-2.5 text-sm border-t ${
                                            theme === 'dark'
                                                ? 'text-red-300 hover:bg-red-900/40 border-gray-700/70'
                                                : 'text-red-500 hover:bg-red-50 border-gray-200'
                                        }`}
                                    >
                                        <LogOut className="w-4 h-4 mr-2"/>
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Search icon + animated inline bar */}
                        <div className="flex items-center gap-2 flex-1 max-w-full">
                            <button
                                onClick={() => setIsSearchOpen((v) => !v)}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                                    theme === 'dark'
                                        ? 'text-gray-400 hover:text-white hover:bg-gray-700/70'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-slate-100'
                                }`}
                                title="Rechercher"
                            >
                <span className="relative w-5 h-5 block">
                  <Search
                      className={`absolute inset-0 w-5 h-5 transform transition-all duration-900 ease-out ${
                          !isSearchOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'
                      }`}
                  />
                  <X
                      className={`absolute inset-0 w-5 h-5 transform transition-all duration-900 ease-out ${
                          isSearchOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'
                      }`}
                  />
                </span>
                            </button>

                            <div
                                className={`transition-all duration-[1200ms] ease-in-out ${
                                    isSearchOpen ? 'flex-1 opacity-100' : 'flex-none w-0 opacity-0'
                                }`}
                            >
                                <div className="relative w-full">
                                    <Search
                                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                                            theme === 'dark' ? 'text-gray-400' : 'text-gray-400'
                                        }`}
                                    />
                                    <input
                                        type="search"
                                        placeholder="Rechercher..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setSearchResultsOpen(true);
                                        }}
                                        onFocus={() => {
                                            if (searchQuery) setSearchResultsOpen(true);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && filteredSearchItems.length > 0) {
                                                navigate(filteredSearchItems[0].path);
                                                setIsSearchOpen(false);
                                                setSearchResultsOpen(false);
                                            }
                                        }}
                                        className={`w-full pl-9 pr-8 py-2 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 border ${
                                            theme === 'dark'
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                    />

                                    {searchQuery && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                // On laisse la barre ouverte et on laisse les résultats se vider naturellement
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            aria-label="Effacer la recherche"
                                        >
                                            <X className="w-4 h-4"/>
                                        </button>
                                    )}

                                    {searchResultsOpen && filteredSearchItems.length > 0 && (
                                        <ul
                                            className={`absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-lg shadow-lg border z-40 text-sm ${
                                                theme === 'dark'
                                                    ? 'bg-gray-800 border-gray-700 text-gray-100'
                                                    : 'bg-white border-gray-200 text-gray-900'
                                            }`}
                                        >
                                            {filteredSearchItems.map((item) => (
                                                <li key={item.path}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigate(item.path);
                                                            setIsSearchOpen(false);
                                                            setSearchResultsOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 hover:bg-primary-600/10 ${
                                                            theme === 'dark'
                                                                ? 'hover:text-white'
                                                                : 'hover:text-primary-700'
                                                        }`}
                                                    >
                                                        {item.label}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-20 p-4 sm:p-6">
                    <Outlet context={{theme}}/>
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
