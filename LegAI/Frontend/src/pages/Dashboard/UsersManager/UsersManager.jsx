import React, { useState, useEffect } from 'react';
import styles from './UsersManagerPage.module.css';

function UsersManagerPage() {
  const isAdmin = true;

  if (!isAdmin) {
    return <div className={styles.error}>Bạn không có quyền truy cập trang này!</div>;
  }

  const [users, setUsers] = useState([
    { id: 1, username: 'admin1', email: 'admin1@example.com', phone: '0123456789', full_name: 'Nguyễn Văn Admin', address: '123 Đường Admin, Hà Nội', description: 'Quản trị viên chính', role: 'Admin', is_verified: true, created_at: '2025-01-01', updated_at: '2025-01-01', last_login: '2025-04-01', failed_attempts: 0, is_locked: false },
    { id: 2, username: 'user1', email: 'user1@example.com', phone: '0987654321', full_name: 'Trần Thị User', address: '456 Đường User, TP.HCM', description: 'Người dùng thường', role: 'User', is_verified: false, created_at: '2025-02-01', updated_at: '2025-02-01', last_login: null, failed_attempts: 3, is_locked: false },
    { id: 3, username: 'user2', email: 'user2@example.com', phone: '0912345678', full_name: 'Lê Văn User 2', address: '789 Đường User, Đà Nẵng', description: 'Người dùng mới', role: 'User', is_verified: true, created_at: '2025-03-01', updated_at: '2025-03-01', last_login: '2025-04-02', failed_attempts: 0, is_locked: false },
    { id: 4, username: 'user3', email: 'user3@example.com', phone: '0934567890', full_name: 'Phạm Thị User 3', address: '101 Đường User, Hải Phòng', description: 'Người dùng tích cực', role: 'User', is_verified: true, created_at: '2025-03-15', updated_at: '2025-03-15', last_login: '2025-04-03', failed_attempts: 1, is_locked: false },
    { id: 5, username: 'user4', email: 'user4@example.com', phone: '0945678901', full_name: 'Ngô Văn User 4', address: '202 Đường User, Cần Thơ', description: 'Người dùng mới', role: 'User', is_verified: false, created_at: '2025-03-20', updated_at: '2025-03-20', last_login: null, failed_attempts: 0, is_locked: false },
    { id: 6, username: 'user5', email: 'user5@example.com', phone: '0956789012', full_name: 'Đỗ Thị User 5', address: '303 Đường User, Nha Trang', description: 'Người dùng thường', role: 'User', is_verified: true, created_at: '2025-03-25', updated_at: '2025-03-25', last_login: '2025-04-04', failed_attempts: 2, is_locked: false },
    { id: 7, username: 'user6', email: 'user6@example.com', phone: '0967890123', full_name: 'Bùi Văn User 6', address: '404 Đường User, Huế', description: 'Người dùng mới', role: 'User', is_verified: false, created_at: '2025-03-30', updated_at: '2025-03-30', last_login: null, failed_attempts: 0, is_locked: false },
    { id: 8, username: 'user7', email: 'user7@example.com', phone: '0978901234', full_name: 'Hoàng Thị User 7', address: '505 Đường User, Vũng Tàu', description: 'Người dùng tích cực', role: 'User', is_verified: true, created_at: '2025-04-01', updated_at: '2025-04-01', last_login: '2025-04-05', failed_attempts: 0, is_locked: false },
  ]);

  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('username');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const filteredUsers = users.filter(user => {
    if (searchField === 'username') return user.username.toLowerCase().includes(searchTerm.toLowerCase());
    if (searchField === 'email') return user.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (searchField === 'role') return user.role.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (updatedUser) => {
    try {
      const response = await fetch(`https://your-api/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(updatedUser),
      });
      if (response.ok) {
        setUsers(users.map(user => (user.id === updatedUser.id ? updatedUser : user)));
        setHistory([...history, {
          action: 'Chỉnh sửa tài khoản',
          userId: updatedUser.id,
          timestamp: new Date().toLocaleString(),
        }]);
        setNotification({ message: 'Cập nhật tài khoản thành công!', type: 'success' });
      } else {
        setNotification({ message: 'Lỗi khi cập nhật tài khoản!', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Lỗi khi cập nhật tài khoản!', type: 'error' });
    }
    closeEditModal();
  };

  const handleToggleLock = async (userId) => {
    const user = users.find(u => u.id === userId);
    const newLockedStatus = !user.is_locked;
    try {
      const response = await fetch(`https://your-api/users/${userId}/toggle-lock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ is_locked: newLockedStatus }),
      });
      if (response.ok) {
        setUsers(users.map(u => (u.id === userId ? { ...u, is_locked: newLockedStatus } : u)));
        setHistory([...history, {
          action: `Đã ${newLockedStatus ? 'khóa' : 'mở khóa'} tài khoản`,
          userId,
          timestamp: new Date().toLocaleString(),
        }]);
        setNotification({ message: `Tài khoản đã được ${newLockedStatus ? 'khóa' : 'mở khóa'}!`, type: 'success' });
      } else {
        setNotification({ message: 'Lỗi khi thay đổi trạng thái tài khoản!', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Lỗi khi thay đổi trạng thái tài khoản!', type: 'error' });
    }
  };

  const handleOpenResetPasswordModal = (userId) => {
    setResetUserId(userId);
    setIsResetPasswordModalOpen(true);
  };

  const closeResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setResetUserId(null);
  };

  const handleResetPassword = async (userId, newPassword) => {
    try {
      const response = await fetch(`https://your-api/users/${userId}/reset-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      if (response.ok) {
        setHistory([...history, {
          action: 'Đặt lại mật khẩu',
          userId,
          timestamp: new Date().toLocaleString(),
        }]);
        setNotification({ message: 'Mật khẩu đã được đặt lại thành công!', type: 'success' });
      } else {
        setNotification({ message: 'Lỗi khi đặt lại mật khẩu!', type: 'error' });
      }
    } catch (error) {
      setNotification({ message: 'Lỗi khi đặt lại mật khẩu!', type: 'error' });
    }
    closeResetPasswordModal();
  };

  const handleDeleteUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (user.role === 'Admin' && user.id === 1) {
      setNotification({ message: 'Không thể xóa tài khoản Admin chính!', type: 'error' });
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${user.username}?`)) {
      try {
        const response = await fetch(`https://your-api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          setUsers(users.filter(u => u.id !== userId));
          setHistory([...history, {
            action: 'Xóa tài khoản',
            userId,
            timestamp: new Date().toLocaleString(),
          }]);
          setNotification({ message: 'Xóa tài khoản thành công!', type: 'success' });
        } else {
          setNotification({ message: 'Lỗi khi xóa tài khoản!', type: 'error' });
        }
      } catch (error) {
        setNotification({ message: 'Lỗi khi xóa tài khoản!', type: 'error' });
      }
    }
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Quản Lý Tài Khoản Người Dùng</h1>

      {/* Thanh tìm kiếm */}
      <div className={styles.searchBar}>
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          className={styles.searchSelect}
        >
          <option value="username">Tên đăng nhập</option>
          <option value="email">Email</option>
          <option value="role">Vai trò</option>
        </select>
        <input
          type="text"
          placeholder={`Tìm kiếm theo ${searchField === 'username' ? 'tên đăng nhập' : searchField === 'email' ? 'email' : 'vai trò'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Thông báo */}
      {notification.message && (
        <div className={`${styles.notification} ${notification.type === 'success' ? styles.success : styles.error}`}>
          {notification.message}
        </div>
      )}

      {/* Bảng danh sách người dùng */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên Đăng Nhập</th>
              <th>Họ Tên</th>
              <th>Email</th>
              <th>Số Điện Thoại</th>
              <th>Địa Chỉ</th>
              <th>Mô Tả</th>
              <th>Vai Trò</th>
              <th>Xác Minh</th>
              <th>Trạng Thái</th>
              <th>Lần Đăng Nhập Cuối</th>
              <th>Thất Bại</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.length > 0 ? (
              currentUsers.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                  <td data-label="STT">{indexOfFirstUser + index + 1}</td>
                  <td data-label="Tên Đăng Nhập">{user.username}</td>
                  <td data-label="Họ Tên">{user.full_name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Số Điện Thoại">{user.phone}</td>
                  <td data-label="Địa Chỉ">{user.address || 'Chưa có'}</td>
                  <td data-label="Mô Tả">{user.description || 'Chưa có'}</td>
                  <td data-label="Vai Trò">{user.role}</td>
                  <td data-label="Xác Minh">{user.is_verified ? 'Đã xác minh' : 'Chưa xác minh'}</td>
                  <td data-label="Trạng Thái">
                    <span className={user.is_locked ? styles.statusLocked : styles.statusActive}>
                      {user.is_locked ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </td>
                  <td data-label="Lần Đăng Nhập Cuối">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Chưa đăng nhập'}</td>
                  <td data-label="Thất Bại">{user.failed_attempts}</td>
                  <td data-label="Hành Động" className={styles.actionButtons}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEditUser(user)}
                    >
                      Sửa
                    </button>
                    <button
                      className={styles.toggleButton}
                      onClick={() => handleToggleLock(user.id)}
                    >
                      {user.is_locked ? 'Mở khóa' : 'Khóa'}
                    </button>
                    <button
                      className={styles.resetButton}
                      onClick={() => handleOpenResetPasswordModal(user.id)}
                    >
                      Đặt lại mật khẩu
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="13" className={styles.noData}>
                  Không tìm thấy người dùng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      <div className={styles.pagination}>
        {Array.from({ length: totalPages }, (_, index) => (
          <button
            key={index + 1}
            onClick={() => handlePageChange(index + 1)}
            className={`${styles.pageButton} ${currentPage === index + 1 ? styles.activePage : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Lịch sử thay đổi */}
      <div className={styles.history}>
        <h2 className={styles.sectionTitle}>Lịch Sử Thay Đổi</h2>
        {history.length > 0 ? (
          <ul className={styles.historyList}>
            {history.map((entry, index) => (
              <li key={index} className={styles.historyItem}>
                {entry.timestamp}: {entry.action} (ID: {entry.userId})
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noHistory}>Chưa có thay đổi nào.</p>
        )}
      </div>

      {/* Modal chỉnh sửa */}
      {isEditModalOpen && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onSave={handleSaveUser}
          onClose={closeEditModal}
        />
      )}

      {/* Modal đặt lại mật khẩu */}
      {isResetPasswordModalOpen && resetUserId && (
        <ResetPasswordModal
          userId={resetUserId}
          onSave={handleResetPassword}
          onClose={closeResetPasswordModal}
        />
      )}
    </div>
  );
}

function EditUserModal({ user, onSave, onClose }) {
  const [formData, setFormData] = useState({ ...user });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Chỉnh Sửa Tài Khoản</h2>
        <form onSubmit={handleSubmit}>
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
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Họ tên:</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Số điện thoại:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={styles.formInput}
            />
          </div>
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
            <select name="role" value={formData.role} onChange={handleChange} className={styles.formSelect}>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Trạng thái xác minh:</label>
            <select name="is_verified" value={formData.is_verified} onChange={handleChange} className={styles.formSelect}>
              <option value={true}>Đã xác minh</option>
              <option value={false}>Chưa xác minh</option>
            </select>
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>Lưu</button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ userId, onSave, onClose }) {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPassword) {
      alert('Vui lòng nhập mật khẩu mới!');
      return;
    }
    onSave(userId, newPassword);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>Đặt Lại Mật Khẩu</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Mật khẩu mới:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới"
              className={styles.formInput}
            />
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.saveButton}>Lưu</button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UsersManagerPage;