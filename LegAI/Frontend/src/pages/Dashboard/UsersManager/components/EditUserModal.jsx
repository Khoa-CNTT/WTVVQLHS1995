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

  // Custom styles
  const modalCustomStyle = {
    width: '95%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    backgroundColor: '#fff'
  };

  const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px'
  };

  const twoColumnStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px'
  };

  const userInfoStyle = {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  };

  const statusBadgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '0.9rem',
    fontWeight: '500',
    margin: '5px',
    whiteSpace: 'nowrap'
  };

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
        style={modalCustomStyle} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
            <i className="fas fa-user-edit" style={{ marginRight: '8px' }}></i> 
            Chỉnh sửa thông tin người dùng
          </h2>
          <button 
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} 
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div style={userInfoStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto' }}>
            <div style={{ 
              width: '70px', height: '70px', 
              backgroundColor: '#e9ecef', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <i className="fas fa-user" style={{ fontSize: '2rem', color: '#adb5bd' }}></i>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '5px' }}>
              <span style={{ 
                ...statusBadgeStyle, 
                backgroundColor: formData.is_verified ? '#d4edda' : '#f8d7da',
                color: formData.is_verified ? '#155724' : '#721c24'
              }}>
                <i className={formData.is_verified ? "fas fa-check-circle" : "fas fa-times-circle"} style={{ marginRight: '5px' }}></i>
                {formData.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}
              </span>
              <span style={{ 
                ...statusBadgeStyle, 
                backgroundColor: formData.is_locked ? '#ffe9e9' : '#e3faef',
                color: formData.is_locked ? '#e53e3e' : '#38a169'
              }}>
                <i className={formData.is_locked ? "fas fa-lock" : "fas fa-lock-open"} style={{ marginRight: '5px' }}></i>
                {formData.is_locked ? 'Đã khóa' : 'Đang hoạt động'}
              </span>
              <span style={{ 
                ...statusBadgeStyle, 
                backgroundColor: '#e9f3ff',
                color: '#2b6cb0'
              }}>
                <i className="fas fa-shield-alt" style={{ marginRight: '5px' }}></i>
                {formData.role}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
              <div><strong>Lần đăng nhập cuối:</strong> {formatDateTime(formData.last_login)}</div>
              <div><strong>Ngày tạo:</strong> {formatDateTime(formData.created_at)}</div>
              <div><strong>Số lần đăng nhập thất bại:</strong> {formData.failed_attempts}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ margin: '15px 0' }}>
          <div style={twoColumnStyle}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: '500', color: '#333' }}>Tên đăng nhập:</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}
                />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>Không thể thay đổi</small>
              </div>
              
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: '500', color: '#333' }}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#f9f9f9'
                }}
                />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>Không thể thay đổi</small>
              </div>
              
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: '500', color: '#333' }}>
                Họ tên: <span style={{ color: '#e53e3e' }}>*</span>
              </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${errors.full_name ? '#e53e3e' : '#ddd'}`,
                  borderRadius: '4px'
                }}
                />
              {errors.full_name && (
                <small style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.full_name}</small>
              )}
              </div>
              
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: '500', color: '#333' }}>Số điện thoại:</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${errors.phone ? '#e53e3e' : '#ddd'}`,
                  borderRadius: '4px'
                }}
                />
              {errors.phone && (
                <small style={{ color: '#e53e3e', fontSize: '0.8rem' }}>{errors.phone}</small>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: '500', color: '#333' }}>Địa chỉ:</label>
                <input
                  type="text"
                  name="address"
                value={formData.address}
                  onChange={handleChange}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                />
              </div>
              
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontWeight: '500', color: '#333' }}>Vai trò:</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleChange} 
                style={{
                  padding: '8px 12px',
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
          
          <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontWeight: '500', color: '#333' }}>Giới thiệu:</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                resize: 'vertical'
              }}
              placeholder="Thêm thông tin giới thiệu về người dùng..."
            />
          </div>

          <div style={{ 
            marginTop: '20px', 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '10px',
            borderTop: '1px solid #eee',
            paddingTop: '15px'
          }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#f1f1f1',
                color: '#333',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className="fas fa-times"></i> Hủy
            </button>
            <button 
              type="submit" 
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#ffcc00',
                color: '#000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: '500'
              }}
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