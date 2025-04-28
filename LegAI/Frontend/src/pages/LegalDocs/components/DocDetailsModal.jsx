import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import styles from './DocDetailsModal.module.css';
import * as legalDocService from '../../../services/legalDocService';

const DocDetailsModal = ({ doc, categories, onClose, onUpdate, isOwner }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Khởi tạo dữ liệu form từ doc được truyền vào
  useEffect(() => {
    if (doc) {
      setFormData({
        title: doc.title || '',
        description: doc.description || '',
        category: doc.category || '',
        tags: doc.tags ? (Array.isArray(doc.tags) ? doc.tags.join(', ') : doc.tags) : ''
      });
    }
  }, [doc]);

  // Xử lý thay đổi dữ liệu form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Xử lý cập nhật hồ sơ pháp lý
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.title || !formData.category) {
      toast.error('Vui lòng nhập tiêu đề và chọn danh mục');
      setIsLoading(false);
      return;
    }

    try {
      // Chuẩn bị dữ liệu để cập nhật
      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category
      };

      // Xử lý tags
      if (formData.tags) {
        const tagsArray = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);
        updateData.tags = tagsArray;
      }

      const response = await legalDocService.updateLegalDoc(doc.id, updateData);

      if (response.success) {
        toast.success('Đã cập nhật hồ sơ pháp lý thành công');
        onUpdate(response.data);
      } else {
        toast.error(response.message || 'Không thể cập nhật hồ sơ');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>{isOwner ? 'Chi tiết hồ sơ pháp lý' : 'Xem hồ sơ pháp lý'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.docInfo}>
            <div className={styles.docHeader}>
              <div className={styles.fileIconLarge}>
                <i className={`fas fa-file-${getFileIcon(doc.file_type)}`}></i>
              </div>
              <div className={styles.docMetaInfo}>
                <div className={styles.docType}>
                  <span>{doc.file_type ? doc.file_type.toUpperCase() : 'Tài liệu'}</span>
                </div>
                <div className={styles.docDate}>
                  <i className="far fa-calendar-alt"></i>
                  <span>Tạo: {formatDate(doc.created_at)}</span>
                </div>
                {doc.updated_at && doc.updated_at !== doc.created_at && (
                  <div className={styles.docDate}>
                    <i className="far fa-edit"></i>
                    <span>Cập nhật: {formatDate(doc.updated_at)}</span>
                  </div>
                )}
                <div className={styles.docSize}>
                  <i className="far fa-hdd"></i>
                  <span>{formatFileSize(doc.file_size || 0)}</span>
                </div>
              </div>
            </div>

            {doc.metadata && doc.metadata.analyzed && (
              <div className={styles.aiAnalysis}>
                <div className={styles.aiHeader}>
                  <i className="fas fa-robot"></i>
                  <h3>Phân tích AI</h3>
                </div>
                
                {doc.metadata.document_type && (
                  <div className={styles.aiSection}>
                    <h4>Loại văn bản</h4>
                    <div className={styles.documentType}>
                      <i className="fas fa-file-contract"></i>
                      <span>{doc.metadata.document_type}</span>
                    </div>
                  </div>
                )}
                
                {doc.metadata.summary && (
                  <div className={styles.aiSection}>
                    <h4>Tóm tắt</h4>
                    <p>{doc.metadata.summary}</p>
                  </div>
                )}
                
                {doc.metadata.keywords && doc.metadata.keywords.length > 0 && (
                  <div className={styles.aiSection}>
                    <h4>Từ khóa chính</h4>
                    <div className={styles.aiTags}>
                      {doc.metadata.keywords.map((keyword, index) => (
                        <span key={index} className={styles.aiTag}>{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {doc.metadata.entities && doc.metadata.entities.length > 0 && (
                  <div className={styles.aiSection}>
                    <h4>Thực thể quan trọng</h4>
                    <ul className={styles.aiList}>
                      {doc.metadata.entities.map((entity, index) => (
                        <li key={index}>
                          <span className={styles.entityText}>{entity.text}</span> 
                          <span className={styles.entityType}>{entity.type}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {doc.metadata.recommendations && (
                  <div className={styles.aiSection}>
                    <h4>Đề xuất & Lưu ý</h4>
                    <div className={styles.recommendations}>
                      {Array.isArray(doc.metadata.recommendations) ? 
                        <ul className={styles.aiList}>
                          {doc.metadata.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul> : 
                        <p>{doc.metadata.recommendations}</p>
                      }
                    </div>
                  </div>
                )}
                
                <div className={styles.aiFooter}>
                  <small>Phân tích ngày: {formatDate(doc.metadata.analyzed_at || doc.updated_at)}</small>
                </div>
              </div>
            )}

            {isOwner && (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="title">Tiêu đề</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="description">Mô tả</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="category">Danh mục</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="tags">Từ khóa</label>
                    <input
                      type="text"
                      id="tags"
                      name="tags"
                      value={formData.tags}
                      onChange={handleInputChange}
                      placeholder="Các từ khóa, phân cách bằng dấu phẩy"
                    />
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={styles.saveButton}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Lưu thay đổi
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={styles.downloadButton}
            onClick={() => legalDocService.downloadLegalDoc(doc.id)}
          >
            <i className="fas fa-download"></i> Tải xuống
          </button>
          {isOwner && (
            <button
              className={styles.shareButton}
              onClick={onClose}
            >
              <i className="fas fa-share-alt"></i> Đóng
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

// Hàm format kích thước file
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

export default DocDetailsModal; 