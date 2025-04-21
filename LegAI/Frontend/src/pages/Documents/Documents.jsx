import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Documents.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
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
  },
  {
    id: 4,
    title: 'Quyết định 28/2021/QĐ-TTg',
    document_type: 'Quyết định',
    version: '2021',
    summary: 'Về việc thực hiện chính sách hỗ trợ người lao động và người sử dụng lao động bị ảnh hưởng bởi đại dịch COVID-19.',
    issued_date: '2021-10-01',
    language: 'Tiếng Việt',
    keywords: ['COVID-19', 'Hỗ trợ', 'Lao động']
  },
  {
    id: 5,
    title: 'Thông tư 41/2022/TT-BTC',
    document_type: 'Thông tư',
    version: '2022',
    summary: 'Hướng dẫn chế độ kế toán áp dụng cho doanh nghiệp siêu nhỏ.',
    issued_date: '2022-06-28',
    language: 'Tiếng Việt',
    keywords: ['Kế toán', 'Doanh nghiệp siêu nhỏ', 'Tài chính']
  },
  {
    id: 6,
    title: 'Luật đất đai số 45/2013/QH13',
    document_type: 'Luật',
    version: '2013',
    summary: 'Quy định về chế độ sở hữu đất đai, quyền hạn và trách nhiệm của Nhà nước đại diện chủ sở hữu toàn dân về đất đai và thống nhất quản lý về đất đai.',
    issued_date: '2013-11-29',
    language: 'Tiếng Việt',
    keywords: ['Đất đai', 'Sở hữu', 'Quyền sử dụng đất']
  },
  {
    id: 7,
    title: 'Luật doanh nghiệp số 59/2020/QH14',
    document_type: 'Luật',
    version: '2020',
    summary: 'Quy định về thành lập, tổ chức quản lý, tổ chức lại, giải thể và hoạt động có liên quan của doanh nghiệp.',
    issued_date: '2020-06-17',
    language: 'Tiếng Việt',
    keywords: ['Doanh nghiệp', 'Quản lý', 'Thành lập']
  },
  {
    id: 8,
    title: 'Nghị định 15/2022/NĐ-CP',
    document_type: 'Nghị định',
    version: '2022',
    summary: 'Quy định chính sách miễn, giảm thuế theo Nghị quyết số 43/2022/QH15 của Quốc hội về chính sách tài khóa, tiền tệ hỗ trợ Chương trình phục hồi và phát triển kinh tế - xã hội.',
    issued_date: '2022-01-28',
    language: 'Tiếng Việt',
    keywords: ['Thuế', 'Miễn giảm', 'Phục hồi kinh tế']
  },
  {
    id: 9,
    title: 'Hiến pháp nước Cộng hòa Xã hội Chủ nghĩa Việt Nam năm 2013',
    document_type: 'Hiến pháp',
    version: '2013',
    summary: 'Hiến pháp là luật cơ bản của nước Cộng hòa xã hội chủ nghĩa Việt Nam, có hiệu lực pháp lý cao nhất.',
    issued_date: '2013-11-28',
    language: 'Tiếng Việt',
    keywords: ['Hiến pháp', 'Luật cơ bản', 'Nhà nước']
  },
  {
    id: 10,
    title: 'Bộ luật lao động số 45/2019/QH14',
    document_type: 'Luật',
    version: '2019',
    summary: 'Quy định về tiêu chuẩn lao động; quyền, nghĩa vụ, trách nhiệm của người lao động, người sử dụng lao động, tổ chức đại diện người lao động tại cơ sở, tổ chức đại diện người sử dụng lao động trong quan hệ lao động và các quan hệ khác liên quan trực tiếp đến quan hệ lao động.',
    issued_date: '2019-11-20',
    language: 'Tiếng Việt',
    keywords: ['Lao động', 'Quan hệ lao động', 'Quyền lợi người lao động']
  }
];

