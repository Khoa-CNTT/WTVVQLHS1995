import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './SearchResults.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import SideMenu from '../../components/layout/Nav/SideMenu';
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

// Dữ liệu mẫu dựa trên cấu trúc bảng từ database.sql
const mockLegalDocuments = [
  {
    id: 1,
    title: 'Luật hình sự số 100/2015/QH13',
    document_type: 'Luật',
    version: '2015',
    summary: 'Luật hình sự quy định về tội phạm và hình phạt, được Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam thông qua năm 2015 và có hiệu lực từ ngày 01/01/2018.',
    issued_date: '2015-11-27',
    language: 'Tiếng Việt',
    keywords: ['Luật hình sự', 'Tội phạm', 'Hình phạt']
  },
  {
    id: 2,
    title: 'Luật dân sự số 91/2015/QH13',
    document_type: 'Luật',
    version: '2015',
    summary: 'Bộ luật dân sự quy định địa vị pháp lý, chuẩn mực pháp lý cho cách ứng xử của cá nhân, pháp nhân, chủ thể khác; quyền và nghĩa vụ của các chủ thể về nhân thân và tài sản.',
    issued_date: '2015-11-24',
    language: 'Tiếng Việt',
    keywords: ['Luật dân sự', 'Quyền và nghĩa vụ', 'Tài sản']
  },
  {
    id: 3,
    title: 'Nghị định 102/2020/NĐ-CP',
    document_type: 'Nghị định',
    version: '2020',
    summary: 'Quy định về chế độ hưu trí đối với quân nhân trực tiếp tham gia kháng chiến chống Mỹ cứu nước từ ngày 30/4/1975 trở về trước.',
    issued_date: '2020-09-01',
    language: 'Tiếng Việt',
    keywords: ['Chế độ hưu trí', 'Quân nhân', 'Kháng chiến']
  }
];

// Dữ liệu mẫu mẫu văn bản
const mockDocumentTemplates = [
  {
    id: 1,
    title: 'Mẫu hợp đồng mua bán hàng hóa',
    template_type: 'Hợp đồng',
    language: 'Tiếng Việt',
    created_at: '2022-06-10'
  },
  {
    id: 2,
    title: 'Đơn xin cấp phép xây dựng',
    template_type: 'Đơn',
    language: 'Tiếng Việt',
    created_at: '2022-08-15'
  },
  {
    id: 3,
    title: 'Mẫu hợp đồng lao động',
    template_type: 'Hợp đồng',
    language: 'Tiếng Việt',
    created_at: '2022-07-05'
  }
];

