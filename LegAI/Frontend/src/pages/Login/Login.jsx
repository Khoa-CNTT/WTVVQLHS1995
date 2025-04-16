import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [alertInfo, setAlertInfo] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (authService.isAuthenticated()) {
      navigate('/');
    }

    // Kiểm tra xem có thông báo từ URL không
    const params = new URLSearchParams(location.search);
    const message = params.get('message');
    
    if (message === 'logout_success') {
      setAlertInfo({
        show: true,
        type: 'success',
        message: 'Đăng xuất thành công!'
      });
      // Xóa tham số message khỏi URL
      navigate('/login', { replace: true });
    } else if (message === 'relogin_required') {
      setAlertInfo({
        show: true,
        type: 'info',
        message: 'Bạn đã đăng ký làm luật sư thành công! Vui lòng đăng nhập lại để sử dụng đầy đủ quyền truy cập mới.'
      });
      // Xóa tham số message khỏi URL
      navigate('/login', { replace: true });
    }
  }, [navigate, location.search]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default Login; 