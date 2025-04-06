import React from 'react';
import styles from '../UsersManagerPage.module.css';

const HistoryLog = ({ history }) => {
  const getActionIcon = (action) => {
    if (action.includes('Chỉnh sửa')) return 'fa-edit';
    if (action.includes('Xóa')) return 'fa-trash-alt';
    if (action.includes('khóa')) return action.includes('Đã khóa') ? 'fa-lock' : 'fa-unlock';
    if (action.includes('mật khẩu')) return 'fa-key';
    return 'fa-history';
  };

  const getActionClass = (action) => {
    if (action.includes('Xóa')) return styles.historyDelete;
    if (action.includes('Đã khóa')) return styles.historyLock;
    if (action.includes('mở khóa')) return styles.historyUnlock;
    if (action.includes('Chỉnh sửa')) return styles.historyEdit;
    if (action.includes('mật khẩu')) return styles.historyReset;
    return '';
  };

  return (
    <div className={styles.history}>
      <div className={styles.historyHeader}>
        <h2 className={styles.sectionTitle}>
          <i className="fas fa-history"></i> Lịch Sử Thay Đổi
        </h2>
      </div>
      
      {history && history.length > 0 ? (
        <ul className={styles.historyList}>
          {history.map((entry, index) => (
            <li key={index} className={`${styles.historyItem} ${getActionClass(entry.action)}`}>
              <div className={styles.historyIcon}>
                <i className={`fas ${getActionIcon(entry.action)}`}></i>
              </div>
              <div className={styles.historyDetails}>
                <span className={styles.historyTimestamp}>{entry.timestamp}</span>
                <span className={styles.historyAction}>{entry.action}</span>
                <span className={styles.historyUserID}>ID: {entry.userId}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.noHistory}>
          <i className="fas fa-info-circle"></i> Chưa có thay đổi nào.
        </div>
      )}
    </div>
  );
};

export default HistoryLog; 