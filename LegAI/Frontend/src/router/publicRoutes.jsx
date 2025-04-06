import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import LoginPage from '../pages/Login/LoginPage';
import HomePage from '../pages/Home/Home'; 
import RegisterPage from '../pages/Register/Register';
import Dashboard from '../pages/Dashboard/Dashboard';

const PublicRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition custom="fade">
            <HomePage />
          </PageTransition>
        } />
        <Route path="/login" element={
          <PageTransition custom="fade">
            <LoginPage />
          </PageTransition>
        } />
        <Route path="/register" element={
          <PageTransition custom="fade">
            <RegisterPage />
          </PageTransition>
        } />
        <Route path="/admin" element={
          <PageTransition custom="fade">
            <Dashboard />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default PublicRoutes;