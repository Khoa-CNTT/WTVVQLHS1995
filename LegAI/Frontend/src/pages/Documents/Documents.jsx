import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Documents.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';
import { BsJournalText, BsCalendar3, BsSearch } from 'react-icons/bs';
import { FaTag, FaArrowRight, FaFilter, FaSpinner } from 'react-icons/fa';
import Loader from '../../components/layout/Loading/Loading';

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
    
    // Không gọi fetchDocuments ở đây vì nó sẽ được gọi thông qua useEffect bên dưới
  }, [location.search]);

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
  };
  
  // Reset lại tất cả filter và tải lại dữ liệu
  const resetFilters = () => {
    setIsResetting(true);
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
        onClick={() => handlePageChange(page - 1)}
      >
        &laquo;
      </button>
    );
    
    // Các nút số trang
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          className={`${styles['pagination-button']} ${page === i ? styles.active : ''}`}
          onClick={() => handlePageChange(i)}
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
        onClick={() => handlePageChange(page + 1)}
      >
        &raquo;
      </button>
    );
    
    return pageButtons;
  };

  // Thêm hàm xử lý chuyển trang để đảm bảo phân trang hoạt động đúng
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  return (
    <>
      <Navbar />
      <div className={styles['documents-container']}>
        <div className={styles['documents-header']}>
          <h1>Văn bản pháp luật</h1>
          <p>Tra cứu các văn bản pháp luật mới nhất và cập nhật</p>
        </div>

        <div className={styles['filters-section']}>
          <form onSubmit={handleSubmit}>
            <div className={styles['filter-controls']}>
              <div className={styles['filter-group']}>
                <label htmlFor="search">
                  <BsSearch style={{ marginRight: '5px' }} /> Từ khóa
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
                <label htmlFor="document_type">
                  <FaFilter style={{ marginRight: '5px' }} /> Loại văn bản
                </label>
                <select
                  id="document_type"
                  name="document_type"
                  className={styles['filter-select']}
                  value={filters.document_type}
                  onChange={handleFilterChange}
                >
                  <option value="">Tất cả loại văn bản</option>
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles['filter-group']}>
                <label htmlFor="from_date">
                  <BsCalendar3 style={{ marginRight: '5px' }} /> Từ ngày
                </label>
                <input
                  type="date"
                  id="from_date"
                  name="from_date"
                  className={styles['filter-select']}
                  value={filters.from_date}
                  onChange={handleFilterChange}
                />
              </div>

              <div className={styles['filter-group']}>
                <label htmlFor="to_date">
                  <BsCalendar3 style={{ marginRight: '5px' }} /> Đến ngày
                </label>
                <input
                  type="date"
                  id="to_date"
                  name="to_date"
                  className={styles['filter-select']}
                  value={filters.to_date}
                  onChange={handleFilterChange}
                />
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
          
          {(filters.search || filters.document_type || filters.from_date || filters.to_date) && (
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
            <p>Đang tải dữ liệu văn bản...</p>
          </div>
        ) : error ? (
          <div className={styles['error']}>
            <p>{error}</p>
            <button 
              className={styles['retry-button']} 
              onClick={() => fetchDocuments()}
            >
              Thử lại
            </button>
          </div>
        ) : documents.length === 0 ? (
          <div className={styles['no-documents']}>
            <p>Không tìm thấy văn bản pháp luật nào phù hợp với điều kiện tìm kiếm.</p>
            {(filters.search || filters.document_type || filters.from_date || filters.to_date) && (
              <button onClick={resetFilters}>
                Xóa bộ lọc và hiển thị tất cả văn bản
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={styles['results-count']}>
              Tìm thấy {pagination.total} văn bản pháp luật
            </div>

            <div className={styles['documents-list']}>
              {documents.map(document => (
                <div
                  key={document.id}
                  className={styles['document-item']}
                  onClick={() => handleDocumentClick(document.id)}
                >
                  <div className={styles['document-type-badge']}>
                    {document.document_type}
                  </div>
                  <h3 className={styles['document-title']}>{document.title}</h3>
                  <div className={styles['document-meta']}>
                    <span>
                      <BsCalendar3 /> Ngày ban hành: {formatDate(document.issued_date)}
                    </span>
                  </div>
                  <p className={styles['document-summary']}>
                    {document.summary ? (
                      document.summary.length > 200 
                        ? `${document.summary.substring(0, 200)}...` 
                        : document.summary
                    ) : 'Không có tóm tắt nội dung'}
                  </p>
                  
                  <div className={styles['document-footer']}>
                    {document.keywords && document.keywords.length > 0 && (
                      <div className={styles['keywords-container']}>
                        {document.keywords.slice(0, 3).map((keyword, index) => (
                          <span key={index} className={styles['keyword-tag']}>
                            <FaTag /> {keyword}
                          </span>
                        ))}
                        {document.keywords.length > 3 && (
                          <span className={styles['keyword-tag']}>
                            +{document.keywords.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <button className={styles['read-more-button']}>
                      Xem chi tiết <FaArrowRight />
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

export default Documents; 