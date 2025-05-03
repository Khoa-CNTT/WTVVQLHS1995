import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Card, Typography, Row, Col, Tag, message, Tooltip, Modal, Select, Spin } from 'antd';
import { SearchOutlined, EyeOutlined, DeleteOutlined, DownloadOutlined, FileOutlined, UserOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { getAllUserLegalDocs, downloadLegalDoc, deleteLegalDoc, analyzeLegalDoc, getLegalDocCategories } from '../../../services/legalDocService';
import AddEditLegalDoc from './AddEditLegalDoc';
import styles from './UserLegalDocsManager.module.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const UserLegalDocsManager = () => {
  // State
  const [legalDocs, setLegalDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [docDetail, setDocDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [editDocId, setEditDocId] = useState(null);

  // Tải danh sách hồ sơ pháp lý khi component được mount
  useEffect(() => {
    fetchLegalDocs();
    fetchCategories();
  }, [pagination.current, pagination.pageSize, searchTerm, selectedUserId, selectedCategory]);

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const response = await getLegalDocCategories();
      if (response && response.success && response.categories) {
        setCategories(response.categories);
      } else {
        // Sử dụng danh mục mặc định nếu không lấy được từ API
        setCategories(['Hồ sơ cá nhân', 'Hợp đồng', 'Đơn kiện', 'Biên bản', 'Khác']);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách danh mục:', error);
      message.error('Không thể tải danh sách danh mục: ' + error.message);
      // Sử dụng danh mục mặc định nếu lỗi
      setCategories(['Hồ sơ cá nhân', 'Hợp đồng', 'Đơn kiện', 'Biên bản', 'Khác']);
    }
  };

  // Hàm fetch danh sách hồ sơ pháp lý từ API
  const fetchLegalDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const options = {
        search: searchTerm,
        userId: selectedUserId,
        category: selectedCategory
      };
      
      const response = await getAllUserLegalDocs(
        pagination.current,
        pagination.pageSize,
        options
      );
      
      if (response && response.status === 'success') {
        setLegalDocs(response.data || []);
        setPagination({
          ...pagination,
          total: response.total || 0,
        });
      } else {
        setError('Không thể tải danh sách hồ sơ pháp lý');
        message.error('Không thể tải danh sách hồ sơ pháp lý');
      }
    } catch (error) {
      setError('Lỗi kết nối máy chủ: ' + (error.message || 'Đã có lỗi xảy ra'));
      message.error('Lỗi khi tải danh sách hồ sơ pháp lý: ' + (error.message || 'Đã có lỗi xảy ra'));
      console.error('Lỗi khi tải danh sách hồ sơ pháp lý:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi phân trang
  const handleTableChange = (pagination) => {
    setPagination({
      ...pagination,
    });
  };

  // Hiển thị chi tiết hồ sơ
  const showDocDetail = async (docId) => {
    try {
      setDetailLoading(true);
      setDetailVisible(true);
      
      // Lấy chi tiết từ API
      const response = await getAllUserLegalDocs(1, 1, { docId });
      
      if (response && response.status === 'success' && response.data && response.data.length > 0) {
        setDocDetail(response.data[0]);
      } else {
        message.error('Không thể tải chi tiết hồ sơ pháp lý');
      }
    } catch (error) {
      message.error('Lỗi khi tải chi tiết hồ sơ pháp lý: ' + (error.message || 'Đã có lỗi xảy ra'));
      console.error('Lỗi khi tải chi tiết hồ sơ pháp lý:', error);
    } finally {
      setDetailLoading(false);
    }
  };

  // Tải xuống file hồ sơ
  const handleDownload = async (docId) => {
    try {
      setLoading(true);
      await downloadLegalDoc(docId);
      message.success('Đã tải xuống hồ sơ pháp lý thành công');
    } catch (error) {
      message.error('Lỗi khi tải xuống hồ sơ pháp lý: ' + (error.message || 'Đã có lỗi xảy ra'));
      console.error('Lỗi khi tải xuống hồ sơ pháp lý:', error);
    } finally {
      setLoading(false);
    }
  };

  // Phân tích hồ sơ với AI
  const handleAnalyze = async (docId) => {
    try {
      setAnalyzeLoading(true);
      const response = await analyzeLegalDoc(docId);
      
      if (response && response.success) {
        message.success('Đã phân tích hồ sơ pháp lý thành công');
        // Cập nhật chi tiết hồ sơ nếu đang xem
        if (docDetail && docDetail.id === docId) {
          setDocDetail({
            ...docDetail,
            ai_analysis: response.data.analysis
          });
        }
        // Tải lại danh sách để cập nhật trạng thái phân tích
        fetchLegalDocs();
      } else {
        message.error('Không thể phân tích hồ sơ pháp lý');
      }
    } catch (error) {
      message.error('Lỗi khi phân tích hồ sơ pháp lý: ' + (error.message || 'Đã có lỗi xảy ra'));
      console.error('Lỗi khi phân tích hồ sơ pháp lý:', error);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  // Xóa hồ sơ
  const handleDelete = (docId, docTitle) => {
    confirm({
      title: 'Xác nhận xóa hồ sơ pháp lý',
      content: `Bạn có chắc chắn muốn xóa hồ sơ "${docTitle}" không? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await deleteLegalDoc(docId);
          
          if (result && result.success) {
            message.success('Đã xóa hồ sơ pháp lý thành công');
            fetchLegalDocs(); // Tải lại danh sách
          } else {
            message.error('Không thể xóa hồ sơ pháp lý');
          }
        } catch (error) {
          message.error('Lỗi khi xóa hồ sơ pháp lý: ' + (error.message || 'Đã có lỗi xảy ra'));
          console.error('Lỗi khi xóa hồ sơ pháp lý:', error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Định dạng loại file
  const getFileType = (filePath) => {
    if (!filePath) return 'Không xác định';
    
    if (filePath.endsWith('.pdf')) return 'PDF';
    if (filePath.endsWith('.docx') || filePath.endsWith('.doc')) return 'Word';
    if (filePath.endsWith('.txt')) return 'Văn bản';
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || filePath.endsWith('.png')) return 'Hình ảnh';
    
    return 'Khác';
  };

  // Hiển thị thông tin phân tích AI
  const renderAIAnalysis = (analysis) => {
    if (!analysis) {
      return (
        <div className={styles.noAnalysis}>
          <p>Chưa có phân tích AI cho tài liệu này</p>
          <Button 
            type="primary" 
            onClick={() => docDetail && handleAnalyze(docDetail.id)}
            loading={analyzeLoading}
          >
            Phân tích ngay
          </Button>
        </div>
      );
    }

    return (
      <div className={styles.analysisContent}>
        {analysis.summary && (
          <div className={styles.analysisSection}>
            <Title level={5}>Tóm tắt:</Title>
            <p>{analysis.summary}</p>
          </div>
        )}
        
        {analysis.keywords && analysis.keywords.length > 0 && (
          <div className={styles.analysisSection}>
            <Title level={5}>Từ khóa:</Title>
            <div className={styles.keywordsList}>
              {analysis.keywords.map((keyword, index) => (
                <Tag key={index} color="blue">{keyword}</Tag>
              ))}
            </div>
          </div>
        )}
        
        {analysis.entities && analysis.entities.length > 0 && (
          <div className={styles.analysisSection}>
            <Title level={5}>Thực thể:</Title>
            <ul className={styles.entitiesList}>
              {analysis.entities.map((entity, index) => (
                <li key={index}>
                  <span className={styles.entityType}>{entity.type}:</span> {entity.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {analysis.document_type && (
          <div className={styles.analysisSection}>
            <Title level={5}>Loại văn bản:</Title>
            <Tag color="purple">{analysis.document_type}</Tag>
          </div>
        )}
      </div>
    );
  };

  // Mở form thêm/sửa hồ sơ
  const showAddEditForm = (docId = null) => {
    setEditDocId(docId);
    setAddEditVisible(true);
    
    // Đóng modal chi tiết nếu đang mở
    if (detailVisible) {
      setDetailVisible(false);
    }
  };

  // Đóng form thêm/sửa hồ sơ
  const handleCloseAddEdit = () => {
    setAddEditVisible(false);
    setEditDocId(null);
  };

  // Xử lý sau khi thêm/sửa thành công
  const handleAddEditSuccess = () => {
    fetchLegalDocs(); // Tải lại danh sách
  };

  // Cột dữ liệu cho bảng
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 50,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <a href="#" onClick={(e) => { e.preventDefault(); showDocDetail(record.id); }}>
          {text}
        </a>
      ),
    },
    {
      title: 'Người dùng',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 150,
      render: (text, record) => (
        <Tooltip title={record.username || record.user_email}>
          <span><UserOutlined style={{ marginRight: 8 }} />{text || 'Người dùng không xác định'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 100,
      render: (text) => formatDate(text),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => showDocDetail(record.id)} 
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => showAddEditForm(record.id)} 
            />
          </Tooltip>
          <Tooltip title="Tải xuống">
            <Button 
              type="text" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownload(record.id)} 
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record.id, record.title)} 
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card className={styles.searchCard} size="small">
        <Row align="middle" gutter={[16, 16]}>
          <Col xs={24} md={4}>
            <Title level={5} style={{ margin: 0, fontSize: '16px' }}>
              <SearchOutlined style={{ marginRight: 8 }} />
              Tìm kiếm
            </Title>
          </Col>
          
          <Col xs={24} md={16}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Danh mục"
                  allowClear
                  style={{ width: '100%' }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  size="middle"
                >
                  <Option value="">Tất cả danh mục</Option>
                  {categories.map(category => (
                    <Option key={category} value={category}>{category}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={16}>
                <Input
                  placeholder="Tìm kiếm theo tiêu đề, nội dung..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<SearchOutlined />}
                  allowClear
                  style={{ width: '100%' }}
                  size="middle"
                />
              </Col>
            </Row>
          </Col>
          
          <Col xs={24} md={4} style={{ textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showAddEditForm()}
            >
              Thêm hồ sơ
            </Button>
          </Col>
        </Row>
      </Card>

      <Card 
        title={<Title level={4} style={{ margin: 0, fontSize: '18px' }}>Danh sách hồ sơ pháp lý</Title>} 
        className={styles.docsTable}
        size="small"
        bodyStyle={{ padding: '12px' }}
      >
        {error ? (
          <div className={styles.errorBox}>
            <Title level={4} style={{ color: '#ff4d4f' }}>Lỗi kết nối</Title>
            <p>{error}</p>
            <Button 
              type="primary" 
              onClick={() => fetchLegalDocs()}
              loading={loading}
            >
              Thử lại
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={legalDocs}
            rowKey="id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              size: 'small',
              showTotal: (total) => `Tổng cộng ${total} hồ sơ`,
            }}
            loading={loading}
            onChange={handleTableChange}
            scroll={{ x: 'max-content' }}
            size="small"
            locale={{
              emptyText: (
                <div style={{ padding: '20px 0' }}>
                  <Title level={5}>Không có dữ liệu</Title>
                  <p>Chưa có hồ sơ pháp lý nào hoặc không thể kết nối đến máy chủ</p>
                </div>
              )
            }}
          />
        )}
      </Card>

      <Modal
        title="Chi tiết hồ sơ pháp lý"
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button 
            key="edit" 
            icon={<EditOutlined />} 
            onClick={() => showAddEditForm(docDetail?.id)}
          >
            Sửa
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => docDetail && handleDownload(docDetail.id)}>
            Tải xuống
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
          </div>
        ) : docDetail ? (
          <div className={styles.docDetail}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Card size="small">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <div className={styles.detailItem}>
                        <Text strong>Tiêu đề:</Text>
                        <Text>{docDetail.title}</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <Text strong>Danh mục:</Text>
                        <Tag color="blue">{docDetail.category}</Tag>
                      </div>
                      <div className={styles.detailItem}>
                        <Text strong>Ngày tạo:</Text>
                        <Text>{formatDate(docDetail.created_at)}</Text>
                      </div>
                    </Col>
                    <Col xs={24} md={12}>
                      <div className={styles.detailItem}>
                        <Text strong>Người dùng:</Text>
                        <Text>{docDetail.owner_name || docDetail.username}</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <Text strong>Email:</Text>
                        <Text>{docDetail.user_email}</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <Text strong>Cập nhật cuối:</Text>
                        <Text>{formatDate(docDetail.updated_at)}</Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
              
              {docDetail.description && (
                <Col span={24}>
                  <Card title="Mô tả" size="small">
                    <p>{docDetail.description}</p>
                  </Card>
                </Col>
              )}
              
              {docDetail.ai_analysis && (
                <Col span={24}>
                  <Card 
                    title="Phân tích AI" 
                    size="small" 
                    extra={
                      <Button 
                        type="link" 
                        onClick={() => setShowAiAnalysis(!showAiAnalysis)}
                      >
                        {showAiAnalysis ? 'Ẩn bớt' : 'Hiển thị'}
                      </Button>
                    }
                  >
                    {showAiAnalysis ? renderAIAnalysis(docDetail.ai_analysis) : (
                      <p>{docDetail.ai_analysis.summary?.substring(0, 150)}... <Button type="link" onClick={() => setShowAiAnalysis(true)}>Xem thêm</Button></p>
                    )}
                  </Card>
                </Col>
              )}
              
              <Col span={24}>
                <div className={styles.filePreview}>
                  <div className={styles.fileIcon}>
                    <FileOutlined style={{ fontSize: 36 }} />
                  </div>
                  <div className={styles.fileInfo}>
                    <Text strong>{getFileType(docDetail.file_path)} - {docDetail.file_path?.split('/').pop()}</Text>
                    <Text>Tải xuống để xem nội dung file</Text>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        ) : (
          <div>Không có dữ liệu</div>
        )}
      </Modal>

      <AddEditLegalDoc 
        visible={addEditVisible}
        onCancel={handleCloseAddEdit}
        onSuccess={handleAddEditSuccess}
        docId={editDocId}
      />
    </div>
  );
};

export default UserLegalDocsManager; 