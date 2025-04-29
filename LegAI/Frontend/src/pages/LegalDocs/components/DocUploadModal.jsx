import { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import styles from './DocUploadModal.module.css';
import PropTypes from 'prop-types';
import * as legalDocService from '../../../services/legalDocService';

const DocUploadModal = ({ categories, onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileType, setFileType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: ''
  });
  const fileInputRef = useRef(null);

  // Xử lý thay đổi file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Kiểm tra kích thước file (tối đa 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 10MB');
      return;
    }

    // Lấy định dạng file
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    setFileType(fileExtension);

    // Tạo file preview nếu là ảnh
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }

    // Cập nhật tiêu đề mặc định từ tên file
    if (!formData.title) {
      const fileName = selectedFile.name.split('.')[0];
      setFormData({
        ...formData,
        title: fileName
      });
    }

    setFile(selectedFile);
  };

  // Xử lý thay đổi dữ liệu form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Hàm mở cửa sổ chọn file
  const openFileSelector = () => {
    fileInputRef.current.click();
  };

  // Xử lý tải lên file
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Vui lòng chọn file để tải lên');
      return;
    }

    if (!formData.title || !formData.category) {
      toast.error('Vui lòng nhập tiêu đề và chọn danh mục');
      return;
    }

    setUploading(true);

    try {
      // Tạo FormData để gửi lên server
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);

      // Xử lý tags
      if (formData.tags) {
        // Chuyển chuỗi tags thành mảng
        const tagsArray = formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag);

        // Thêm tags vào FormData
        uploadData.append('tags', JSON.stringify(tagsArray));
      }

      // Gửi yêu cầu tải lên
      const response = await legalDocService.uploadLegalDoc(uploadData);

      if (response.success) {
        onSuccess(response.data);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra khi tải lên hồ sơ');
      }
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi tải lên hồ sơ');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Tải lên hồ sơ pháp lý mới</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <form onSubmit={handleSubmit}>
            <div className={styles.fileUploadArea}>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileChange}
                className={styles.fileInput}
                ref={fileInputRef}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
              />

              {!file ? (
                <div className={styles.dropZone} onClick={openFileSelector}>
                  <i className="fas fa-cloud-upload-alt"></i>
                  <p>Kéo thả file vào đây hoặc nhấp để chọn file</p>
                  <span>PDF, DOCX, JPG, PNG (tối đa 10MB)</span>
                </div>
              ) : (
                <div className={styles.filePreview}>
                  {filePreview ? (
                    <img src={filePreview} alt="Preview" className={styles.imagePreview} />
                  ) : (
                    <div className={styles.fileIcon}>
                      <i className={`fas fa-file-${getFileIcon(fileType)}`}></i>
                    </div>
                  )}
                  <div className={styles.fileInfo}>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileSize}>{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileButton}
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Tiêu đề</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Nhập tiêu đề hồ sơ"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả ngắn về hồ sơ"
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
          </form>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={uploading}
          >
            Hủy
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!file || !formData.title || !formData.category || uploading}
          >
            {uploading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Đang tải lên...
              </>
            ) : (
              <>
                <i className="fas fa-upload"></i> Tải lên
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Hàm hỗ trợ xác định icon dựa vào loại file
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

DocUploadModal.propTypes = {
  categories: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

export default DocUploadModal; 