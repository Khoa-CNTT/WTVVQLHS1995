import React from 'react';
import { Modal, Typography, Space, Button, Alert } from 'antd';
import { ExclamationCircleOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
  // Đảm bảo user có giá trị
  if (!user) return null;

  const handleSubmit = () => {
    console.log("Đang xóa user ID:", user.id); // Thêm log để debug
    onConfirm(user.id);
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>Xác nhận xóa người dùng</span>
        </Space>
      }
      open={true}
      onCancel={onCancel}
      maskClosable={false}
      centered
      footer={[
        <Button 
          key="cancel" 
          onClick={onCancel}
          icon={<CloseOutlined />}
        >
          Hủy bỏ
        </Button>,
        <Button
          key="submit"
          danger
          type="primary"
          icon={<DeleteOutlined />}
          onClick={handleSubmit}
        >
          Xóa người dùng
        </Button>
      ]}
    >
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <DeleteOutlined style={{ fontSize: '32px', color: '#ff4d4f', marginBottom: '16px' }} />
        <Typography.Paragraph>
          Bạn có chắc chắn muốn xóa người dùng <Text strong>{user.username}</Text> không?
        </Typography.Paragraph>
      </div>
      
      <Alert
        message="Cảnh báo"
        description={
          <span>
            Hành động này sẽ xóa <Text strong>hoàn toàn</Text> người dùng và <Text strong>tất cả dữ liệu liên quan</Text> khỏi cơ sở dữ liệu. Hành động này <Text strong>không thể hoàn tác</Text>.
          </span>
        }
        type="error"
        showIcon
      />
    </Modal>
  );
};

export default DeleteConfirmModal; 