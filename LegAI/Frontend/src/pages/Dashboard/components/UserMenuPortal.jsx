import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../DashboardPage.module.css';

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
        className={`${styles.userDropdownMenu} animate__animated animate__fadeIn`}
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => e.stopPropagation()}
      >
        {items.map((item, index) => (
          <div key={index} className={styles.userMenuItem} onClick={() => {
            item.onClick();
            onClose();
          }}>
            <span>{item.icon}</span> {item.label}
          </div>
        ))}
      </div>
    </>,
    portalContainer
  );
};

export default UserMenuPortal; 