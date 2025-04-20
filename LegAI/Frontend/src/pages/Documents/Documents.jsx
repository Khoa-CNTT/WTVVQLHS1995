import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faCalendarAlt, faFilter, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import legalService from '../../services/legalService';
import styles from './Documents.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypes, setDocumentTypes] = useState([]);
  const [issuingBodies, setIssuingBodies] = useState([]);
  const [legalFields, setLegalFields] = useState([]);
  const [effectStatus, setEffectStatus] = useState([]);
  const [advancedFilterVisible, setAdvancedFilterVisible] = useState(false);
  
  // Bộ lọc
  const [filters, setFilters] = useState({
    type: '',
    fromDate: '',
    toDate: '',
    issuingBody: '',
    field: '',
    status: ''
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchDocuments();
    fetchFilterOptions();
  }, [currentPage]);
  
  const fetchFilterOptions = async () => {
    try {
      // Lấy các tùy chọn lọc từ API
      const [typesRes, bodiesRes, fieldsRes, statusRes] = await Promise.all([
        legalService.getDocumentTypes(),
        legalService.getIssuingBodies(),
        legalService.getLegalFields(),
        legalService.getEffectStatus()
      ]);
      
      setDocumentTypes(typesRes.data || []);
      setIssuingBodies(bodiesRes.data || []);
      setLegalFields(fieldsRes.data || []);
      setEffectStatus(statusRes.data || []);
    } catch (error) {
      console.error('Lỗi khi lấy tùy chọn lọc:', error);
    }
  };

  const fetchDocuments = async (page = 1) => {
    try {
      setLoading(true);
      
      // Đảm bảo tham số đúng định dạng
      const queryParams = {
        q: searchTerm,
        page: page,
        limit: 10
      };
      
      // Thêm các bộ lọc nếu có giá trị
      if (filters.type) queryParams.type = filters.type;
      if (filters.fromDate) queryParams.fromDate = filters.fromDate;
      if (filters.toDate) queryParams.toDate = filters.toDate;
      if (filters.issuingBody) queryParams.issuingBody = filters.issuingBody;
      if (filters.field) queryParams.field = filters.field;
      if (filters.status) queryParams.status = filters.status;
      
      console.log('Đang gửi request tìm kiếm với các tham số:', queryParams);
      
      const response = await legalService.searchLegalDocuments(queryParams);
      
      console.log('Nhận được response:', response);
      
      if (response && response.status === 'success') {
        setDocuments(response.data || []);
        
        // Kiểm tra và cập nhật thông tin phân trang
        if (response.pagination) {
          console.log('Thông tin phân trang:', response.pagination);
          setTotalPages(response.pagination.totalPages || 1);
          setCurrentPage(response.pagination.currentPage || 1);
        } else {
          console.warn('Không có thông tin phân trang trong response');
          setTotalPages(1);
          setCurrentPage(1);
        }
        
        setError(null);
      } else {
        console.error('Response không có định dạng mong đợi:', response);
        setError('Không thể tải danh sách văn bản pháp luật. Dữ liệu trả về không hợp lệ.');
      }
    } catch (err) {
      console.error('Lỗi khi tải văn bản pháp luật:', err);
      setError('Không thể tải danh sách văn bản pháp luật. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleDocumentClick = (documentId) => {
    // Đảm bảo ID có định dạng đúng cho URL
    let formattedId = documentId;
    
    if (typeof formattedId === 'string') {
      // Loại bỏ dấu / ở đầu nếu có, vì đường dẫn URL không cần dấu /
      if (formattedId.startsWith('/')) {
        formattedId = formattedId.substring(1);
      }
      
      console.log(`Chuyển hướng đến trang chi tiết văn bản: /documents/${formattedId}`);
    } else {
      console.log(`Chuyển hướng đến trang chi tiết văn bản với ID không phải chuỗi: ${formattedId}`);
    }
    
    navigate(`/documents/${formattedId}`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDocuments(1);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const toggleAdvancedFilter = () => {
    setAdvancedFilterVisible(!advancedFilterVisible);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchDocuments(1);
    console.log('Áp dụng bộ lọc mới:', filters);
  };
  
  const handleClearFilters = () => {
    setFilters({
      type: '',
      fromDate: '',
      toDate: '',
      issuingBody: '',
      field: '',
      status: ''
    });
    setCurrentPage(1);
    fetchDocuments(1);
  };

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
      <div className={styles['pagination']}>
        <button 
          className={styles['pagination-button']} 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &laquo; Trang trước
        </button>
        
        {startPage > 1 && (
          <>
            <button className={styles['pagination-button']} onClick={() => handlePageChange(1)}>1</button>
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
            <button className={styles['pagination-button']} onClick={() => handlePageChange(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
        
        <button 
          className={styles['pagination-button']} 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Trang sau &raquo;
        </button>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className={styles['documents-container']}>
      <Navbar />
      
      <div className={styles['documents-content']}>
        <div className={styles['documents-header']}>
          <h1>Văn bản pháp luật</h1>
          <p>Tra cứu cơ sở dữ liệu văn bản pháp luật và văn bản liên quan</p>
        </div>
        
        <div className={styles['search-section']}>
          <div className={styles['search-form']}>
            <form onSubmit={handleSearchSubmit}>
              <div className={styles['search-input-wrapper']}>
                <input
                  type="text"
                  className={styles['search-input']}
                  placeholder="Tìm kiếm văn bản pháp luật..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <button type="submit" className={styles['search-button']}>
                  <FontAwesomeIcon icon={faSearch} /> Tìm kiếm
                </button>
              </div>
            </form>
          </div>
          
          <div className={styles['filters-section']}>
            <div className={styles['filter-header']}>
              <h3>Bộ lọc</h3>
              <button 
                className={styles['filter-toggle']}
                onClick={toggleAdvancedFilter}
              >
                <FontAwesomeIcon icon={advancedFilterVisible ? faChevronUp : faChevronDown} />
                {advancedFilterVisible ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'}
              </button>
            </div>
            
            <div className={styles['filter-controls']}>
              <div className={styles['filter-group']}>
                <label htmlFor="type">Loại văn bản:</label>
                <select
                  id="type"
                  name="type"
                  className={styles['filter-select']}
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  <option value="">Tất cả</option>
                  {documentTypes.map(type => (
                    <option key={type.id || type} value={type.id || type}>{type.name || type}</option>
                  ))}
                </select>
              </div>
              
              {advancedFilterVisible && (
                <>
                  <div className={styles['filter-group']}>
                    <label htmlFor="fromDate">Từ ngày:</label>
                    <div className={styles['date-input-wrapper']}>
                      <FontAwesomeIcon icon={faCalendarAlt} className={styles['date-icon']} />
                      <input
                        type="date"
                        id="fromDate"
                        name="fromDate"
                        className={styles['filter-input']}
                        value={filters.fromDate}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  
                  <div className={styles['filter-group']}>
                    <label htmlFor="toDate">Đến ngày:</label>
                    <div className={styles['date-input-wrapper']}>
                      <FontAwesomeIcon icon={faCalendarAlt} className={styles['date-icon']} />
                      <input
                        type="date"
                        id="toDate"
                        name="toDate"
                        className={styles['filter-input']}
                        value={filters.toDate}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                  
                  <div className={styles['filter-group']}>
                    <label htmlFor="issuingBody">Cơ quan ban hành:</label>
                    <select
                      id="issuingBody"
                      name="issuingBody"
                      className={styles['filter-select']}
                      value={filters.issuingBody}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tất cả</option>
                      {issuingBodies.map(body => (
                        <option key={body.id} value={body.id}>{body.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles['filter-group']}>
                    <label htmlFor="field">Lĩnh vực:</label>
                    <select
                      id="field"
                      name="field"
                      className={styles['filter-select']}
                      value={filters.field}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tất cả</option>
                      {legalFields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles['filter-group']}>
                    <label htmlFor="status">Hiệu lực:</label>
                    <select
                      id="status"
                      name="status"
                      className={styles['filter-select']}
                      value={filters.status}
                      onChange={handleFilterChange}
                    >
                      <option value="">Tất cả</option>
                      {effectStatus.map(status => (
                        <option key={status.id} value={status.id}>{status.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className={styles['filter-actions']}>
                <button className={styles['filter-button']} onClick={handleApplyFilters}>
                  <FontAwesomeIcon icon={faFilter} /> Lọc kết quả
                </button>
                {(filters.type || filters.fromDate || filters.toDate || filters.issuingBody || filters.field || filters.status) && (
                  <button className={styles['filter-clear']} onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles['documents-list']}>
          {loading ? (
            <div className={styles.loading}>Đang tải văn bản pháp luật...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : documents.length === 0 ? (
            <div className={styles['no-documents']}>
              Không tìm thấy văn bản pháp luật nào phù hợp với tiêu chí tìm kiếm.
            </div>
          ) : (
            documents.map(doc => (
              <div 
                key={doc.id} 
                className={styles['document-item']}
                onClick={() => handleDocumentClick(doc.id)}
              >
                <div className={styles['document-type-badge']}>
                  {doc.document_type || 'Văn bản'}
                </div>
                <h3 className={styles['document-title']}>{doc.title}</h3>
                <div className={styles['document-meta']}>
                  <span className={styles['document-number']}>{doc.document_number || 'Không có số hiệu'}</span>
                  <span className={styles['document-date']}>
                    {doc.issued_date ? `Ban hành: ${formatDate(doc.issued_date)}` : ''}
                  </span>
                  <span className={styles['document-issuer']}>{doc.issuer || 'Chưa rõ cơ quan ban hành'}</span>
                  <span className={styles['document-status']}>{doc.status || ''}</span>
                </div>
                <p className={styles['document-summary']}>
                  {doc.summary || 'Không có tóm tắt cho văn bản này.'}
                </p>
                {doc.keywords && doc.keywords.length > 0 && (
                  <div className={styles['keywords-container']}>
                    {doc.keywords.map((keyword, index) => (
                      <span key={index} className={styles['keyword-tag']}>{keyword}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {renderPagination()}
      </div>
    </div>
  );
};

export default Documents; 