import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Card, Typography, Row, Col, message, Tooltip, Modal, Spin, Divider } from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined, EditOutlined, PlusOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons';
import aiService from '../../../services/aiService';
import authService from '../../../services/authService';
import styles from './AIConsultationManager.module.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const AIConsultationManager = () => {
  // State
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    question: '',
    answer: ''
  });
  const [authError, setAuthError] = useState(null);

  // Xác thực người dùng khi component được mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!authService.isAuthenticated()) {
          setAuthError('Bạn cần đăng nhập để truy cập trang này');
          return;
        }
        
        const user = authService.getCurrentUser();
        if (!user || user.role.toLowerCase() !== 'admin') {
          setAuthError('Bạn không có quyền truy cập trang này');
          return;
        }
        
        setAuthError(null);
        fetchConsultations();
      } catch (error) {
        console.error('Lỗi kiểm tra xác thực:', error);
        setAuthError('Lỗi xác thực: ' + (error.message || 'Không xác định'));
      }
    };
    
    checkAuth();
  }, []);

  // Tải danh sách tư vấn AI khi component được mount
  useEffect(() => {
    if (!authError) {
      fetchConsultations();
    }
  }, [pagination.current, pagination.pageSize, searchTerm, authError]);

  // Hàm fetch danh sách tư vấn AI từ API
  const fetchConsultations = async () => {
    if (authError) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const options = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm
      };
      
      const response = await aiService.getAllAIConsultations(options);
      
      if (response && response.success) {
        setConsultations(response.data || []);
        setPagination({
          ...pagination,
          total: response.total || 0,
        });
      } else {
        setError('Không thể tải danh sách tư vấn AI');
        message.error('Không thể tải danh sách tư vấn AI');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setAuthError('Phiên làm việc đã hết hạn');
        message.error('Phiên làm việc đã hết hạn');
      } else {
        setError('Lỗi kết nối máy chủ');
        message.error('Lỗi kết nối máy chủ');
      }
      console.error('Lỗi khi tải danh sách tư vấn AI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi phân trang
  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  // Hiển thị chi tiết tư vấn
  const showConsultationDetail = async (id) => {
    try {
      setLoading(true);
      const response = await aiService.getAIConsultationById(id);
      
      if (response && response.success) {
        setSelectedConsultation(response.data);
        setDetailVisible(true);
      } else {
        message.error('Không thể tải chi tiết tư vấn AI');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setAuthError('Phiên làm việc đã hết hạn');
        message.error('Phiên làm việc đã hết hạn');
      } else {
        message.error('Lỗi kết nối máy chủ');
      }
      console.error('Lỗi khi tải chi tiết tư vấn AI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal chỉnh sửa
  const showEditModal = async (id) => {
    try {
      setLoading(true);
      const response = await aiService.getAIConsultationById(id);
      
      if (response && response.success) {
        const consultation = response.data;
        setSelectedConsultation(consultation);
        setFormData({
          userId: consultation.user_id,
          question: consultation.question,
          answer: consultation.answer
        });
        setEditVisible(true);
      } else {
        message.error('Không thể tải chi tiết tư vấn AI');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setAuthError('Phiên làm việc đã hết hạn');
        message.error('Phiên làm việc đã hết hạn');
      } else {
        message.error('Lỗi kết nối máy chủ');
      }
      console.error('Lỗi khi tải chi tiết tư vấn AI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mở modal tạo mới
  const showCreateModal = () => {
    setFormData({
      userId: '',
      question: '',
      answer: ''
    });
    setCreateVisible(true);
  };

  // Xử lý thay đổi form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Không cần làm sạch HTML khi nhập, chỉ cần khi hiển thị
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Xử lý tạo mới
  const handleCreate = async () => {
    try {
      setLoading(true);
      
      if (!formData.question || !formData.answer) {
        message.error('Vui lòng nhập đầy đủ câu hỏi và câu trả lời');
        setLoading(false);
        return;
      }
      
      const response = await aiService.createAIConsultation(formData);
      
      if (response && response.success) {
        message.success('Tạo tư vấn AI mới thành công');
        setCreateVisible(false);
        fetchConsultations();
      } else {
        message.error('Không thể tạo tư vấn AI mới');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setAuthError('Phiên làm việc đã hết hạn');
        message.error('Phiên làm việc đã hết hạn');
      } else {
        message.error('Lỗi kết nối máy chủ');
      }
      console.error('Lỗi khi tạo tư vấn AI mới:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý cập nhật
  const handleUpdate = async () => {
    try {
      setLoading(true);
      
      if (!formData.question || !formData.answer) {
        message.error('Vui lòng nhập đầy đủ câu hỏi và câu trả lời');
        setLoading(false);
        return;
      }
      
      const response = await aiService.updateAIConsultation(selectedConsultation.id, formData);
      
      if (response && response.success) {
        message.success('Cập nhật tư vấn AI thành công');
        setEditVisible(false);
        fetchConsultations();
      } else {
        message.error('Không thể cập nhật tư vấn AI');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setAuthError('Phiên làm việc đã hết hạn');
        message.error('Phiên làm việc đã hết hạn');
      } else {
        message.error('Lỗi kết nối máy chủ');
      }
      console.error('Lỗi khi cập nhật tư vấn AI:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xóa tư vấn
  const handleDelete = (id, question) => {
    confirm({
      title: 'Xác nhận xóa tư vấn AI',
      content: `Bạn có chắc chắn muốn xóa tư vấn này không?`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await aiService.deleteAIConsultation(id);
          
          if (result && result.success) {
            message.success('Đã xóa tư vấn AI thành công');
            fetchConsultations();
          } else {
            message.error('Không thể xóa tư vấn AI');
          }
        } catch (error) {
          if (error.response && error.response.status === 401) {
            setAuthError('Phiên làm việc đã hết hạn');
            message.error('Phiên làm việc đã hết hạn');
          } else {
            message.error('Lỗi kết nối máy chủ');
          }
          console.error('Lỗi khi xóa tư vấn AI:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Hàm đăng nhập lại
  const handleRelogin = () => {
    window.location.href = '/login?redirect=/dashboard?tab=tư-vấn-ai';
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Cập nhật hàm cleanHtmlContent để xử lý hiển thị nội dung text không có HTML
  const cleanHtmlContent = (content) => {
    if (!content) return '';
    
    // Xóa các thẻ HTML và thay thế các ký tự đặc biệt
    return content
      .replace(/<[^>]*>/g, '') // Xóa tất cả thẻ HTML
      .replace(/&nbsp;/g, ' ') // Thay thẻ &nbsp; bằng khoảng trắng
      .replace(/&amp;/g, '&') // Thay &amp; bằng &
      .replace(/&lt;/g, '<') // Thay &lt; bằng <
      .replace(/&gt;/g, '>'); // Thay &gt; bằng >
  };

  // Cập nhật bảng hiển thị để làm sạch text
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 50,
    },
    {
      title: 'Người dùng',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
      render: (text, record) => (
        <span>{text || record.user_id || 'Không xác định'}</span>
      ),
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'question',
      key: 'question',
      ellipsis: true,
      render: (text) => {
        const cleanText = cleanHtmlContent(text);
        return <span>{cleanText.length > 40 ? cleanText.substring(0, 40) + '...' : cleanText}</span>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (text) => formatDate(text),
      responsive: ['md'],
    },
    {
      title: '',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={() => showConsultationDetail(record.id)} 
          />
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record.id)} 
          />
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id, record.question)} 
          />
        </Space>
      ),
    },
  ];

  // Nếu có lỗi xác thực, hiển thị thông báo lỗi
  if (authError) {
    return (
      <div className={styles.container}>
        <Card className={styles.errorCard}>
          <div className={styles.errorBox}>
            <WarningOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
            <Title level={4}>Lỗi xác thực</Title>
            <Paragraph>{authError}</Paragraph>
            <Button 
              type="primary" 
              onClick={handleRelogin}
              style={{ marginTop: 16 }}
            >
              Đăng nhập lại
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card className={styles.searchCard}>
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={14} md={18}>
            <Input
              placeholder="Tìm kiếm tư vấn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={10} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={showCreateModal}
            >
              Thêm mới
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className={styles.tableCard}>
        {error ? (
          <div className={styles.errorBox}>
            <div>{error}</div>
            <Button 
              type="primary" 
              onClick={() => fetchConsultations()}
              loading={loading}
              size="small"
              style={{ marginTop: 10 }}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={consultations}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              size: 'small',
              showTotal: (total) => `${total} tư vấn`,
            }}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 500 }}
            size="small"
          />
        )}
      </Card>

      {/* Modal xem chi tiết */}
      <Modal
        title="Chi tiết tư vấn AI"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
          </div>
        ) : selectedConsultation ? (
          <div className={styles.detailContent}>
            <div className={styles.detailItem}>
              <Text strong>Người dùng:</Text>
              <Text>{selectedConsultation.user_name || selectedConsultation.user_id || 'Không xác định'}</Text>
            </div>
            
            <div className={styles.detailItem}>
              <Text strong>Ngày tạo:</Text>
              <Text>{formatDate(selectedConsultation.created_at)}</Text>
            </div>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <div className={styles.detailItem}>
              <Text strong>Câu hỏi:</Text>
              <div className={styles.questionBox}>{cleanHtmlContent(selectedConsultation.question)}</div>
            </div>
            
            <div className={styles.detailItem}>
              <Text strong>Câu trả lời:</Text>
              <div className={styles.answerBox}>{cleanHtmlContent(selectedConsultation.answer)}</div>
            </div>
          </div>
        ) : (
          <div>Không có dữ liệu</div>
        )}
      </Modal>

      {/* Modal chỉnh sửa */}
      <Modal
        title="Chỉnh sửa tư vấn AI"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        okText="Cập nhật"
        cancelText="Hủy"
        onOk={handleUpdate}
        confirmLoading={loading}
      >
        <div className={styles.formContainer}>
          <div className={styles.formItem}>
            <Text strong>Câu hỏi:</Text>
            <TextArea
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Nhập câu hỏi"
              rows={4}
            />
          </div>

          <div className={styles.formItem}>
            <Text strong>Câu trả lời:</Text>
            <TextArea
              name="answer"
              value={formData.answer}
              onChange={handleInputChange}
              placeholder="Nhập câu trả lời"
              rows={6}
            />
          </div>
        </div>
      </Modal>

      {/* Modal tạo mới */}
      <Modal
        title="Thêm tư vấn AI mới"
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        okText="Tạo mới"
        cancelText="Hủy"
        onOk={handleCreate}
        confirmLoading={loading}
      >
        <div className={styles.formContainer}>
          <div className={styles.formItem}>
            <Text strong>ID người dùng:</Text>
            <Input
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              placeholder="Nhập ID người dùng"
            />
          </div>

          <div className={styles.formItem}>
            <Text strong>Câu hỏi:</Text>
            <TextArea
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="Nhập câu hỏi"
              rows={4}
            />
          </div>

          <div className={styles.formItem}>
            <Text strong>Câu trả lời:</Text>
            <TextArea
              name="answer"
              value={formData.answer}
              onChange={handleInputChange}
              placeholder="Nhập câu trả lời"
              rows={6}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIConsultationManager; 