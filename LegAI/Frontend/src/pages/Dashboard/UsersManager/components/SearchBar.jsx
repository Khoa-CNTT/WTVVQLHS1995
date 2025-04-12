import React from 'react';
import styles from '../UsersManagerPage.module.css';

const SearchBar = ({ searchTerm, searchField, role, onSearchTermChange, onSearchFieldChange, onRoleChange }) => {
  const searchPlaceholder = () => {
    switch (searchField) {
      case 'username': return 'tên đăng nhập';
      case 'email': return 'email';
      case 'full_name': return 'họ tên';
      default: return 'tên đăng nhập';
    }
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>
          <i className="fas fa-search"></i> Tìm kiếm người dùng
        </h2>
      </div>
      <div className={styles.searchControls}>
        <div className={styles.searchFilters}>
        <select
          value={searchField}
          onChange={(e) => onSearchFieldChange(e.target.value)}
          className={styles.searchSelect}
        >
          <option value="username">Tên đăng nhập</option>
          <option value="email">Email</option>
            <option value="full_name">Họ tên</option>
          </select>

          <select
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
            className={styles.searchSelect}
          >
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
            <option value="Lawyer">Luật sư</option>
        </select>
        </div>

        <div className={styles.searchInputWrapper}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={`Tìm kiếm theo ${searchPlaceholder()}...`}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button 
              className={styles.clearButton}
              onClick={() => onSearchTermChange('')}
              title="Xóa tìm kiếm"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 