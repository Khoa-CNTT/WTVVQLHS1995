import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from './LegalDocs.module.css';
import * as legalDocService from '../../services/legalDocService';
import DocUploadModal from './components/DocUploadModal';
import DocDetailsModal from './components/DocDetailsModal';
import DocShareModal from './components/DocShareModal';
import DocCard from '../../components/DocCard/DocCard';
import DocSearchFilter from './components/DocSearchFilter';
import DocAnalysisModal from './components/DocAnalysisModal';
import LoadingSpinner from '../../components/Common/Spinner';
import Navbar from '../../components/layout/Nav/Navbar';
import ChatManager from '../../components/layout/Chat/ChatManager';
import { FaPlus, FaSearch, FaFilter, FaSyncAlt, FaFileAlt, FaFolderOpen, FaShareAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const LegalDocsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('my-docs');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const navigate = useNavigate();
  
  // Refs cho các phần tử DOM
  const headerRef = useRef(null);
  const tabsRef = useRef(null);
  const docsGridRef = useRef(null);
  const filterRef = useRef(null);

  // Fetch dữ liệu khi component mount hoặc khi filters, pagination thay đổi
  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, [activeTab, filters, pagination.page, pagination.limit]);

  // Fetch danh sách hồ sơ pháp lý
  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      let response;
      
      if (activeTab === 'my-docs') {
        // Lấy danh sách hồ sơ pháp lý cá nhân
        console.log('Đang lấy tài liệu cá nhân với tham số:', pagination, filters);
        response = await legalDocService.getUserLegalDocs(pagination.page, pagination.limit, filters);
      } else {
        // Lấy danh sách hồ sơ pháp lý được chia sẻ
        console.log('Đang lấy tài liệu được chia sẻ với tham số:', pagination, filters);
        response = await legalDocService.getSharedLegalDocs(pagination.page, pagination.limit, filters);
      }
      
      console.log(`Phản hồi từ API (${activeTab}):`, response);
      
      if (response.success) {
        if (activeTab === 'my-docs') {
          setDocuments(response.data);
          console.log('Đã cập nhật tài liệu cá nhân:', response.data.length);
        } else {
          setSharedDocuments(response.data);
          console.log('Đã cập nhật tài liệu được chia sẻ:', response.data.length);
        }
        
        // Cập nhật thông tin phân trang
        setPagination(prevState => ({
          ...prevState,
          totalPages: response.pagination.totalPages,
          total: response.pagination.total
        }));
      } else {
        toast.error(response.message || 'Không thể tải danh sách hồ sơ pháp lý');
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách hồ sơ pháp lý:', error);
      if (error.response) {
        console.error('Server response:', error.response.data);
      }
      toast.error('Có lỗi xảy ra khi tải danh sách hồ sơ pháp lý');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch danh sách các danh mục
  const fetchCategories = async () => {
    try {
      const response = await legalDocService.getLegalDocCategories();
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Xử lý thay đổi tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters({
      category: '',
      search: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Xử lý thay đổi bộ lọc
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination({
      ...pagination,
      page: 1
    });
  };

  // Xử lý thay đổi trang
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
    
    // Scroll to top khi chuyển trang
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Mở modal chi tiết
  const handleViewDetails = (doc) => {
    setSelectedDoc(doc);
    setShowDetailsModal(true);
  };

  // Mở modal chia sẻ
  const handleShareDoc = (doc) => {
    setSelectedDoc(doc);
    setShowShareModal(true);
  };

  // Xử lý tải xuống hồ sơ
  const handleDownload = async (docId) => {
    try {
      await legalDocService.downloadLegalDoc(docId);
      toast.success('Đang tải xuống hồ sơ...');
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải xuống hồ sơ');
    }
  };

  // Xử lý xóa hồ sơ
  const handleDelete = async (docId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ này không?')) {
      try {
        const response = await legalDocService.deleteLegalDoc(docId);
        if (response.success) {
          toast.success('Đã xóa hồ sơ pháp lý');
          fetchDocuments();
        } else {
          toast.error(response.message || 'Không thể xóa hồ sơ');
        }
      } catch (error) {
        console.error(error);
        toast.error('Có lỗi xảy ra khi xóa hồ sơ');
      }
    }
  };

  // Xử lý tải lên hồ sơ mới
  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    toast.success('Đã tải lên hồ sơ pháp lý thành công');
    fetchDocuments();
  };

  // Xử lý cập nhật hồ sơ
  const handleUpdateSuccess = () => {
    setShowDetailsModal(false);
    toast.success('Đã cập nhật hồ sơ pháp lý thành công');
    fetchDocuments();
  };

  // Xử lý chia sẻ hồ sơ
  const handleShareSuccess = () => {
    setShowShareModal(false);
    toast.success('Đã chia sẻ hồ sơ pháp lý thành công');
    fetchDocuments();
  };

  // Xử lý phân tích hồ sơ
  const handleAnalyze = (doc) => {
    setSelectedDoc(doc);
    setShowAnalysisModal(true);
  };

  // Xử lý hoàn thành phân tích
  const handleAnalysisComplete = () => {
    setShowAnalysisModal(false);
    fetchDocuments();
  };

  // Render danh sách hồ sơ
  const renderDocumentsList = () => {
    const currentDocs = activeTab === 'my-docs' ? documents : sharedDocuments;

    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
        </div>
      );
    }

    if (currentDocs.length === 0) {
      return (
        <div className={styles.emptyState}>
          <FaFolderOpen />
          <h3>{activeTab === 'my-docs' ? 'Không có hồ sơ pháp lý nào' : 'Không có hồ sơ được chia sẻ'}</h3>
          {activeTab === 'my-docs' && (
            <button 
              className={styles.uploadButton}
              onClick={() => setShowUploadModal(true)}
            >
              <FaPlus /> Tải lên hồ sơ mới
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={styles.docsGrid} ref={docsGridRef}>
        {currentDocs.map((doc, index) => (
          <div key={doc.id} className="doc-card-animation">
            <DocCard 
              doc={doc}
              isOwner={activeTab === 'my-docs'}
              onView={() => handleViewDetails(doc)}
              onDownload={() => handleDownload(doc.id)}
              onShare={() => handleShareDoc(doc)}
              onDelete={() => handleDelete(doc.id)}
              onAnalyze={() => handleAnalyze(doc)}
            />
          </div>
        ))}
      </div>
    );
  };

  // Render phân trang
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className={styles.pagination}>
        <button 
          className={styles.pageButton}
          onClick={() => handlePageChange(1)}
          disabled={pagination.page === 1}
        >
          <FaChevronLeft />
          <FaChevronLeft />
        </button>
        <button 
          className={styles.pageButton}
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <FaChevronLeft />
        </button>
        
        {[...Array(pagination.totalPages)].map((_, i) => {
          // Hiển thị tối đa 5 nút phân trang
          if (
            i + 1 === 1 ||
            i + 1 === pagination.totalPages ||
            (i + 1 >= pagination.page - 1 && i + 1 <= pagination.page + 1)
          ) {
            return (
              <button
                key={i}
                className={`${styles.pageButton} ${pagination.page === i + 1 ? styles.currentPage : ''}`}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            );
          } else if (
            (i + 1 === pagination.page - 2 && pagination.page > 3) ||
            (i + 1 === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
          ) {
            return <span key={i} className={styles.pageEllipsis}>...</span>;
          }
          return null;
        })}
        
        <button 
          className={styles.pageButton}
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          <FaChevronRight />
        </button>
        <button 
          className={styles.pageButton}
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.page === pagination.totalPages}
        >
          <FaChevronRight />
          <FaChevronRight />
        </button>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <ChatManager />
      
      <div className={styles.container}>
        <div className={styles.pageHeader} ref={headerRef}>
          <div>
            <h1 className={styles.pageTitle}>Hồ sơ pháp lý</h1>
            <p className={styles.pageDescription}>
              Quản lý và truy cập tất cả các tài liệu pháp lý của bạn, bao gồm hợp đồng, giấy tờ và hồ sơ quan trọng
            </p>
          </div>
          
          <div className={styles.actionButtons}>
            {activeTab === 'my-docs' && (
              <button 
                className={styles.primaryButton}
                onClick={() => setShowUploadModal(true)}
              >
                <FaPlus /> Tải lên hồ sơ
              </button>
            )}
            <button 
              className={styles.secondaryButton}
              onClick={() => fetchDocuments()}
            >
              <FaSyncAlt /> Làm mới
            </button>
          </div>
        </div>
        
        <div className={styles.tabs} ref={tabsRef}>
          <button 
            className={`${styles.tab} ${activeTab === 'my-docs' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('my-docs')}
          >
            Hồ sơ của tôi
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'shared' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('shared')}
          >
            Được chia sẻ với tôi
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.filterSection} ref={filterRef}>
            <DocSearchFilter 
              categories={categories}
              onFilterChange={handleFilterChange}
              filters={filters}
            />
          </div>
          
          {renderDocumentsList()}
          {renderPagination()}
        </div>
      </div>
      
      {showUploadModal && (
        <DocUploadModal 
          categories={categories}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
      
      {showDetailsModal && selectedDoc && (
        <DocDetailsModal 
          doc={selectedDoc}
          categories={categories}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={handleUpdateSuccess}
          isOwner={activeTab === 'my-docs'}
        />
      )}
      
      {showShareModal && selectedDoc && (
        <DocShareModal 
          doc={selectedDoc}
          onClose={() => setShowShareModal(false)}
          onSuccess={handleShareSuccess}
        />
      )}
      
      {showAnalysisModal && selectedDoc && (
        <DocAnalysisModal 
          doc={selectedDoc}
          onClose={() => setShowAnalysisModal(false)}
          onComplete={handleAnalysisComplete}
        />
      )}
    </>
  );
};

export default LegalDocsPage; 