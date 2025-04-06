import React, { useState, useEffect } from 'react';
import styles from '../UsersManagerPage.module.css';

const EditUserModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({ ...user });
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'full_name':
        if (!value || value.trim() === '') error = 'Họ tên không được để trống';
        break;
      case 'phone':
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(value)) error = 'Số điện thoại không hợp lệ';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData({ ...formData, [name]: newValue });
    
    // Validate field
    const error = validateField(name, newValue);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra lỗi trước khi submit
    let hasErrors = false;
    const newErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        hasErrors = true;
      }
    });
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-user-edit"></i> Chỉnh Sửa Tài Khoản
          </h2>
          <button className={styles.modalCloseButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formColumns}>
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tên đăng nhập:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled
                  className={styles.formInput}
                />
                <small className={styles.formHelp}>Tên đăng nhập không thể thay đổi</small>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  className={styles.formInput}
                />
                <small className={styles.formHelp}>Email không thể thay đổi</small>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Họ tên: <span className={styles.requiredField}>*</span></label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`${styles.formInput} ${errors.full_name ? styles.inputError : ''}`}
                />
                {errors.full_name && <div className={styles.errorMessage}>{errors.full_name}</div>}
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Số điện thoại: <span className={styles.requiredField}>*</span></label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${styles.formInput} ${errors.phone ? styles.inputError : ''}`}
                />
                {errors.phone && <div className={styles.errorMessage}>{errors.phone}</div>}
              </div>
            </div>
            
            <div className={styles.formColumn}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Địa chỉ:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  className={styles.formInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mô tả:</label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="3"
                  className={styles.formTextarea}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Vai trò:</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                  className={styles.formSelect}
                >
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Trạng thái xác minh:</label>
                <div className={styles.formRadioGroup}>
                  <label className={styles.formRadioLabel}>
                    <input 
                      type="radio" 
                      name="is_verified"
                      checked={formData.is_verified === true}
                      onChange={() => setFormData({...formData, is_verified: true})}
                    />
                    <span>Đã xác minh</span>
                  </label>
                  <label className={styles.formRadioLabel}>
                    <input 
                      type="radio" 
                      name="is_verified"
                      checked={formData.is_verified === false}
                      onChange={() => setFormData({...formData, is_verified: false})}
                    />
                    <span>Chưa xác minh</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>
              <i className="fas fa-save"></i> Lưu thay đổi
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              <i className="fas fa-times"></i> Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal; 