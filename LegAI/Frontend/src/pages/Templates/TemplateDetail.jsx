import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaGlobe, FaRegFileAlt, FaDownload, FaEdit, FaSpinner } from 'react-icons/fa';
import styles from './TemplateDetail.module.css';
import legalService from '../../services/legalService';
import Navbar from '../../components/layout/Nav/Navbar';
import { API_URL } from '../../config/constants';
import { toast } from 'react-toastify';

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

  const handleDownload = async () => {
    if (template?.id) {
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
            <title>${template.title}</title>
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
                text-transform: uppercase;
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
              
              .contract-box {
                border: 1px solid #000;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="document-container">
              <div class="header">
                <strong>MẪU VĂN BẢN</strong>
              </div>
              
              <div class="title">${template.title}</div>
              
              <div class="metadata">
                <p>Loại mẫu: ${template.template_type}</p>
                <p>Ngày tạo: ${new Date(template.created_at).toLocaleDateString("vi-VN")}</p>
              </div>
              
              <hr>
              
              <div class="content">
                ${template.content || ''}
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
        
        // Tạo thẻ a để tải xuống
        const a = document.createElement('a');
        a.href = url;
        a.download = `mau_${template.title.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.html`;
        a.style.display = 'none';
        
        // Thêm vào body, click và xóa
        document.body.appendChild(a);
        a.click();
        
        // Dọn dẹp
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 1000);
        
        toast.success('Tải xuống mẫu văn bản thành công!');
      } catch (error) {
        console.error('Lỗi khi tải xuống mẫu văn bản:', error);
        toast.error('Không thể tải xuống mẫu văn bản. Vui lòng thử lại sau.');
      }
    } else {
      toast.error('Không thể tải xuống mẫu văn bản. Không tìm thấy ID mẫu.');
    }
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
              <FaRegFileAlt /> Định dạng: {template.format || 'PDF'}
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
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateDetail; 