const SearchResults = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState({ documents: [], templates: [] });
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    documentType: '',
    dateFrom: '',
    dateTo: '',
    language: ''
  });
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // Lấy query từ URL khi component được tải
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    
    if (query) {
      fetchSearchResults(query);
    } else {
      setLoading(false);
    }
  }, [location.search]);

  // Tìm kiếm trong dữ liệu mẫu
  const fetchSearchResults = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      // Giả lập độ trễ tìm kiếm
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Tìm kiếm trong danh sách văn bản pháp luật
      const matchedDocuments = mockLegalDocuments.filter(doc => {
        const searchQuery = query.toLowerCase();
        return (
          doc.title.toLowerCase().includes(searchQuery) ||
          doc.summary.toLowerCase().includes(searchQuery) ||
          doc.document_type.toLowerCase().includes(searchQuery) ||
          (doc.keywords && doc.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery)))
        );
      });
      
      // Tìm kiếm trong danh sách mẫu văn bản
      const matchedTemplates = mockDocumentTemplates.filter(template => {
        const searchQuery = query.toLowerCase();
        return (
          template.title.toLowerCase().includes(searchQuery) ||
          template.template_type.toLowerCase().includes(searchQuery)
        );
      });
      
      // Lọc kết quả theo bộ lọc đã chọn
      const filteredDocuments = matchedDocuments.filter(doc => {
        if (filters.documentType && doc.document_type !== filters.documentType) return false;
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          const docDate = new Date(doc.issued_date);
          if (docDate < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999);
          const docDate = new Date(doc.issued_date);
          if (docDate > toDate) return false;
        }
        
        return true;
      });
      
      const filteredTemplates = matchedTemplates.filter(template => {
        if (filters.language && template.language !== filters.language) return false;
        return true;
      });
      
      // Phân trang
      const itemsPerPage = 5;
      const startIndex = (currentPage - 1) * itemsPerPage;
      
      // Dữ liệu phân trang tùy thuộc vào tab đang chọn
      let paginatedDocuments = [];
      let paginatedTemplates = [];
      
      if (activeTab === 'all' || activeTab === 'documents') {
        paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
      }
      
      if (activeTab === 'all' || activeTab === 'templates') {
        paginatedTemplates = filteredTemplates.slice(startIndex, startIndex + itemsPerPage);
      }
      
      setResults({
        documents: paginatedDocuments,
        templates: paginatedTemplates,
        totalDocuments: filteredDocuments.length,
        totalTemplates: filteredTemplates.length
      });
      
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra nếu người dùng không nhập gì thì không thực hiện tìm kiếm
    if (!searchQuery.trim()) {
      return;
    }
    
    setCurrentPage(1);
    fetchSearchResults(searchQuery);
  };

  // Xử lý thay đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    // Gọi lại hàm tìm kiếm khi thay đổi tab để cập nhật kết quả
    fetchSearchResults(searchQuery);
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset về trang 1 và gọi lại API khi thay đổi bộ lọc
    setCurrentPage(1);
    
    // Sử dụng setTimeout để tránh gọi API quá nhiều khi người dùng thay đổi nhiều bộ lọc liên tiếp
    setTimeout(() => {
      fetchSearchResults(searchQuery);
    }, 300);
  };

  // Xử lý chuyển trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchSearchResults(searchQuery);
  };

  // Tính toán tổng số kết quả
  const totalResults = (results.totalDocuments || 0) + (results.totalTemplates || 0);
  const totalPages = Math.ceil(totalResults / 5);
  
  // Xử lý điều hướng đến trang "Xem tất cả văn bản"
  const handleViewAllDocuments = () => {
    navigate('/documents');
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  // Sửa lại cách điều hướng khi click vào văn bản
  const handleDocumentClick = (document) => {
    // Kiểm tra loại văn bản để điều hướng đúng
    if (document.document_type) {
      // Đây là văn bản pháp luật
      navigate(`/legal/documents/${document.id}`);
    } else {
      // Đây là mẫu văn bản
      navigate(`/legal/templates/${document.id}`);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
              {searchQuery && !loading && !error && (
                <div className={styles['search-count']}>
                  {totalResults > 0 
                    ? `Tìm thấy ${totalResults} kết quả cho "${searchQuery}"`
                    : `Không tìm thấy kết quả cho "${searchQuery}"`}
                </div>
              )}
            </div>
          </div>

          {searchQuery && (
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

          {searchQuery && !loading && !error && totalResults > 0 && (
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
                      <option value="Luật">Luật</option>
                      <option value="Nghị định">Nghị định</option>
                      <option value="Nghị quyết">Nghị quyết</option>
                      <option value="Thông tư">Thông tư</option>
                      <option value="Quyết định">Quyết định</option>
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

          {!loading && !error && searchQuery && totalResults === 0 && (
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

          {!loading && !error && searchQuery && totalResults > 0 && (
            <div className={styles['search-results']}>
              {(activeTab === 'all' || activeTab === 'documents') && results.documents && results.documents.length > 0 && (
                <div className={styles['documents-section']}>
                  <h2 className={styles['section-title']}>
                    <FontAwesomeIcon icon={faFile} /> Văn bản pháp luật
                  </h2>
                  <div className={styles['documents-list']}>
                    {results.documents.map((document) => (
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
                        <p className={styles['document-summary']}>{document.summary.substring(0, 200)}...</p>
                        {document.keywords && (
                          <div className={styles['keywords-container']}>
                            {document.keywords.map((keyword, idx) => (
                              <span key={idx} className={styles['keyword-tag']}>{keyword}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(activeTab === 'all' || activeTab === 'templates') && results.templates && results.templates.length > 0 && (
                <div className={styles['templates-section']}>
                  <h2 className={styles['section-title']}>
                    <FontAwesomeIcon icon={faFileAlt} /> Mẫu văn bản
                  </h2>
                  <div className={styles['templates-list']}>
                    {results.templates.map(template => (
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
                            <FontAwesomeIcon icon={faLanguage} /> {template.language}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button 
                    className={styles['page-btn']} 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  >
                    <FontAwesomeIcon icon={faChevronLeft} />
                    Trước
                  </button>
                  
                  <div className={styles['page-numbers']}>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        className={`${styles['page-number']} ${currentPage === index + 1 ? styles.active : ''}`}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  
                  <button 
                    className={styles['page-btn']}
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  >
                    Tiếp
                    <FontAwesomeIcon icon={faChevronRight} />
                  </button>
                </div>
              )}
            </div>
          )}
          
          {!searchQuery && !loading && (
            <div className={styles['initial-search-message']}>
              <FontAwesomeIcon icon={faSearch} size="3x" />
              <h3>Tìm kiếm văn bản pháp luật</h3>
              <p>Nhập từ khóa vào ô tìm kiếm phía trên để tìm kiếm văn bản pháp luật và mẫu đơn</p>
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