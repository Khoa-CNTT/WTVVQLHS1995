import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import PublicRoutes from './publicRoutes';
import PrivateRoutes from './privateRoutes';
import RouteChangeDetector from '../components/layout/TransitionPage/RouteChangeDetector';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import authService from '../services/authService';
import { Navigate } from 'react-router-dom';

// Kiểm tra xác thực
const isAuthenticated = () => authService.isAuthenticated();

// Thành phần bảo vệ route
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

const AppRouter = () => {
  const location = useLocation();

  return (
    <>
      <RouteChangeDetector />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/*" element={
            <PageTransition custom="fade">
              <PublicRoutes />
            </PageTransition>
          } />
          <Route path="/admin" element={
            <PageTransition custom="fade">
              <Dashboard />
            </PageTransition>
          } />
          <Route path="/dashboard/*" element={
            <PageTransition custom="fade">
              <ProtectedRoute>
                <PrivateRoutes />
              </ProtectedRoute>
            </PageTransition>
          } />
          <Route path="/profile" element={
            <PageTransition custom="fade">
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </PageTransition>
          } />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default AppRouter;