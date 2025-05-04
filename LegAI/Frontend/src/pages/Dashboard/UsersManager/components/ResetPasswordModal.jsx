import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert, Space, Typography } from 'antd';
import { KeyOutlined, SaveOutlined, CloseOutlined, EyeOutlined, EyeInvisibleOutlined, SyncOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

const ResetPasswordModal = ({ userId, onSave, onClose }) => {
  const [form] = Form.useForm();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Đảm bảo ít nhất 6 ký tự
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    form.setFieldsValue({ 
      newPassword: password,
      confirmPassword: password 
    });
    
    // Tạm thời hiển thị mật khẩu để người dùng có thể nhìn thấy
    setPasswordVisible(true);
  };

  const onFinish = (values) => {
    setError('');
    
    // Kiểm tra mật khẩu
    if (!values.newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    
    if (values.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (values.newPassword !== values.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    toast.success('Đã đặt lại mật khẩu thành công');
    onSave(userId, values.newPassword);
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined />
          <span>Đặt lại mật khẩu</span>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={null}
      maskClosable={false}
      centered
      width={450}
    >
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Form 
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Mật khẩu mới"
          name="newPassword"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input.Password
            placeholder="Nhập mật khẩu mới"
            visibilityToggle={{ 
              visible: passwordVisible, 
              onVisibleChange: setPasswordVisible 
            }}
            prefix={<KeyOutlined />}
          />
        </Form.Item>
        
        <Form.Item
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            })
          ]}
        >
          <Input.Password
            placeholder="Nhập lại mật khẩu mới"
            visibilityToggle={{ 
              visible: passwordVisible, 
              onVisibleChange: setPasswordVisible 
            }}
            prefix={<KeyOutlined />}
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            block 
            icon={<SyncOutlined />}
            onClick={generateRandomPassword}
            style={{ marginBottom: 16 }}
          >
            Tạo mật khẩu ngẫu nhiên
          </Button>
          
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            Mật khẩu sẽ được tạo ngẫu nhiên với ít nhất 10 ký tự bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
          </Typography.Text>
        </Form.Item>
        
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onClose} icon={<CloseOutlined />}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
              Lưu thay đổi
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;