// Danh sách loại văn bản
const documentTypesList = [
  { id: 1, name: 'Luật' },
  { id: 2, name: 'Nghị định' },
  { id: 3, name: 'Quyết định' },
  { id: 4, name: 'Thông tư' },
  { id: 5, name: 'Hiến pháp' }
];

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [filters, setFilters] = useState({
    type: '',
    fromDate: '',
    toDate: ''
  });
  
  const navigate = useNavigate();
  const limit = 5; // Số văn bản hiển thị trên mỗi trang

  // Lấy danh sách văn bản pháp luật từ API
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // Gọi API lấy danh sách văn bản pháp luật
        const response = await legalService.searchLegalDocuments({
          q: '',
          type: filters.type,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          page: currentPage,
          limit: limit
        });
        
        if (response && response.data) {
          setDocuments(response.data);
          
          // Cập nhật thông tin phân trang
          if (response.pagination) {
            setTotalPages(response.pagination.totalPages || 1);
          }
        } else {
          setDocuments([]);
          setTotalPages(1);
        }
        
        setError(null);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách văn bản pháp luật:', error);
        setError('Đã xảy ra lỗi khi tải danh sách văn bản. Vui lòng thử lại sau.');
        
        // Tạm thời dùng dữ liệu mẫu nếu API không hoạt động
        let filteredData = [...mockLegalDocuments];
        
        if (filters.type) {
          filteredData = filteredData.filter(doc => doc.document_type === filters.type);
        }
        
        if (filters.fromDate) {
          const fromDate = new Date(filters.fromDate);
          filteredData = filteredData.filter(doc => new Date(doc.issued_date) >= fromDate);
        }
        
        if (filters.toDate) {
          const toDate = new Date(filters.toDate);
          toDate.setHours(23, 59, 59, 999);
          filteredData = filteredData.filter(doc => new Date(doc.issued_date) <= toDate);
        }
        
        const totalItems = filteredData.length;
        const totalPagesCount = Math.ceil(totalItems / limit);
        setTotalPages(totalPagesCount);
        
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedData = filteredData.slice(startIndex, endIndex);
        
        setDocuments(paginatedData);
      } finally {
        setLoading(false);
      }
    };
    
    // Gọi API lấy danh sách loại văn bản
    const fetchDocumentTypes = async () => {
      try {
        const response = await legalService.getDocumentTypes();
        if (response && response.data) {
          setDocumentTypes(response.data);
        } else {
          setDocumentTypes([]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy danh sách loại văn bản:', error);
        // Dùng dữ liệu mẫu nếu API không hoạt động
        setDocumentTypes([
          { id: 1, name: 'Luật' },
          { id: 2, name: 'Nghị định' },
          { id: 3, name: 'Quyết định' },
          { id: 4, name: 'Thông tư' },
          { id: 5, name: 'Hiến pháp' }
        ]);
      }
    };
    
    fetchDocuments();
    fetchDocumentTypes();
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

  // Xử lý khi nhấn vào một văn bản
  const handleDocumentClick = (documentId) => {
    navigate(`/legal/documents/${documentId}`);
  };

  // Định dạng ngày
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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
      <div className={styles['documents-container']}>
        <div className={styles['documents-header']}>
          <h1>Văn bản pháp luật</h1>
          <p>Danh sách tất cả văn bản pháp luật</p>
        </div>
        
        <div className={styles['filters-section']}>
          <div className={styles['filter-controls']}>
            <div className={styles['filter-group']}>
              <label htmlFor="type">Loại văn bản:</label>
              <select 
                id="type" 
                name="type" 
                value={filters.type}
                onChange={handleFilterChange}
                className={styles['filter-select']}
              >
                <option value="">Tất cả</option>
                {documentTypes.map((type, index) => (
                  <option key={index} value={type.name}>{type.name}</option>
                ))}
              </select>
            </div>
            
            <div className={styles['filter-group']}>
              <label htmlFor="fromDate">Từ ngày:</label>
              <input 
                type="date" 
                id="fromDate" 
                name="fromDate" 
                value={filters.fromDate}
                onChange={handleFilterChange}
                className={styles['filter-input']}
              />
            </div>
            
            <div className={styles['filter-group']}>
              <label htmlFor="toDate">Đến ngày:</label>
              <input 
                type="date" 
                id="toDate" 
                name="toDate" 
                value={filters.toDate}
                onChange={handleFilterChange}
                className={styles['filter-input']}
              />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className={styles['loading']}>Đang tải danh sách văn bản...</div>
        ) : error ? (
          <div className={styles['error']}>{error}</div>
        ) : documents.length === 0 ? (
          <div className={styles['no-documents']}>Không có văn bản nào phù hợp với tiêu chí tìm kiếm</div>
        ) : (
          <>
            <div className={styles['documents-list']}>
              {documents.map((document) => (
                <div 
                  key={document.id} 
                  className={styles['document-item']}
                  onClick={() => handleDocumentClick(document.id)}
                >
                  <div className={styles['document-type-badge']}>{document.document_type}</div>
                  <h2 className={styles['document-title']}>{document.title}</h2>
                  <div className={styles['document-meta']}>
                    <span className={styles['document-date']}>
                      <i className="far fa-calendar-alt"></i> {formatDate(document.issued_date)}
                    </span>
                    <span className={styles['document-number']}>
                      <i className="fas fa-hashtag"></i> Phiên bản: {document.version || 'N/A'}
                    </span>
                  </div>
                  {document.summary && (
                    <p className={styles['document-summary']}>{document.summary.substring(0, 200)}...</p>
                  )}
                  <div className={styles['keywords-container']}>
                    {document.keywords && document.keywords.map((keyword, idx) => (
                      <span key={idx} className={styles['keyword-tag']}>{keyword}</span>
                    ))}
                  </div>
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

export default Documents; 