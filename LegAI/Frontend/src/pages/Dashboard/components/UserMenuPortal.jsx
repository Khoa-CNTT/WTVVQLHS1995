import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Menu, Dropdown } from 'antd';
import { HomeOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import 'animate.css';

const UserMenuPortal = ({ isOpen, position, onMouseEnter, onMouseLeave, onClose, items }) => {
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Tạo container cho portal nếu chưa tồn tại
    let container = document.getElementById('user-menu-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'user-menu-portal';
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    // Cleanup khi component unmount
    return () => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, []);

  // Đóng menu khi nhấn phím Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Không render gì nếu menu đóng hoặc chưa có container
  if (!isOpen || !portalContainer) return null;

  // Map các icon chuẩn cho các menu item
  const getItemIcon = (icon) => {
    switch(icon) {
      case '🏠': return <HomeOutlined />;
      case '👤': return <UserOutlined />;
      case '🚪': return <LogoutOutlined />;
      default: return null;
    }
  };

  const menuItems = items.map((item, index) => ({
    key: index.toString(),
    icon: getItemIcon(item.icon),
    label: item.label,
    onClick: () => {
      item.onClick();
      onClose();
    }
  }));

  return ReactDOM.createPortal(
    <>
      {/* Invisible overlay để bắt sự kiện click bên ngoài */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99990
        }}
        onClick={onClose}
      />
      
      <div 
        style={{
          position: 'fixed',
          top: position.top,
          right: position.right,
          zIndex: 99999,
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          minWidth: '150px'
        }}
        className="animate__animated animate__fadeIn"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => e.stopPropagation()}
      >
        <Menu items={menuItems} />
      </div>
    </>,
    portalContainer
  );
};

export default UserMenuPortal; 