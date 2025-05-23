import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './DocumentDetail.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import legalService from '../../services/legalService';
import Loader from '../../components/layout/Loading/Loading';
import { FaRegFilePdf, FaShare, FaStar, FaBookmark, FaRegCalendarAlt, FaTag, FaExternalLinkAlt, FaBalanceScale, FaSearch, FaBrain } from 'react-icons/fa';
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
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

  // Phân tích văn bản pháp luật bằng AI
  const handleAnalyzeDocument = async () => {
    try {
      setAnalyzing(true);
      setShowAnalysis(true);
      
      // Hiển thị thông báo
      toast.info('Đang phân tích văn bản pháp luật...', {
        autoClose: 3000,
        position: 'top-right'
      });
      
      // Gọi API để phân tích
      const response = await legalService.analyzeLegalDocument(id);
      
      // Lưu ý: hàm analyzeLegalDocument đã được sửa đổi để luôn trả về status: 'success'
      // và data mặc định ngay cả khi có lỗi xảy ra
      if (response.data) {
        setAnalysisResult(response.data);
        
        // Hiển thị toast thành công nếu không có thông báo lỗi
        if (!response.message || !response.message.includes('lỗi')) {
          toast.success('Phân tích văn bản thành công!', {
            autoClose: 3000,
            position: 'top-right'
          });
        } 
        // Nếu có thông báo lỗi trong message, hiển thị cảnh báo
        else {
          toast.warning(response.message || 'Phân tích văn bản có thể không đầy đủ', {
            autoClose: 5000,
            position: 'top-right'
          });
        }
      } else {
        // Trường hợp hiếm gặp: không có dữ liệu nhưng không có lỗi
        toast.warning('Không nhận được dữ liệu phân tích chi tiết', {
          autoClose: 3000,
          position: 'top-right'
        });
        
        // Tạo dữ liệu mặc định để hiển thị
        setAnalysisResult({
          summary: "Không thể tạo tóm tắt văn bản",
          key_points: ["Hệ thống không thể phân tích văn bản này", "Vui lòng thử lại sau"],
          legal_analysis: "Không có kết quả phân tích",
          related_fields: ["Pháp luật"],
          recommendations: "Vui lòng đọc trực tiếp nội dung văn bản",
          potential_issues: "Không có thông tin"
        });
      }
    } catch (error) {
      // Lỗi này chỉ xảy ra nếu có vấn đề với việc hiển thị UI, vì hàm analyzeLegalDocument
      // đã được thiết kế để không ném lỗi
      console.error('Lỗi không mong đợi khi phân tích văn bản:', error);
      toast.error('Không thể phân tích văn bản do lỗi hệ thống. Vui lòng thử lại sau.', {
        autoClose: 5000, 
        position: 'top-right'
      });
      
      // Tạo dữ liệu mặc định để hiển thị
      setAnalysisResult({
        summary: "Không thể phân tích văn bản pháp luật",
        key_points: ["Hệ thống gặp lỗi", "Vui lòng thử lại sau"],
        legal_analysis: "Lỗi khi phân tích",
        related_fields: ["Pháp luật"],
        recommendations: "Vui lòng thử lại sau hoặc liên hệ hỗ trợ kỹ thuật",
        potential_issues: "Không có thông tin"
      });
    } finally {
      // Giữ trạng thái loading thêm một chút để skeleton loading hiển thị rõ ràng hơn
      setTimeout(() => {
        setAnalyzing(false);
      }, 500);
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
                  className={`${styles['action-button']} ${styles.research}`}
                  onClick={handleAnalyzeDocument}
                  disabled={analyzing}
                >
                  <FaBrain /> {analyzing ? 'Đang phân tích...' : 'Nghiên cứu'}
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

            {/* Phần hiển thị kết quả phân tích */}
            {showAnalysis && (
              <div className={styles['analysis-container']}>
                <h2 className={styles['analysis-title']}>
                  <FaBrain /> Kết quả nghiên cứu văn bản pháp luật
                  <button 
                    className={styles['close-analysis']}
                    onClick={() => setShowAnalysis(false)}
                  >
                    ×
                  </button>
                </h2>
                
                {analyzing ? (
                  <div className={styles['analysis-content']}>
                    {/* Skeleton loading cho phần tóm tắt */}
                    <div className={styles['analysis-section']}>
                      <h3>Tóm tắt</h3>
                      <div className={styles['skeleton-text']}>
                        <div className={styles['skeleton-line']} style={{ width: '100%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '95%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '90%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '97%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skeleton loading cho phần điểm chính */}
                    <div className={styles['analysis-section']}>
                      <h3>Điểm chính</h3>
                      <div className={styles['skeleton-list']}>
                        <div className={styles['skeleton-bullet']}>
                          <div className={styles['skeleton-dot']}></div>
                          <div className={styles['skeleton-line']} style={{ width: '90%' }}></div>
                        </div>
                        <div className={styles['skeleton-bullet']}>
                          <div className={styles['skeleton-dot']}></div>
                          <div className={styles['skeleton-line']} style={{ width: '85%' }}></div>
                        </div>
                        <div className={styles['skeleton-bullet']}>
                          <div className={styles['skeleton-dot']}></div>
                          <div className={styles['skeleton-line']} style={{ width: '80%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Skeleton loading cho phần phân tích pháp lý */}
                    <div className={styles['analysis-section']}>
                      <h3>Phân tích pháp lý</h3>
                      <div className={styles['skeleton-text']}>
                        <div className={styles['skeleton-line']} style={{ width: '100%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '98%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '95%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '90%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skeleton loading cho phần lĩnh vực liên quan */}
                    <div className={styles['analysis-section']}>
                      <h3>Lĩnh vực liên quan</h3>
                      <div className={styles['skeleton-tags']}>
                        <div className={styles['skeleton-tag']}></div>
                        <div className={styles['skeleton-tag']}></div>
                        <div className={styles['skeleton-tag']}></div>
                      </div>
                    </div>
                    
                    {/* Skeleton loading cho phần đề xuất */}
                    <div className={styles['analysis-section']}>
                      <h3>Đề xuất</h3>
                      <div className={styles['skeleton-text']}>
                        <div className={styles['skeleton-line']} style={{ width: '100%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '90%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '95%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skeleton loading cho phần vấn đề tiềm ẩn */}
                    <div className={styles['analysis-section']}>
                      <h3>Vấn đề tiềm ẩn</h3>
                      <div className={styles['skeleton-text']}>
                        <div className={styles['skeleton-line']} style={{ width: '95%' }}></div>
                        <div className={styles['skeleton-line']} style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                ) : analysisResult ? (
                  <div className={styles['analysis-content']}>
                    {analysisResult.summary && (
                      <div className={styles['analysis-section']}>
                        <h3>Tóm tắt</h3>
                        <p>{analysisResult.summary}</p>
                      </div>
                    )}
                    
                    {analysisResult.key_points && analysisResult.key_points.length > 0 && (
                      <div className={styles['analysis-section']}>
                        <h3>Điểm chính</h3>
                        <ul>
                          {analysisResult.key_points.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysisResult.legal_analysis && (
                      <div className={styles['analysis-section']}>
                        <h3>Phân tích pháp lý</h3>
                        <p>{analysisResult.legal_analysis}</p>
                      </div>
                    )}
                    
                    {analysisResult.related_fields && analysisResult.related_fields.length > 0 && (
                      <div className={styles['analysis-section']}>
                        <h3>Lĩnh vực liên quan</h3>
                        <div className={styles['tag-container']}>
                          {analysisResult.related_fields.map((field, index) => (
                            <span key={index} className={styles['field-tag']}>
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysisResult.recommendations && (
                      <div className={styles['analysis-section']}>
                        <h3>Đề xuất</h3>
                        <p>{analysisResult.recommendations}</p>
                      </div>
                    )}
                    
                    {analysisResult.potential_issues && (
                      <div className={styles['analysis-section']}>
                        <h3>Vấn đề tiềm ẩn</h3>
                        <p>{analysisResult.potential_issues}</p>
                      </div>
                    )}
                    
                    <div className={styles['analysis-disclaimer']}>
                      <p><strong>Lưu ý:</strong> Phân tích này được thực hiện bởi công nghệ AI và chỉ mang tính tham khảo. Vui lòng tham vấn chuyên gia pháp lý để có thông tin chính xác nhất.</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles['analysis-error']}>
                    <p>Không thể phân tích văn bản này. Vui lòng thử lại sau.</p>
                    <button 
                      className={styles['retry-button']}
                      onClick={handleAnalyzeDocument}
                    >
                      Thử lại
                    </button>
                  </div>
                )}
              </div>
            )}
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