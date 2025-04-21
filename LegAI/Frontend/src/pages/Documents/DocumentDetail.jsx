import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './DocumentDetail.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';
import Loader from '../../components/layout/Loading/Loading';
import { FaRegFilePdf, FaShare, FaStar, FaBookmark, FaRegCalendarAlt, FaTag, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

/**
 * Trang hiển thị chi tiết văn bản pháp luật
 */
const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Tải thông tin chi tiết văn bản khi component được tải
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true);
        setError(null);

        // Gọi API lấy chi tiết văn bản
        const response = await legalService.getLegalDocumentById(id);
        
        if (response && response.status === 'success' && response.data) {
          setDocument(response.data);
          
          // Kiểm tra trạng thái yêu thích và đánh dấu từ localStorage
          checkDocumentStatus();
        } else {
          setError('Không thể tải thông tin văn bản pháp luật');
        }
      } catch (error) {
        console.error('Lỗi khi tải chi tiết văn bản:', error);
        setError('Đã xảy ra lỗi khi tải thông tin văn bản');
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Kiểm tra trạng thái yêu thích và đánh dấu
  const checkDocumentStatus = () => {
    // Lấy danh sách từ localStorage
    const favorites = JSON.parse(localStorage.getItem('favoriteDocuments') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    
    // Kiểm tra văn bản hiện tại có trong danh sách không
    setIsFavorite(favorites.includes(Number(id)));
    setIsBookmarked(bookmarks.includes(Number(id)));
  };

  // Xử lý khi người dùng yêu thích văn bản
  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDocuments') || '[]');
    const docId = Number(id);
    
    if (isFavorite) {
      // Xóa khỏi danh sách yêu thích
      const updatedFavorites = favorites.filter(favId => favId !== docId);
      localStorage.setItem('favoriteDocuments', JSON.stringify(updatedFavorites));
      setIsFavorite(false);
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } else {
      // Thêm vào danh sách yêu thích
      favorites.push(docId);
      localStorage.setItem('favoriteDocuments', JSON.stringify(favorites));
      setIsFavorite(true);
      toast.success('Đã thêm vào danh sách yêu thích');
    }
  };

  // Xử lý khi người dùng đánh dấu văn bản
  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarkedDocuments') || '[]');
    const docId = Number(id);
    
    if (isBookmarked) {
      // Xóa khỏi danh sách đánh dấu
      const updatedBookmarks = bookmarks.filter(bId => bId !== docId);
      localStorage.setItem('bookmarkedDocuments', JSON.stringify(updatedBookmarks));
      setIsBookmarked(false);
      toast.success('Đã xóa khỏi danh sách đánh dấu');
    } else {
      // Thêm vào danh sách đánh dấu
      bookmarks.push(docId);
      localStorage.setItem('bookmarkedDocuments', JSON.stringify(bookmarks));
      setIsBookmarked(true);
      toast.success('Đã thêm vào danh sách đánh dấu');
    }
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

  // Xử lý khi người dùng muốn in văn bản
  const handlePrint = () => {
    window.print();
  };

  // Xử lý khi người dùng muốn tải xuống văn bản
  const handleDownload = () => {
    if (document?.id) {
      try {
        legalService.downloadLegalDocument(document.id);
      } catch (error) {
        console.error('Lỗi khi tải xuống tài liệu:', error);
        toast.error('Không thể tải xuống tài liệu. Vui lòng thử lại sau.');
      }
    } else {
      toast.error('Không thể tải xuống tài liệu. Vui lòng thử lại sau.');
    }
  };

  // Xử lý khi người dùng muốn chia sẻ văn bản
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document?.title,
        text: document?.summary,
        url: window.location.href
      })
      .then(() => console.log('Đã chia sẻ thành công'))
      .catch((error) => console.log('Lỗi khi chia sẻ:', error));
    } else {
      // Fallback nếu Web Share API không được hỗ trợ
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Đã sao chép đường dẫn vào clipboard'))
        .catch(() => toast.error('Không thể sao chép đường dẫn'));
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles['document-detail-container']}>
        {loading ? (
          <div className={styles.loading}>
            <Loader />
            <p>Đang tải thông tin văn bản...</p>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <h2>Đã xảy ra lỗi</h2>
            <p>{error}</p>
            <Link to="/documents" className={styles['back-link']}>Quay lại danh sách văn bản</Link>
          </div>
        ) : document ? (
          <div className={styles['document-detail']}>
            <div className={styles['navigation-buttons']}>
              <Link to="/documents" className={styles['back-link']}>
                &laquo; Quay lại danh sách
              </Link>
              <Link to="/" className={styles['home-button']}>
                Trang chủ
              </Link>
            </div>

            <div className={styles['document-header']}>
              <h1 className={styles['document-title']}>{document.title}</h1>
              
              <div className={styles['document-meta']}>
                <span className={styles['document-type']}>
                  Loại văn bản: {document.document_type}
                </span>
                <span className={styles['document-number']}>
                  Phiên bản: {document.version || 'N/A'}
                </span>
                <span className={styles['document-date']}>
                  <FaRegCalendarAlt /> Ngày ban hành: {formatDate(document.issued_date)}
                </span>
                <span className={styles['document-language']}>
                  Ngôn ngữ: {document.language || 'Tiếng Việt'}
                </span>
              </div>

              {document.keywords && document.keywords.length > 0 && (
                <div className={styles['document-keywords']}>
                  <span className={styles['keywords-label']}>Từ khóa:</span>
                  {document.keywords.map((keyword, index) => (
                    <span key={index} className={styles['keyword-tag']}>
                      <FaTag /> {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {document.summary && (
              <div className={styles['document-summary']}>
                <h2 className={styles['summary-title']}>Tóm tắt</h2>
                <p className={styles['summary-text']}>{document.summary}</p>
              </div>
            )}

            <div className={styles['document-content']}>
              <h2 className={styles['content-title']}>Nội dung văn bản</h2>
              <div 
                className={styles['content-text']}
                dangerouslySetInnerHTML={{ __html: document.content || 'Không có nội dung' }}
              />
            </div>

            <div className={styles['document-footer']}>
              <div className={styles['document-actions']}>
                <button 
                  className={`${styles['action-button']} ${styles.print}`}
                  onClick={handlePrint}
                >
                  <FaRegFilePdf /> In văn bản
                </button>
                <button 
                  className={`${styles['action-button']} ${styles.download}`}
                  onClick={handleDownload}
                >
                  <FaExternalLinkAlt /> Tải xuống
                </button>
                <button 
                  className={`${styles['action-button']} ${styles.share}`}
                  onClick={handleShare}
                >
                  <FaShare /> Chia sẻ
                </button>
                <button 
                  className={`${styles['action-button']} ${styles.favorite} ${isFavorite ? styles.active : ''}`}
                  onClick={toggleFavorite}
                >
                  <FaStar /> {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                </button>
                <button 
                  className={`${styles['action-button']} ${styles.bookmark} ${isBookmarked ? styles.active : ''}`}
                  onClick={toggleBookmark}
                >
                  <FaBookmark /> {isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.error}>
            <h2>Không tìm thấy văn bản</h2>
            <p>Văn bản bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/documents" className={styles['back-link']}>Quay lại danh sách văn bản</Link>
          </div>
        )}
      </div>
    </>
  );
};

export default DocumentDetail; 