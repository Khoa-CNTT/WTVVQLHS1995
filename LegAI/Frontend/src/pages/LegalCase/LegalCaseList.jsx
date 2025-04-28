import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Input, Select, Tag, Space, Typography, message, Tooltip, Pagination, Empty, Layout, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, FileOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FileTextOutlined, FilterOutlined } from '@ant-design/icons';
import legalCaseService from '../../services/legalCaseService';
import styles from './LegalCase.module.css';
import moment from 'moment';
import Navbar from '../../components/layout/Nav/Navbar';

const { Title, Text } = Typography;
const { Option } = Select;
const { Content } = Layout;

const LegalCaseList = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  // Lấy danh sách vụ án
  useEffect(() => {
    fetchCases();
  }, [pagination.current, pagination.pageSize, filters]);

  const fetchCases = async () => {
    try {
      setLoading(true);

      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };

      if (filters.status) {
        params.status = filters.status;
      }

      const response = await legalCaseService.getLegalCases(params);

      if (response.success) {
        // Lọc kết quả nếu có tìm kiếm
        let filteredCases = response.data;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredCases = filteredCases.filter(item =>
            item.title.toLowerCase().includes(searchLower) ||
            item.case_type.toLowerCase().includes(searchLower)
          );
        }

        setCases(filteredCases);
        setPagination({
          ...pagination,
          total: response.count || filteredCases.length
        });
      } else {
        message.error(response.message || 'Không thể tải danh sách vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vụ án:', error);
      message.error('Không thể tải danh sách vụ án. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi tìm kiếm
  const handleSearch = (value) => {
    setFilters({
      ...filters,
      search: value
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  // Xử lý thay đổi trạng thái
  const handleStatusChange = (value) => {
    setFilters({
      ...filters,
      status: value
    });
    setPagination({
      ...pagination,
      current: 1
    });
  };

  // Xử lý thay đổi trang
  const handleTableChange = (page, pageSize) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize
    });
  };

  // Xử lý xóa vụ án
  const handleDeleteCase = async (id) => {
    try {
      const response = await legalCaseService.deleteLegalCase(id);

      if (response.success) {
        message.success('Đã xóa vụ án thành công');
        fetchCases();
      } else {
        message.error(response.message || 'Không thể xóa vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi xóa vụ án:', error);
      message.error('Không thể xóa vụ án. Vui lòng thử lại sau.');
    }
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

  // Định nghĩa cột cho bảng
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <Text strong className={styles.caseTitle}>{text}</Text>
          <div className={styles.caseMeta}>
            <Tag color="#3d5a80">{record.case_type}</Tag>
            {record.is_ai_generated && (
              <Tag color="purple">AI</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => renderStatus(status),
    },
    {
      title: 'Luật sư',
      dataIndex: 'lawyer',
      key: 'lawyer',
      render: lawyer => lawyer ? lawyer.full_name : <Text type="secondary">Chưa gán</Text>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="small" className={styles.actionButtons}>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/legal-cases/${record.id}`)}
              className={styles.viewButton}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="default"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/legal-cases/${record.id}/edit`)}
              className={styles.editButton}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteCase(record.id)}
              className={styles.deleteButton}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (<>     
   <Navbar />
    <Layout className={styles.legalCaseLayout}>
      <Content className={styles.legalCaseContent}>
        <div className={styles.legalCaseList}>
          <div className={styles.listHeader}>
            <Title level={2}>Vụ án pháp lý</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/legal-cases/create')}
              size="large"
              className={styles.createButton}
            >
              Tạo vụ án mới
            </Button>
          </div>

          <Card className={styles.listCard} bordered={false}>
            <div className={styles.searchBar}>
              <Row gutter={16} align="middle">
                <Col xs={24} sm={12} md={8} lg={10}>
                  <Input
                    placeholder="Tìm kiếm theo tiêu đề hoặc loại vụ án"
                    prefix={<SearchOutlined />}
                    value={filters.search}
                    onChange={e => handleSearch(e.target.value)}
                    size="large"
                    className={styles.searchInput}
                  />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className={styles.filterContainer}>
                    <FilterOutlined className={styles.filterIcon} />
                    <Select
                      placeholder="Lọc theo trạng thái"
                      value={filters.status}
                      onChange={handleStatusChange}
                      allowClear
                      size="large"
                      className={styles.statusFilter}
                    >
                      <Option value="">Tất cả</Option>
                      <Option value="draft">Nháp</Option>
                      <Option value="pending">Đang xử lý</Option>
                      <Option value="paid">Đã thanh toán</Option>
                      <Option value="completed">Hoàn thành</Option>
                      <Option value="cancelled">Đã hủy</Option>
                    </Select>
                  </div>
                </Col>
              </Row>
            </div>

            <Table
              dataSource={cases}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              className={styles.casesTable}
              rowClassName={styles.tableRow}
              locale={{
                emptyText: (
                  <Empty
                    description="Không có vụ án nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )
              }}
            />

            <div className={styles.paginationContainer}>
              <Pagination
                current={pagination.current}
                pageSize={pagination.pageSize}
                total={pagination.total}
                onChange={handleTableChange}
                showSizeChanger
                showTotal={total => `Tổng cộng ${total} vụ án`}
              />
            </div>
          </Card>
        </div>
      </Content>
    </Layout></>
  );
};

export default LegalCaseList; 