// Templates.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Templates.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import Loader from '../../components/layout/Loading/Loading';
import legalService from '../../services/legalService';
import { FaRegFile, FaCalendarAlt, FaSearch, FaFilter, FaLanguage, FaArrowRight, FaSpinner } from 'react-icons/fa';

/**
 * Trang hiển thị danh sách mẫu văn bản
 */
const Templates = () => {
  const navigate = useNavigate();
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
  
  // Tải danh sách mẫu văn bản khi component được tải hoặc khi filter/pagination thay đổi
  useEffect(() => {
    fetchTemplates();
  }, [pagination.page]);
  
  // Tải danh sách loại mẫu khi component mount
  useEffect(() => {
    fetchTemplateTypes();
  }, []);

  // Hàm tìm kiếm mẫu văn bản
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tạo bản sao của filter để tránh lỗi tham chiếu
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Chỉ thêm vào tham số khi có giá trị
      if (filters.search.trim()) {
        queryParams.search = filters.search.trim();
      }
      
      if (filters.template_type) {
        queryParams.template_type = filters.template_type;
      }
      
      const response = await legalService.getDocumentTemplates(queryParams);
      
      if (response.status === 'success') {
        // Lấy dữ liệu từ response
        let filteredTemplates = response.data || [];
        
        // Lọc thêm ở client nếu cần
        if (filters.search.trim()) {
          const searchTerms = filters.search.trim().toLowerCase().split(/\s+/);
          filteredTemplates = filteredTemplates.filter(template => {
            // Chỉ tìm kiếm theo tiêu đề, không tìm theo nội dung
            return searchTerms.every(term => 
              template.title.toLowerCase().includes(term) || 
              (template.template_type && template.template_type.toLowerCase().includes(term))
            );
          });
        }
        
        setTemplates(filteredTemplates);
        setPagination({
          page: response.pagination?.currentPage || 1,
          limit: response.pagination?.limit || 12,
          total: response.pagination?.total || filteredTemplates.length,
          totalPages: response.pagination?.totalPages || Math.ceil(filteredTemplates.length / 12)
        });
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
  };
    
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
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Xử lý sự kiện submit form tìm kiếm
  const handleSubmit = (e) => {
    e.preventDefault();
    // Reset về trang đầu tiên khi áp dụng bộ lọc mới
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
    fetchTemplates();
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
    
    // Sử dụng setTimeout để đảm bảo state đã được cập nhật
    setTimeout(() => {
      fetchTemplates();
    }, 100);
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
      console.log('Ngày không hợp lệ:', dateString);
      return 'N/A';
    }
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Hiển thị phân trang
  const renderPagination = () => {
    const { page, totalPages } = pagination;
    const pageButtons = [];
    
    // Giới hạn số nút phân trang hiển thị
    const maxPageButtons = 5;
    const startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
    
    // Nút quay lại trang trước
    pageButtons.push(
      <button 
        key="prev" 
        className={styles['pagination-button']}
        disabled={page <= 1}
        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
      >
        «
      </button>
    );
    
    // Các nút số trang
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          className={`${styles['pagination-button']} ${page === i ? styles.active : ''}`}
          onClick={() => setPagination(prev => ({ ...prev, page: i }))}
        >
          {i}
        </button>
      );
    }
    
    // Nút tiến đến trang sau
    pageButtons.push(
      <button 
        key="next" 
        className={styles['pagination-button']}
        disabled={page >= totalPages}
        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
      >
        »
      </button>
    );
    
    return pageButtons;
  };

  return (
    <>
      <Navbar />
      <div className={styles['templates-container']}>
        <div className={styles['templates-header']}>
          <h1>Mẫu văn bản pháp lý</h1>
          <p>Tra cứu và tải xuống các mẫu văn bản pháp lý phổ biến</p>
        </div>
        
        <div className={styles['filters-section']}>
          <form onSubmit={handleSubmit}>
            <div className={styles['filter-controls']}>
              <div className={styles['filter-group']}>
                <label htmlFor="search">
                  <FaSearch style={{ marginRight: '5px' }} /> Từ khóa
                </label>
                <input
                  type="text"
                  id="search"
                  name="search"
                  className={styles['filter-select']}
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Nhập từ khóa tìm kiếm..."
                />
              </div>
              
              <div className={styles['filter-group']}>
                <label htmlFor="template_type">
                  <FaFilter style={{ marginRight: '5px' }} /> Loại mẫu
                </label>
                <select
                  id="template_type"
                  name="template_type"
                  className={styles['filter-select']}
                  value={filters.template_type}
                  onChange={handleFilterChange}
                  disabled={templateTypes.length === 0}
                >
                  <option value="">Tất cả loại mẫu</option>
                  {templateTypes.length > 0 ? (
                    templateTypes.map(type => (
                      <option key={type.id || type.name} value={type.id || type.name}>
                        {type.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Đang tải loại mẫu...</option>
                  )}
                </select>
              </div>
              
              <div className={styles['filter-group']}>
                <label>&nbsp;</label>
                <button
                  type="submit"
                  className={styles['filter-select']}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className={styles['spinner-icon']} /> Đang tìm...
                    </>
                  ) : (
                    <>Tìm kiếm</>
                  )}
                </button>
              </div>
            </div>
          </form>
          
          {(filters.search || filters.template_type) && (
            <div className={styles['reset-filter-container']}>
              <button 
                className={styles['reset-filter-button']} 
                onClick={resetFilters}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <FaSpinner className={styles['spinner-icon']} /> Đang đặt lại...
                  </>
                ) : (
                  <>Đặt lại bộ lọc</>
                )}
              </button>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className={styles['loading']}>
            <Loader />
            <p>Đang tải dữ liệu mẫu văn bản...</p>
          </div>
        ) : error ? (
          <div className={styles['error']}>
            <p>{error}</p>
            <button 
              className={styles['retry-button']} 
              onClick={() => fetchTemplates()}
            >
              Thử lại
            </button>
          </div>
        ) : templates.length === 0 ? (
          <div className={styles['no-templates']}>
            <p>Không tìm thấy mẫu văn bản nào phù hợp với điều kiện tìm kiếm.</p>
            {(filters.search || filters.template_type) && (
              <button 
                className={styles['reset-filter']} 
                onClick={resetFilters}
                disabled={isResetting}
              >
                {isResetting ? 'Đang đặt lại...' : 'Xóa bộ lọc và hiển thị tất cả'}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles['results-count']}>
              Tìm thấy {pagination.total} mẫu văn bản
            </div>
            
            <div className={styles['templates-list']}>
              {templates.map(template => (
                <div 
                  key={template.id} 
                  className={styles['template-item']}
                  onClick={() => handleTemplateClick(template.id)}
                >
                  <div className={styles['template-type-badge']}>
                    <FaFilter style={{ marginRight: '5px' }} />
                    {template.template_type}
                  </div>
                  <h3 className={styles['template-title']}>{template.title}</h3>
                  <div className={styles['template-meta']}>
                    <span className={styles['template-date']}>
                      <FaCalendarAlt /> {formatDate(template.created_at)}
                    </span>
                    <span className={styles['template-language']}>
                      <FaLanguage /> {template.language || 'Tiếng Việt'}
                    </span>
                  </div>
                  <div className={styles['template-description']}>
                    <button className={styles['view-details-button']}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {pagination.totalPages > 1 && (
              <div className={styles['pagination']}>
                {renderPagination()}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Templates;