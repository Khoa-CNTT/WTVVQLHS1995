import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import LegalDocsPage from '../pages/LegalDocs/LegalDocsPage';
import authService from '../services/authService';

// Sử dụng hàm isAuthenticated từ authService
const isAuthenticated = () => authService.isAuthenticated();

const PrivateRoutes = () => {
  const location = useLocation();

  return isAuthenticated() ? (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition custom="fade">
            <Dashboard />
          </PageTransition>
        } />
        <Route path="/profile" element={
          <PageTransition custom="fade">
            <Profile />
          </PageTransition>
        } />
        <Route path="/legal-docs" element={
          <PageTransition custom="fade">
            <LegalDocsPage />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoutes;