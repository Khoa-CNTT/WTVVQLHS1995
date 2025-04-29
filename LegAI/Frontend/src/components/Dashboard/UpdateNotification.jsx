import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import scraperService from '../../services/scraperService';
import styles from './UpdateNotification.module.css';

const UpdateNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Hàm lấy thông báo cập nhật mới
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await scraperService.getAutoUpdateNotifications();
      
      
      if (response.success && Array.isArray(response.data)) {
        setNotifications(response.data);
      } else if (Array.isArray(response.data)) {
        setNotifications(response.data);
      } else {
        console.warn('Định dạng phản hồi không đúng:', response);
        setNotifications([]);
      }
      setError(null);
    } catch (err) {
      console.error('Lỗi khi lấy thông báo cập nhật:', err);
      setError('Không thể lấy thông báo cập nhật. Vui lòng thử lại sau.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông báo khi component được mount
  useEffect(() => {
    fetchNotifications();
    
    // Lấy thông báo mới mỗi 2 phút thay vì 5 phút
    const interval = setInterval(() => {
      fetchNotifications();
    }, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Xử lý đánh dấu thông báo đã đọc
  const handleMarkAsRead = async (id) => {
    try {
      const response = await scraperService.markNotificationAsShown(id);
      
      if (response.success) {
        // Cập nhật lại danh sách thông báo
        setNotifications(notifications.filter(notif => notif.id !== id));
        toast.success('Đã đánh dấu thông báo là đã đọc');
      }
    } catch (err) {
      console.error('Lỗi khi đánh dấu thông báo đã đọc:', err);
      toast.error('Không thể đánh dấu thông báo. Vui lòng thử lại sau.');
    }
  };
  
  // Định dạng ngày giờ
  const formatDateTime = (dateTimeString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateTimeString).toLocaleDateString('vi-VN', options);
  };

  // Nếu không có thông báo, không render gì cả
  if (!loading && notifications.length === 0 && !error) {
    return null;
  }

  return (
    <div className={styles.notificationContainer}>
      <h3 className={styles.notificationTitle}>
        <span className={styles.notificationIcon}>🔔</span>
        Thông báo cập nhật văn bản pháp luật
      </h3>
      
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Đang tải thông báo...</p>
        </div>
      )}
      
      {error && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <button onClick={fetchNotifications}>Thử lại</button>
        </div>
      )}
      
      {!loading && !error && notifications.length > 0 && (
        <div className={styles.notificationList}>
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={styles.notificationItem}
            >
              <div className={styles.notificationContent}>
                <p className={styles.notificationDetails}>
                  {notification.details}
                </p>
                <p className={styles.notificationTime}>
                  {formatDateTime(notification.created_at)}
                </p>
              </div>
              <button
                className={styles.markAsReadButton}
                onClick={() => handleMarkAsRead(notification.id)}
                title="Đánh dấu đã đọc"
              >
                ✓
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdateNotification; 