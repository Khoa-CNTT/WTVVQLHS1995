import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faHome, faPrint, faDownload, faShare, faStar, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular, faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import legalService from '../../services/legalService';
import styles from './DocumentDetail.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import DOMPurify from 'dompurify';
import { toast } from 'react-toastify';

const DocumentDetail = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocument();
    checkDocumentStatus();
  }, [id]);

  // Thêm useEffect mới để cập nhật tiêu đề trang khi document thay đổi
  useEffect(() => {
    if (document && document.title) {
      document.title = `${document.title} | LegAI`;
    }
  }, [document]);

    const fetchDocument = async () => {
      try {
        setLoading(true);
        
        // Xử lý ID để phù hợp với định dạng API
        let documentId = id;
        
        console.log('Đang xử lý ID ban đầu:', documentId);
        
        // Xử lý nhiều trường hợp ID khác nhau
        // 1. ID là số: giữ nguyên
        // 2. ID có dạng luat-xxx, nghi-dinh-xxx, v.v.: giữ nguyên
        // 3. ID bắt đầu bằng "/" (từ URL): bỏ dấu /
        if (typeof documentId === 'string' && documentId.startsWith('/')) {
          documentId = documentId.substring(1);
          console.log('Đã loại bỏ dấu / ở đầu:', documentId);
        }
        
        console.log('Đang tải văn bản với ID cuối cùng:', documentId);
        const response = await legalService.getLegalDocumentById(documentId);
        
        if (response.status === 'success' && response.data) {
          console.log('Nhận được dữ liệu văn bản:', response.data.title);
          setDocument(response.data);
          setError(null);
          
          // Xóa dòng cập nhật tiêu đề trang ở đây
          // document.title = `${response.data.title} | LegAI`;
        } else {
          console.error('API trả về lỗi hoặc không có dữ liệu:', response);
          setError('Không thể tải thông tin văn bản pháp luật. Vui lòng thử lại sau.');
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin văn bản:', err.message);
        if (err.response) {
          console.error('Chi tiết lỗi:', err.response.status, err.response.data);
        }
        setError(`Không thể tải thông tin văn bản pháp luật: ${err.message || 'Lỗi không xác định'}`);
      } finally {
        setLoading(false);
      }
    };

  const checkDocumentStatus = () => {
    // Kiểm tra trạng thái đánh dấu từ localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    
    setIsFavorite(favorites.includes(id));
    setIsBookmarked(bookmarks.includes(id));
  };

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      // Xóa khỏi danh sách yêu thích
      const updatedFavorites = favorites.filter(docId => docId !== id);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      toast.success('Đã xóa khỏi danh sách yêu thích');
    } else {
      // Thêm vào danh sách yêu thích
      const updatedFavorites = [...favorites, id];
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      toast.success('Đã thêm vào danh sách yêu thích');
    }
    
    setIsFavorite(!isFavorite);
  };

  const toggleBookmark = () => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    
    if (isBookmarked) {
      // Xóa khỏi danh sách đánh dấu
      const updatedBookmarks = bookmarks.filter(docId => docId !== id);
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
      toast.success('Đã xóa khỏi danh sách đánh dấu');
    } else {
      // Thêm vào danh sách đánh dấu
      const updatedBookmarks = [...bookmarks, id];
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
      toast.success('Đã thêm vào danh sách đánh dấu');
    }
    
    setIsBookmarked(!isBookmarked);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    
    try {
    const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (document && document.pdf_url) {
      window.open(document.pdf_url, '_blank');
    } else if (document && document.doc_url) {
      window.open(document.doc_url, '_blank');
    } else {
      alert('Không có file tải xuống cho văn bản này.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document.title,
        text: document.summary,
        url: window.location.href,
      })
      .catch((error) => console.log('Lỗi khi chia sẻ:', error));
    } else {
      // Fallback - sao chép URL vào clipboard
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Đã sao chép đường dẫn vào clipboard!'))
        .catch((err) => console.error('Không thể sao chép:', err));
    }
  };

  if (loading) {
  return (
    <>
      <Navbar />
        <div className={styles['document-detail-container']}>
          <div className={styles.loading}>Đang tải thông tin văn bản...</div>
        </div>
      </>
    );
  }

  if (error || !document) {
    return (
      <>
        <Navbar />
        <div className={styles['document-detail-container']}>
          <div className={styles.error}>
            {error || 'Không tìm thấy văn bản pháp luật'}
            <div className={styles['navigation-buttons']}>
              <button className={styles['home-button']} onClick={() => navigate('/')}>
                  <FontAwesomeIcon icon={faHome} /> Trang chủ
                </button>
              <Link to="/documents" className={styles['back-link']}>
                  <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách
                </Link>
              </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles['document-detail-container']}>
        <div className={styles['document-detail']}>
          <div className={styles['document-header']}>
            <div className={styles['navigation-buttons']}>
              <button className={styles['home-button']} onClick={() => navigate('/')}>
                <FontAwesomeIcon icon={faHome} /> Trang chủ
              </button>
              <Link to="/documents" className={styles['back-link']}>
                <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách
              </Link>
              
              <button 
                className={`${styles['action-button']} ${styles.favorite} ${isFavorite ? styles.active : ''}`} 
                onClick={toggleFavorite}
                title={isFavorite ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
              >
                <FontAwesomeIcon icon={isFavorite ? faStar : faStarRegular} />
                {isFavorite ? " Đã yêu thích" : " Yêu thích"}
              </button>
              
              <button 
                className={`${styles['action-button']} ${styles.bookmark} ${isBookmarked ? styles.active : ''}`} 
                onClick={toggleBookmark}
                title={isBookmarked ? "Xóa đánh dấu" : "Đánh dấu văn bản"}
              >
                <FontAwesomeIcon icon={isBookmarked ? faBookmark : faBookmarkRegular} />
                {isBookmarked ? " Đã đánh dấu" : " Đánh dấu"}
              </button>
            </div>
            <h1 className={styles['document-title']}>{document.title}</h1>
            <div className={styles['document-meta']}>
              <span className={styles['document-type']}>{document.document_type}</span>
              {document.document_number && (
                <span className={styles['document-number']}>Số: {document.document_number}</span>
              )}
              {document.issued_date && (
                <span className={styles['document-date']}>
                  Ban hành: {formatDate(document.issued_date)}
                </span>
              )}
              {document.effective_date && (
                <span className={styles['document-effective-date']}>
                  Hiệu lực: {formatDate(document.effective_date)}
                </span>
              )}
              {document.issuer && (
                <span className={styles['document-issuer']}>
                  Cơ quan ban hành: {document.issuer}
                </span>
              )}
              {document.signer && (
                <span className={styles['document-signer']}>
                  Người ký: {document.signer}
                </span>
              )}
              {document.status && (
                <span className={styles['document-status']}>
                  Trạng thái: {document.status}
                </span>
              )}
              </div>

              {document.keywords && document.keywords.length > 0 && (
              <div className={styles['document-keywords']}>
                <span className={styles['keywords-label']}>Từ khóa:</span>
                  {document.keywords.map((keyword, index) => (
                  <span key={index} className={styles['keyword-tag']}>{keyword}</span>
                  ))}
                </div>
              )}
            </div>
            
            {document.summary && (
            <div className={styles['document-summary']}>
              <h2 className={styles['summary-title']}>Trích yếu</h2>
              <p className={styles['summary-text']}>{document.summary}</p>
              </div>
            )}
            
          <div className={styles['document-content']}>
            <h2 className={styles['content-title']}>Nội dung văn bản</h2>
            <div className={styles['content-text']}>
              {document.content ? (
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(document.content) }} />
              ) : (
                <p>Không có nội dung chi tiết cho văn bản này. Vui lòng tải file đính kèm để xem chi tiết.</p>
              )}
              </div>
            </div>
            
          <div className={styles['document-footer']}>
            <div className={styles['document-actions']}>
              <button onClick={handlePrint} className={`${styles['action-button']} ${styles.print}`}>
                  <FontAwesomeIcon icon={faPrint} /> In văn bản
                </button>
              <button onClick={handleDownload} className={`${styles['action-button']} ${styles.download}`}>
                <FontAwesomeIcon icon={faDownload} /> Tải xuống
              </button>
              <button onClick={handleShare} className={`${styles['action-button']} ${styles.share}`}>
                  <FontAwesomeIcon icon={faShare} /> Chia sẻ
                </button>
                <button 
                className={`${styles['action-button']} ${styles.favorite} ${isFavorite ? styles.active : ''}`} 
                onClick={toggleFavorite}
              >
                <FontAwesomeIcon icon={isFavorite ? faStar : faStarRegular} />
                {isFavorite ? " Đã yêu thích" : " Yêu thích"}
              </button>
              <button 
                className={`${styles['action-button']} ${styles.bookmark} ${isBookmarked ? styles.active : ''}`} 
                onClick={toggleBookmark}
                >
                <FontAwesomeIcon icon={isBookmarked ? faBookmark : faBookmarkRegular} />
                {isBookmarked ? " Đã đánh dấu" : " Đánh dấu"}
                </button>
              </div>
            </div>
          </div>
      </div>
    </>
  );
};

export default DocumentDetail; 