import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedLayout = () => {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  const isAuthenticated = authService.isAuthenticated();
  
  // Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Nếu đã đăng nhập, hiển thị nội dung của route con
  return <Outlet />;
};

export default ProtectedLayout; 