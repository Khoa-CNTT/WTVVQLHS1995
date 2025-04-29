import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Card, List, Button, Typography, Empty, Spin, Badge, Tooltip } from 'antd';
import { BellOutlined, CheckOutlined, InboxOutlined } from '@ant-design/icons';
import 'animate.css';

const { Title, Text } = Typography;

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
      
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BellOutlined style={{ marginRight: 8 }} />
            <span>Thông báo cập nhật</span>
          </div>
        }
        style={{
          position: 'fixed',
          top: position.top,
          right: position.right,
          width: 350,
          maxHeight: 450,
          overflow: 'auto',
          boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
          zIndex: 1050
        }}
        bodyStyle={{ padding: 0 }}
        className="animate__animated animate__fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '30px 0', textAlign: 'center' }}>
            <Spin tip="Đang tải thông báo..." />
          </div>
        ) : notifications.length > 0 ? (
          <List
            dataSource={notifications}
            renderItem={item => (
              <List.Item
                key={item.id}
                actions={[
                  <Tooltip title="Đánh dấu đã đọc">
                    <Button 
                      type="text" 
                      shape="circle" 
                      icon={<CheckOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead(item.id);
                      }}
                    />
                  </Tooltip>
                ]}
                style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0' }}
              >
                <List.Item.Meta
                  title={<span>{item.details}</span>}
                  description={<Text type="secondary">{formatDateTime(item.created_at)}</Text>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={<InboxOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
            description="Không có thông báo mới"
            style={{ padding: '30px 0' }}
          />
        )}
      </Card>
    </>,
    portalContainer
  );
};

export default NotificationMenuPortal; 