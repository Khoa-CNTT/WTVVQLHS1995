import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Loading from '../Loading/Loading';
import authService from '../../../services/authService';

// Component này theo dõi thay đổi route và hiển thị loading khi chuyển trang
const RouteChangeDetector = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Hiển thị loading khi bắt đầu chuyển trang
    setIsLoading(true);

    // Đóng tất cả các cửa sổ chat khi chuyển trang
    const event = new CustomEvent('toggleChat', { 
      detail: { 
        isOpen: false,
        action: 'close'
      } 
    });
    window.dispatchEvent(event);

    // Cuộn về đầu trang khi chuyển trang
    window.scrollTo(0, 0);

    // Kiểm tra xác thực cho các route protected
    const protectedRoutes = ['/admin', '/dashboard', '/profile'];
    const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
    
    if (isProtectedRoute) {
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        navigate('/login', { replace: true });
        return;
      }
      
      // Kiểm tra phân quyền admin cho route /admin
      if (location.pathname.startsWith('/admin')) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          navigate('/', { replace: true });
          return;
        }
      }
    }

    // Ẩn loading sau khi chuyển trang hoàn tất
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Thời gian loading (ms)

    return () => clearTimeout(timer);
  }, [location, navigate]);

  // Hiển thị component loading khi đang chuyển trang
  return isLoading ? <Loading /> : null;
};

export default RouteChangeDetector; 