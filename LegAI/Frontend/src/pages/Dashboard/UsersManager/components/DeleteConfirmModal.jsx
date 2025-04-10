import React from 'react';
import styles from '../UsersManagerPage.module.css';

const DeleteConfirmModal = ({ user, onConfirm, onCancel }) => {
  // Đảm bảo user có giá trị
  if (!user) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(user.id);
  };

  // Modal styles
  const modalStyle = {
    width: '100%',
    maxWidth: '450px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
  };

  const modalHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px'
  };

  const warningIconStyle = {
    fontSize: '4rem',
    color: '#e53e3e',
    marginBottom: '15px',
    textAlign: 'center',
    display: 'block'
  };

  const messageTitleStyle = {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#333',
    marginBottom: '15px',
    textAlign: 'center'
  };

  const warningMessageStyle = {
    padding: '10px',
    backgroundColor: '#fff5f5',
    color: '#e53e3e',
    borderRadius: '4px',
    fontSize: '0.9rem',
    marginTop: '15px',
    textAlign: 'center',
    fontWeight: '500'
  };

  const infoGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr',
    gap: '8px',
    padding: '10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '0.95rem',
    marginBottom: '15px'
  };

  const infoLabelStyle = {
    fontWeight: '500',
    color: '#333'
  };

  const buttonContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
    borderTop: '1px solid #eee',
    paddingTop: '15px'
  };

  const cancelButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#f1f1f1',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px'
  };

  const deleteButtonStyle = {
    padding: '8px 16px',
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontWeight: '500'
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#e53e3e', marginRight: '8px' }}></i>
            Xác nhận xóa người dùng
          </h2>
          <button 
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} 
            onClick={onCancel}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div>
          <i className="fas fa-trash-alt" style={warningIconStyle}></i>
          
          <p style={messageTitleStyle}>
            Bạn có chắc chắn muốn xóa tài khoản <strong>{user.username}</strong>?
          </p>
          
          <div style={infoGridStyle}>
            <span style={infoLabelStyle}>Họ tên:</span>
            <span>{user.full_name || 'Chưa cập nhật'}</span>
            
            <span style={infoLabelStyle}>Email:</span>
            <span>{user.email || 'Chưa cập nhật'}</span>
            
            <span style={infoLabelStyle}>Vai trò:</span>
            <span>{user.role || 'User'}</span>
            
            <span style={infoLabelStyle}>Trạng thái:</span>
            <span>{user.is_locked ? 'Đã khóa' : 'Đang hoạt động'}</span>
          </div>
          
          <p style={warningMessageStyle}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '5px' }}></i>
            Hành động này không thể hoàn tác và tất cả dữ liệu liên quan đến tài khoản này sẽ bị xóa vĩnh viễn!
          </p>
        </div>
        
        <div style={buttonContainerStyle}>
          <button 
            style={cancelButtonStyle} 
            onClick={onCancel}
          >
            <i className="fas fa-times"></i> Hủy bỏ
          </button>
          <button 
            style={deleteButtonStyle}
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