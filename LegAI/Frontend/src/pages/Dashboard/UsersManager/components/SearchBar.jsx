import React from 'react';
import { Input, Select, Space, Card, Typography, Row, Col } from 'antd';
import { SearchOutlined, UserOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

const SearchBar = ({ searchTerm, searchField, role, onSearchTermChange, onSearchFieldChange, onRoleChange }) => {
  const searchPlaceholder = () => {
    switch (searchField) {
      case 'username': return 'tên đăng nhập';
      case 'email': return 'email';
      case 'full_name': return 'họ tên';
      default: return 'tên đăng nhập';
    }
  };

  const getSearchPrefixIcon = () => {
    switch (searchField) {
      case 'username': return <UserOutlined />;
      case 'email': return <MailOutlined />;
      case 'full_name': return <IdcardOutlined />;
      default: return <UserOutlined />;
    }
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Row align="middle" gutter={[16, 16]}>
        <Col xs={24} md={8} style={{ marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>
            <SearchOutlined style={{ marginRight: 8 }} />
            Tìm kiếm người dùng
          </Title>
        </Col>
        
        <Col xs={24} md={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={24}>
              <Space style={{ width: '100%' }}>
                <Select
                  value={searchField}
                  onChange={onSearchFieldChange}
                  style={{ width: 140 }}
                >
                  <Option value="username">Tên đăng nhập</Option>
                  <Option value="email">Email</Option>
                  <Option value="full_name">Họ tên</Option>
                </Select>
  
                <Select
                  value={role}
                  onChange={onRoleChange}
                  style={{ width: 140 }}
                >
                  <Option value="">Tất cả vai trò</Option>
                  <Option value="Admin">Admin</Option>
                  <Option value="User">User</Option>
                  <Option value="Lawyer">Luật sư</Option>
                </Select>
  
                <Input
                  placeholder={`Tìm kiếm theo ${searchPlaceholder()}...`}
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  prefix={getSearchPrefixIcon()}
                  allowClear
                  style={{ width: '100%' }}
                />
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default SearchBar; 