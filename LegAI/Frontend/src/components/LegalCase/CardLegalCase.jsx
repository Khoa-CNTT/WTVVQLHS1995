import React from 'react';
import { Card, Tag, Space, Button, Typography, Tooltip } from 'antd';
import { EyeOutlined, EditOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import styles from './CardLegalCase.module.css';

const { Title, Text } = Typography;

const CardLegalCase = ({ legalCase }) => {
  const navigate = useNavigate();

  // Xử lý khi người dùng nhấn nút xem chi tiết
  const handleViewDetails = () => {
    navigate(`/legal-cases/${legalCase.id}`);
  };

  // Xử lý khi người dùng nhấn nút chỉnh sửa
  const handleEdit = () => {
    navigate(`/legal-cases/edit/${legalCase.id}`);
  };

  // Hiển thị trạng thái vụ án
  const renderStatus = (status) => {
    switch (status) {
      case 'draft':
        return <Tag color="blue">Nháp</Tag>;
      case 'pending':
        return <Tag color="orange">Đang xử lý</Tag>;
      case 'paid':
        return <Tag color="green">Đã thanh toán</Tag>;
      case 'completed':
        return <Tag color="green">Hoàn thành</Tag>;
      case 'cancelled':
        return <Tag color="red">Đã hủy</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  // Lấy thông tin về tài liệu đính kèm
  const hasDocuments = legalCase.documents && legalCase.documents.length > 0;
  
  return (
    <Card
      className={styles.card}
      hoverable
      actions={[
        <Tooltip title="Xem chi tiết">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={handleViewDetails}
          >
            Xem
          </Button>
        </Tooltip>,
        <Tooltip title="Chỉnh sửa">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={handleEdit}
          >
            Sửa
          </Button>
        </Tooltip>,
      ]}
    >
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <Title level={4} className={styles.title}>
            {legalCase.title}
          </Title>
          <Space size={8}>
            {renderStatus(legalCase.status)}
            <Tag color="#3d5a80">{legalCase.case_type}</Tag>
            {legalCase.is_ai_generated && (
              <Tag color="purple">AI</Tag>
            )}
          </Space>
        </div>
        <div className={styles.headerRight}>
          {hasDocuments && (
            <Tooltip title={`${legalCase.documents.length} tài liệu đính kèm`}>
              <FileTextOutlined className={styles.documentIcon} />
            </Tooltip>
          )}
        </div>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.description}>
          {legalCase.description || 'Không có mô tả'}
        </div>
        
        <div className={styles.metadata}>
          <Text type="secondary" className={styles.date}>
            Ngày tạo: {moment(legalCase.created_at).format('DD/MM/YYYY')}
          </Text>
          
          {legalCase.lawyer && (
            <div className={styles.lawyer}>
              <Text type="secondary">
                Luật sư: {legalCase.lawyer.full_name || 'Chưa có'}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CardLegalCase; 