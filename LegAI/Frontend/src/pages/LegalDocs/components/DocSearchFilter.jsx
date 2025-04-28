import { useState, useEffect } from 'react';
import styles from './DocSearchFilter.module.css';
import PropTypes from 'prop-types';

const DocSearchFilter = ({ categories, filters, onFilterChange }) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
  const [sortBy, setSortBy] = useState(filters.sortBy || 'created_at');
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || 'DESC');
  const [showFilters, setShowFilters] = useState(false);

  // Cập nhật state khi filters props thay đổi
  useEffect(() => {
    setSearchValue(filters.search || '');
    setSelectedCategory(filters.category || '');
    setSortBy(filters.sortBy || 'created_at');
    setSortOrder(filters.sortOrder || 'DESC');
  }, [filters]);

  // Xử lý tìm kiếm khi nhấn Enter
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  // Xử lý tìm kiếm khi click nút tìm kiếm
  const handleSearchClick = () => {
    applyFilters();
  };

  // Xử lý thay đổi danh mục
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    onFilterChange({
      ...filters,
      category: e.target.value
    });
  };

  // Xử lý thay đổi sắp xếp
  const handleSortChange = (e) => {
    const value = e.target.value;
    let newSortBy = sortBy;
    let newSortOrder = sortOrder;

    switch (value) {
      case 'newest':
        newSortBy = 'created_at';
        newSortOrder = 'DESC';
        break;
      case 'oldest':
        newSortBy = 'created_at';
        newSortOrder = 'ASC';
        break;
      case 'name_asc':
        newSortBy = 'title';
        newSortOrder = 'ASC';
        break;
      case 'name_desc':
        newSortBy = 'title';
        newSortOrder = 'DESC';
        break;
      default:
        break;
    }

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);

    onFilterChange({
      ...filters,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    });
  };

  // Áp dụng bộ lọc
  const applyFilters = () => {
    onFilterChange({
      ...filters,
      search: searchValue,
      category: selectedCategory,
      sortBy,
      sortOrder
    });
  };

  // Xóa bộ lọc
  const clearFilters = () => {
    setSearchValue('');
    setSelectedCategory('');
    setSortBy('created_at');
    setSortOrder('DESC');

    onFilterChange({
      search: '',
      category: '',
      sortBy: 'created_at',
      sortOrder: 'DESC'
    });
  };

  // Lấy giá trị sắp xếp hiện tại
  const getCurrentSortValue = () => {
    if (sortBy === 'created_at' && sortOrder === 'DESC') return 'newest';
    if (sortBy === 'created_at' && sortOrder === 'ASC') return 'oldest';
    if (sortBy === 'title' && sortOrder === 'ASC') return 'name_asc';
    if (sortBy === 'title' && sortOrder === 'DESC') return 'name_desc';
    return 'newest';
  };

  // Kiểm tra xem có bộ lọc nào đang áp dụng không
  const hasActiveFilters = () => {
    return !!searchValue || !!selectedCategory || sortBy !== 'created_at' || sortOrder !== 'DESC';
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.searchBar}>
        <div className={styles.searchInputContainer}>
          <input 
            type="text"
            placeholder="Tìm kiếm hồ sơ pháp lý..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={styles.searchInput}
          />
          <button 
            className={styles.searchButton}
            onClick={handleSearchClick}
          >
            <i className="fas fa-search"></i>
          </button>
        </div>

        <button 
          className={styles.filterToggle}
          onClick={() => setShowFilters(!showFilters)}
          title="Hiển thị bộ lọc"
        >
          <i className="fas fa-filter"></i>
          {hasActiveFilters() && <span className={styles.filterBadge}></span>}
        </button>
      </div>

      {showFilters && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterGroup}>
            <label>Danh mục:</label>
            <select 
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Sắp xếp:</label>
            <select 
              value={getCurrentSortValue()}
              onChange={handleSortChange}
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name_asc">Tên (A-Z)</option>
              <option value="name_desc">Tên (Z-A)</option>
            </select>
          </div>

          <button 
            className={styles.clearButton}
            onClick={clearFilters}
            disabled={!hasActiveFilters()}
          >
            <i className="fas fa-times"></i> Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

DocSearchFilter.propTypes = {
  categories: PropTypes.array.isRequired,
  filters: PropTypes.object.isRequired,
  onFilterChange: PropTypes.func.isRequired
};

export default DocSearchFilter; 