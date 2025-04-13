import React, { useState, useEffect } from 'react';
import Loading from './components/layout/Loading/Loading';
import { checkTokenExpiration } from './config/axios';
import authService from './services/authService';
import userService from './services/userService';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Kiểm tra xem token có hợp lệ không khi ứng dụng khởi động
        if (localStorage.getItem('token')) {
          await checkTokenExpiration();
          
          // Thêm: Làm mới thông tin người dùng khi app khởi động
          try {
            await userService.refreshUserData();
          } catch (refreshError) {
            console.error('Lỗi làm mới thông tin người dùng:', refreshError);
          }
        }
        
        // Sau khi kiểm tra token, tắt loading
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Lỗi khi kiểm tra xác thực:', error);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Kiểm tra token và làm mới thông tin người dùng định kỳ
  useEffect(() => {
    // Nếu không có token, không cần thiết lập kiểm tra
    if (!localStorage.getItem('token')) return;
    
    // Biến để theo dõi thời gian kiểm tra token cuối cùng
    let lastTokenCheck = Date.now();
    // Biến để theo dõi thời gian làm mới thông tin người dùng cuối cùng
    let lastUserRefresh = Date.now();
    
    // Thiết lập kiểm tra token định kỳ (mỗi 15 phút)
    const tokenCheckInterval = setInterval(() => {
      if (localStorage.getItem('token')) {
        authService.checkTokenValidity();
        lastTokenCheck = Date.now();
        
        // Thêm: Làm mới thông tin người dùng mỗi 15 phút
        if (Date.now() - lastUserRefresh > 15 * 60 * 1000) {
          userService.refreshUserData()
            .then(() => {
              lastUserRefresh = Date.now();
              console.log('Đã làm mới thông tin người dùng');
            })
            .catch(error => {
              console.error('Lỗi làm mới thông tin người dùng:', error);
            });
        }
      }
    }, 15 * 60 * 1000); // Kiểm tra mỗi 15 phút
    
    // Thiết lập riêng một interval để làm mới thông tin người dùng thường xuyên hơn (mỗi 5 phút)
    const userRefreshInterval = setInterval(() => {
      if (localStorage.getItem('token')) {
        userService.refreshUserData()
          .then(() => {
            lastUserRefresh = Date.now();
          })
          .catch(error => {
            console.error('Lỗi làm mới thông tin người dùng:', error);
          });
      }
    }, 5 * 60 * 1000); // Làm mới mỗi 5 phút
    
    // Xử lý khi người dùng tương tác với trang
    const handleUserActivity = () => {
      // Chỉ kiểm tra token nếu đã hơn 5 phút kể từ lần kiểm tra cuối cùng
      if (Date.now() - lastTokenCheck > 5 * 60 * 1000 && localStorage.getItem('token')) {
        authService.checkTokenValidity();
        lastTokenCheck = Date.now();
      }
      
      // Thêm: Làm mới thông tin người dùng nếu đã hơn 10 phút kể từ lần làm mới cuối cùng
      if (Date.now() - lastUserRefresh > 10 * 60 * 1000 && localStorage.getItem('token')) {
        userService.refreshUserData()
          .then(() => {
            lastUserRefresh = Date.now();
          })
          .catch(error => {
            console.error('Lỗi làm mới thông tin người dùng:', error);
          });
      }
    };
    
    // Sử dụng throttle để giảm số lần gọi hàm khi người dùng thao tác liên tục
    let throttleTimer;
    const throttledActivity = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          handleUserActivity();
          throttleTimer = null;
        }, 1000);
      }
    };
    
    // Thêm các listener cho hoạt động người dùng
    window.addEventListener('click', throttledActivity);
    window.addEventListener('keypress', throttledActivity);
    window.addEventListener('scroll', throttledActivity);
    window.addEventListener('mousemove', throttledActivity);
    
    // Cũng kiểm tra khi tab trở nên active
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleUserActivity();
      }
    });
    
    return () => {
      // Dọn dẹp
      clearInterval(tokenCheckInterval);
      clearInterval(userRefreshInterval); // Thêm: Dọn dẹp interval làm mới thông tin người dùng
      clearTimeout(throttleTimer);
      window.removeEventListener('click', throttledActivity);
      window.removeEventListener('keypress', throttledActivity);
      window.removeEventListener('scroll', throttledActivity);
      window.removeEventListener('mousemove', throttledActivity);
      document.removeEventListener('visibilitychange', handleUserActivity);
    };
  }, []);

  if (loading) {
    return <Loading />;
  }

  return null;
}

export default App;