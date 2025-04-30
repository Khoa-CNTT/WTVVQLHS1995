import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import PublicRoutes from './publicRoutes';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import LegalDocsPage from '../pages/LegalDocs/LegalDocsPage';
import LawyerDashboard from '../pages/LawyerDashboard/LawyerDashboard';
import UsersManagerPage from '../pages/Dashboard/UsersManager/UsersManager';
import ContractManager from '../pages/Contracts/ContractManager';
import ContractDetail from '../pages/Contracts/ContractDetail';
import LegalCaseList from '../pages/LegalCase/LegalCaseList';
import LegalCaseDetail from '../pages/LegalCase/LegalCaseDetail';
import LegalCaseCreator from '../pages/LegalCase/LegalCaseCreator';
import LegalCaseEditor from '../pages/LegalCase/LegalCaseEditor';
import authService from '../services/authService';
import LegalDocDetail from '../pages/LegalDocs/LegalDocDetail';

// Kiểm tra đăng nhập
const isAuthenticated = () => authService.isAuthenticated();

// Kiểm tra vai trò - không phân biệt hoa thường
const hasRole = (roles) => {
  const user = authService.getCurrentUser();
  if (!user || !user.role) return false;
  
  // Chuyển đổi vai trò người dùng thành chữ thường để so sánh
  const userRole = user.role.toLowerCase();
  
  // Chuyển đổi các vai trò cần kiểm tra thành mảng và chuẩn hóa chữ thường
  const requiredRoles = Array.isArray(roles) 
    ? roles.map(r => r.toLowerCase()) 
    : [roles.toLowerCase()];
  
  return requiredRoles.some(role => {
    // Xử lý trường hợp vai trò 'user' và 'customer' được xem là tương đương
    if ((role === 'customer' && userRole === 'user') ||
        (role === 'user' && userRole === 'customer')) {
      return true;
    }
    
    return role === userRole;
  });
};

// Route bảo vệ
const ProtectedRoute = ({ children, roles = [] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // Nếu chỉ định vai trò, kiểm tra vai trò người dùng
  if (roles.length > 0 && !hasRole(roles)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppRouter = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/*" element={<PublicRoutes />} />
        
        {/* Routes riêng tư yêu cầu đăng nhập */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <Profile />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route hồ sơ pháp lý */}
        <Route path="/legal-docs" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <LegalDocsPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route quản lý hợp đồng */}
        <Route path="/contracts" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <ContractManager />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route chi tiết hợp đồng */}
        <Route path="/contracts/:id" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <ContractDetail />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route dành cho admin */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['admin']}>
            <PageTransition custom="fade">
              <Dashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route quản lý người dùng */}
        <Route path="/dashboard/users" element={
          <ProtectedRoute roles={['admin']}>
            <PageTransition custom="fade">
              <UsersManagerPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route dành cho luật sư */}
        <Route path="/lawyer-dashboard" element={
          <ProtectedRoute roles={['lawyer']}>
            <PageTransition custom="fade">
              <LawyerDashboard />
            </PageTransition>
          </ProtectedRoute>
        } />

        {/* Route chi tiết hồ sơ pháp lý */}
        <Route path="/dashboard/legal-docs/:id" element={
          <ProtectedRoute roles={['admin', 'user', 'customer','lawyer']}>
            <PageTransition custom="fade">
              <Dashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route chi tiết hồ sơ pháp lý */}
        <Route path="/legal-docs/:id" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <LegalDocDetail />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route quản lý vụ án pháp lý */}
        <Route path="/legal-cases" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <LegalCaseList />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/legal-cases/create" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <LegalCaseCreator />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/legal-cases/:id" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <LegalCaseDetail />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        <Route path="/legal-cases/:id/edit" element={
          <ProtectedRoute>
            <PageTransition custom="fade">
              <LegalCaseEditor />
            </PageTransition>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;