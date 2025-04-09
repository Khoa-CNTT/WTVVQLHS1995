import React, { useState } from 'react';
import axiosInstance from '../../../../config/axios';

function AddUserModal({ onClose, onSave }) {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    fullName: "",
    phone: "",
    password: "",
    role: "user",
    address: "",
    bio: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Các style inline
  const styles = {
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '24px',
      width: '90%',
      maxWidth: '900px',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    },
    modalHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
    },
    modalTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      color: '#333',
      margin: 0,
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: '#999',
    },
    generalError: {
      color: '#d32f2f',
      backgroundColor: '#ffebee',
      padding: '10px',
      borderRadius: '4px',
      marginBottom: '15px',
      fontSize: '0.9rem',
      textAlign: 'center',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '16px',
      marginBottom: '20px',
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    fullWidth: {
      gridColumn: '1 / -1',
    },
    label: {
      marginBottom: '8px',
      fontWeight: '500',
      color: '#555',
      fontSize: '0.95rem',
    },
    requiredField: {
      color: '#d32f2f',
    },
    inputField: {
      padding: '10px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '0.95rem',
      color: '#333',
      width: '100%',
      transition: 'border-color 0.2s ease',
    },
    inputFieldFocus: {
      border: '1px solid #4CAF50',
    },
    selectField: {
      appearance: 'none',
      backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"%23555\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')",
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      paddingRight: '30px',
    },
    textareaField: {
      minHeight: '100px',
      resize: 'vertical',
    },
    errorText: {
      color: '#d32f2f',
      fontSize: '0.85rem',
      marginTop: '5px',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '20px',
    },
    cancelButton: {
      padding: '10px 20px',
      backgroundColor: '#f1f2f6',
      color: '#555',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
    },
    saveButton: {
      padding: '10px 20px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'background-color 0.2s ease',
    },
  };

  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    // Validate username
    if (!userData.username.trim()) {
      tempErrors.username = "Tên đăng nhập là bắt buộc";
      isValid = false;
    } else if (userData.username.length < 3) {
      tempErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email.trim()) {
      tempErrors.email = "Email là bắt buộc";
      isValid = false;
    } else if (!emailRegex.test(userData.email)) {
      tempErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    // Validate fullName
    if (!userData.fullName.trim()) {
      tempErrors.fullName = "Họ tên là bắt buộc";
      isValid = false;
    }

    // Validate phone
    const phoneRegex = /^(0)[0-9]{9}$/;
    if (userData.phone.trim() && !phoneRegex.test(userData.phone)) {
      tempErrors.phone = "Số điện thoại không hợp lệ (VD: 0912345678)";
      isValid = false;
    }

    // Validate password
    if (!userData.password) {
      tempErrors.password = "Mật khẩu là bắt buộc";
      isValid = false;
    } else if (userData.password.length < 6) {
      tempErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
      isValid = false;
    }

    // Validate role
    if (!userData.role) {
      tempErrors.role = "Vai trò là bắt buộc";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
    
    // Clear error for the field being edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await axiosInstance.post('/auth/users', userData);
      onSave(userData);
      onClose();
    } catch (error) {
      console.error("Lỗi khi thêm người dùng:", error);
      setGeneralError(
        error.response?.data?.message || "Có lỗi xảy ra khi thêm người dùng"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        style={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Thêm người dùng mới</h2>
          <button style={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        
        {generalError && <div style={styles.generalError}>{generalError}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Tên đăng nhập <span style={styles.requiredField}>*</span>
              </label>
              <input
                type="text"
                name="username"
                value={userData.username}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Nhập tên đăng nhập"
                autoComplete="off"
              />
              {errors.username && <div style={styles.errorText}>{errors.username}</div>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Email <span style={styles.requiredField}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="example@email.com"
                autoComplete="off"
              />
              {errors.email && <div style={styles.errorText}>{errors.email}</div>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Họ tên <span style={styles.requiredField}>*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={userData.fullName}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Nhập họ tên đầy đủ"
                autoComplete="off"
              />
              {errors.fullName && <div style={styles.errorText}>{errors.fullName}</div>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Điện thoại</label>
              <input
                type="tel"
                name="phone"
                value={userData.phone}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="0912345678"
                autoComplete="off"
              />
              {errors.phone && <div style={styles.errorText}>{errors.phone}</div>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Mật khẩu <span style={styles.requiredField}>*</span>
              </label>
              <input
                type="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                autoComplete="new-password"
              />
              {errors.password && <div style={styles.errorText}>{errors.password}</div>}
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Vai trò <span style={styles.requiredField}>*</span>
              </label>
              <select
                name="role"
                value={userData.role}
                onChange={handleChange}
                style={{ ...styles.inputField, ...styles.selectField }}
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
              {errors.role && <div style={styles.errorText}>{errors.role}</div>}
            </div>
            
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.label}>Địa chỉ</label>
              <input
                type="text"
                name="address"
                value={userData.address}
                onChange={handleChange}
                style={styles.inputField}
                placeholder="Nhập địa chỉ"
                autoComplete="off"
              />
              {errors.address && <div style={styles.errorText}>{errors.address}</div>}
            </div>
            
            <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
              <label style={styles.label}>Giới thiệu</label>
              <textarea
                name="bio"
                value={userData.bio}
                onChange={handleChange}
                style={{ ...styles.inputField, ...styles.textareaField }}
                placeholder="Nhập thông tin giới thiệu"
              />
              {errors.bio && <div style={styles.errorText}>{errors.bio}</div>}
            </div>
          </div>
          
          <div style={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              style={styles.saveButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Tạo người dùng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserModal; 