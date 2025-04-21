import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './DocumentDetail.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faPrint, 
  faDownload, 
  faShare, 
  faStar, 
  faBookmark,
  faArrowLeft,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '../../components/layout/Nav/Navbar';

// Dữ liệu mẫu dựa trên cấu trúc bảng từ database.sql
const mockLegalDocuments = [
  {
    id: 1,
    title: 'Luật hình sự số 100/2015/QH13',
    document_type: 'Luật',
    version: '2015',
    content: `<h2>QUỐC HỘI</h2>
    <p>Luật số: 100/2015/QH13</p>
    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>Độc lập - Tự do - Hạnh phúc</p>
    <h1 style="text-align: center;">BỘ LUẬT HÌNH SỰ</h1>
    <p>Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;</p>
    <p>Quốc hội ban hành Bộ luật hình sự.</p>
    <h2>Phần thứ nhất: NHỮNG QUY ĐỊNH CHUNG</h2>
    <h3>Chương I: ĐIỀU KHOẢN CƠ BẢN</h3>
    <p><strong>Điều 1. Nhiệm vụ của Bộ luật hình sự</strong></p>
    <p>Bộ luật hình sự có nhiệm vụ bảo vệ chủ quyền quốc gia, an ninh của đất nước, bảo vệ chế độ xã hội chủ nghĩa, quyền con người, quyền công dân, bảo vệ quyền bình đẳng giữa đồng bào các dân tộc, bảo vệ lợi ích của Nhà nước, tổ chức, bảo vệ trật tự pháp luật, chống mọi hành vi phạm tội; đồng thời giáo dục mọi người ý thức tuân theo pháp luật, phòng ngừa và đấu tranh chống tội phạm.</p>
    <p>Bộ luật này quy định về tội phạm và hình phạt.</p>`,
    summary: 'Luật hình sự quy định về tội phạm và hình phạt, được Quốc hội nước Cộng hòa Xã hội Chủ nghĩa Việt Nam thông qua năm 2015 và có hiệu lực từ ngày 01/01/2018.',
    issued_date: '2015-11-27',
    effective_date: '2018-01-01',
    issuing_body: 'Quốc hội',
    signer: 'Nguyễn Sinh Hùng',
    effect_status: 'Còn hiệu lực',
    language: 'Tiếng Việt',
    keywords: ['Luật hình sự', 'Tội phạm', 'Hình phạt']
  },
  {
    id: 2,
    title: 'Luật dân sự số 91/2015/QH13',
    document_type: 'Luật',
    version: '2015',
    content: `<h2>QUỐC HỘI</h2>
    <p>Luật số: 91/2015/QH13</p>
    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>Độc lập - Tự do - Hạnh phúc</p>
    <h1 style="text-align: center;">BỘ LUẬT DÂN SỰ</h1>
    <p>Căn cứ Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam;</p>
    <p>Quốc hội ban hành Bộ luật dân sự.</p>
    <h2>Phần thứ nhất: QUY ĐỊNH CHUNG</h2>
    <h3>Chương I: NHỮNG QUY ĐỊNH CHUNG</h3>
    <p><strong>Điều 1. Phạm vi điều chỉnh</strong></p>
    <p>Bộ luật này quy định địa vị pháp lý, chuẩn mực pháp lý cho cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản của cá nhân, pháp nhân trong các quan hệ được hình thành trên cơ sở bình đẳng, tự do ý chí, độc lập về tài sản và tự chịu trách nhiệm.</p>`,
    summary: 'Bộ luật dân sự quy định địa vị pháp lý, chuẩn mực pháp lý cho cách ứng xử của cá nhân, pháp nhân, chủ thể khác; quyền và nghĩa vụ của các chủ thể về nhân thân và tài sản.',
    issued_date: '2015-11-24',
    effective_date: '2017-01-01',
    issuing_body: 'Quốc hội',
    signer: 'Nguyễn Sinh Hùng',
    effect_status: 'Còn hiệu lực',
    language: 'Tiếng Việt',
    keywords: ['Luật dân sự', 'Quyền và nghĩa vụ', 'Tài sản']
  },
  {
    id: 3,
    title: 'Nghị định 102/2020/NĐ-CP',
    document_type: 'Nghị định',
    version: '2020',
    content: `<h2>CHÍNH PHỦ</h2>
    <p>Số: 102/2020/NĐ-CP</p>
    <p>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>Độc lập - Tự do - Hạnh phúc</p>
    <h1 style="text-align: center;">NGHỊ ĐỊNH<br/>Quy định chế độ hưu trí đối với quân nhân trực tiếp tham gia kháng chiến chống Mỹ cứu nước từ ngày 30/4/1975 trở về trước</h1>
    <p>Căn cứ Luật Tổ chức Chính phủ ngày 19 tháng 6 năm 2015;</p>
    <p>Căn cứ Luật Ngân sách nhà nước ngày 25 tháng 6 năm 2015;</p>
    <p>Theo đề nghị của Bộ trưởng Bộ Quốc phòng;</p>
    <p>Chính phủ ban hành Nghị định quy định chế độ hưu trí đối với quân nhân trực tiếp tham gia kháng chiến chống Mỹ cứu nước từ ngày 30/4/1975 trở về trước.</p>`,
    summary: 'Quy định về chế độ hưu trí đối với quân nhân trực tiếp tham gia kháng chiến chống Mỹ cứu nước từ ngày 30/4/1975 trở về trước.',
    issued_date: '2020-09-01',
    effective_date: '2020-10-15',
    issuing_body: 'Chính phủ',
    signer: 'Nguyễn Xuân Phúc',
    effect_status: 'Còn hiệu lực',
    language: 'Tiếng Việt',
    keywords: ['Chế độ hưu trí', 'Quân nhân', 'Kháng chiến']
  }
];

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  // Lấy thông tin chi tiết văn bản
  const fetchDocument = async () => {
    try {
      setLoading(true);
      
      // Tìm văn bản trong dữ liệu mẫu
      const docId = parseInt(id);
      const foundDocument = mockLegalDocuments.find(doc => doc.id === docId);
      
      if (foundDocument) {
        setDocument(foundDocument);
        setError(null);
        // Cập nhật tiêu đề trang
        document.title = `${foundDocument.title || 'Văn bản pháp luật'} | LegAI`;
        
        // Kiểm tra xem văn bản có trong danh sách yêu thích và đánh dấu không
        // Trong thực tế, đây sẽ là lưu trữ trong localStorage hoặc từ database
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        
        setIsFavorite(favorites.includes(docId));
        setIsBookmarked(bookmarks.includes(docId));
      } else {
        throw new Error('Không tìm thấy văn bản');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin văn bản:', error);
      setError('Đã xảy ra lỗi khi tải thông tin văn bản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái văn bản
  const checkDocumentStatus = () => {
    if (!document) return '';
    
    const isActive = document.status === 'active' || document.effect_status === 'Còn hiệu lực';
    return isActive ? 'Còn hiệu lực' : 'Hết hiệu lực';
  };

  // Xử lý thêm/xóa yêu thích
  const toggleFavorite = () => {
    const docId = parseInt(id);
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      // Xóa khỏi danh sách yêu thích
      const updatedFavorites = favorites.filter(id => id !== docId);
      localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } else {
      // Thêm vào danh sách yêu thích
      localStorage.setItem('favorites', JSON.stringify([...favorites, docId]));
    }
    
    setIsFavorite(!isFavorite);
  };

  // Xử lý thêm/xóa đánh dấu
  const toggleBookmark = () => {
    const docId = parseInt(id);
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    
    if (isBookmarked) {
      // Xóa khỏi danh sách đánh dấu
      const updatedBookmarks = bookmarks.filter(id => id !== docId);
      localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    } else {
      // Thêm vào danh sách đánh dấu
      localStorage.setItem('bookmarks', JSON.stringify([...bookmarks, docId]));
    }
    
    setIsBookmarked(!isBookmarked);
  };

  // Định dạng ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Nếu không thể parse được, trả về chuỗi ban đầu
        return dateString;
      }
      
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // In văn bản
  const handlePrint = () => {
    window.print();
  };

  // Tải xuống văn bản
  const handleDownload = () => {
    alert('Tính năng tải xuống đang được phát triển');
  };

  // Chia sẻ văn bản
  const handleShare = () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: document?.title || 'Chia sẻ văn bản pháp luật',
        text: `Xem văn bản: ${document?.title}`,
        url: shareUrl
      }).catch(err => {
        console.error('Lỗi khi chia sẻ:', err);
      });
    } else {
      // Sao chép URL vào clipboard nếu Web Share API không khả dụng
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert('Đã sao chép liên kết vào clipboard');
        })
        .catch(err => {
          console.error('Lỗi khi sao chép:', err);
        });
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles['document-detail-container']}>
        {loading ? (
          <div className={styles.loading}>
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>Đang tải thông tin văn bản...</span>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{error}</span>
            <div className={styles['navigation-buttons']}>
              <Link to="/" className={styles['home-button']}>
                <FontAwesomeIcon icon={faHome} /> Trang chủ
              </Link>
              <Link to="/documents" className={styles['back-link']}>
                <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách
              </Link>
            </div>
          </div>
        ) : document ? (
          <div className={styles['document-detail']}>
            <div className={styles['navigation-buttons']}>
              <Link to="/" className={styles['home-button']}>
                <FontAwesomeIcon icon={faHome} /> Trang chủ
              </Link>
              <Link to="/documents" className={styles['back-link']}>
                <FontAwesomeIcon icon={faArrowLeft} /> Quay lại danh sách
              </Link>
            </div>

            <div className={styles['document-header']}>
              <h1 className={styles['document-title']}>{document.title}</h1>
              
              <div className={styles['document-meta']}>
                <span className={styles['document-type']}>
                  {document.document_type || document.template_type || 'Văn bản'}
                </span>
                
                {document.document_number && (
                  <span className={styles['document-number']}>
                    Số: {document.document_number}
                  </span>
                )}
                
                {document.version && (
                  <span className={styles['document-number']}>
                    Phiên bản: {document.version}
                  </span>
                )}
                
                {document.issued_date && (
                  <span className={styles['document-date']}>
                    Ngày ban hành: {formatDate(document.issued_date)}
                  </span>
                )}
                
                {document.effective_date && (
                  <span className={styles['document-date']}>
                    Ngày hiệu lực: {formatDate(document.effective_date)}
                  </span>
                )}
                
                {document.issuing_body && (
                  <span className={styles['document-issuer']}>
                    Cơ quan ban hành: {document.issuing_body}
                  </span>
                )}
                
                {document.signer && (
                  <span className={styles['document-signer']}>
                    Người ký: {document.signer}
                  </span>
                )}
                
                <span className={styles['document-status']}>
                  Trạng thái: {checkDocumentStatus()}
                </span>
              </div>
              
              {document.keywords && document.keywords.length > 0 && (
                <div className={styles['document-keywords']}>
                  <span className={styles['keywords-label']}>Từ khóa:</span>
                  {document.keywords.map((keyword, index) => (
                    <span key={index} className={styles['keyword-tag']}>
                      {keyword}
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
                dangerouslySetInnerHTML={{ __html: document.content }}
              />
            </div>
            
            <div className={styles['document-footer']}>
              <div className={styles['document-actions']}>
                <button 
                  className={`${styles['action-button']} ${styles.print}`} 
                  onClick={handlePrint}
                >
                  <FontAwesomeIcon icon={faPrint} /> In
                </button>
                
                <button 
                  className={`${styles['action-button']} ${styles.download}`} 
                  onClick={handleDownload}
                >
                  <FontAwesomeIcon icon={faDownload} /> Tải xuống
                </button>
                
                <button 
                  className={`${styles['action-button']} ${styles.share}`} 
                  onClick={handleShare}
                >
                  <FontAwesomeIcon icon={faShare} /> Chia sẻ
                </button>
                
                <button 
                  className={`${styles['action-button']} ${styles.favorite} ${isFavorite ? styles.active : ''}`} 
                  onClick={toggleFavorite}
                >
                  <FontAwesomeIcon icon={faStar} /> {isFavorite ? 'Đã yêu thích' : 'Yêu thích'}
                </button>
                
                <button 
                  className={`${styles['action-button']} ${styles.bookmark} ${isBookmarked ? styles.active : ''}`} 
                  onClick={toggleBookmark}
                >
                  <FontAwesomeIcon icon={faBookmark} /> {isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.error}>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>Không tìm thấy thông tin văn bản</span>
          </div>
        )}
      </div>
    </>
  );
};

export default DocumentDetail; 