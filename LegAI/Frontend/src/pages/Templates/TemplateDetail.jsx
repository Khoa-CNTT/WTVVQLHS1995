import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaGlobe, FaRegFileAlt, FaDownload, FaEdit, FaSpinner } from 'react-icons/fa';
import styles from './TemplateDetail.module.css';
import legalService from '../../services/legalService';
import Navbar from '../../components/layout/Nav/Navbar';

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplateDetail = async () => {
      try {
        setLoading(true);
        const response = await legalService.getDocumentTemplateById(id);
        setTemplate(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Lỗi khi tải chi tiết mẫu:', err);
        setError('Không thể tải chi tiết mẫu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };

    fetchTemplateDetail();
  }, [id]);

  const handleBack = () => {
    navigate('/templates');
  };

  const handleDownload = () => {
    // Xử lý tải xuống mẫu tài liệu
    alert('Tính năng tải xuống mẫu sẽ được thực hiện trong tương lai.');
  };


  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles['template-detail-container']}>
          <div className={styles['loading']}>
            <FaSpinner className={styles['spinner']} />
            <p>Đang tải chi tiết mẫu...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className={styles['template-detail-container']}>
          <div className={styles['error']}>
            <p>{error}</p>
          </div>
          <button onClick={handleBack} className={styles['back-button']}>
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </>
    );
  }

  if (!template) {
    return (
      <>
        <Navbar />
        <div className={styles['template-detail-container']}>
          <div className={styles['not-found']}>
            <h2>Không tìm thấy mẫu</h2>
            <p>Mẫu tài liệu bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button onClick={handleBack} className={styles['back-button']}>
              <FaArrowLeft /> Quay lại danh sách mẫu
            </button>
          </div>
        </div>
      </>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Navbar />
      <div className={styles['template-detail-container']}>
        <div className={styles['action-bar']}>
          <button onClick={handleBack} className={styles['back-button']}>
            <FaArrowLeft /> Quay lại
          </button>
          <div className={styles['action-buttons']}>
            <button onClick={handleDownload} className={styles['download-button']}>
              <FaDownload /> Tải xuống
            </button>
          </div>
        </div>

        <div className={styles['template-header']}>
          <span className={styles['template-type-badge']}>{template.template_type}</span>
          <h1 className={styles['template-title']}>{template.title}</h1>
          <div className={styles['template-meta']}>
            <span className={styles['template-date']}>
              <FaCalendarAlt /> Tạo ngày: {formatDate(template.created_at)}
            </span>
            <span className={styles['template-language']}>
              <FaGlobe /> Ngôn ngữ: {template.language || 'Tiếng Việt'}
            </span>
            <span className={styles['template-format']}>
              <FaRegFileAlt /> Định dạng: {template.format || 'DOCX'}
            </span>
          </div>
        </div>

        <div className={styles['template-content']}>
          <div className={styles['content-section']}>
            <h2 className={styles['section-title']}>Nội dung mẫu</h2>
            <div className={styles['template-content-text']}>
              {template.content ? (
                <div dangerouslySetInnerHTML={{ __html: template.content }} />
              ) : (
                <p>Không có nội dung cho mẫu này.</p>
              )}
            </div>
          </div>

          <div className={styles['content-section']}>
            <h2 className={styles['section-title']}>Hướng dẫn sử dụng</h2>
            <div className={styles['usage-instructions']}>
              <p>Hướng dẫn sử dụng mẫu văn bản:</p>
              <ol>
                <li>Tải xuống mẫu bằng cách nhấp vào nút "Tải xuống" phía trên.</li>
                <li>Mở tệp tin trong Microsoft Word hoặc phần mềm soạn thảo văn bản tương tự.</li>
                <li>Điền thông tin vào các trường được đánh dấu (thường nằm trong dấu ngoặc vuông [...]).</li>
                <li>Lưu tài liệu sau khi hoàn thành.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateDetail; 