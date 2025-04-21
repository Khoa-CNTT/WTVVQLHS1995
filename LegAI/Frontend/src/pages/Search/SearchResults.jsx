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
import legalService from '../../services/legalService';

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
  const [loading, setLoading] = useState(false);
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Lấy query từ URL khi component được tải
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get('q') || '';
    setSearchQuery(query);
    
    // Đặt isInitialLoad là true để biết đây là lần tải đầu tiên
    setIsInitialLoad(true);
    
    if (query) {
      fetchSearchResults(query);
    } else {
      // Nếu không có từ khóa tìm kiếm, tải tất cả văn bản và mẫu
      fetchAllDocumentsAndTemplates();
    }
  }, [location.search]);

  // Tìm kiếm trong dữ liệu
  const fetchSearchResults = async (query) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = {
        search: query,
        page: currentPage,
        limit: 10,
        document_type: filters.documentType || undefined,
        from_date: filters.dateFrom || undefined,
        to_date: filters.dateTo || undefined,
        language: filters.language || undefined
      };
      
      // Gọi API searchAll từ legalService
      const response = await legalService.searchAll(searchParams);
      console.log('API search response:', response);
      
      if (response && response.status === 'success') {
        // Phân loại kết quả tìm kiếm thành documents và templates
        const allResults = response.data || [];
        console.log('Kết quả API nhận được:', allResults);
        
        // Phân loại kết quả dựa trên thuộc tính của đối tượng
        const documents = [];
        const templates = [];
        
        allResults.forEach(item => {
          // Xác định loại dựa trên thuộc tính của item
          let isTemplate = false;
          if (item.result_type === 'template') {
            isTemplate = true;
          } else if (item.result_type === 'document') {
            isTemplate = false;
          } else if (item.template_type) {
            isTemplate = true;
          } else if (item.document_type || item.issued_date || item.document_number) {
            isTemplate = false;
          } else if (item.created_at && !item.issued_date) {
            isTemplate = true;
          } else {
            // Mặc định là văn bản pháp luật nếu không xác định được
            isTemplate = false;
          }
          
          // Xây dựng đối tượng mới với đầy đủ thông tin
          const processedItem = {
            ...item,
            // Thêm trường result_type để dễ dàng phân loại sau này
            result_type: isTemplate ? 'template' : 'document',
            
            // Đảm bảo các trường chung có giá trị mặc định
            id: item.id || Math.random().toString(36).substring(2),
            title: item.title || 'Không có tiêu đề',
          };
          
          // Bổ sung thông tin tùy theo loại
          if (isTemplate) {
            // Nếu là mẫu văn bản
            processedItem.template_type = item.template_type || 'Mẫu văn bản';
            processedItem.created_at = item.created_at || new Date().toISOString();
            processedItem.language = item.language || 'Tiếng Việt';
            templates.push(processedItem);
          } else {
            // Nếu là văn bản pháp luật
            processedItem.document_type = item.document_type || 'Văn bản pháp luật';
            processedItem.document_number = item.document_number || '';
            processedItem.issued_date = item.issued_date || item.created_at || new Date().toISOString();
            documents.push(processedItem);
          }
        });
        
        console.log('Documents sau khi lọc:', documents);
        console.log('Templates sau khi lọc:', templates);
        
        setResults({
          documents: documents,
          templates: templates,
          totalDocuments: documents.length,
          totalTemplates: templates.length
        });
        
        // Cập nhật tổng số trang từ thông tin phân trang từ API
        const calculatedTotalPages = response.pagination?.totalPages || Math.ceil((documents.length + templates.length) / 10) || 1;
        setCurrentPage(response.pagination?.currentPage || currentPage);
      } else {
        setError('Không thể tải kết quả tìm kiếm');
      }
    } catch (err) {
      console.error('Lỗi tìm kiếm:', err);
      setError('Đã xảy ra lỗi khi tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Tải tất cả văn bản và mẫu khi không có từ khóa tìm kiếm
  const fetchAllDocumentsAndTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Tải danh sách văn bản pháp luật
      const documentsResponse = await legalService.getLegalDocuments({
        page: currentPage,
        limit: 5
      });
      
      // Tải danh sách mẫu văn bản
      const templatesResponse = await legalService.getDocumentTemplates({
        page: currentPage,
        limit: 5
      });
      
      if (documentsResponse.status === 'success' && templatesResponse.status === 'success') {
        setResults({
          documents: documentsResponse.data || [],
          templates: templatesResponse.data || [],
          totalDocuments: documentsResponse.pagination?.total || 0,
          totalTemplates: templatesResponse.pagination?.total || 0
        });
      } else {
        setError('Không thể tải danh sách văn bản và mẫu');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu:', err);
      setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  // Submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Nếu người dùng không nhập gì, tải tất cả văn bản và mẫu
    if (!searchQuery.trim()) {
      fetchAllDocumentsAndTemplates();
      return;
    }
    
    setCurrentPage(1);
    fetchSearchResults(searchQuery);
  };

  // Xử lý thay đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Không gọi lại API khi chuyển tab, chỉ thay đổi trạng thái active tab
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

  // Tính toán tổng số kết quả dựa trên tab đang chọn
  let displayedDocuments = [];
  let displayedTemplates = [];
  
  if (activeTab === 'all') {
    displayedDocuments = results.documents || [];
    displayedTemplates = results.templates || [];
  } else if (activeTab === 'documents') {
    displayedDocuments = results.documents || [];
    displayedTemplates = [];
  } else if (activeTab === 'templates') {
    displayedDocuments = [];
    displayedTemplates = results.templates || [];
  }
  
  const totalDisplayedResults = displayedDocuments.length + displayedTemplates.length;
  const totalResults = (results.totalDocuments || 0) + (results.totalTemplates || 0);

  // Tính toán số trang dựa trên kết quả đang hiển thị
  const totalPages = Math.ceil(totalDisplayedResults / 10);

  // Xử lý điều hướng đến trang "Xem tất cả văn bản"
  const handleViewAllDocuments = () => {
    navigate('/legal/documents');
  };

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  // Sửa lại cách điều hướng khi click vào văn bản
  const handleDocumentClick = (document) => {
    console.log('Clicked document:', document);
    
    // Xác định loại dựa trên cả result_type và các đặc điểm khác
    let isTemplate = false;
    
    // Ưu tiên kiểm tra result_type trước
    if (document.result_type === 'template') {
      isTemplate = true;
    } else if (document.result_type === 'document') {
      isTemplate = false;
    } else if (document.template_type) {
      // Nếu có template_type thì đây là mẫu văn bản
      isTemplate = true;
    } else if (document.document_type || document.issued_date || document.document_number) {
      // Nếu có document_type hoặc issued_date thì đây là văn bản pháp luật
      isTemplate = false;
    } else if (document.created_at && !document.issued_date) {
      // Nếu chỉ có created_at mà không có issued_date thì có thể là mẫu
      isTemplate = true;
    }
    
    // Log để debug
    console.log('Đã xác định là:', isTemplate ? 'Mẫu văn bản' : 'Văn bản pháp luật');
    
    // Điều hướng đến trang phù hợp
    if (isTemplate) {
      navigate(`/legal/templates/${document.id}`);
    } else {
      navigate(`/legal/documents/${document.id}`);
    }
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    // Log giá trị ngày thực tế để debug
    console.log('formatDate input:', dateString, typeof dateString);
    
    if (!dateString) {
      console.log('Ngày trống');
      return 'N/A';
    }
    
    try {
      // Kiểm tra và chuẩn hóa định dạng ngày nếu cần
      let formattedDate = dateString;
      
      // Nếu là timestamp số, chuyển thành chuỗi ISO
      if (typeof dateString === 'number') {
        formattedDate = new Date(dateString).toISOString();
      }
      
      // Xử lý trường hợp format đặc biệt nếu có
      if (typeof dateString === 'string' && !dateString.includes('-') && !dateString.includes('/')) {
        // Có thể là timestamp dạng string
        formattedDate = new Date(parseInt(dateString)).toISOString();
      }
      
      // Tạo đối tượng Date
      const date = new Date(formattedDate);
      
      // Kiểm tra nếu ngày không hợp lệ
      if (isNaN(date.getTime())) {
        console.log('Ngày không hợp lệ:', dateString);
        return 'N/A';
      }
      
      // Format ngày theo locale Việt Nam
      const result = date.toLocaleDateString('vi-VN');
      console.log('formatDate result:', result);
      return result;
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error, dateString);
      return 'N/A';
    }
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
              {!loading && !error && !isInitialLoad && (
                <div className={styles['search-count']}>
                  {searchQuery.trim() ? 
                    (totalResults > 0 
                      ? `Tìm thấy ${totalResults} kết quả cho "${searchQuery}" ${activeTab !== 'all' ? `(Đang hiển thị ${totalDisplayedResults} kết quả ${activeTab === 'documents' ? 'văn bản' : 'mẫu'})` : ''}` 
                      : `Không tìm thấy kết quả cho "${searchQuery}"`) 
                    : `Hiển thị ${totalDisplayedResults} ${activeTab === 'all' ? 'văn bản và mẫu' : (activeTab === 'documents' ? 'văn bản' : 'mẫu')}`
                  }
                </div>
              )}
            </div>
          </div>

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
              Văn bản pháp lý
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

          {!loading && !error && totalDisplayedResults === 0 && !isInitialLoad && (
            <div className={styles['no-results']}>
              <h3>
                {activeTab === 'all' 
                  ? 'Không tìm thấy kết quả phù hợp' 
                  : `Không tìm thấy ${activeTab === 'documents' ? 'văn bản' : 'mẫu'} phù hợp`}
              </h3>
              <p>
                {activeTab === 'all' 
                  ? 'Vui lòng thử lại với từ khóa khác hoặc xem các đề xuất dưới đây' 
                  : `Không tìm thấy ${activeTab === 'documents' ? 'văn bản' : 'mẫu'} phù hợp với từ khóa "${searchQuery}". Vui lòng thử từ khóa khác hoặc chọn tab khác.`}
              </p>
              
              <div className={styles['suggestion-buttons']}>
                <button onClick={() => navigate('/legal/documents')}>
                  <FontAwesomeIcon icon={faBook} />
                  Danh sách văn bản pháp lý
                </button>
                <button onClick={() => navigate('/legal/templates')}>
                  <FontAwesomeIcon icon={faFileContract} />
                  Danh sách mẫu văn bản
                </button>
              </div>
            </div>
          )}

          {!loading && !error && totalDisplayedResults > 0 && (
            <div className={styles['search-results']}>
              {(activeTab === 'all' || activeTab === 'documents') && displayedDocuments.length > 0 && (
                <div className={styles['documents-section']}>
                  <h2 className={styles['section-title']}>
                    <FontAwesomeIcon icon={faFile} /> Văn bản pháp lý
                  </h2>
                  <div className={styles['documents-list']}>
                    {displayedDocuments.map((document) => (
                      <div 
                        key={document.id} 
                        className={styles["document-item"]}
                        onClick={() => handleDocumentClick(document)}
                      >
                        <h3 className={styles['document-title']}>
                          {document.title}
                        </h3>
                        <div className={styles['document-meta']}>
                          {document.document_type && (
                            <span className={styles['document-type']}>{document.document_type}</span>
                          )}
                          {document.document_number && (
                            <span className={styles['document-number']}>
                              <FontAwesomeIcon icon={faFileContract} /> Số: {document.document_number}
                            </span>
                          )}
                          <span className={styles['document-date']}>
                            <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(document.issued_date || document.created_at)}
                          </span>
                        </div>
                        <p className={styles['document-summary']}>
                          {document.summary 
                            ? (document.summary.length > 200 
                              ? `${document.summary.substring(0, 200)}...` 
                              : document.summary)
                            : 'Không có tóm tắt'}
                        </p>
                        {document.keywords && document.keywords.length > 0 && (
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
              
              {(activeTab === 'all' || activeTab === 'templates') && displayedTemplates.length > 0 && (
                <div className={styles['templates-section']}>
                  <h2 className={styles['section-title']}>
                    <FontAwesomeIcon icon={faFileAlt} /> Mẫu văn bản
                  </h2>
                  <div className={styles['templates-list']}>
                    {displayedTemplates.map(template => (
                      <div 
                        key={template.id} 
                        className={styles['template-item']}
                        onClick={() => handleDocumentClick(template)}
                      >
                        <h3 className={styles['template-title']}>
                          {template.title}
                        </h3>
                        <div className={styles['template-meta']}>
                          {template.template_type && (
                            <span className={styles['template-type']}>{template.template_type}</span>
                          )}
                          <span className={styles['template-language']}>
                            <FontAwesomeIcon icon={faLanguage} /> {template.language || 'Tiếng Việt'}
                          </span>
                          <span className={styles['template-date']}>
                            <FontAwesomeIcon icon={faCalendarAlt} /> {formatDate(template.created_at || new Date().toISOString())}
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