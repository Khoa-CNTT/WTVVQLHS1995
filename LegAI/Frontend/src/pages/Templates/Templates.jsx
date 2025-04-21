import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Templates.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [templateTypes, setTemplateTypes] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    searchTerm: ''
  });
  
  const navigate = useNavigate();
  const limit = 5; // Số mẫu văn bản hiển thị trên mỗi trang

  // Lấy danh sách mẫu văn bản từ API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        
        // Gọi API lấy danh sách mẫu văn bản
        const response = await legalService.searchDocumentTemplates({
          q: filters.searchTerm,
          type: filters.type,
          page: currentPage,
          limit: limit
        });
        
        if (response && response.data) {
          setTemplates(response.data);
          
          // Cập nhật thông tin phân trang
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
          }
        } else {
          setTemplates([]);
          setTotalPages(1);
        }
        
        setError(null);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách mẫu văn bản:', error);
        setError('Đã xảy ra lỗi khi tải danh sách mẫu văn bản. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    // Gọi API lấy danh sách loại mẫu văn bản
    const fetchTemplateTypes = async () => {
      try {
        const response = await legalService.getTemplateTypes();
        if (response) {
          setTemplateTypes(response);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách loại mẫu văn bản:', error);
      }
    };
    
    fetchTemplates();
    fetchTemplateTypes();
  }, [currentPage, filters]);

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
    setCurrentPage(1); // Reset về trang đầu tiên khi thay đổi bộ lọc
  };

  // Xử lý khi nhấn vào một mẫu văn bản
  const handleTemplateClick = (templateId) => {
    navigate(`/legal/templates/${templateId}`);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Xử lý tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    // Reset trang về 1 khi tìm kiếm
    setCurrentPage(1);
  };

  // Tạo các nút phân trang
  const renderPagination = () => {
    const pages = [];
    
    // Thêm nút Previous
    pages.push(
      <button 
        key="prev" 
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        className={styles['pagination-button']}
      >
        &laquo;
      </button>
    );
    
    // Tạo các nút số trang
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`${styles['pagination-button']} ${currentPage === i ? styles['active'] : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Thêm nút Next
    pages.push(
      <button 
        key="next" 
        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        className={styles['pagination-button']}
      >
        &raquo;
      </button>
    );
    
    return (
      <div className={styles['pagination']}>
        {pages}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className={styles['templates-container']}>
        <div className={styles['templates-header']}>
          <h1>Mẫu văn bản pháp luật</h1>
          <p>Danh sách tất cả mẫu văn bản pháp luật</p>
        </div>
        
        <div className={styles['filters-section']}>
          <div className={styles['filter-controls']}>
            <div className={styles['filter-group']}>
              <label htmlFor="type">Loại mẫu văn bản:</label>
              <select 
                id="type" 
                name="type" 
                value={filters.type}
                onChange={handleFilterChange}
                className={styles['filter-select']}
              >
                <option value="">Tất cả</option>
                {templateTypes.map((type, index) => (
                  <option key={index} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div className={styles['filter-group']}>
              <label htmlFor="searchTerm">Tìm kiếm:</label>
              <div className={styles['search-container']}>
                <input 
                  type="text" 
                  id="searchTerm" 
                  name="searchTerm" 
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="Nhập từ khóa tìm kiếm"
                  className={styles['filter-input']}
                />
                <button 
                  onClick={handleSearch}
                  className={styles['search-button']}
                >
                  <i className="fa fa-search"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className={styles['loading']}>Đang tải danh sách mẫu văn bản...</div>
        ) : error ? (
          <div className={styles['error']}>{error}</div>
        ) : templates.length === 0 ? (
          <div className={styles['no-templates']}>Không có mẫu văn bản nào phù hợp với tiêu chí tìm kiếm</div>
        ) : (
          <>
            <div className={styles['templates-list']}>
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className={styles['template-item']}
                  onClick={() => handleTemplateClick(template.id)}
                >
                  <div className={styles['template-type-badge']}>{template.template_type_name || 'Mẫu văn bản'}</div>
                  <h2 className={styles['template-title']}>{template.title}</h2>
                  <div className={styles['template-meta']}>
                    <span className={styles['template-date']}>
                      <i className="far fa-calendar-alt"></i> Ngày tạo: {formatDate(template.created_at)}
                    </span>
                    <span className={styles['template-date']}>
                      <i className="far fa-calendar-plus"></i> Cập nhật: {formatDate(template.updated_at)}
                    </span>
                  </div>
                  {template.description && (
                    <p className={styles['template-description']}>{template.description.substring(0, 200)}...</p>
                  )}
                </div>
              ))}
            </div>
            
            {renderPagination()}
          </>
        )}
      </div>
    </>
  );
};

export default Templates; 