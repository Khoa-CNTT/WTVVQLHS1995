import React from 'react';
import styles from '../UsersManagerPage.module.css';

const UserTable = ({ users, startIndex = 0, onEditUser, onToggleLock, onResetPassword, onDeleteUser, loading }) => {
  if (loading) {
    return (
      <div className={styles.tableWrapper}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên Đăng Nhập</th>
            <th>Họ Tên</th>
            <th>Email</th>
            <th>Vai Trò</th>
            <th>Trạng Thái</th>
            <th>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user.id} className={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                <td data-label="STT">{startIndex + index + 1}</td>
                <td data-label="Tên Đăng Nhập">{user.username}</td>
                <td data-label="Họ Tên">{user.full_name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Vai Trò">
                  <span className={user.role === 'Admin' ? styles.badgeAdmin : styles.badgeUser}>
                    {user.role}
                  </span>
                </td>
                <td data-label="Trạng Thái">
                  <span className={user.is_locked ? styles.statusLocked : styles.statusActive}>
                    <i className={user.is_locked ? "fas fa-lock" : "fas fa-lock-open"}></i>
                    {user.is_locked ? ' Đã khóa' : ' Hoạt động'}
                  </span>
                </td>
                <td data-label="Hành Động" className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => onEditUser(user)}
                    title="Chỉnh sửa"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className={styles.toggleButton}
                    onClick={() => onToggleLock(user.id)}
                    title={user.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                  >
                    <i className={user.is_locked ? "fas fa-unlock" : "fas fa-lock"}></i>
                  </button>
                  <button
                    className={styles.resetButton}
                    onClick={() => onResetPassword(user.id)}
                    title="Đặt lại mật khẩu"
                  >
                    <i className="fas fa-key"></i>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDeleteUser(user)}
                    title="Xóa tài khoản"
                    disabled={user.role === 'Admin' && user.id === 1}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className={styles.noData}>
                <i className="fas fa-search"></i> Không tìm thấy người dùng.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable; 