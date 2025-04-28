import React from 'react';
import { FaExclamationTriangle, FaTrash, FaFileAlt, FaCalendarAlt, FaBuilding, FaTags } from 'react-icons/fa';
import styles from '../ContractManager.module.css';

const DeleteConfirmation = ({ 
  contract, 
  formatDate, 
  handleDeleteContract, 
  handleCloseModals, 
  loading 
}) => {
  if (!contract) return null;
  
  return (
    <div className={styles.deleteConfirmContainer}>
      <div className={styles.warningHeader}>
        <FaExclamationTriangle className={styles.warningIcon} />
        <h3>Xác nhận xóa hợp đồng</h3>
      </div>
      
      <p className={styles.deleteQuestion}>
        Bạn có chắc chắn muốn xóa hợp đồng <strong>"{contract.title}"</strong>?
      </p>
      
      <div className={styles.contractSummary}>
        <div className={styles.summaryItem}>
          <FaFileAlt />
          <span><strong>Tiêu đề:</strong> {contract.title}</span>
        </div>
        <div className={styles.summaryItem}>
          <FaTags />
          <span><strong>Loại hợp đồng:</strong> {contract.contract_type}</span>
        </div>
        <div className={styles.summaryItem}>
          <FaBuilding />
          <span><strong>Đối tác:</strong> {contract.partner || 'Chưa xác định'}</span>
        </div>
        <div className={styles.summaryItem}>
          <FaCalendarAlt />
          <span><strong>Thời gian:</strong> {formatDate(contract.start_date)} - {formatDate(contract.end_date)}</span>
        </div>
      </div>
      
      <p className={styles.warningText}>
        <FaExclamationTriangle /> Lưu ý: Hành động này không thể hoàn tác.
      </p>
      
      <div className={styles.deleteActions}>
        <button 
          className={styles.cancelButton} 
          onClick={handleCloseModals}
        >
          Hủy
        </button>
        <button 
          className={styles.deleteButton} 
          onClick={handleDeleteContract} 
          disabled={loading}
        >
          {loading ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            <>
              <FaTrash /> Xóa hợp đồng
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DeleteConfirmation; 