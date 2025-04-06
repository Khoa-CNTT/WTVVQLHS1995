import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loading from '../Loading/Loading';

// Component này theo dõi thay đổi route và hiển thị loading khi chuyển trang
const RouteChangeDetector = () => {
  const location = useLocation();
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

    // Ẩn loading sau khi chuyển trang hoàn tất
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Thời gian loading (ms)

    // Log cho việc debug
    console.log(`Đã chuyển đến trang: ${location.pathname}`);

    // Cleanup timer khi unmount
    return () => clearTimeout(timer);
  }, [location]);

  // Hiển thị component loading khi đang chuyển trang
  return isLoading ? <Loading /> : null;
};

export default RouteChangeDetector; 