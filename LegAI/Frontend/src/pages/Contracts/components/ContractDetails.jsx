import React from 'react';
import { Card, Typography, Descriptions, Button, Space, Divider, Tag } from 'antd';
import { FileTextOutlined, DownloadOutlined, EditOutlined, 
  CalendarOutlined, BuildOutlined, EditFilled, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ContractDetails = ({ 
  contract, 
  formatDate, 
  handleDownloadFile, 
  handleCloseDetails, 
  handleShowEditModal
}) => {
  if (!contract) return null;
  
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <FileTextOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 16 }} />
        <div>
          <Title level={4} style={{ margin: 0 }}>{contract.title}</Title>
          <Tag color="blue">{contract.contract_type}</Tag>
        </div>
      </div>
      
      <Divider />
      
      <Descriptions 
        bordered 
        column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
      >
        <Descriptions.Item label={
          <Space>
            <BuildOutlined />
            <span>Đối tác</span>
          </Space>
        }>
          {contract.partner || 'Chưa xác định'}
        </Descriptions.Item>
        
        <Descriptions.Item label={
          <Space>
            <EditFilled />
            <span>Chữ ký</span>
          </Space>
        }>
          {contract.signature || 'Chưa có'}
        </Descriptions.Item>
        
        <Descriptions.Item label={
          <Space>
            <CalendarOutlined />
            <span>Ngày bắt đầu</span>
          </Space>
        }>
          {formatDate(contract.start_date)}
        </Descriptions.Item>
        
        <Descriptions.Item label={
          <Space>
            <CalendarOutlined />
            <span>Ngày kết thúc</span>
          </Space>
        }>
          {formatDate(contract.end_date) || 'Không xác định'}
        </Descriptions.Item>
        
        <Descriptions.Item label={
          <Space>
            <ClockCircleOutlined />
            <span>Ngày tạo</span>
          </Space>
        }>
          {formatDate(contract.created_at)}
        </Descriptions.Item>
        
        <Descriptions.Item label={
          <Space>
            <EditOutlined />
            <span>Cập nhật lần cuối</span>
          </Space>
        }>
          {formatDate(contract.updated_at)}
        </Descriptions.Item>
      </Descriptions>
      
      <Divider />
      
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadFile(contract.id)}
        >
          Tải xuống
        </Button>
        <Button
          type="default"
          icon={<EditOutlined />}
          onClick={() => {
            handleCloseDetails();
            handleShowEditModal(contract);
          }}
        >
          Chỉnh sửa
        </Button>
      </div>
    </Card>
  );
};

export default ContractDetails; 