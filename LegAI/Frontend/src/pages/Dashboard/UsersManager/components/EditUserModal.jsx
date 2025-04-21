import React, { useState } from 'react';
import styles from '../UsersManagerPage.module.css';

const EditUserModal = ({ user, onSave, onClose }) => {
  // Đảm bảo tất cả dữ liệu có giá trị hợp lệ
  const [formData, setFormData] = useState({
    id: user.id || '',
    username: user.username || '',
    email: user.email || '',
    full_name: user.full_name || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    role: user.role || 'user',
    is_verified: user.is_verified || false,
    is_locked: user.is_locked || false,
    failed_attempts: user.failed_attempts || 0,
    last_login: user.last_login || '',
    created_at: user.created_at || ''
  });
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'full_name':
        if (!value || value.trim() === '') error = 'Họ tên không được để trống';
        break;
      case 'phone':
        if (value) {
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(value)) error = 'Số điện thoại không hợp lệ';
        }
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
    
    const error = validateField(name, newValue);
    setErrors({ ...errors, [name]: error });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Kiểm tra lỗi
    let hasErrors = false;
    const newErrors = {};
    
    // Kiểm tra họ tên
    if (!formData.full_name || formData.full_name.trim() === '') {
      newErrors.full_name = 'Họ tên không được để trống';
      hasErrors = true;
    }

    // Kiểm tra số điện thoại nếu có
    if (formData.phone) {
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    // Chuẩn bị dữ liệu đúng format để gửi lên server
    const userData = {
      id: formData.id, // Đảm bảo có ID
      fullName: formData.full_name,
      phone: formData.phone || '',
      address: formData.address || '',
      bio: formData.bio || '',
      role: formData.role
    };
    
    onSave(userData);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN');
    } catch (e) {
      return 'Không hợp lệ';
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalCompact}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '20px'
        }}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <i className="fas fa-user-edit" style={{ marginRight: '8px' }}></i> 
            Chỉnh sửa thông tin người dùng
          </h2>
          <button 
            className={styles.modalCloseButton}
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
            <div style={{ 
              display: 'flex', 
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '15px',
          backgroundColor: '#f8f9fa',
          padding: '10px',
          borderRadius: '6px',
          textAlign: 'left'
        }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
              <span style={{ 
              display: 'inline-block',
                backgroundColor: formData.is_verified ? '#d4edda' : '#f8d7da',
              color: formData.is_verified ? '#155724' : '#721c24',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              marginRight: '5px'
              }}>
                <i className={formData.is_verified ? "fas fa-check-circle" : "fas fa-times-circle"} style={{ marginRight: '5px' }}></i>
                {formData.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
              </span>
              <span style={{ 
              display: 'inline-block',
                backgroundColor: formData.is_locked ? '#ffe9e9' : '#e3faef',
              color: formData.is_locked ? '#e53e3e' : '#38a169',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.85rem'
              }}>
                <i className={formData.is_locked ? "fas fa-lock" : "fas fa-lock-open"} style={{ marginRight: '5px' }}></i>
                {formData.is_locked ? 'Đã khóa' : 'Đang hoạt động'}
              </span>
          </div>
          
          <div style={{ flex: '1', minWidth: '200px', fontSize: '0.85rem' }}>
            <div><strong>ID:</strong> {formData.id}</div>
            <div><strong>Ngày tạo:</strong> {formatDateTime(formData.created_at)}</div>
            </div>
          
          <div style={{ flex: '1', minWidth: '200px', fontSize: '0.85rem' }}>
              <div><strong>Lần đăng nhập cuối:</strong> {formatDateTime(formData.last_login)}</div>
              <div><strong>Số lần đăng nhập thất bại:</strong> {formData.failed_attempts}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Tên đăng nhập
              </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}
                />
              </div>
              
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Email
              </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}
                />
              </div>
              
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Họ tên <span style={{ color: '#e53e3e' }}>*</span>
              </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${errors.full_name ? '#e53e3e' : '#ddd'}`,
                  borderRadius: '4px'
                }}
                />
              {errors.full_name && (
                <small style={{ color: '#e53e3e', fontSize: '0.8rem', display: 'block', marginTop: '3px' }}>
                  {errors.full_name}
                </small>
              )}
              </div>
              
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Số điện thoại
              </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${errors.phone ? '#e53e3e' : '#ddd'}`,
                  borderRadius: '4px'
                }}
                />
              {errors.phone && (
                <small style={{ color: '#e53e3e', fontSize: '0.8rem', display: 'block', marginTop: '3px' }}>
                  {errors.phone}
                </small>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Địa chỉ
              </label>
                <input
                  type="text"
                  name="address"
                value={formData.address}
                  onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                />
              </div>
              
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Vai trò
              </label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                >
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                <option value="Lawyer">Luật sư</option>
                </select>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Giới thiệu
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              placeholder="Thêm thông tin giới thiệu về người dùng..."
            />
          </div>

          <div className={styles.modalActions}>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.cancelButton}
            >
              <i className="fas fa-times"></i> Hủy
            </button>
            <button 
              type="submit" 
              className={styles.saveButton}
            >
              <i className="fas fa-save"></i> Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal; 