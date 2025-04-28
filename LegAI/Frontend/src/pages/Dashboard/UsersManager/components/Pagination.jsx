import React from 'react';
import styles from '../UsersManagerPage.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  // Tạo mảng số trang với phân trang có giới hạn
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Số trang hiển thị tối đa
    
    if (totalPages <= maxVisiblePages) {
      // Hiển thị tất cả trang nếu ít hơn giới hạn
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu
      pageNumbers.push(1);
      
      // Tính toán vị trí bắt đầu và kết thúc của dải trang
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Điều chỉnh để luôn hiển thị 3 trang giữa
      if (currentPage <= 3) {
        endPage = 4;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 3;
      }
      
      // Thêm dấu ... nếu cần
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Thêm các trang ở giữa
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      
      // Thêm dấu ... nếu cần
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Luôn hiển thị trang cuối
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.pagination}>
      <button 
        className={`${styles.pageButton} ${styles.navButton} ${currentPage === 1 ? styles.disabled : ''}`}
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        title="Trang trước"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className={styles.ellipsis}>...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${styles.pageButton} ${currentPage === page ? styles.activePage : ''}`}
          >
            {page}
          </button>
        )
      ))}
      
      <button 
        className={`${styles.pageButton} ${styles.navButton} ${currentPage === totalPages ? styles.disabled : ''}`}
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        title="Trang sau"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default Pagination; 