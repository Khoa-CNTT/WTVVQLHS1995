import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, message, Select, Modal, Form, Input, Typography, Tooltip, Spin } from 'antd';
import { EyeOutlined, EditOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import legalCaseService from '../../services/legalCaseService';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const LawyerCaseManager = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });
  const [statusModal, setStatusModal] = useState({
    visible: false,
    caseId: null,
    currentStatus: ''
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

      const response = await legalCaseService.getLawyerCases(params);

      if (response.success) {
        // Lọc kết quả nếu có tìm kiếm
        let filteredCases = response.data || [];
        if (filters.search && filters.search.trim() !== '') {
          try {
            const searchLower = filters.search.toLowerCase();
            filteredCases = filteredCases.filter(item =>
              (item.title && item.title.toLowerCase().includes(searchLower)) ||
              (item.case_type && item.case_type.toLowerCase().includes(searchLower)) ||
              (item.customer_name && item.customer_name.toLowerCase().includes(searchLower))
            );
          } catch (filterError) {
            console.error('Lỗi khi lọc kết quả tìm kiếm:', filterError);
          }
        }

        setCases(filteredCases);
        setPagination({
          ...pagination,
          total: response.count || filteredCases.length
        });
      } else {
        setCases([]);
        message.error(response.message || 'Không thể tải danh sách vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách vụ án của luật sư:', error);
      setCases([]);
      message.error('Không thể tải danh sách vụ án. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
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

  // Xử lý tìm kiếm
  const handleSearch = (value) => {
    setFilters({
      ...filters,
      search: value
    });
  };

  // Mở modal cập nhật trạng thái
  const openStatusModal = (caseId, currentStatus) => {
    setStatusModal({
      visible: true,
      caseId,
      currentStatus
    });
    form.setFieldsValue({
      status: currentStatus,
      notes: ''
    });
  };

  // Đóng modal cập nhật trạng thái
  const closeStatusModal = () => {
    setStatusModal({
      visible: false,
      caseId: null,
      currentStatus: ''
    });
    form.resetFields();
  };

  // Cập nhật trạng thái vụ án
  const updateStatus = async (values) => {
    try {
      const { status, notes } = values;
      const { caseId } = statusModal;

      const response = await legalCaseService.updateCaseStatus(caseId, status, notes);

      if (response.success) {
        message.success('Cập nhật trạng thái vụ án thành công');
        closeStatusModal();
        fetchCases();
      } else {
        message.error(response.message || 'Không thể cập nhật trạng thái vụ án');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái vụ án:', error);
      message.error('Không thể cập nhật trạng thái vụ án. Vui lòng thử lại sau.');
    }
  };

  // Xem chi tiết vụ án
  const viewCaseDetail = (caseId) => {
    navigate(`/legal-cases/${caseId}`);
  };

  // Hiển thị trạng thái vụ án
  const renderStatus = (status) => {
    switch (status) {
      case 'draft':
        return <Tag color="blue">Nháp</Tag>;
      case 'pending':
        return <Tag color="orange">Đang chờ xử lý</Tag>;
      case 'in_progress':
        return <Tag color="processing">Đang xử lý</Tag>;
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

  /**
   * Đánh dấu vụ án đã hoàn thành
   * @param {number} caseId - ID của vụ án cần đánh dấu hoàn thành
   */
  const handleMarkCaseCompleted = async (caseId) => {
    try {
      Modal.confirm({
        title: 'Đánh dấu vụ án đã hoàn thành?',
        content: 'Khi đánh dấu hoàn thành, vụ án sẽ được chuyển sang trạng thái đã kết thúc. Bạn có chắc chắn muốn tiếp tục?',
        okText: 'Xác nhận',
        okType: 'primary',
        cancelText: 'Hủy',
        async onOk() {
          try {
            const response = await legalCaseService.updateCaseStatus(caseId, 'completed');
            
            if (response && response.success) {
              message.success('Đã đánh dấu vụ án hoàn thành');
              await fetchCases(); // Làm mới danh sách vụ án
            } else {
              message.error(response.message || 'Không thể cập nhật trạng thái vụ án');
            }
          } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái vụ án:', error);
            message.error('Không thể cập nhật trạng thái vụ án. Vui lòng thử lại sau.');
          }
        }
      });
    } catch (error) {
      console.error('Lỗi khi xử lý đánh dấu vụ án hoàn thành:', error);
      message.error('Không thể xử lý yêu cầu. Vui lòng thử lại sau.');
    }
  };

  // Định nghĩa cột cho bảng
  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Tag color="#3d5a80">{record.case_type}</Tag>
        </Space>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text>{text || record.user_name}</Text>
          {record.customer_email && <Text type="secondary" style={{ fontSize: '12px' }}>{record.customer_email}</Text>}
          {record.customer_phone && <Text type="secondary" style={{ fontSize: '12px' }}>{record.customer_phone}</Text>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: status => renderStatus(status),
    },
    {
      title: 'Phí',
      dataIndex: 'fee_amount',
      key: 'fee_amount',
      render: (fee) => fee ? `${parseInt(fee).toLocaleString('vi-VN')} VNĐ` : 'Chưa có',
    },
    {
      title: 'Tài liệu',
      key: 'documents',
      render: (_, record) => {
        const docs = Array.isArray(record.documents) ? record.documents : [];
        return docs.length > 0 ? `${docs.length} tài liệu` : 'Không có';
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: date => moment(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="primary" 
              shape="circle" 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => viewCaseDetail(record.id)}
            />
          </Tooltip>
          
          {/* Thêm nút đánh dấu hoàn thành */}
          {record.status !== 'closed' && (
            <Tooltip title="Đánh dấu hoàn thành">
              <Button 
                type="primary" 
                shape="circle" 
                icon={<CheckCircleOutlined />} 
                size="small"
                onClick={() => handleMarkCaseCompleted(record.id)}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              />
            </Tooltip>
          )}
          
          <Tooltip title="Cập nhật trạng thái">
            <Button 
              type="default" 
              shape="circle" 
              icon={<EditOutlined />} 
              onClick={() => openStatusModal(record.id, record.status)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="lawyer-case-manager">
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Input.Search
              placeholder="Tìm kiếm vụ án..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300, marginRight: 16 }}
            />
            <Select
              placeholder="Lọc theo trạng thái"
              style={{ width: 200 }}
              allowClear
              onChange={handleStatusChange}
              value={filters.status}
            >
              <Option value="pending">Đang chờ xử lý</Option>
              <Option value="in_progress">Đang xử lý</Option>
              <Option value="paid">Đã thanh toán</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
            </Select>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={cases}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: handleTableChange,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} vụ án`
          }}
          loading={loading}
        />

        <Modal
          title="Cập nhật trạng thái vụ án"
          visible={statusModal.visible}
          onCancel={closeStatusModal}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={updateStatus}>
            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select placeholder="Chọn trạng thái mới">
                <Option value="pending">Đang chờ xử lý</Option>
                <Option value="in_progress">Đang xử lý</Option>
                <Option value="completed">Hoàn thành</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="notes"
              label="Ghi chú"
            >
              <TextArea rows={4} placeholder="Nhập ghi chú về cập nhật này" />
            </Form.Item>
            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={closeStatusModal} style={{ marginRight: 8 }}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                  Cập nhật
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default LawyerCaseManager; 