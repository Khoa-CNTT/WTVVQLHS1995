import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, Typography, Tag, Space, Descriptions, Divider } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, EditOutlined, CloseOutlined, SaveOutlined, CheckCircleOutlined, CloseCircleOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Option } = Select;

const EditUserModal = ({ user, onSave, onClose }) => {
  const [form] = Form.useForm();
  // Đảm bảo tất cả dữ liệu có giá trị hợp lệ
  const [formData, setFormData] = useState({
    id: user.id || '',
    username: user.username || '',
    email: user.email || '',
    full_name: user.full_name || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    role: user.role || 'user',
    is_verified: user.is_verified || false,
    is_locked: user.is_locked || false,
    failed_attempts: user.failed_attempts || 0,
    last_login: user.last_login || '',
    created_at: user.created_at || ''
  });

  const onFinish = (values) => {
    // Chuẩn bị dữ liệu đúng format để gửi lên server
    const userData = {
      id: formData.id, // Đảm bảo có ID
      fullName: values.full_name,
      phone: values.phone || '',
      address: values.address || '',
      bio: values.bio || '',
      role: values.role
    };
    
    onSave(userData);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    } catch (e) {
      return 'Không hợp lệ';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <EditOutlined />
          <span>Chỉnh sửa thông tin người dùng</span>
        </Space>
      }
      open={true}
      width={800}
      onCancel={onClose}
      footer={null}
      maskClosable={false}
      centered
    >
      <div style={{ marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={24}>
            <Space wrap>
              <Tag color={formData.is_verified ? "success" : "error"} icon={formData.is_verified ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
                {formData.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
              </Tag>
              <Tag color={formData.is_locked ? "error" : "success"} icon={formData.is_locked ? <LockOutlined /> : <UnlockOutlined />}>
                {formData.is_locked ? 'Đã khóa' : 'Đang hoạt động'}
              </Tag>
            </Space>
          </Col>
        </Row>

        <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }} bordered style={{ marginTop: 12 }}>
          <Descriptions.Item label="ID">{formData.id}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDateTime(formData.created_at)}</Descriptions.Item>
          <Descriptions.Item label="Lần đăng nhập cuối">{formatDateTime(formData.last_login)}</Descriptions.Item>
          <Descriptions.Item label="Số lần đăng nhập thất bại">{formData.failed_attempts}</Descriptions.Item>
        </Descriptions>
      </div>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          role: formData.role,
          bio: formData.bio
        }}
        onFinish={onFinish}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tên đăng nhập"
              name="username"
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                disabled
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
            >
              <Input
                prefix={<MailOutlined className="site-form-item-icon" />}
                disabled
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="Họ tên"
              name="full_name"
              rules={[{ required: true, message: 'Họ tên không được để trống' }]}
            >
              <Input prefix={<UserOutlined className="site-form-item-icon" />} />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { 
                  pattern: /^[0-9]{10,11}$/, 
                  message: 'Số điện thoại không hợp lệ',
                  validateTrigger: 'onBlur'
                }
              ]}
            >
              <Input prefix={<PhoneOutlined className="site-form-item-icon" />} />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="Địa chỉ"
              name="address"
            >
              <Input prefix={<HomeOutlined className="site-form-item-icon" />} />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item
              label="Vai trò"
              name="role"
              rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
            >
              <Select>
                <Option value="Admin">Admin</Option>
                <Option value="User">User</Option>
                <Option value="Lawyer">Luật sư</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item
              label="Giới thiệu"
              name="bio"
            >
              <TextArea 
                rows={4}
                placeholder="Thêm thông tin giới thiệu về người dùng..."
              />
            </Form.Item>
          </Col>
        </Row>
        
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

export default EditUserModal; 