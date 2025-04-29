import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Layout, 
  Typography, 
  Input, 
  Select, 
  DatePicker, 
  Button, 
  Card, 
  List, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Pagination, 
  Spin, 
  Empty, 
  Alert, 
  Form, 
  Divider 
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  CalendarOutlined, 
  RightOutlined, 
  TagOutlined, 
  FileTextOutlined, 
  ReloadOutlined
} from '@ant-design/icons';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

/**
 * Trang hiển thị danh sách văn bản pháp luật
 */
const Documents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    document_type: '',
    from_date: '',
    to_date: ''
  });
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  const [form] = Form.useForm();

  // Đọc trạng thái filter từ URL khi trang được tải
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlFilters = {
      search: queryParams.get('search') || '',
      document_type: queryParams.get('document_type') || '',
      from_date: queryParams.get('from_date') || '',
      to_date: queryParams.get('to_date') || ''
    };
    
    const urlPage = parseInt(queryParams.get('page')) || 1;
    
    setFilters(urlFilters);
    setPagination(prev => ({
      ...prev,
      page: urlPage
    }));
    
    // Cập nhật form
    form.setFieldsValue({
      search: urlFilters.search,
      document_type: urlFilters.document_type,
      date_range: urlFilters.from_date && urlFilters.to_date ? 
        [moment(urlFilters.from_date), moment(urlFilters.to_date)] : null
    });
  }, [location.search, form]);

  // Tải danh sách văn bản pháp luật khi component được tải hoặc khi filter/pagination thay đổi
  useEffect(() => {
    fetchDocuments();
    fetchDocumentTypes();
  }, [pagination.page, filters]);

  // Cập nhật URL khi filters hoặc pagination thay đổi
  useEffect(() => {
    // Tạo object chứa tất cả tham số query hiện tại
    const queryParams = new URLSearchParams();
    
    // Thêm các filter có giá trị vào URL
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.document_type) queryParams.set('document_type', filters.document_type);
    if (filters.from_date) queryParams.set('from_date', filters.from_date);
    if (filters.to_date) queryParams.set('to_date', filters.to_date);
    
    // Thêm thông tin trang hiện tại
    if (pagination.page > 1) queryParams.set('page', pagination.page.toString());
    
    // Cập nhật URL mà không reload trang
    const newUrl = `${location.pathname}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    navigate(newUrl, { replace: true });
  }, [filters, pagination.page, navigate, location.pathname]);

  // Hàm tìm kiếm văn bản pháp luật
  const fetchDocuments = async () => {
    try {
      setError(null);

      // Chuẩn hóa từ khóa tìm kiếm thành chữ thường để không phân biệt hoa thường
      const normalizedSearch = filters.search ? filters.search.toLowerCase().trim() : '';
      
      // Giữ nguyên document_type vì phía backend đã xử lý không phân biệt hoa thường
      const queryParams = {
        search: normalizedSearch,
        document_type: filters.document_type,
        from_date: filters.from_date,
        to_date: filters.to_date,
        page: pagination.page,
        limit: pagination.limit,
        case_insensitive: true // Thêm flag để xử lý không phân biệt hoa thường
      };

      const response = await legalService.getLegalDocuments(queryParams);
      
      if (response.status === 'success') {
        setDocuments(response.data || []);
        setPagination(response.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0
        });
      } else {
        setError('Không thể tải danh sách văn bản pháp luật');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách văn bản:', error);
      setError('Đã xảy ra lỗi khi tải danh sách văn bản pháp luật');
    } finally {
      setLoading(false);
      setIsResetting(false);
    }
  };

  // Lấy danh sách loại văn bản
  const fetchDocumentTypes = async () => {
    try {
      const types = await legalService.getDocumentTypes();
      setDocumentTypes(types || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách loại văn bản:', error);
    }
  };

  // Xử lý sự kiện submit form tìm kiếm
  const handleSubmit = (values) => {
    const newFilters = {
      search: values.search || '',
      document_type: values.document_type || '',
      from_date: values.date_range ? values.date_range[0].format('YYYY-MM-DD') : '',
      to_date: values.date_range ? values.date_range[1].format('YYYY-MM-DD') : ''
    };
    
    setFilters(newFilters);
    
    // Reset về trang đầu tiên khi áp dụng bộ lọc mới
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };
  
  // Reset lại tất cả filter và tải lại dữ liệu
  const resetFilters = () => {
    setIsResetting(true);
    form.resetFields();
    
    setFilters({
      search: '',
      document_type: '',
      from_date: '',
      to_date: ''
    });
    
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Điều hướng đến trang chi tiết văn bản
  const handleDocumentClick = (documentId) => {
    navigate(`/legal/documents/${documentId}`);
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

  // Xử lý chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // Hiển thị các tag keywords
  const renderKeywords = (keywords) => {
    if (!keywords || !keywords.length) return null;
    
    return (
      <Space wrap>
        {keywords.slice(0, 3).map((keyword, index) => (
          <Tag key={index} color="blue">
            <TagOutlined /> {keyword}
          </Tag>
        ))}
        {keywords.length > 3 && (
          <Tag color="blue">+{keywords.length - 3}</Tag>
        )}
      </Space>
    );
  };

  return (
    <>
      <Navbar />    
  <Layout>

      <Content style={{ padding: '120px 30px 60px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Title level={1} style={{ 
            background: 'linear-gradient(90deg, #1e293b, #4a6cf7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Văn bản pháp luật
          </Title>
          <Paragraph style={{ fontSize: '1.2rem', color: '#64748b' }}>
            Tra cứu các văn bản pháp luật mới nhất và cập nhật
          </Paragraph>
        </div>

        {/* Filter Section */}
        <Card style={{ marginBottom: '2.5rem' }}>
          <Form 
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Form.Item 
                  name="search" 
                  label="Từ khóa"
                >
                  <Input 
                    placeholder="Nhập từ khóa tìm kiếm..." 
                    prefix={<SearchOutlined />} 
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={8}>
                <Form.Item 
                  name="document_type" 
                  label="Loại văn bản"
                >
                  <Select
                    placeholder="Tất cả loại văn bản"
                    allowClear
                    suffixIcon={<FilterOutlined />}
                  >
                    <Option value="">Tất cả loại văn bản</Option>
                    {documentTypes.map(type => (
                      <Option key={type.id} value={type.id}>
                        {type.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={8}>
                <Form.Item 
                  name="date_range" 
                  label="Thời gian ban hành"
                >
                  <RangePicker 
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                    placeholder={['Từ ngày', 'Đến ngày']}
                    suffixIcon={<CalendarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            <Row justify="end" gutter={16}>
              {(filters.search || filters.document_type || filters.from_date || filters.to_date) && (
                <Col>
                  <Button 
                    onClick={resetFilters}
                    icon={<ReloadOutlined />}
                    loading={isResetting}
                  >
                    Đặt lại bộ lọc
                  </Button>
                </Col>
              )}
              <Col>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  icon={<SearchOutlined />}
                  loading={loading}
                >
                  Tìm kiếm
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Content */}
        {error ? (
          <Alert
            message="Đã xảy ra lỗi"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={fetchDocuments}>
                Thử lại
              </Button>
            }
          />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 20 }}>Đang tải dữ liệu văn bản...</div>
          </div>
        ) : documents.length === 0 ? (
          <Empty 
            description={
              <Space direction="vertical" align="center">
                <Text>Không tìm thấy văn bản pháp luật nào phù hợp với điều kiện tìm kiếm.</Text>
                {(filters.search || filters.document_type || filters.from_date || filters.to_date) && (
                  <Button type="primary" onClick={resetFilters}>
                    Xóa bộ lọc và hiển thị tất cả văn bản
                  </Button>
                )}
              </Space>
            }
          />
        ) : (
          <>
            <div style={{ 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              color: '#64748b' 
            }}>
              <div style={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: '#4a6cf7', 
                marginRight: 10 
              }}></div>
              Tìm thấy {pagination.total} văn bản pháp luật
            </div>

            <List
              dataSource={documents}
              renderItem={document => (
                <Card 
                  hoverable 
                  style={{ marginBottom: 16 }}
                  onClick={() => handleDocumentClick(document.id)}
                >
                  <div style={{ position: 'absolute', top: 16, right: 16 }}>
                    <Tag color="purple">{document.document_type}</Tag>
                  </div>
                  
                  <Title level={4} style={{ paddingRight: 100, marginBottom: 16 }}>
                    {document.title}
                  </Title>
                  
                  <Space style={{ marginBottom: 16 }}>
                    <CalendarOutlined style={{ color: '#4a6cf7' }} />
                    <Text>Ngày ban hành: {formatDate(document.issued_date)}</Text>
                  </Space>
                  
                  <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 16 }}>
                    {document.summary || 'Không có tóm tắt nội dung'}
                  </Paragraph>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    {renderKeywords(document.keywords)}
                    
                    <Button 
                      type="primary"
                      icon={<RightOutlined />}
                      size="small"
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </Card>
              )}
            />

            {pagination.totalPages > 1 && (
              <Row justify="center" style={{ marginTop: '3rem' }}>
                <Pagination
                  current={pagination.page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </Row>
            )}
          </>
        )}
      </Content>
    </Layout>
    </>
  );
};

export default Documents; 