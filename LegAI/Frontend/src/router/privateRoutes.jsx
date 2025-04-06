import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';

// Tạm thời luôn cho phép truy cập các trang private để test UI
const isAuthenticated = () => true;

const PrivateRoutes = () => {
  const location = useLocation();

  return isAuthenticated() ? (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={
          <PageTransition custom="slideUp">
            <Dashboard />
          </PageTransition>
        } />
        <Route path="/profile" element={
          <PageTransition custom="scale">
            <Profile />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  ) : (
    <Navigate to="/login" />
  );
};

export default PrivateRoutes;