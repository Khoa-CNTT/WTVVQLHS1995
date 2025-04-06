import React from 'react';
import styles from '../UsersManagerPage.module.css';

const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(user.id);
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-exclamation-triangle"></i> Xác Nhận Xóa
          </h2>
          <button className={styles.modalCloseButton} onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.deleteConfirmContent}>
          <div className={styles.warningIcon}>
            <i className="fas fa-trash-alt"></i>
          </div>
          
          <p className={styles.deleteConfirmMessage}>
            Bạn có chắc chắn muốn xóa tài khoản <strong>{user.username}</strong>?
          </p>
          
          <div className={styles.deleteUserInfo}>
            <div className={styles.deleteUserDetail}>
              <span className={styles.deleteUserLabel}>Họ tên:</span>
              <span className={styles.deleteUserValue}>{user.full_name}</span>
            </div>
            <div className={styles.deleteUserDetail}>
              <span className={styles.deleteUserLabel}>Email:</span>
              <span className={styles.deleteUserValue}>{user.email}</span>
            </div>
            <div className={styles.deleteUserDetail}>
              <span className={styles.deleteUserLabel}>Vai trò:</span>
              <span className={styles.deleteUserValue}>{user.role}</span>
            </div>
          </div>
          
          <p className={styles.deleteWarning}>
            Hành động này không thể hoàn tác và tất cả dữ liệu liên quan đến tài khoản này sẽ bị xóa vĩnh viễn.
          </p>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.cancelButton} 
            onClick={onCancel}
          >
            <i className="fas fa-times"></i> Hủy bỏ
          </button>
          <button 
            className={styles.deleteConfirmButton}
            onClick={handleSubmit}
          >
            <i className="fas fa-trash-alt"></i> Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal; 