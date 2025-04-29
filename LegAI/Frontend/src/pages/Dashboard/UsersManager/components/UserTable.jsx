import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Empty, Spin } from 'antd';
import { EditOutlined, LockOutlined, UnlockOutlined, KeyOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';

const UserTable = ({ users, startIndex = 0, onEditUser, onToggleLock, onResetPassword, onDeleteUser, loading }) => {
  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 70,
      render: (_, __, index) => startIndex + index + 1,
    },
    {
      title: 'Tên Đăng Nhập',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Họ Tên',
      dataIndex: 'full_name',
      key: 'full_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai Trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = 'blue';
        if (role === 'Admin') color = 'red';
        if (role === 'Lawyer') color = 'green';
        return <Tag color={color}>{role}</Tag>;
      },
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'is_locked',
      key: 'is_locked',
      render: (is_locked) => (
        is_locked ? 
          <Tag icon={<LockOutlined />} color="error">Đã khóa</Tag> : 
          <Tag icon={<UnlockOutlined />} color="success">Đang hoạt động</Tag>
      ),
    },
    {
      title: 'Hành Động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => onEditUser(record)}
            />
          </Tooltip>
          <Tooltip title={record.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}>
            <Button 
              type={record.is_locked ? "default" : "primary"} 
              danger={!record.is_locked} 
              size="small" 
              icon={record.is_locked ? <UnlockOutlined /> : <LockOutlined />} 
              onClick={() => onToggleLock(record.id)}
            />
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button 
              type="default" 
              size="small" 
              icon={<KeyOutlined />} 
              onClick={() => onResetPassword(record.id)}
            />
          </Tooltip>
          <Tooltip title="Xóa tài khoản">
            <Button 
              type="primary" 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              onClick={() => onDeleteUser(record)}
              disabled={record.role === 'Admin' && record.id === 1}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <Table 
      columns={columns}
      dataSource={users} 
      rowKey="id"
      locale={{
        emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không tìm thấy người dùng" />
      }}
      pagination={false}
      bordered
      size="middle"
    />
  );
};

export default UserTable; 