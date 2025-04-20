import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './SearchResults.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import SideMenu from '../../components/layout/Nav/SideMenu';
import legalService from '../../services/legalService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFile, 
  faFileAlt, 
  faCalendarAlt, 
  faLanguage, 
  faChevronLeft, 
  faChevronRight,
  faExclamationTriangle,
  faSpinner,
  faFilter,
  faBook,
  faFileContract,
  faHome
} from '@fortawesome/free-solid-svg-icons';

const SearchResults = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ documents: [], templates: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    documentType: '',
    dateFrom: '',
    dateTo: '',
    language: ''
  });
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Lấy query từ URL khi component được tải
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    
    // Chỉ tìm kiếm khi có query
    if (query) {
      fetchSearchResults(query, 1);
      setHasSearched(true);
    }
  }, [location.search]);

  // Thêm effect để gọi lại API khi thay đổi trang
  useEffect(() => {
    if (hasSearched) {
      fetchSearchResults(searchQuery, currentPage);
    }
  }, [currentPage]);

  // Gọi API thực tế để lấy kết quả tìm kiếm với phân trang
  const fetchSearchResults = async (query, page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Đảm bảo query luôn là chuỗi, không phải undefined hoặc null
      const searchQuery = query || '';
      
      console.log('Đang tìm kiếm với từ khóa:', searchQuery, 'trang:', page);
      
      // Tạo query params
      const params = {
        q: searchQuery,
        page: page,
        limit: 10
      };
      
      // Nếu đang áp dụng bộ lọc, thêm tham số tương ứng
      if (activeTab === 'documents') {
        if (filters.documentType) params.type = filters.documentType;
        if (filters.dateFrom) params.fromDate = filters.dateFrom;
        if (filters.dateTo) params.toDate = filters.dateTo;
      }
      
      if (activeTab === 'templates' && filters.language) {
        params.language = filters.language;
      }
      
      console.log('Gửi request với tham số:', params);
      
      // Gọi API thực tế với tham số
      const response = await legalService.searchAll(params);
      
      console.log('Nhận được response:', response);
      
      if (response && response.status === 'success') {
        console.log(`Tìm thấy ${response.data.legalDocuments?.length || 0} văn bản pháp luật và ${response.data.documentTemplates?.length || 0} mẫu văn bản`);
        
        // Cập nhật kết quả
        setResults({
          documents: response.data.legalDocuments || [],
          templates: response.data.documentTemplates || []
        });
        
        // Cập nhật thông tin phân trang
        if (response.pagination) {
          console.log('Thông tin phân trang nhận được:', response.pagination);
          setTotalPages(response.pagination.totalPages || 1);
          setCurrentPage(response.pagination.currentPage || 1);
        } else {
          console.warn('Không có thông tin phân trang trong response');
          setTotalPages(1);
          setCurrentPage(page);
        }
      } else {
        console.error('API trả về lỗi hoặc không đúng định dạng:', response);
        setError('Không thể tải kết quả tìm kiếm. Dữ liệu không hợp lệ.');
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm:', err);
      if (err.response) {
        console.error('Chi tiết lỗi:', err.response.status, err.response.data);
      }
      setError(`Đã xảy ra lỗi khi tìm kiếm: ${err.message || 'Vui lòng thử lại sau.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setHasSearched(true);
    
    // Reset về trang 1 khi tìm kiếm mới
    setCurrentPage(1);
    fetchSearchResults(searchQuery, 1);
  };

  // Xử lý thay đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Thêm hàm xử lý chuyển trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Tính toán tổng số kết quả
  const totalResults = results.documents.length + results.templates.length;
  
  // Lọc kết quả dựa theo tab và bộ lọc
  const filteredResults = {
    documents: results.documents.filter(doc => {
      if (activeTab !== 'all' && activeTab !== 'documents') return false;
      if (filters.documentType && doc.document_type !== filters.documentType) return false;
      
      // Lọc theo ngày
      if (filters.dateFrom || filters.dateTo) {
        const docDate = new Date(doc.issued_date);
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (docDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59); // Đặt thời gian là cuối ngày
          if (docDate > toDate) return false;
        }
      }
      
      return true;
    }),
    templates: results.templates.filter(template => {
      if (activeTab !== 'all' && activeTab !== 'templates') return false;
      if (filters.language && template.language !== filters.language) return false;
      return true;
    })
  };

  // Xử lý điều hướng đến trang "Xem tất cả văn bản"
  const handleViewAllDocuments = () => {
    navigate('/documents');
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  // Sửa lại cách điều hướng khi click vào văn bản
  const handleDocumentClick = (document) => {
    // Đảm bảo ID có định dạng đúng cho URL
    let documentId = document.id;
    if (typeof documentId === 'string' && documentId.startsWith('/')) {
      documentId = documentId.substring(1);
    }

    if (document.document_type) {
      // Đây là văn bản pháp luật
      navigate(`/documents/${documentId}`);
    } else if (document.template_type) {
      // Đây là mẫu văn bản
      navigate(`/templates/${documentId}`);
    } else {
      // Fallback - Nếu không xác định được loại, dùng URL từ document nếu có
      if (document.url) {
        navigate(document.url);
      } else {
        // Nếu không có URL, cố gắng dùng ID
        navigate(`/documents/${documentId}`);
      }
    }
  };
  
  // Định dạng ngày
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  // Thêm phần hiển thị phân trang
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className={styles.pagination}>
        <button 
          className={styles['pagination-button']} 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FontAwesomeIcon icon={faChevronLeft} /> {t('Trang trước')}
        </button>
        
        {startPage > 1 && (
          <>
            <button 
              className={`${styles['pagination-button']} ${1 === currentPage ? styles.active : ''}`} 
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            {startPage > 2 && <span className={styles['pagination-ellipsis']}>...</span>}
          </>
        )}
        
        {pageNumbers.map(number => (
          <button
            key={number}
            className={`${styles['pagination-button']} ${number === currentPage ? styles.active : ''}`}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className={styles['pagination-ellipsis']}>...</span>}
            <button 
              className={`${styles['pagination-button']} ${totalPages === currentPage ? styles.active : ''}`}
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}
        
        <button 
          className={styles['pagination-button']} 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          {t('Trang sau')} <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className={styles.mainContainer}>
        <div className={styles['search-results-container']}>
          <div className={styles['search-header']}>
            <h1 className={styles['search-title']}>Kết quả tìm kiếm</h1>
            
            <div className={styles['search-form']}>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  className={styles['search-input']}
                  placeholder="Nhập từ khóa tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className={styles['search-button']}>
                  <FontAwesomeIcon icon={faSearch} />
                  Tìm kiếm
                </button>
              </form>
              {hasSearched && !loading && !error && (
                <div className={styles['search-count']}>
                  {searchQuery ? 
                    `Tìm thấy ${totalResults} kết quả cho "${searchQuery}"` 
                    : `Hiển thị tất cả ${totalResults} kết quả`}
                </div>
              )}
            </div>
          </div>

          {hasSearched && (
            <div className={styles['search-tabs']}>
              <button 
                className={`${styles['tab-btn']} ${activeTab === 'all' ? styles.active : ''}`}
                onClick={() => handleTabChange('all')}
              >
                <FontAwesomeIcon icon={faSearch} className={styles['tab-icon']} />
                Tất cả
              </button>
              <button 
                className={`${styles['tab-btn']} ${activeTab === 'documents' ? styles.active : ''}`}
                onClick={() => handleTabChange('documents')}
              >
                <FontAwesomeIcon icon={faFile} className={styles['tab-icon']} />
                Văn bản pháp luật
              </button>
              <button 
                className={`${styles['tab-btn']} ${activeTab === 'templates' ? styles.active : ''}`}
                onClick={() => handleTabChange('templates')}
              >
                <FontAwesomeIcon icon={faFileAlt} className={styles['tab-icon']} />
                Mẫu văn bản
              </button>
              
              <button 
                className={styles['view-all-btn']}
                onClick={handleViewAllDocuments}
              >
                <FontAwesomeIcon icon={faBook} className={styles['tab-icon']} />
                Xem tất cả văn bản
              </button>
            </div>
          )}

          {hasSearched && !loading && !error && totalResults > 0 && (
            <div className={styles.filters}>
              {(activeTab === 'all' || activeTab === 'documents') && (
                <>
                  <div className={styles['filter-group']}>
                    <label htmlFor="documentType">Loại văn bản</label>
                    <select 
                      id="documentType" 
                      name="documentType" 
                      value={filters.documentType}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tất cả loại</option>
                      <option value="Nghị định">Nghị định</option>
                      <option value="Nghị quyết">Nghị quyết</option>
                      <option value="Văn bản hợp nhất">Văn bản hợp nhất</option>
                    </select>
                  </div>
                  
                  <div className={styles['filter-group']}>
                    <label htmlFor="dateFrom">Từ ngày</label>
                    <input 
                      type="date" 
                      id="dateFrom" 
                      name="dateFrom"
                      value={filters.dateFrom}
                      onChange={handleFilterChange}
                    />
                  </div>
                  
                  <div className={styles['filter-group']}>
                    <label htmlFor="dateTo">Đến ngày</label>
                    <input 
                      type="date" 
                      id="dateTo" 
                      name="dateTo"
                      value={filters.dateTo}
                      onChange={handleFilterChange}
                    />
                  </div>
                </>
              )}
              
              {(activeTab === 'all' || activeTab === 'templates') && (
                <div className={styles['filter-group']}>
                  <label htmlFor="language">Ngôn ngữ</label>
                  <select 
                    id="language" 
                    name="language"
                    value={filters.language}
                    onChange={handleFilterChange}
                  >
                    <option value="">Tất cả ngôn ngữ</option>
                    <option value="Tiếng Việt">Tiếng Việt</option>
                    <option value="English">Tiếng Anh</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className={styles.loading}>
              <FontAwesomeIcon icon={faSpinner} spin />
              Đang tải kết quả...
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
              {error}
            </div>
          )}

          {hasSearched && !loading && !error && totalResults === 0 && (
            <div className={styles['no-results']}>
              <h3>Không tìm thấy kết quả phù hợp</h3>
              <p>Vui lòng thử lại với từ khóa khác hoặc xem các đề xuất dưới đây</p>
              
              <div className={styles['suggestion-buttons']}>
                <button onClick={() => navigate('/documents')}>
                  <FontAwesomeIcon icon={faBook} />
                  Danh sách văn bản pháp luật
                </button>
                <button onClick={() => navigate('/templates')}>
                  <FontAwesomeIcon icon={faFileContract} />
                  Danh sách mẫu văn bản
                </button>
              </div>
            </div>
          )}

          {hasSearched && !loading && !error && totalResults > 0 && (
            <div className={styles['search-results']}>
              {(activeTab === 'all' || activeTab === 'documents') && filteredResults.documents.length > 0 && (
                <div className={styles['documents-section']}>
                  <h2 className={styles['section-title']}>
                    <FontAwesomeIcon icon={faFile} /> Văn bản pháp luật
                  </h2>
                  <div className={styles['documents-list']}>
                    {filteredResults.documents.map((document) => (
                      <div 
                        key={document.id} 
                        className={styles["document-item"]}
                        onClick={() => handleDocumentClick(document)}
                      >
                        <h3 className={styles['document-title']}>
                          {document.title}
                        </h3>
                        <div className={styles['document-meta']}>
                          <span className={styles['document-type']}>{document.document_type}</span>
                          <span className={styles['document-date']}>
                            <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(document.issued_date)}
                          </span>
                        </div>
                        <p className={styles['document-summary']}>{document.summary || 'Không có tóm tắt'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(activeTab === 'all' || activeTab === 'templates') && filteredResults.templates.length > 0 && (
                <div className={styles['templates-section']}>
                  <h2 className={styles['section-title']}>
                    <FontAwesomeIcon icon={faFileAlt} /> Mẫu văn bản
                  </h2>
                  <div className={styles['templates-list']}>
                    {filteredResults.templates.map(template => (
                      <div 
                        key={template.id} 
                        className={styles['template-item']}
                        onClick={() => handleDocumentClick(template)}
                      >
                        <h3 className={styles['template-title']}>
                          {template.title}
                        </h3>
                        <div className={styles['template-meta']}>
                          <span className={styles['template-type']}>{template.template_type}</span>
                          <span className={styles['template-language']}>
                            <FontAwesomeIcon icon={faLanguage} /> {template.language || 'Tiếng Việt'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {renderPagination()}
            </div>
          )}

          {!hasSearched && (
            <div className={styles['initial-search-message']}>
              <FontAwesomeIcon icon={faSearch} size="3x" />
              <h3>Nhập từ khóa và ấn nút tìm kiếm để bắt đầu</h3>
              <p>Hoặc bạn có thể để trống để xem tất cả tài liệu có sẵn</p>
            </div>
          )}
        </div>
      </div>

      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={toggleSideMenu}
        currentUser={null}
        onLogout={() => {}}
      />
    </>
  );
};

export default SearchResults; 