import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, Alert, Space } from 'antd';
import { UserAddOutlined, UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, HomeOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import axiosInstance from '../../../../config/axios';

const { TextArea } = Input;
const { Option } = Select;

function AddUserModal({ onClose, onSave }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const onFinish = async (values) => {
    setGeneralError("");
    setLoading(true);

    try {
      await axiosInstance.post('/users/register', values);
      onSave(values);
      onClose();
    } catch (error) {
      console.error("Lỗi khi thêm người dùng:", error);
      setGeneralError(
        error.response?.data?.message || "Có lỗi xảy ra khi thêm người dùng"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          <span>Thêm người dùng mới</span>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={null}
      width={800}
      maskClosable={false}
      centered
    >
      {generalError && (
        <Alert
          message={generalError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          role: "user"
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[
                { required: true, message: 'Tên đăng nhập là bắt buộc' },
                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Nhập tên đăng nhập"
                autoComplete="off"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Email là bắt buộc' },
                { type: 'email', message: 'Email không hợp lệ' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="example@email.com"
                autoComplete="off"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Họ tên"
              name="fullName"
              rules={[{ required: true, message: 'Họ tên là bắt buộc' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Nhập họ tên đầy đủ"
                autoComplete="off"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Điện thoại"
              name="phone"
              rules={[
                { 
                  pattern: /^(0)[0-9]{9}$/, 
                  message: 'Số điện thoại không hợp lệ (VD: 0912345678)',
                  validateTrigger: 'onBlur'
                }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="0912345678"
                autoComplete="off"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Mật khẩu là bắt buộc' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                autoComplete="new-password"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Vai trò"
              name="role"
              rules={[{ required: true, message: 'Vai trò là bắt buộc' }]}
            >
              <Select placeholder="Chọn vai trò người dùng">
                <Option value="user">Người dùng</Option>
                <Option value="admin">Quản trị viên</Option>
                <Option value="Lawyer">Luật sư</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Địa chỉ"
              name="address"
            >
              <Input 
                prefix={<HomeOutlined />} 
                placeholder="Nhập địa chỉ"
                autoComplete="off"
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Giới thiệu"
              name="bio"
            >
              <TextArea
                rows={4}
                placeholder="Nhập thông tin giới thiệu"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button 
              onClick={onClose} 
              icon={<CloseOutlined />}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<SaveOutlined />}
            >
              {loading ? "Đang xử lý..." : "Tạo người dùng"}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AddUserModal; 