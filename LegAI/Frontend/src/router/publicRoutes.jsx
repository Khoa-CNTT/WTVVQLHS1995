import { Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import Home from '../pages/Home/Home';
import Services from '../pages/Services/Services';
import News from '../pages/News/News';
import Contact from '../pages/Contact/Contact';
import Lawyers from '../pages/Lawyers/Lawyers';
import LawyerRegisterForm from '../pages/Lawyers/signUp/signUpLawyer';
import LoginPage from '../pages/Login/LoginPage';
import RegisterPage from '../pages/Register/Register';
import ForgotPassword from '../pages/ForgotPassword/ForgotPassword';
import TestApiConnection from '../components/TestApiConnection';
import { useLocation } from 'react-router-dom';
import ChangePassword from '../pages/Profile/ChangePassword/ChangePasssword'
import HomePage from '../pages/Home/Home';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import ChangePasswordPage from '../pages/Profile/ChangePassword/ChangePasssword';
import LawyerDashboard from '../pages/LawyerDashboard/LawyerDashboard';
import UsersManagerPage from '../pages/Dashboard/UsersManager/UsersManager';
import SearchResults from '../pages/Search/SearchResults';
import DocumentDetail from '../pages/Documents/DocumentDetail';
import Documents from '../pages/Documents/Documents';
import authService from '../services/authService';
import Templates from '../pages/Templates/Templates';
import TemplateDetail from '../pages/Templates/TemplateDetail';

// Kiểm tra xem người dùng đã đăng nhập chưa
const isAuthenticated = () => authService.isAuthenticated();

const PublicRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <PageTransition custom="fade">
            <Home />
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
        <Route path="/contact" element={
          <PageTransition custom="fade">
            <Contact />
          </PageTransition>
        } />
        <Route path="/lawyers" element={
          <PageTransition custom="fade">
            <Lawyers />
          </PageTransition>
        } />
        <Route path="/lawyers/signup" element={
          <PageTransition custom="fade">
            <LawyerRegisterForm />
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
        <Route path="/forgot-password" element={
          <PageTransition custom="fade">
            <ForgotPassword />
          </PageTransition>
        } />
        <Route path="/search" element={
          <PageTransition custom="fade">
            <SearchResults />
          </PageTransition>
        } />
        <Route path="/documents" element={
          <PageTransition custom="fade">
            <Documents />
          </PageTransition>
        } />
        <Route path="/legal/documents/:id" element={
          <PageTransition custom="fade">
            <DocumentDetail />
          </PageTransition>
        } />
        <Route path="/templates" element={
          <PageTransition custom="fade">
            <Templates />
          </PageTransition>
        } />
        <Route path="/legal/templates/:id" element={
          <PageTransition custom="fade">
            <TemplateDetail />
          </PageTransition>
        } />
        <Route path="/templates/:id" element={
          <PageTransition custom="fade">
            <TemplateDetail />
          </PageTransition>
        } />
        <Route path="/test" element={<TestApiConnection />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
};

export default PublicRoutes;