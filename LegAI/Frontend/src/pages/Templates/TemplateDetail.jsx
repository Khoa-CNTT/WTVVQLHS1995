import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import legalService from '../../services/legalService';
import styles from './TemplateDetail.module.css';
import Navbar from '../../components/layout/Nav/Navbar';
import ChatManager from '../../components/layout/Chat/ChatManager';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faDownload, 
  faPrint, 
  faShare, 
  faHome,
  faCalendarAlt,
  faLanguage,
  faFileAlt,
  faUser,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

const TemplateDetail = () => {
  const { id } = useParams();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await legalService.getDocumentTemplateById(id);
        if (response.status === 'success') {
          setTemplate(response.data);
        } else {
          setError('Không thể tải thông tin mẫu văn bản');
        }
      } catch (error) {
        console.error('Lỗi khi lấy thông tin mẫu văn bản:', error);
        setError('Đã xảy ra lỗi khi tải thông tin mẫu văn bản. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <>
      <Navbar />
      <div className={styles["template-detail-container"]}>
        {loading ? (
          <div className={styles.loading}>Đang tải thông tin mẫu văn bản...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : template ? (
          <div className={styles["template-detail"]}>
            <div className={styles["template-header"]}>
              <div className={styles["breadcrumb"]}>
                <Link to="/" className={styles["breadcrumb-item"]}>
                  <FontAwesomeIcon icon={faHome} /> Trang chủ
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className={styles["breadcrumb-separator"]} />
                <Link to="/templates" className={styles["breadcrumb-item"]}>
                  Mẫu văn bản
                </Link>
                <FontAwesomeIcon icon={faChevronRight} className={styles["breadcrumb-separator"]} />
                <span className={styles["breadcrumb-item-active"]}>{template.title}</span>
              </div>
              
              <h1 className={styles["template-title"]}>{template.title}</h1>
              <div className={styles["template-meta"]}>
                <span className={styles["template-type"]}>
                  <FontAwesomeIcon icon={faFileAlt} /> {template.template_type}
                </span>
                <span className={styles["template-date"]}>
                  <FontAwesomeIcon icon={faCalendarAlt} /> Cập nhật: {formatDate(template.updated_at || template.created_at)}
                </span>
                <span className={styles["template-language"]}>
                  <FontAwesomeIcon icon={faLanguage} /> {template.language || 'Tiếng Việt'}
                </span>
                {template.author && (
                  <span className={styles["template-author"]}>
                    <FontAwesomeIcon icon={faUser} /> {template.author}
                  </span>
                )}
              </div>
            </div>
            
            {template.description && (
              <div className={styles["template-description"]}>
                <h2 className={styles["description-title"]}>Mô tả</h2>
                <p className={styles["description-text"]}>{template.description}</p>
              </div>
            )}
            
            <div className={styles["template-content"]}>
              <h2 className={styles["content-title"]}>Nội dung mẫu văn bản</h2>
              <div className={styles["content-wrapper"]}>
                <pre className={styles["content-text"]}>
                  {template.content}
                </pre>
              </div>
            </div>
            
            {template.instructions && (
              <div className={styles["template-instructions"]}>
                <h2 className={styles["instructions-title"]}>Hướng dẫn sử dụng</h2>
                <div className={styles["instructions-text"]}>
                  {template.instructions.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            <div className={styles["template-footer"]}>
              <div className={styles["template-actions"]}>
                <button className={`${styles["action-button"]} ${styles.print}`}>
                  <FontAwesomeIcon icon={faPrint} /> In mẫu văn bản
                </button>
                <button className={`${styles["action-button"]} ${styles.download}`}>
                  <FontAwesomeIcon icon={faDownload} /> Tải xuống
                </button>
                <button className={`${styles["action-button"]} ${styles.share}`}>
                  <FontAwesomeIcon icon={faShare} /> Chia sẻ
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles["not-found"]}>Không tìm thấy mẫu văn bản</div>
        )}
      </div>
      <ChatManager />
    </>
  );
};

export default TemplateDetail; 