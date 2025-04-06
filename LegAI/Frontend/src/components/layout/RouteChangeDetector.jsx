import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Component này theo dõi thay đổi route và thực hiện các hành động cần thiết
const RouteChangeDetector = () => {
  const location = useLocation();

  useEffect(() => {
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

    // Log cho việc debug
    console.log(`Đã chuyển đến trang: ${location.pathname}`);
  }, [location]);

  // Component này không render gì cả
  return null;
};

export default RouteChangeDetector; 