import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './UserLegalDocsManager.module.css';
import axiosInstance from '../../../config/axios';
import Spinner from '../../../components/Common/Spinner';
import * as legalDocService from '../../../services/legalDocService';
import { useParams } from 'react-router-dom';

// Component xem chi tiết hồ sơ
const DocDetailsModal = ({ doc, onClose, onDownload, onAnalyze, onShare }) => {
  if (!doc) return null;

  const getFileIcon = (fileType) => {
    if (!fileType) return "📄";
    
    fileType = fileType.toLowerCase();
    if (fileType.includes('pdf')) return "📕";
    if (fileType.includes('doc') || fileType.includes('word')) return "📘";
    if (fileType.includes('xls') || fileType.includes('excel')) return "📗";
    if (fileType.includes('ppt') || fileType.includes('powerpoint')) return "📙";
    if (fileType.includes('txt') || fileType.includes('text')) return "📃";
    if (fileType.includes('jpg') || fileType.includes('jpeg') || 
        fileType.includes('png') || fileType.includes('gif') || 
        fileType.includes('bmp') || fileType.includes('image')) return "🖼️";
    return "📄";
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'Không xác định';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return 'Không xác định';
    
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.viewModal}>
        <div className={styles.modalHeader}>
          <h2>Chi tiết hồ sơ pháp lý</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.docHeader}>
            <div className={styles.fileIconLarge}>
              {getFileIcon(doc.fileType || doc.file_type)}
            </div>
            
            <div className={styles.docMeta}>
              <h3>{doc.title}</h3>
              
              <div className={styles.docOwner}>
                <i className="fas fa-user"></i>
                <span>Người tạo: {doc.user?.fullname || doc.user?.email || doc.username || 'Không xác định'}</span>
              </div>
              
              <div className={styles.docCategory}>
                <i className="fas fa-folder"></i>
                <span>Danh mục: {doc.category?.name || doc.category_name || 'Không xác định'}</span>
              </div>
              
              <div className={styles.docDate}>
                <i className="fas fa-calendar-alt"></i>
                <span>Ngày tạo: {formatDate(doc.created_at || doc.createdAt)}</span>
              </div>
              
              <div className={styles.docSize}>
                <i className="fas fa-file-alt"></i>
                <span>Loại tệp: {doc.fileType || doc.file_type || 'Không xác định'}</span>
                {(doc.fileSize || doc.file_size) && 
                  <span> | Dung lượng: {formatFileSize(doc.fileSize || doc.file_size)}</span>
                }
              </div>
              
              <div className={styles.docAccess}>
                <i className="fas fa-lock"></i>
                <span className={doc.isShared ? styles.sharedLabel : styles.privateLabel}>
                  {doc.isShared ? 'Đã chia sẻ' : 'Riêng tư'}
                </span>
              </div>
            </div>
          </div>
          
          {doc.description && (
            <div className={styles.docSection}>
              <h4>Mô tả</h4>
              <p>{doc.description}</p>
            </div>
          )}
          
          {doc.tags && doc.tags.length > 0 && (
            <div className={styles.docSection}>
              <h4>Từ khóa</h4>
              <div className={styles.tagsList}>
                {doc.tags.map((tag, idx) => (
                  <span key={idx} className={styles.tag}>{tag}</span>
                ))}
              </div>
            </div>
          )}
          
          {doc.metadata && doc.metadata.ai_analysis && (
            <div className={styles.docSection}>
              <h4>Phân tích AI</h4>
              <div className={styles.aiAnalysis}>
                {doc.metadata.ai_analysis.summary && (
                  <div className={styles.aiSection}>
                    <h5>Tóm tắt</h5>
                    <p>{doc.metadata.ai_analysis.summary}</p>
                  </div>
                )}
                
                {doc.metadata.ai_analysis.keywords && (
                  <div className={styles.aiSection}>
                    <h5>Từ khóa quan trọng</h5>
                    <div className={styles.tagsList}>
                      {doc.metadata.ai_analysis.keywords.map((keyword, idx) => (
                        <span key={idx} className={styles.aiTag}>{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {doc.metadata.ai_analysis.entities && (
                  <div className={styles.aiSection}>
                    <h5>Thực thể pháp lý</h5>
                    <ul className={styles.entitiesList}>
                      {Object.entries(doc.metadata.ai_analysis.entities).map(([type, values], idx) => (
                        <li key={idx}>
                          <span className={styles.entityType}>{type}:</span> {values.join(', ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.viewButton} 
            onClick={() => onDownload(doc.id)}
          >
            <i className="fas fa-download"></i> Tải xuống
          </button>
          
          <button 
            className={styles.shareButton} 
            onClick={() => onShare(doc)}
          >
            <i className="fas fa-share-alt"></i> Chia sẻ
          </button>
          
          {!doc.metadata?.ai_analysis && (
            <button 
              className={styles.viewButton} 
              onClick={() => onAnalyze(doc.id)}
            >
              <i className="fas fa-robot"></i> Phân tích AI
            </button>
          )}
          
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            <i className="fas fa-times"></i> Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

const UserLegalDocsManager = () => {
  const params = useParams();
  // State cho người dùng
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  
  // State cho hồ sơ pháp lý
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // State cho modal xem chi tiết
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Khởi tạo dữ liệu khi component mount
  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, []);

  // Tải danh sách hồ sơ khi thay đổi trang, tìm kiếm, người dùng, hoặc danh mục
  useEffect(() => {
    fetchDocuments();
  }, [currentPage, searchTerm, selectedUser, selectedCategory]);

  // Kiểm tra nếu có ID hồ sơ trong URL
  useEffect(() => {
    if (params.id) {
      const getDocDetails = async () => {
        try {
          setLoading(true);
          const response = await legalDocService.getLegalDocById(params.id);
          if (response && response.status === 'success') {
            setSelectedDoc(response.data);
            setShowDetailsModal(true);
          } else {
            toast.error('Không tìm thấy hồ sơ hoặc bạn không có quyền truy cập');
          }
        } catch (error) {
          console.error('Lỗi khi lấy chi tiết hồ sơ:', error);
          toast.error('Không thể tải thông tin hồ sơ');
        } finally {
          setLoading(false);
        }
      };
      
      getDocDetails();
    }
  }, [params.id]);

  // Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      const response = await legalDocService.getLegalDocCategories();
      if (response && response.status === 'success') {
        setCategories(response.data || []);
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách danh mục:', err);
    }
  };

const fetchUsers = async () => {
  try {
    // Thay đổi sử dụng API xác thực
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Không có token xác thực');
      return;
    }
    
    const response = await axiosInstance.get('/auth/users', {
      params: { limit: 100 },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data && response.data.status === 'success') {
      if (response.data.data && Array.isArray(response.data.data.users)) {
        setUsers(response.data.data.users);
      } else {
        console.error('Định dạng dữ liệu không đúng:', response.data);
      }
    }
  } catch (err) {
    console.error('Lỗi khi lấy danh sách người dùng:', err);
    // Tạo danh sách người dùng mẫu trong trường hợp lỗi
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser) {
      setUsers([currentUser]);
      setSelectedUser(currentUser.id);
    }
  }
};

// Xử lý dữ liệu hồ sơ để chuẩn hóa các trường
const processDocumentData = (doc) => {
  if (!doc) return null;
  
  // Đảm bảo trả về đối tượng mặc định nếu doc là null hoặc không xác định
  return {
    ...doc,
    id: doc.id || `temp-${Math.random().toString(36).substr(2, 9)}`,
    title: doc.title || 'Không có tiêu đề',
    description: doc.description || '',
    category: doc.category || { 
      id: doc.category_id || 0, 
      name: doc.category_name || 'Không xác định' 
    },
    user: doc.user || { 
      id: doc.user_id || 0,
      fullname: doc.user_name || doc.username || 'Không xác định',
      email: doc.user_email || doc.email || 'Không xác định'
    },
    created_at: doc.created_at || doc.createdAt || new Date().toISOString(),
    file_type: doc.file_type || doc.fileType || 'unknown',
    file_size: doc.file_size || doc.fileSize || 0,
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    metadata: doc.metadata || {},
    isShared: !!doc.is_shared
  };
};

const fetchDocuments = async () => {
  try {
    setLoading(true);
    const params = {
      category: selectedCategory,
      search: searchTerm,
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };

    const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;
    if (!currentUserId) {
      throw new Error('Không thể xác định người dùng hiện tại');
    }

    let response;
    // Luôn lấy hồ sơ của người dùng hiện tại, bỏ qua việc chọn người dùng khác
    // vì API admin không hoạt động
    try {
      response = await legalDocService.getUserLegalDocs(currentPage, 10, params);
    } catch (error) {
      console.error('Lỗi khi lấy hồ sơ cá nhân:', error);
      throw error;
    }

    if (response && response.status === 'success') {
      // Xử lý dữ liệu khi API trả về đúng định dạng
      
      // Kiểm tra cấu trúc dữ liệu
      const processedData = Array.isArray(response.data) 
        ? response.data 
        : (Array.isArray(response.data.documents) ? response.data.documents : []);
      
      // Đảm bảo mỗi document có đầy đủ thông tin
      const documentsWithDefaults = processedData.map(doc => processDocumentData(doc));
      
      setDocuments(documentsWithDefaults);
      setTotalPages(response.pagination?.totalPages || 1);
    } else if (response && Array.isArray(response.data)) {
      // Xử lý khi API trả về mảng trực tiếp
      
      const documentsWithDefaults = response.data.map(doc => processDocumentData(doc));
      
      setDocuments(documentsWithDefaults);
      setTotalPages(1);
    } else {
      setDocuments([]);
      setTotalPages(1);
    }
  } catch (err) {
    console.error('Lỗi khi lấy danh sách hồ sơ pháp lý:', err);
    setError('Không thể tải danh sách hồ sơ pháp lý');
    toast.error('Không thể tải danh sách hồ sơ pháp lý');
    setDocuments([]);
    setTotalPages(1);
  } finally {
    setLoading(false);
  }
};

  // Xử lý thay đổi người dùng
  const handleUserChange = (e) => {
    setSelectedUser(e.target.value);
    setCurrentPage(1);
  };
  
  // Xử lý thay đổi danh mục
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  // Xử lý tìm kiếm
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Xử lý thay đổi trang
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Format ngày từ chuỗi ISO
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return 'Không xác định';
    }
  };
  
  // Xử lý mở modal xem chi tiết
  const handleViewDetails = (doc) => {
    setSelectedDoc(doc);
    setShowDetailsModal(true);
  };
  
  // Xử lý đóng modal
  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedDoc(null);
  };
  
  // Xử lý tải xuống hồ sơ
  const handleDownload = async (docId) => {
    try {
      setLoading(true);
      await legalDocService.downloadLegalDoc(docId);
      toast.success('Tải xuống hồ sơ thành công!');
    } catch (error) {
      console.error('Lỗi khi tải xuống hồ sơ:', error);
      toast.error('Không thể tải xuống hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý phân tích AI
  const handleAnalyze = async (docId) => {
    try {
      setAnalyzing(true);
      toast.info('Đang phân tích hồ sơ bằng AI...');
      
      const response = await legalDocService.analyzeLegalDoc(docId);
      
      if (response && response.status === 'success') {
        toast.success('Phân tích hồ sơ thành công!');
        
        // Cập nhật lại danh sách hồ sơ để hiển thị kết quả phân tích
        await fetchDocuments();
        
        // Nếu đang xem chi tiết, cập nhật thông tin hồ sơ đang xem
        if (selectedDoc && selectedDoc.id === docId) {
          const updatedDoc = await legalDocService.getLegalDocById(docId);
          if (updatedDoc && updatedDoc.status === 'success') {
            setSelectedDoc(updatedDoc.data);
          }
        }
      } else {
        toast.error('Phân tích hồ sơ không thành công.');
      }
    } catch (error) {
      console.error('Lỗi khi phân tích hồ sơ:', error);
      toast.error('Không thể phân tích hồ sơ. Vui lòng thử lại sau.');
    } finally {
      setAnalyzing(false);
    }
  };
  
  // Xử lý chia sẻ hồ sơ pháp lý
  const handleShareDocument = async (doc) => {
    try {
      setLoading(true);
      
      // Mở form chia sẻ hoặc hiển thị hộp thoại
      const userToShareWith = window.prompt("Nhập ID người dùng để chia sẻ:", "");
      
      if (!userToShareWith) {
        toast.info('Đã hủy thao tác chia sẻ');
        setLoading(false);
        return;
      }
      
      // Chuẩn bị dữ liệu theo định dạng API yêu cầu
      const shareData = {
        user_id: userToShareWith,
        permission: "view",
        expire_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Hạn 30 ngày
      };
      
      
      // Gọi API chia sẻ
      const response = await legalDocService.shareLegalDoc(doc.id, shareData);
      
      if (response && response.status === 'success') {
        toast.success(`Đã chia sẻ thành công hồ sơ "${doc.title}" với người dùng ID: ${userToShareWith}`);
        
        // Cập nhật lại danh sách hồ sơ để cập nhật trạng thái chia sẻ
        await fetchDocuments();
      } else {
        toast.error('Chia sẻ hồ sơ không thành công');
      }
    } catch (error) {
      console.error('Lỗi khi chia sẻ hồ sơ pháp lý:', error);
      toast.error(`Không thể chia sẻ hồ sơ. ${error.response?.data?.message || 'Vui lòng thử lại sau.'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Render phân trang
  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`${styles.pageButton} ${currentPage === i ? styles.activePage : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return (
      <div className={styles.pagination}>
        <button
          className={styles.pageButton}
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &laquo;
        </button>
        {pages}
        <button
          className={styles.pageButton}
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          &raquo;
        </button>
      </div>
    );
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {selectedUser && (
          <span className={styles.noticeText}>
            <i className="fas fa-info-circle"></i> Chức năng xem hồ sơ của người dùng khác tạm thời không khả dụng. Chỉ hiển thị hồ sơ của bạn.
          </span>
        )}
      </div>
      
      <div className={styles.filterContainer}>
        {/*
        <div className={styles.filterItem}>
          <label htmlFor="userSelect">Người dùng:</label>
          <select
            id="userSelect"
            value={selectedUser}
            onChange={handleUserChange}
            className={styles.select}
          >
            <option value="">Tất cả người dùng</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullname || user.email}
              </option>
            ))}
          </select>
        </div>
        */}
        
        <div className={styles.filterItem}>
          <label htmlFor="categorySelect">Danh mục:</label>
          <select
            id="categorySelect"
            value={selectedCategory}
            onChange={handleCategoryChange}
            className={styles.select}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="searchInput">Tìm kiếm:</label>
          <input
            id="searchInput"
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Nhập từ khóa tìm kiếm..."
            className={styles.input}
          />
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner />
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyContainer}>
          <p>Không có hồ sơ pháp lý nào.</p>
        </div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th width="5%">STT</th>
                  <th width="25%">Tên hồ sơ</th>
                  <th width="15%">Danh mục</th>
                  <th width="20%">Người dùng</th>
                  <th width="15%">Ngày tạo</th>
                  <th width="20%">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc, index) => (
                    <tr key={doc.id || index} className={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                      <td>{(currentPage - 1) * 10 + index + 1}</td>
                      <td className={styles.documentTitle}>{doc.title || 'Không có tiêu đề'}</td>
                      <td>{doc.category?.name || 'Không xác định'}</td>
                      <td>
                        {doc.user?.fullname || 
                         doc.user?.email || 
                         'Không xác định'}
                      </td>
                      <td>{formatDate(doc.created_at || doc.createdAt || new Date())}</td>
                      <td className={styles.actions}>
                        <button
                          className={styles.viewButton}
                          onClick={() => handleViewDetails(doc)}
                          title="Xem chi tiết"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownload(doc.id)}
                          title="Tải xuống"
                        >
                          <i className="fas fa-download"></i>
                        </button>
                        <button
                          className={styles.shareButton}
                          onClick={() => handleShareDocument(doc)}
                          title="Chia sẻ hồ sơ"
                        >
                          <i className="fas fa-share-alt"></i>
                        </button>
                        {!doc.metadata?.ai_analysis && (
                          <button
                            className={styles.analyzeButton}
                            onClick={() => handleAnalyze(doc.id)}
                            title="Phân tích AI"
                            disabled={analyzing}
                          >
                            <i className="fas fa-robot"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '1rem' }}>
                      Không có dữ liệu hồ sơ pháp lý.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {renderPagination()}
          
          {showDetailsModal && selectedDoc && (
            <DocDetailsModal 
              doc={selectedDoc}
              onClose={handleCloseModal}
              onDownload={handleDownload}
              onAnalyze={handleAnalyze}
              onShare={handleShareDocument}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UserLegalDocsManager; 