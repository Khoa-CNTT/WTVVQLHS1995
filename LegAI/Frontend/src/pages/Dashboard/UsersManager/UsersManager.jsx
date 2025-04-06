import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from './UsersManagerPage.module.css';

// Tách các component ra để dễ quản lý
import UserTable from './components/UserTable';
import SearchBar from './components/SearchBar';
import Notification from './components/Notification';
import Pagination from './components/Pagination';
import HistoryLog from './components/HistoryLog';
import EditUserModal from './components/EditUserModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

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
      {/* Thanh tìm kiếm */}
      <SearchBar
        searchTerm={searchTerm}
        searchField={searchField}
        onSearchTermChange={(value) => setSearchTerm(value)}
        onSearchFieldChange={(value) => setSearchField(value)}
      />

      {/* Thông báo */}
      <Notification notification={notification} />

      {/* Bảng danh sách người dùng */}
      <UserTable
        users={currentUsers}
        onEditUser={(user) => handleEditUser(user)}
        onToggleLock={(userId) => handleToggleLock(userId)}
        onDeleteUser={(userId) => handleDeleteUser(userId)}
      />

      {/* Phân trang */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(pageNumber) => handlePageChange(pageNumber)}
      />

      {/* Lịch sử thay đổi */}
      <HistoryLog history={history} />

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

export default UsersManagerPage;