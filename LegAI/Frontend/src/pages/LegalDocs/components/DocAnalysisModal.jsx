import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './DocAnalysisModal.module.css';
import * as legalDocService from '../../../services/legalDocService';
import * as legalDocAIService from '../../../services/legalDocAIService';

const DocAnalysisModal = ({ doc, onClose, onComplete }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Bắt đầu phân tích khi mở modal
  useEffect(() => {
    if (doc && doc.id) {
      startAnalysis();
    }
  }, [doc]);

  // Mô phỏng tiến trình phân tích
  useEffect(() => {
    let interval;
    if (analyzing && progress < 95) {
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.random() * 10;
          return Math.min(prev + increment, 95);
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analyzing, progress]);

  // Phân tích tài liệu bằng AI
  const startAnalysis = async () => {
    setAnalyzing(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Gọi dịch vụ AI để phân tích tài liệu
      const analysisResult = await legalDocAIService.analyzeLegalDocument(doc);
      
      if (analysisResult.success) {
        setProgress(100);
        setResult(analysisResult.data);
        toast.success('Phân tích hồ sơ pháp lý thành công');
      } else {
        setError(analysisResult.message || 'Không thể phân tích hồ sơ pháp lý');
        toast.error(analysisResult.message || 'Không thể phân tích hồ sơ pháp lý');
      }
    } catch (error) {
      console.error(error);
      setError('Có lỗi xảy ra khi phân tích hồ sơ pháp lý');
      toast.error('Có lỗi xảy ra khi phân tích hồ sơ pháp lý');
    } finally {
      setAnalyzing(false);
    }
  };

  // Hoàn thành phân tích và đóng modal
  const handleComplete = () => {
    if (onComplete) {
      onComplete(result);
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Phân tích hồ sơ pháp lý bằng AI</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={analyzing}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.docInfo}>
            <div className={styles.docTitle}>
              <i className={`fas fa-file-${getFileIcon(doc.file_type)}`}></i>
              <h3>{doc.title}</h3>
            </div>
          </div>

          <div className={styles.analysisProgress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={styles.progressText}>
              {analyzing ? (
                <>{Math.round(progress)}% - Đang phân tích...</>
              ) : progress === 100 ? (
                <>Hoàn thành!</>
              ) : error ? (
                <>Đã xảy ra lỗi!</>
              ) : (
                <>Chuẩn bị phân tích...</>
              )}
            </div>
          </div>

          {analyzing && (
            <div className={styles.loadingIndicator}>
              <div className={styles.processingText}>
                <i className="fas fa-robot"></i>
                <p>AI đang phân tích nội dung tài liệu của bạn...</p>
              </div>
              <ul className={styles.taskList}>
                <li className={styles.taskItem}>
                  <i className="fas fa-check-circle"></i>
                  <span>Đọc và xử lý văn bản</span>
                </li>
                <li className={`${styles.taskItem} ${progress > 30 ? styles.activeTask : ''}`}>
                  <i className={progress > 30 ? "fas fa-check-circle" : "fas fa-circle"}></i>
                  <span>Phân tích nội dung pháp lý</span>
                </li>
                <li className={`${styles.taskItem} ${progress > 60 ? styles.activeTask : ''}`}>
                  <i className={progress > 60 ? "fas fa-check-circle" : "fas fa-circle"}></i>
                  <span>Xác định các điểm quan trọng</span>
                </li>
                <li className={`${styles.taskItem} ${progress > 85 ? styles.activeTask : ''}`}>
                  <i className={progress > 85 ? "fas fa-check-circle" : "fas fa-circle"}></i>
                  <span>Tạo tóm tắt và phân loại thông tin</span>
                </li>
              </ul>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Không thể phân tích tài liệu</h3>
              <p>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={startAnalysis}
              >
                <i className="fas fa-redo"></i> Thử lại
              </button>
            </div>
          )}

          {result && (
            <div className={styles.resultContainer}>
              <div className={styles.resultHeader}>
                <i className="fas fa-check-circle"></i>
                <h3>Phân tích thành công!</h3>
              </div>

              {result.metadata && (
                <div className={styles.analysisResult}>
                  {result.metadata.summary && (
                    <div className={styles.resultSection}>
                      <h4>Tóm tắt</h4>
                      <p>{result.metadata.summary}</p>
                    </div>
                  )}

                  {result.metadata.keywords && result.metadata.keywords.length > 0 && (
                    <div className={styles.resultSection}>
                      <h4>Từ khóa chính</h4>
                      <div className={styles.keywordsList}>
                        {result.metadata.keywords.map((keyword, index) => (
                          <span key={index} className={styles.keyword}>{keyword}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.metadata.entities && result.metadata.entities.length > 0 && (
                    <div className={styles.resultSection}>
                      <h4>Thực thể quan trọng</h4>
                      <ul className={styles.entitiesList}>
                        {result.metadata.entities.map((entity, index) => (
                          <li key={index}>
                            <strong>{entity.text}</strong> <span>({entity.type})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {result.metadata.recommendations && (
                    <div className={styles.resultSection}>
                      <h4>Đề xuất</h4>
                      <ul className={styles.recommendationsList}>
                        {Array.isArray(result.metadata.recommendations) ? 
                          result.metadata.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          )) : 
                          <li>{result.metadata.recommendations}</li>
                        }
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          {!analyzing && !error && result && (
            <button 
              className={styles.completeButton}
              onClick={handleComplete}
            >
              <i className="fas fa-check"></i> Hoàn thành
            </button>
          )}
          
          {!analyzing && (
            <button 
              className={styles.cancelButton}
              onClick={onClose}
            >
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Hàm xác định icon dựa trên loại file
const getFileIcon = (fileType) => {
  const type = fileType ? fileType.toLowerCase() : '';
  
  switch (type) {
    case 'pdf':
      return 'pdf';
    case 'docx':
    case 'doc':
      return 'word';
    case 'xlsx':
    case 'xls':
      return 'excel';
    case 'pptx':
    case 'ppt':
      return 'powerpoint';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'image';
    case 'txt':
      return 'alt';
    default:
      return 'alt';
  }
};

export default DocAnalysisModal; 