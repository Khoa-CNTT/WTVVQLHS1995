import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from '../DashboardPage.module.css';

const NotificationMenuPortal = ({ isOpen, position, onClose, notifications, loading, onMarkAsRead, formatDateTime }) => {
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Tạo container cho portal nếu chưa tồn tại
    let container = document.getElementById('notification-menu-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-menu-portal';
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
          zIndex: 1049
        }}
        onClick={onClose}
      />
      
      <div
        className={`${styles.notificationDropdown} animate__animated animate__fadeIn`}
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className={styles.notificationTitle}>Thông báo cập nhật</h3>
        
        {loading ? (
          <div className={styles.notificationLoading}>
            <div className={styles.spinner}></div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className={styles.notificationList}>
            {notifications.map(item => (
              <div key={item.id} className={styles.notificationItem}>
                <div className={styles.notificationContent}>
                  <p className={styles.notificationDetails}>{item.details}</p>
                  <p className={styles.notificationTime}>{formatDateTime(item.created_at)}</p>
                </div>
                <button 
                  className={styles.markReadButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(item.id);
                  }}
                  title="Đánh dấu đã đọc"
                >
                  ✓
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyNotification}>
            <span className={styles.emptyIcon}>📭</span>
            <p>Không có thông báo mới</p>
          </div>
        )}
      </div>
    </>,
    portalContainer
  );
};

export default NotificationMenuPortal; 