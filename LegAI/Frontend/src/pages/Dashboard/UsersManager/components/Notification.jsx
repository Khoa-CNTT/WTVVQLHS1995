import React from 'react';
import { Alert } from 'antd';

const Notification = ({ notification }) => {
  if (!notification || !notification.message) return null;

  const { message, type } = notification;

  return (
    <Alert
      message={message}
      type={type === 'success' ? 'success' : 'error'}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

export default Notification; 