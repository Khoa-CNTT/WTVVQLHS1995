// Templates.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Layout, Typography, Input, Select, Button, Card, Row, Col, 
  Pagination, List, Space, Empty, Tag, Spin, Alert, Divider, Badge
} from 'antd';
import { 
  SearchOutlined, FilterOutlined, GlobalOutlined, 
  RightOutlined, CalendarOutlined, ReloadOutlined,
  FileOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  CheckCircleOutlined, LoadingOutlined
} from '@ant-design/icons';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

/**
 * Trang hiển thị danh sách mẫu văn bản
 */
const Templates = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    template_type: ''
  });
  const [templateTypes, setTemplateTypes] = useState([]);
  const [isResetting, setIsResetting] = useState(false);
  
  // Đọc trạng thái filter từ URL khi trang được tải
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlFilters = {
      search: queryParams.get('search') || '',
      template_type: queryParams.get('template_type') || ''
    };
    
    const urlPage = parseInt(queryParams.get('page')) || 1;
    
    setFilters(urlFilters);
    setPagination(prev => ({
      ...prev,
      page: urlPage
    }));
  }, [location.search]);
  
  // Cập nhật URL khi filters hoặc pagination thay đổi
  useEffect(() => {
    // Tạo object chứa tất cả tham số query hiện tại
    const queryParams = new URLSearchParams();
    
    // Thêm các filter có giá trị vào URL
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.template_type) queryParams.set('template_type', filters.template_type);
    
    // Thêm thông tin trang hiện tại
    if (pagination.page > 1) queryParams.set('page', pagination.page.toString());
    
    // Cập nhật URL mà không reload trang
    const newUrl = `${location.pathname}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    navigate(newUrl, { replace: true });
  }, [filters, pagination.page, navigate, location.pathname]);
  
  // Hàm tìm kiếm mẫu văn bản
  const fetchTemplates = useCallback(async () => {
    try {
      setError(null);

      // Chuẩn hóa từ khóa tìm kiếm thành chữ thường để không phân biệt hoa thường
      const normalizedSearch = filters.search.trim() ? filters.search.trim().toLowerCase() : '';

      // Tạo bản sao của filter để tránh lỗi tham chiếu
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Chỉ thêm vào tham số khi có giá trị
      if (normalizedSearch) {
        queryParams.search = normalizedSearch;
      }
      
      if (filters.template_type) {
        queryParams.template_type = filters.template_type;
      }
      
      const response = await legalService.getDocumentTemplates(queryParams);
      
      if (response.status === 'success') {
        // Lấy dữ liệu từ response
        let filteredTemplates = response.data || [];
        
        // Lọc thêm ở client nếu cần (chuyển đổi thành chữ thường để không phân biệt hoa thường)
        if (normalizedSearch) {
          const searchTerms = normalizedSearch.split(/\s+/);
          filteredTemplates = filteredTemplates.filter(template => {
            // Tìm kiếm theo tiêu đề và loại mẫu (chuyển cả hai thành chữ thường)
            const normalizedTitle = template.title.toLowerCase();
            const normalizedType = template.template_type ? template.template_type.toLowerCase() : '';
            
            return searchTerms.every(term => 
              normalizedTitle.includes(term) || 
              normalizedType.includes(term)
            );
          });
        }
        
        setTemplates(filteredTemplates);
        setPagination(prev => ({
          ...prev,
          page: response.pagination?.currentPage || prev.page,
          limit: response.pagination?.limit || prev.limit,
          total: response.pagination?.total || filteredTemplates.length,
          totalPages: response.pagination?.totalPages || Math.ceil(filteredTemplates.length / 12)
        }));
      } else {
        setError('Không thể tải danh sách mẫu văn bản');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách mẫu văn bản:', error);
      setError('Đã xảy ra lỗi khi tải danh sách mẫu văn bản');
    } finally {
      setLoading(false);
      setIsResetting(false);
    }
  }, [pagination.page, pagination.limit, filters]);
  
  // Tải danh sách mẫu văn bản khi component được tải hoặc khi filter/pagination thay đổi
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  // Tải danh sách loại mẫu khi component mount
  useEffect(() => {
    fetchTemplateTypes();
  }, []);

  // Lấy danh sách loại mẫu văn bản
  const fetchTemplateTypes = async () => {
    try {
      const response = await legalService.getTemplateTypes();
      
      // Đảm bảo chúng ta có một mảng hợp lệ
      let types = [];
      if (response && response.status === 'success') {
        types = response.data || [];
      } else if (Array.isArray(response)) {
        types = response;
      }
      
      // Nếu mảng rỗng, tạo một số loại mẫu mặc định
      if (types.length === 0) {
        types = [
          { id: 'don', name: 'Đơn' },
          { id: 'hop-dong', name: 'Hợp đồng' },
          { id: 'bao-cao', name: 'Báo cáo' },
          { id: 'bien-ban', name: 'Biên bản' },
          { id: 'to-trinh', name: 'Tờ trình' }
        ];
      }
      
      setTemplateTypes(types);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', error);
      // Sử dụng danh sách loại mẫu mặc định nếu có lỗi
      const defaultTypes = [
        { id: 'don', name: 'Đơn' },
        { id: 'hop-dong', name: 'Hợp đồng' },
        { id: 'bao-cao', name: 'Báo cáo' },
        { id: 'bien-ban', name: 'Biên bản' },
        { id: 'to-trinh', name: 'Tờ trình' }
      ];
      setTemplateTypes(defaultTypes);
    }
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (name, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Xử lý sự kiện submit form tìm kiếm
  const handleSubmit = () => {
    // Reset về trang đầu tiên khi áp dụng bộ lọc mới
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };
  
  // Reset lại tất cả filter và tải lại dữ liệu
  const resetFilters = () => {
    setIsResetting(true);
    setFilters({
      search: '',
      template_type: ''
    });
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Điều hướng đến trang chi tiết mẫu văn bản
  const handleTemplateClick = (templateId) => {
    navigate(`/legal/templates/${templateId}`);
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Kiểm tra định dạng ngày hợp lệ
    const date = new Date(dateString);
    
    // Kiểm tra nếu ngày không hợp lệ (Invalid Date)
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      page
    }));
  };

  return (
    <>
    <Navbar />
    <Layout>
      <Content style={{ padding: '120px 30px 60px', maxWidth: 1200, margin: '0 auto', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <Title 
            level={1} 
            style={{ 
              fontSize: '2.75rem', 
              fontWeight: 700, 
              background: 'linear-gradient(90deg, #1e293b, #4a6cf7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Mẫu văn bản pháp lý
          </Title>
          <Paragraph style={{ fontSize: '1.2rem', color: '#64748b', maxWidth: 600, margin: '0 auto' }}>
            Tra cứu và tải xuống các mẫu văn bản pháp lý phổ biến
          </Paragraph>
        </div>
        
        <Card 
          style={{ 
            marginBottom: '2.5rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            borderRadius: '16px'
          }}
        >
          <Row gutter={[24, 16]} align="bottom">
            <Col xs={24} sm={24} md={8}>
              <Text strong>
                <SearchOutlined style={{ marginRight: 8 }} />
                Từ khóa
              </Text>
              <Search
                placeholder="Nhập từ khóa tìm kiếm..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                style={{ marginTop: 8 }}
                allowClear
              />
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Text strong>
                <FilterOutlined style={{ marginRight: 8 }} />
                Loại mẫu
              </Text>
              <Select
                placeholder="Tất cả loại mẫu"
                value={filters.template_type}
                onChange={(value) => handleFilterChange('template_type', value)}
                style={{ width: '100%', marginTop: 8 }}
                allowClear
              >
                <Option value="">Tất cả loại mẫu</Option>
                {templateTypes.map(type => (
                  <Option key={type.id || type.name} value={type.id || type.name}>
                    {type.name}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={12} md={8}>
              <Button 
                type="primary" 
                onClick={handleSubmit}
                loading={loading}
                style={{ marginTop: 27, width: '100%' }}
                icon={<SearchOutlined />}
              >
                Tìm kiếm
              </Button>
            </Col>
          </Row>
          
          {(filters.search || filters.template_type) && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button 
                onClick={resetFilters}
                loading={isResetting}
                icon={<ReloadOutlined />}
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </Card>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Đang tải dữ liệu mẫu văn bản...</div>
          </div>
        ) : error ? (
          <Alert
            message="Đã xảy ra lỗi"
            description={
              <Space direction="vertical">
                <Text>{error}</Text>
                <Button type="primary" onClick={() => fetchTemplates()}>
                  Thử lại
                </Button>
              </Space>
            }
            type="error"
            showIcon
          />
        ) : templates.length === 0 ? (
          <Empty
            description={
              <Space direction="vertical" align="center">
                <Text>Không tìm thấy mẫu văn bản nào phù hợp với điều kiện tìm kiếm.</Text>
                {(filters.search || filters.template_type) && (
                  <Button 
                    onClick={resetFilters}
                    loading={isResetting}
                  >
                    Xóa bộ lọc và hiển thị tất cả
                  </Button>
                )}
              </Space>
            }
          />
        ) : (
          <>
            <Badge
              count={pagination.total}
              showZero
              overflowCount={9999}
              style={{ backgroundColor: '#4a6cf7' }}
            >
              <Text style={{ fontSize: '1.05rem', color: '#64748b', marginBottom: 16, display: 'inline-block' }}>
                Tìm thấy mẫu văn bản
              </Text>
            </Badge>
            
            <List
              grid={{
                gutter: 16,
                xs: 1,
                sm: 1,
                md: 2,
                lg: 3,
                xl: 3,
                xxl: 3,
              }}
              dataSource={templates}
              renderItem={template => (
                <List.Item>
                  <Card
                    hoverable
                    onClick={() => handleTemplateClick(template.id)}
                    style={{ 
                      borderRadius: '16px',
                      overflow: 'hidden',
                      height: '100%'
                    }}
                    bodyStyle={{ padding: '1.75rem' }}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <Tag color="#4a6cf7" style={{ borderRadius: '30px', padding: '4px 12px' }}>
                        <FilterOutlined style={{ marginRight: 5 }} />
                        {template.template_type}
                      </Tag>
                    </div>
                    
                    <Title level={4} style={{ marginBottom: 16, lineHeight: 1.4 }} ellipsis={{ rows: 2 }}>
                      {template.title}
                    </Title>
                    
                    <Space split={<Divider type="vertical" />} style={{ marginBottom: 16, color: '#64748b' }}>
                      <Space>
                        <CalendarOutlined />
                        {formatDate(template.created_at)}
                      </Space>
                      <Space>
                        <GlobalOutlined />
                        {template.language || 'Tiếng Việt'}
                      </Space>
                    </Space>
                    
                    <div style={{ marginTop: 16 }}>
                      <Button 
                        type="primary" 
                        ghost
                        style={{ borderRadius: '8px', width: '100%' }}
                      >
                        Xem chi tiết <RightOutlined />
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
            
            {pagination.totalPages > 1 && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Pagination
                  current={pagination.page}
                  total={pagination.total}
                  pageSize={pagination.limit}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </Content>
    </Layout>
    </>
  );
};

export default Templates;