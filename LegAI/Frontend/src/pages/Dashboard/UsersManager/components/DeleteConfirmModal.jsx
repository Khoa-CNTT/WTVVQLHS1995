import React from 'react';
import styles from '../UsersManagerPage.module.css';

const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
  // Đảm bảo user có giá trị
  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Đang xóa user ID:", user.id); // Thêm log để debug
    onConfirm(user);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.modalDelete}`}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <i className="fas fa-exclamation-triangle"></i> Xác nhận xóa người dùng
          </h3>
          <button className={styles.modalCloseButton} onClick={onCancel}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.deleteWarning}>
            <i className="fas fa-trash-alt"></i>
            <p>
              Bạn có chắc chắn muốn xóa người dùng <strong>{user.username}</strong> không?
            </p>
            <p className={styles.warningText}>
              <strong>Cảnh báo:</strong> Hành động này sẽ xóa <strong>hoàn toàn</strong> người dùng
              và <strong>tất cả dữ liệu liên quan</strong> khỏi cơ sở dữ liệu.
              Hành động này <strong>không thể hoàn tác</strong>.
            </p>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={`${styles.deleteButton} ${styles.confirmDeleteButton}`}
            onClick={handleSubmit}
          >
            <i className="fas fa-trash-alt"></i> Xóa người dùng
          </button>
          <button 
            type="button" 
            className={styles.cancelButton} 
            onClick={onCancel}
          >
            <i className="fas fa-times"></i> Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal; 