import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from '../components/layout/TransitionPage/PageTransition';
import PublicRoutes from './publicRoutes';
import PrivateRoutes from './privateRoutes';
import Dashboard from '../pages/Dashboard/Dashboard';
import Profile from '../pages/Profile/Profile';
import LawyerDashboard from '../pages/LawyerDashboard/LawyerDashboard';
import UsersManagerPage from '../pages/Dashboard/UsersManager/UsersManager';
import authService from '../services/authService';

// Kiểm tra đăng nhập
const isAuthenticated = () => authService.isAuthenticated();

// Kiểm tra vai trò
const hasRole = (role) => {
  const user = authService.getCurrentUser();
  if (!user || !user.role) return false;
  
  // Chuyển đổi cả hai thành chữ thường để so sánh
  const userRole = user.role.toLowerCase();
  const requiredRole = Array.isArray(role) 
    ? role.map(r => r.toLowerCase()) 
    : [role.toLowerCase()];
  
  return requiredRole.includes(userRole);
};

// Route bảo vệ
const ProtectedRoute = ({ children, roles = [] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  
  // Nếu chỉ định vai trò, kiểm tra vai trò người dùng
  if (roles.length > 0) {
    // Sử dụng hàm hasRole từ authService
    const hasAccess = roles.some(role => authService.hasRole(role));
    
    if (!hasAccess) {
      return <Navigate to="/" />;
    }
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
        
        {/* Route dành cho admin */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={hasRole['admin']}>
            <PageTransition custom="fade">
              <Dashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route quản lý người dùng */}
        <Route path="/dashboard/users" element={
          <ProtectedRoute roles={hasRole['admin']}>
            <PageTransition custom="fade">
              <UsersManagerPage />
            </PageTransition>
          </ProtectedRoute>
        } />
        
        {/* Route dành cho luật sư */}
        <Route path="/lawyer-dashboard" element={
          <ProtectedRoute roles={hasRole(['lawyer'])}>
            <PageTransition custom="fade">
              <LawyerDashboard />
            </PageTransition>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRouter;