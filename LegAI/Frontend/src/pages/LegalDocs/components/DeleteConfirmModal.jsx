import React from 'react';
import styles from './DeleteConfirmModal.module.css';
import PropTypes from 'prop-types';
import moment from 'moment';
import 'moment/locale/vi';

const DeleteConfirmModal = ({ doc, onClose, onConfirm, isDeleting }) => {
  // Format thời gian
  const formatDate = (dateString) => {
    if (!dateString) return 'Không xác định';
    moment.locale('vi');
    return moment(dateString).format('DD/MM/YYYY HH:mm');
  };

  // Xác định icon dựa trên loại file
  const getFileIcon = (fileType) => {
    const type = fileType ? fileType.toLowerCase() : '';
    
    switch (type) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'docx':
      case 'doc':
        return 'fa-file-word';
      case 'xlsx':
      case 'xls':
        return 'fa-file-excel';
      case 'pptx':
      case 'ppt':
        return 'fa-file-powerpoint';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fa-file-image';
      case 'txt':
        return 'fa-file-alt';
      default:
        return 'fa-file';
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Xác nhận xóa hồ sơ</h2>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.warningIcon}>
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          
          <div className={styles.documentInfo}>
            <div className={styles.documentIcon}>
              <i className={`fas ${getFileIcon(doc.file_type)}`}></i>
            </div>
            <div className={styles.documentDetails}>
              <h3>{doc.title}</h3>
              <p className={styles.documentMeta}>
                {doc.category && <span><i className="fas fa-folder"></i> {doc.category}</span>}
                {doc.file_type && <span><i className="fas fa-file-alt"></i> {doc.file_type.toUpperCase()}</span>}
                {doc.created_at && <span><i className="fas fa-calendar"></i> {formatDate(doc.created_at)}</span>}
              </p>
            </div>
          </div>
          
          <p className={styles.warningText}>
            Bạn có chắc chắn muốn xóa hồ sơ này?
          </p>
          <p className={styles.description}>
            Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến hồ sơ này sẽ bị xóa vĩnh viễn.
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={isDeleting}
          >
            Hủy
          </button>
          <button 
            className={styles.deleteButton} 
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Đang xóa...
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i> Xóa hồ sơ
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

DeleteConfirmModal.propTypes = {
  doc: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool
};

export default DeleteConfirmModal; 