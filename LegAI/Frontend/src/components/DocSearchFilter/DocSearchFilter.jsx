import { useState, useEffect } from 'react';
import styles from './DocSearchFilter.module.css';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const DocSearchFilter = ({ categories, filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState({
    category: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    ...filters
  });

  useEffect(() => {
    setLocalFilters({
      category: '',
      search: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',
      ...filters
    });
  }, [filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const resetFilters = {
      category: '',
      search: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.filterForm}>
      <div className={styles.filterControls}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Tìm kiếm</label>
          <div className={styles.searchInputContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              name="search"
              value={localFilters.search}
              onChange={handleInputChange}
              placeholder="Tên hồ sơ, nội dung..."
              className={styles.filterInput}
            />
            {localFilters.search && (
              <button 
                type="button" 
                className={styles.clearInputButton}
                onClick={() => {
                  setLocalFilters(prev => ({ ...prev, search: '' }));
                }}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Danh mục</label>
          <select
            name="category"
            value={localFilters.category}
            onChange={handleInputChange}
            className={styles.filterSelect}
          >
            <option value="">Tất cả</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sắp xếp theo</label>
          <select
            name="sortBy"
            value={localFilters.sortBy}
            onChange={handleInputChange}
            className={styles.filterSelect}
          >
            <option value="created_at">Ngày tạo</option>
            <option value="updated_at">Ngày cập nhật</option>
            <option value="title">Tên hồ sơ</option>
            <option value="size">Kích thước</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Thứ tự</label>
          <select
            name="sortOrder"
            value={localFilters.sortOrder}
            onChange={handleInputChange}
            className={styles.filterSelect}
          >
            <option value="DESC">Giảm dần</option>
            <option value="ASC">Tăng dần</option>
          </select>
        </div>

        <div className={styles.filterActions}>
          <button type="submit" className={styles.filterButton}>
            <FaFilter /> Lọc
          </button>
          
          <button 
            type="button" 
            className={styles.clearFilterButton}
            onClick={handleClearFilters}
          >
            <FaTimes /> Xóa bộ lọc
          </button>
        </div>
      </div>
    </form>
  );
};

export default DocSearchFilter; 