import React from 'react';
import { Typography, Alert, Space, Button, List, Divider } from 'antd';
import { 
  ExclamationCircleOutlined, 
  DeleteOutlined, 
  FileOutlined, 
  CalendarOutlined, 
  TeamOutlined, 
  TagOutlined 
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const DeleteConfirmation = ({ 
  contract, 
  formatDate, 
  handleDeleteContract, 
  handleCloseModals, 
  loading 
}) => {
  if (!contract) return null;
  
  const contractDetails = [
    {
      icon: <FileOutlined />,
      label: 'Tiêu đề:',
      value: contract.title
    },
    {
      icon: <TagOutlined />,
      label: 'Loại hợp đồng:',
      value: contract.contract_type
    },
    {
      icon: <TeamOutlined />,
      label: 'Đối tác:',
      value: contract.partner || 'Chưa xác định'
    },
    {
      icon: <CalendarOutlined />,
      label: 'Thời gian:',
      value: `${formatDate(contract.start_date)} - ${formatDate(contract.end_date)}`
    }
  ];
  
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div style={{ textAlign: 'center' }}>
        <ExclamationCircleOutlined 
          style={{ 
            fontSize: 48, 
            color: '#ff4d4f', 
            marginBottom: 16 
          }} 
        />
        <Title level={4}>Xác nhận xóa hợp đồng</Title>
      </div>
      
      <Paragraph style={{ fontSize: 16, textAlign: 'center' }}>
        Bạn có chắc chắn muốn xóa hợp đồng <Text strong>"{contract.title}"</Text>?
      </Paragraph>
      
      <List
        bordered
        dataSource={contractDetails}
        renderItem={item => (
          <List.Item>
            <Space>
              {item.icon}
              <Text strong>{item.label}</Text>
              {item.value}
            </Space>
          </List.Item>
        )}
      />
      
      <Alert
        message="Lưu ý: Hành động này không thể hoàn tác."
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
      />
      
      <Divider />
      
      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button 
            onClick={handleCloseModals}
          >
            Hủy
          </Button>
          <Button 
            type="primary" 
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteContract}
            loading={loading}
          >
            Xóa hợp đồng
          </Button>
        </Space>
      </div>
    </Space>
  );
};

export default DeleteConfirmation; 