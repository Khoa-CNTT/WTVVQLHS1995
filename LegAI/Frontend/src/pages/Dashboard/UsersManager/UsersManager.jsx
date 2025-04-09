import React, { useState, useEffect, useCallback } from 'react';
import styles from './UsersManagerPage.module.css';
import axiosInstance from '../../../config/axios';

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
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('username');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('');
  const [error, setError] = useState(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const usersPerPage = 10;

  // Lấy danh sách người dùng
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy token từ localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Vui lòng đăng nhập để xem danh sách người dùng');
        return;
      }

      const response = await axiosInstance.get('/auth/users', {
        params: {
          page: currentPage,
          limit: usersPerPage,
          search: searchTerm,
          role: role
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setUsers(response.data.data.users);
        setTotalPages(response.data.data.totalPages);
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        setError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        // Redirect to login page
        window.location.href = '/login';
      } else {
        setError(error.response?.data?.message || 'Không thể tải danh sách người dùng');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
      // Đảm bảo có ID người dùng
      if (!updatedUser.id) {
        setNotification({
          message: 'Lỗi: ID người dùng không hợp lệ',
          type: 'error'
        });
        return;
      }

      const response = await axiosInstance.put(`/auth/users/${updatedUser.id}`, updatedUser);
      
      if (response.data.status === 'success') {
        setNotification({
          message: 'Cập nhật thông tin thành công',
          type: 'success'
        });
        
        // Cập nhật danh sách người dùng
        const updatedUsers = users.map(user => 
          user.id === updatedUser.id ? { ...user, ...response.data.data } : user
        );
        setUsers(updatedUsers);
        
        // Đóng modal
        closeEditModal();
        
        // Thêm vào lịch sử thay đổi
        const newHistoryEntry = {
          userId: updatedUser.id,
          action: `Chỉnh sửa thông tin người dùng ${updatedUser.fullName || ''}`,
          timestamp: new Date().toLocaleString()
        };
        setHistory([newHistoryEntry, ...history]);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật người dùng:', error);
      setNotification({
        message: `Lỗi cập nhật: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    }
  };

  const handleToggleLock = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Vui lòng đăng nhập để thực hiện thao tác này', type: 'error' });
        return;
      }

      const response = await axiosInstance.patch(`/auth/users/${userId}/toggle-lock`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.status === 'success') {
        const updatedUser = response.data.data;
        setUsers(users.map(u => (u.id === userId ? updatedUser : u)));
        setHistory([...history, {
          action: `Đã ${updatedUser.is_locked ? 'khóa' : 'mở khóa'} tài khoản`,
          userId,
          timestamp: new Date().toLocaleString()
        }]);
        setNotification({
          message: `Tài khoản đã được ${updatedUser.is_locked ? 'khóa' : 'mở khóa'}!`,
          type: 'success'
        });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Lỗi khi thay đổi trạng thái tài khoản',
        type: 'error'
      });
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
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({ message: 'Vui lòng đăng nhập để thực hiện thao tác này', type: 'error' });
        return;
      }

      const response = await axiosInstance.post(`/auth/users/${userId}/reset-password`, 
        { newPassword },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        setHistory([...history, {
          action: 'Đặt lại mật khẩu',
          userId,
          timestamp: new Date().toLocaleString()
        }]);
        setNotification({ message: 'Mật khẩu đã được đặt lại thành công!', type: 'success' });
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      setNotification({
        message: error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu',
        type: 'error'
      });
    }
    closeResetPasswordModal();
  };

  const handleOpenDeleteConfirmModal = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      // Kiểm tra ID người dùng
      if (!userId) {
        setNotification({
          message: 'Lỗi: ID người dùng không hợp lệ',
          type: 'error'
        });
        return;
      }

      // Gọi API xóa người dùng
      const response = await axiosInstance.delete(`/auth/users/${userId}`);
      
      if (response.data.status === 'success') {
        setNotification({
          message: 'Xóa tài khoản thành công',
          type: 'success'
        });
        
        // Cập nhật danh sách người dùng
        setUsers(users.filter(user => user.id !== userId));
        
        // Đóng modal xác nhận xóa
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
        
        // Thêm vào lịch sử thay đổi
        const deletedUser = userToDelete;
        const newHistoryEntry = {
          userId: userId,
          action: `Xóa tài khoản người dùng ${deletedUser?.username || ''}`,
          timestamp: new Date().toLocaleString()
        };
        setHistory([newHistoryEntry, ...history]);
      }
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      setNotification({
        message: `Lỗi xóa: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    } finally {
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
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

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Thanh tìm kiếm */}
      <SearchBar
        searchTerm={searchTerm}
        searchField={searchField}
        role={role}
        onSearchTermChange={(value) => setSearchTerm(value)}
        onSearchFieldChange={(value) => setSearchField(value)}
        onRoleChange={(value) => setRole(value)}
      />

      {/* Thông báo */}
      <Notification notification={notification} />

      {/* Bảng danh sách người dùng */}
      <UserTable
        users={users}
        onEditUser={handleEditUser}
        onToggleLock={handleToggleLock}
        onResetPassword={handleOpenResetPasswordModal}
        onDeleteUser={handleOpenDeleteConfirmModal}
        loading={loading}
      />

      {/* Phân trang */}
      {users.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

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

      {/* Modal xác nhận xóa */}
      {isDeleteConfirmOpen && userToDelete && (
        <DeleteConfirmModal
          user={userToDelete}
          onConfirm={handleDeleteUser}
          onCancel={() => {
            setDeleteConfirmOpen(false);
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
}

export default UsersManagerPage;