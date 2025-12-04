import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';

// Components
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import PartnersPage from './pages/PartnersPage';
import NewsPage from './pages/NewsPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import PartnershipPage from './pages/PartnershipPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import EngagementPage from './pages/EngagementPage';
import ContactPage from './pages/ContactPage';
import RecruitmentPage from './pages/RecruitmentPage';

// Admin Pages
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminPartnersPage from './pages/admin/PartnersPage';
import AdminReportsPage from './pages/admin/ReportsPage';
import AdminSettingsPage from './pages/admin/SettingsPage';
import AdminUsersPage from './pages/admin/UsersPage';
import PostsPage from './pages/admin/PostsPage';
import CommentsPage from './pages/admin/CommentsPage';
import LikesPage from './pages/admin/LikesPage';
import EventsPage from './pages/admin/EventsPage';
import CategoriesPage from './pages/admin/CategoriesPage';
import NewsletterPage from './pages/admin/NewsletterPage';
import RolePermissionsPage from './pages/admin/RolePermissionsPage';
import AssignRolesPage from './pages/admin/AssignRolesPage';
import NotificationsPage from './pages/admin/NotificationsPage';
import AdminServicesPage from './pages/admin/ServicesPage';
import AdminQuoteRequestsPage from './pages/admin/QuoteRequestsPage';
import CandidaturePage from './pages/admin/CandidaturePage';
import JobOfferPage from './pages/admin/JobOfferPage';
import MenuVisibilityPage from './pages/admin/MenuVisibilityPage';

function App() {
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AuthProvider>
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="partenaires" element={<PartnersPage />} />
            <Route path="actualites" element={<NewsPage />} />
            <Route path="a-propos" element={<AboutPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="admin-login" element={<AdminLoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="devenir-partenaire" element={<PartnershipPage />} />
            <Route path="profil" element={<ProfilePage />} />
            <Route path="engagement" element={<EngagementPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="recrutement" element={<RecruitmentPage />}>
              <Route index element={null} />
              <Route path="offres" element={null} />
              <Route path="cv" element={null} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          
          {/* Admin Routes - Protected */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users">
              <Route index element={<AdminUsersPage />} />
              <Route path="visitors" element={<AdminUsersPage />} />
              <Route path="admins" element={<AdminUsersPage />} />
              <Route path="assign-roles" element={<AssignRolesPage />} />
              <Route path="permissions" element={<RolePermissionsPage />} />
            </Route>
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="posts" element={<PostsPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="quote-requests" element={<AdminQuoteRequestsPage />} />
            <Route path="candidatures" element={<CandidaturePage />} />
            <Route path="offres-emploi" element={<JobOfferPage />} />
            <Route path="likes" element={<LikesPage />} />
            <Route path="comments" element={<CommentsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="newsletter" element={<NewsletterPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="menu-visibility" element={<MenuVisibilityPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </AuthProvider>
  );
}

export default App;