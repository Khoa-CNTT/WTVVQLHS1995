import React from 'react';
import styles from '../UsersManagerPage.module.css';

const Notification = ({ notification }) => {
  if (!notification || !notification.message) return null;

  const { message, type } = notification;
  const isSuccess = type === 'success';

  return (
    <div className={`${styles.notification} ${isSuccess ? styles.success : styles.error}`}>
      <div className={styles.notificationContent}>
        <i className={`fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Notification; 