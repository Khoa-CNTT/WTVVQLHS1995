import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import LoginPage from '../pages/Login/LoginPage';
import HomePage from '../pages/Home/Home'; 
import RegisterPage from '../pages/Register/Register';
import ChangePassword from '../pages/Profile/ChangePassword/ChangePasssword'
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import Contact from '../pages/Contact/Contact';
import LawyerDashboard from '../pages/LawyerDashboard/LawyerDashboard';
import Services from '../pages/Services/Services';
import News from '../pages/News/News';
import Lawyers from '../pages/Lawyers/Lawyers';


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
        <Route path="/change-password" element={
         <PageTransition custom="fade">
            <ChangePassword/>
          </PageTransition>
        } />
        <Route path="/forgot-password" element={
         <PageTransition custom="fade">
            <ForgotPassword/>
          </PageTransition>
        } />
        <Route path="/contact" element={
         <PageTransition custom="fade">
            <Contact/>
          </PageTransition>
        } />
        <Route path="/lawyer-dashboard" element={
          <PageTransition custom="fade">
            <LawyerDashboard />
          </PageTransition>
        } />
        <Route path="/services" element={
          <PageTransition custom="fade">
            <Services />
          </PageTransition>
        } />
        <Route path="/news" element={
          <PageTransition custom="fade">
            <News />
          </PageTransition>
        } />
        <Route path="/lawyers" element={
          <PageTransition custom="fade">
            <Lawyers />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default PublicRoutes;