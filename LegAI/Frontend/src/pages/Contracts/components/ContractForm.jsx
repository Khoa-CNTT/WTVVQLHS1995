import React from 'react';
import styles from '../ContractManager.module.css';
import { FaCalendarAlt, FaFileUpload, FaSignature, FaBuilding, FaFileContract } from 'react-icons/fa';

const ContractForm = ({ 
  formData, 
  handleInputChange, 
  handleFileChange, 
  handleSubmit, 
  handleCancel, 
  loading, 
  isEdit,
  contractTypes 
}) => {
  return (
    <form onSubmit={handleSubmit} className={styles.customForm}>
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            <span>Tiêu đề hợp đồng</span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className={styles.formInput}
              placeholder="Nhập tiêu đề hợp đồng"
            />
          </label>
        </div>
        
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            <span>Loại hợp đồng</span>
            <div className={styles.customSelect}>
              <select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleInputChange}
                required
                className={styles.formSelect}
              >
                <option value="">Chọn loại hợp đồng</option>
                {contractTypes.map((type, index) => (
                  <option key={index} value={type}>{type}</option>
                ))}
              </select>
              <FaFileContract className={styles.selectIcon} />
            </div>
          </label>
        </div>
        
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            <span>Đối tác</span>
            <div className={styles.inputWithIcon}>
              <input
                type="text"
                name="partner"
                value={formData.partner}
                onChange={handleInputChange}
                placeholder="Tên đối tác"
                required
                className={styles.formInput}
              />
              <FaBuilding className={styles.inputIcon} />
            </div>
          </label>
        </div>
        
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            <span>Chữ ký</span>
            <div className={styles.inputWithIcon}>
              <input
                type="text"
                name="signature"
                value={formData.signature}
                onChange={handleInputChange}
                placeholder="Tên người ký"
                className={styles.formInput}
              />
              <FaSignature className={styles.inputIcon} />
            </div>
          </label>
        </div>
        
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            <span>Ngày bắt đầu</span>
            <div className={styles.inputWithIcon}>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className={styles.formInput}
              />
              <FaCalendarAlt className={styles.inputIcon} />
            </div>
          </label>
        </div>
        
        <div className={styles.formField}>
          <label className={styles.formLabel}>
            <span>Ngày kết thúc</span>
            <div className={styles.inputWithIcon}>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className={styles.formInput}
              />
              <FaCalendarAlt className={styles.inputIcon} />
            </div>
          </label>
        </div>
      </div>
      
      <div className={styles.formField} style={{marginTop: '20px'}}>
        <label className={styles.formLabel}>
          <span>
            {isEdit ? 'Tải lên file hợp đồng mới (tùy chọn)' : 'Tải lên file hợp đồng'}
          </span>
          <div className={styles.fileUploadContainer}>
            <input
              type="file"
              id="contract-file"
              onChange={handleFileChange}
              required={!isEdit}
              accept=".pdf,.doc,.docx"
              className={styles.fileInput}
            />
            <label htmlFor="contract-file" className={styles.fileInputLabel}>
              <FaFileUpload />
              <span>Chọn file</span>
            </label>
            <span className={styles.fileName}>
              {formData.file ? formData.file.name : 'Chưa chọn file nào'}
            </span>
          </div>
        </label>
        <p className={styles.formHelper}>
          {isEdit 
            ? 'Nếu không tải lên file mới, file hợp đồng hiện tại sẽ được giữ nguyên.'
            : 'Chỉ chấp nhận file PDF, DOC hoặc DOCX. Kích thước tối đa 10MB.'}
        </p>
      </div>
      
      <div className={styles.formActions}>
        <button type="button" onClick={handleCancel} className={styles.cancelButton}>
          Hủy
        </button>
        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            isEdit ? 'Cập nhật hợp đồng' : 'Tạo hợp đồng'
          )}
        </button>
      </div>
    </form>
  );
};

export default ContractForm; 