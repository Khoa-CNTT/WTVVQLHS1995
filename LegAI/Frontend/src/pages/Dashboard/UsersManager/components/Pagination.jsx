import React from 'react';
import { Pagination as AntPagination } from 'antd';

const Pagination = ({ currentPage, totalPages, onPageChange, pageSize = 10, total }) => {
  if (totalPages <= 1) return null;

  // Tính tổng số mục nếu không được cung cấp
  const calculatedTotal = total || totalPages * pageSize;

  return (
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <AntPagination
        current={currentPage}
        total={calculatedTotal}
        pageSize={pageSize}
        onChange={onPageChange}
        showSizeChanger={false}
        showQuickJumper={false}
      />
    </div>
  );
};

export default Pagination; 