import React from 'react';
import { Timeline, Card, Typography, Empty, Tag, Space } from 'antd';
import { HistoryOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, KeyOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const HistoryLog = ({ history }) => {
  const getActionIcon = (action) => {
    if (action.includes('Chỉnh sửa')) return <EditOutlined style={{ fontSize: '16px' }} />;
    if (action.includes('Xóa')) return <DeleteOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />;
    if (action.includes('Đã khóa')) return <LockOutlined style={{ fontSize: '16px', color: '#ff4d4f' }} />;
    if (action.includes('mở khóa')) return <UnlockOutlined style={{ fontSize: '16px', color: '#52c41a' }} />;
    if (action.includes('mật khẩu')) return <KeyOutlined style={{ fontSize: '16px', color: '#faad14' }} />;
    return <HistoryOutlined style={{ fontSize: '16px' }} />;
  };

  const getActionColor = (action) => {
    if (action.includes('Xóa')) return 'error';
    if (action.includes('Đã khóa')) return 'error';
    if (action.includes('mở khóa')) return 'success';
    if (action.includes('Chỉnh sửa')) return 'processing';
    if (action.includes('mật khẩu')) return 'warning';
    return 'default';
  };

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          <span>Lịch Sử Thay Đổi</span>
        </Space>
      }
      style={{ marginTop: 16 }}
    >
      {history && history.length > 0 ? (
        <Timeline
          items={history.map((entry, index) => ({
            key: index,
            dot: getActionIcon(entry.action),
            color: getActionColor(entry.action),
            children: (
              <div>
                <Space direction="vertical" size={0} style={{ display: 'flex' }}>
                  <Text strong>{entry.action}</Text>
                  <Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{entry.timestamp}</Text>
                    <Tag size="small">ID: {entry.userId}</Tag>
                  </Space>
                </Space>
              </div>
            ),
          }))}
        />
      ) : (
        <Empty 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          description={
            <Text type="secondary">
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              Chưa có thay đổi nào.
            </Text>
          } 
        />
      )}
    </Card>
  );
};

export default HistoryLog; 