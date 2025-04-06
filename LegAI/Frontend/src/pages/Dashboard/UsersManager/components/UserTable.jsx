import React from 'react';
import styles from '../UsersManagerPage.module.css';

const UserTable = ({ users, startIndex = 0, onEditUser, onToggleLock, onResetPassword, onDeleteUser }) => {
  return (
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
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user.id} className={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                <td data-label="STT">{startIndex + index + 1}</td>
                <td data-label="Tên Đăng Nhập">{user.username}</td>
                <td data-label="Họ Tên">{user.full_name}</td>
                <td data-label="Email">{user.email}</td>
                <td data-label="Số Điện Thoại">{user.phone}</td>
                <td data-label="Địa Chỉ">{user.address || 'Chưa có'}</td>
                <td data-label="Mô Tả">{user.description || 'Chưa có'}</td>
                <td data-label="Vai Trò">
                  <span className={user.role === 'Admin' ? styles.badgeAdmin : styles.badgeUser}>
                    {user.role}
                  </span>
                </td>
                <td data-label="Xác Minh">
                  {user.is_verified ? 
                    <span className={styles.verifiedBadge}><i className="fas fa-check-circle"></i> Đã xác minh</span> : 
                    <span className={styles.unverifiedBadge}><i className="fas fa-times-circle"></i> Chưa xác minh</span>
                  }
                </td>
                <td data-label="Trạng Thái">
                  <span className={user.is_locked ? styles.statusLocked : styles.statusActive}>
                    <i className={user.is_locked ? "fas fa-lock" : "fas fa-lock-open"}></i>
                    {user.is_locked ? ' Đã khóa' : ' Hoạt động'}
                  </span>
                </td>
                <td data-label="Lần Đăng Nhập Cuối">{user.last_login ? new Date(user.last_login).toLocaleString() : 'Chưa đăng nhập'}</td>
                <td data-label="Thất Bại">
                  {user.failed_attempts > 0 ? 
                    <span className={styles.failedAttempts}>{user.failed_attempts}</span> : 
                    user.failed_attempts
                  }
                </td>
                <td data-label="Hành Động" className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => onEditUser(user)}
                    title="Chỉnh sửa"
                  >
                    <i className="fas fa-edit"></i> Sửa
                  </button>
                  <button
                    className={styles.toggleButton}
                    onClick={() => onToggleLock(user.id)}
                    title={user.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                  >
                    <i className={user.is_locked ? "fas fa-unlock" : "fas fa-lock"}></i>
                    {user.is_locked ? ' Mở khóa' : ' Khóa'}
                  </button>
                  <button
                    className={styles.resetButton}
                    onClick={() => onResetPassword(user.id)}
                    title="Đặt lại mật khẩu"
                  >
                    <i className="fas fa-key"></i> Đặt lại MK
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDeleteUser(user.id)}
                    title="Xóa tài khoản"
                  >
                    <i className="fas fa-trash-alt"></i> Xóa
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="13" className={styles.noData}>
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