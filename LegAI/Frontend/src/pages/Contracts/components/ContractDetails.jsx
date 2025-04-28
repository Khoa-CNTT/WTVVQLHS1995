import React from 'react';
import { FaDownload, FaEdit, FaFileAlt, FaPencilAlt, FaCalendarAlt, FaBuilding, FaSignature, FaClock } from 'react-icons/fa';
import styles from '../ContractManager.module.css';

const ContractDetails = ({ 
  contract, 
  formatDate, 
  handleDownloadFile, 
  handleCloseDetails, 
  handleShowEditModal
}) => {
  if (!contract) return null;
  
  return (
    <div className={styles.contractDetailContainer}>
      <div className={styles.contractDetailHeader}>
        <FaFileAlt className={styles.contractDetailIcon} />
        <div>
          <h3 className={styles.contractDetailTitle}>{contract.title}</h3>
          <div className={styles.contractDetailType}>
            {contract.contract_type}
          </div>
        </div>
      </div>
      
      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <FaBuilding /> 
            <span>Đối tác</span>
          </div>
          <div className={styles.detailValue}>{contract.partner || 'Chưa xác định'}</div>
        </div>
        
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <FaSignature /> 
            <span>Chữ ký</span>
          </div>
          <div className={styles.detailValue}>{contract.signature || 'Chưa có'}</div>
        </div>
        
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <FaCalendarAlt /> 
            <span>Ngày bắt đầu</span>
          </div>
          <div className={styles.detailValue}>{formatDate(contract.start_date)}</div>
        </div>
        
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <FaCalendarAlt /> 
            <span>Ngày kết thúc</span>
          </div>
          <div className={styles.detailValue}>{formatDate(contract.end_date) || 'Không xác định'}</div>
        </div>
        
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <FaClock /> 
            <span>Ngày tạo</span>
          </div>
          <div className={styles.detailValue}>{formatDate(contract.created_at)}</div>
        </div>
        
        <div className={styles.detailItem}>
          <div className={styles.detailLabel}>
            <FaPencilAlt /> 
            <span>Cập nhật lần cuối</span>
          </div>
          <div className={styles.detailValue}>{formatDate(contract.updated_at)}</div>
        </div>
      </div>
      
      <div className={styles.contractDetailActions}>
        <button 
          className={styles.downloadButton} 
          onClick={() => handleDownloadFile(contract.id)}
        >
          <FaDownload /> Tải xuống
        </button>
        <button 
          className={styles.editButton}
          onClick={() => {
            handleCloseDetails();
            handleShowEditModal(contract);
          }}
        >
          <FaEdit /> Chỉnh sửa
        </button>
      </div>
    </div>
  );
};

export default ContractDetails; 