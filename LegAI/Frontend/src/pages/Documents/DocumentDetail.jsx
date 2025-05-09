import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './DocumentDetail.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';
import Loader from '../../components/layout/Loading/Loading';
import { FaRegFilePdf, FaShare, FaStar, FaBookmark, FaRegCalendarAlt, FaTag, FaExternalLinkAlt, FaBalanceScale, FaSearchPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import DocumentAnalysis from '../../components/AI/DocumentAnalysis';

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
  const [showAnalysis, setShowAnalysis] = useState(false);

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
  const handleDownload = async () => {
    if (document?.id) {
      try {
        // Hiển thị thông báo đang chuẩn bị
        toast.info('Đang chuẩn bị tệp tải xuống...');
        
        // Tạo HTML trực tiếp từ client side để đảm bảo nội dung tiếng Việt hiển thị đúng
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="vi">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${document.title}</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 2cm;
                }
              }
              
              body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 14px;
                line-height: 1.5;
                color: #000;
                margin: 0;
                padding: 20px;
                background-color: #fff;
              }
              
              .document-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #fff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
              
              .header {
                text-align: center;
                margin-bottom: 20px;
              }
              
              .title {
                font-weight: bold;
                font-size: 18px;
                text-align: center;
                margin: 20px 0;
              }
              
              .metadata {
                margin-bottom: 20px;
                font-style: italic;
              }
              
              .content {
                text-align: justify;
              }
              
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              
              hr {
                border: none;
                border-top: 1px solid #ccc;
                margin: 20px 0;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              
              th {
                background-color: #f2f2f2;
                font-weight: bold;
              }
              
              .page-number {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="document-container">
              <div class="header">
                <strong>VĂN BẢN PHÁP LUẬT</strong>
              </div>
              
              <div class="title">${document.title}</div>
              
              <div class="metadata">
                <p>Loại văn bản: ${document.document_type}</p>
                <p>Ngày ban hành: ${new Date(document.issued_date).toLocaleDateString("vi-VN")}</p>
                ${document.document_number ? `<p>Số hiệu: ${document.document_number}</p>` : ""}
              </div>
              
              <hr>
              
              <div class="content">
                ${document.content || ''}
              </div>
              
              <div class="footer">
                <p>Tải xuống từ Hệ thống LegAI - ${new Date().toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
            
            <script>
              // Script để tạo nút in khi tài liệu được mở
              window.onload = function() {
                if (typeof window.print === 'function') {
                  const printButton = document.createElement('button');
                  printButton.innerText = 'In tài liệu';
                  printButton.style.padding = '8px 16px';
                  printButton.style.margin = '20px auto';
                  printButton.style.display = 'block';
                  printButton.style.backgroundColor = '#4CAF50';
                  printButton.style.color = 'white';
                  printButton.style.border = 'none';
                  printButton.style.borderRadius = '4px';
                  printButton.style.cursor = 'pointer';
                  printButton.onclick = function() { window.print(); };
                  document.body.appendChild(printButton);
                }
              };
            </script>
          </body>
          </html>
        `;
        
        // Tạo Blob HTML
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        
        // Tạo URL để tải xuống
        const url = URL.createObjectURL(blob);
        
        // Tạo thẻ a để tải xuống - sử dụng window.document thay vì document để tránh xung đột
        const downloadLink = window.document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = `${document.title.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.html`;
        downloadLink.style.display = 'none';
        
        // Thêm vào body, click và xóa
        window.document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // Dọn dẹp
        setTimeout(() => {
          URL.revokeObjectURL(url);
          window.document.body.removeChild(downloadLink);
        }, 1000);
        
        toast.success('Tải xuống tài liệu thành công!');
      } catch (error) {
        console.error('Lỗi khi tải xuống tài liệu:', error);
        toast.error('Không thể tải xuống tài liệu. Vui lòng thử lại sau.');
      }
    } else {
      toast.error('Không thể tải xuống tài liệu. Không tìm thấy ID tài liệu.');
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

  // Xử lý khi người dùng muốn phân tích văn bản
  const handleAnalyze = () => {
    if (document?.id) {
      setShowAnalysis(true);
      toast.info('Đang chuẩn bị phân tích văn bản...');
    } else {
      toast.error('Không thể phân tích văn bản. Không tìm thấy nội dung văn bản.');
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
                <Link 
                  to={`/legal/documents/${document.id}/compare`} 
                  className={`${styles['action-button']} ${styles.compare}`}
                >
                  <FaBalanceScale /> So sánh
                </Link>
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
                <button 
                  className={`${styles['action-button']} ${styles.analyze}`}
                  onClick={handleAnalyze}
                >
                  <FaSearchPlus /> Nghiên cứu
                </button>
              </div>
            </div>

            {/* Component phân tích văn bản */}
            <DocumentAnalysis
              documentId={document.id}
              documentTitle={document.title}
              documentContent={document.content}
              visible={showAnalysis}
              onClose={() => setShowAnalysis(false)}
            />
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