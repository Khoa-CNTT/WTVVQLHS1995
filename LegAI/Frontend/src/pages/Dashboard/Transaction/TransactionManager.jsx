import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TransactionManager.module.css';
import * as transactionService from '../../../services/transactionService';
import authService from '../../../services/authService';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const TransactionManager = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Kiểm tra xem người dùng có phải là admin không
  useEffect(() => {
    const checkUserRole = () => {
      const isAdmin = authService.hasRole('admin');
      if (!isAdmin) {
        navigate('/dashboard');
      }
    };
    
    checkUserRole();
  }, [navigate]);

  // Fetch transactions khi component được load và khi filters thay đổi
  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, pagination.limit, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionService.getAllTransactions({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        search: filters.search,
        startDate: filters.startDate,
        endDate: filters.endDate
      });

      if (response.success) {
        setTransactions(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
      } else {
        setError(response.message || 'Không thể tải danh sách giao dịch');
      }
    } catch (error) {
      console.error('Lỗi khi tải giao dịch:', error);
      setError('Có lỗi xảy ra khi tải danh sách giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset trang về 1 khi thay đổi bộ lọc
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({
      ...prev,
      page
    }));
  };

  const handleShowDetail = async (transactionId) => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactionById(transactionId);
      
      if (response.success) {
        setSelectedTransaction(response.data);
        setShowDetailModal(true);
      } else {
        setError(response.message || 'Không thể tải chi tiết giao dịch');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết giao dịch:', error);
      setError('Có lỗi xảy ra khi tải chi tiết giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleShowEdit = async (transactionId) => {
    try {
      setLoading(true);
      const response = await transactionService.getTransactionById(transactionId);
      
      if (response.success) {
        setSelectedTransaction(response.data);
        setShowEditModal(true);
      } else {
        setError(response.message || 'Không thể tải chi tiết giao dịch');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết giao dịch:', error);
      setError('Có lỗi xảy ra khi tải chi tiết giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (transactionId, newStatus) => {
    try {
      setLoading(true);
      const response = await transactionService.updateTransactionStatus(transactionId, newStatus);
      
      if (response.success) {
        setShowEditModal(false);
        fetchTransactions();
      } else {
        setError(response.message || 'Không thể cập nhật trạng thái giao dịch');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái giao dịch:', error);
      setError('Có lỗi xảy ra khi cập nhật trạng thái giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    let statusClass = '';
    let statusText = '';
    
    switch (status) {
      case 'pending':
        statusClass = styles.statusPending;
        statusText = 'Chờ xử lý';
        break;
      case 'completed':
        statusClass = styles.statusCompleted;
        statusText = 'Hoàn thành';
        break;
      case 'cancelled':
        statusClass = styles.statusCancelled;
        statusText = 'Đã hủy';
        break;
      case 'processing':
        statusClass = styles.statusProcessing;
        statusText = 'Đang xử lý';
        break;
      case 'refunded':
        statusClass = styles.statusRefunded;
        statusText = 'Hoàn tiền';
        break;
      default:
        statusClass = styles.statusUnknown;
        statusText = status || 'Không xác định';
    }
    
    return <span className={`${styles.statusBadge} ${statusClass}`}>{statusText}</span>;
  };

  const renderTransactionTable = () => {
    if (loading && transactions.length === 0) {
      return (
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      );
    }

    if (error && transactions.length === 0) {
      return (
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={fetchTransactions} className={styles.retryButton}>
            <i className="fas fa-sync-alt"></i> Thử lại
          </button>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className={styles.empty}>
          <i className="fas fa-file-invoice-dollar"></i>
          <p>Không có giao dịch nào</p>
        </div>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Vụ án</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.id}</td>
                <td>{transaction.user_name || transaction.user_id}</td>
                <td>{transaction.case_title || transaction.case_id}</td>
                <td>{formatCurrency(transaction.amount)}</td>
                <td>{transaction.payment_method}</td>
                <td>{renderStatusBadge(transaction.status)}</td>
                <td>{formatDate(transaction.created_at)}</td>
                <td className={styles.actions}>
                  <button 
                    className={styles.detailButton}
                    onClick={() => handleShowDetail(transaction.id)}
                    title="Xem chi tiết"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button 
                    className={styles.editButton}
                    onClick={() => handleShowEdit(transaction.id)}
                    title="Cập nhật trạng thái"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit) || 1;
    
    if (totalPages <= 1) {
      return null;
    }
    
    return (
      <div className={styles.pagination}>
        <button 
          className={styles.pageButton}
          disabled={pagination.page === 1}
          onClick={() => handlePageChange(pagination.page - 1)}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        
        {[...Array(totalPages)].map((_, index) => {
          const pageNumber = index + 1;
          
          // Chỉ hiển thị trang hiện tại, trang trước, trang sau và các trang đầu/cuối
          if (
            pageNumber === 1 ||
            pageNumber === totalPages ||
            (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1)
          ) {
            return (
              <button
                key={pageNumber}
                className={`${styles.pageButton} ${pageNumber === pagination.page ? styles.activePage : ''}`}
                onClick={() => handlePageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            );
          }
          
          // Hiển thị dấu "..." giữa các trang
          if (
            (pageNumber === 2 && pagination.page > 3) ||
            (pageNumber === totalPages - 1 && pagination.page < totalPages - 2)
          ) {
            return <span key={pageNumber} className={styles.ellipsis}>...</span>;
          }
          
          return null;
        })}
        
        <button 
          className={styles.pageButton}
          disabled={pagination.page === totalPages}
          onClick={() => handlePageChange(pagination.page + 1)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedTransaction) return null;
    
    return (
      <div className={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Chi tiết giao dịch</h3>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowDetailModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailItem}>
              <span>ID:</span>
              <span>{selectedTransaction.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Người dùng:</span>
              <span>{selectedTransaction.user_name || selectedTransaction.user_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Email:</span>
              <span>{selectedTransaction.user_email || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Luật sư:</span>
              <span>{selectedTransaction.lawyer_name || selectedTransaction.lawyer_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Vụ án:</span>
              <span>{selectedTransaction.case_title || selectedTransaction.case_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Số tiền:</span>
              <span>{formatCurrency(selectedTransaction.amount)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Phương thức:</span>
              <span>{selectedTransaction.payment_method}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Trạng thái:</span>
              <span>{renderStatusBadge(selectedTransaction.status)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Ngày tạo:</span>
              <span>{formatDate(selectedTransaction.created_at)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Ngày cập nhật:</span>
              <span>{formatDate(selectedTransaction.updated_at)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Ngày xác nhận:</span>
              <span>{formatDate(selectedTransaction.confirmation_date) || 'N/A'}</span>
            </div>
            {selectedTransaction.description && (
              <div className={styles.detailItem}>
                <span>Mô tả:</span>
                <span>{selectedTransaction.description}</span>
              </div>
            )}
            {selectedTransaction.payment_info && (
              <div className={styles.detailItem}>
                <span>Thông tin thanh toán:</span>
                <pre>{typeof selectedTransaction.payment_info === 'object' 
                  ? JSON.stringify(selectedTransaction.payment_info, null, 2) 
                  : selectedTransaction.payment_info}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEditModal = () => {
    if (!selectedTransaction) return null;
    
    return (
      <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Cập nhật trạng thái giao dịch</h3>
            <button 
              className={styles.closeButton} 
              onClick={() => setShowEditModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.detailItem}>
              <span>ID:</span>
              <span>{selectedTransaction.id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Người dùng:</span>
              <span>{selectedTransaction.user_name || selectedTransaction.user_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Vụ án:</span>
              <span>{selectedTransaction.case_title || selectedTransaction.case_id}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Số tiền:</span>
              <span>{formatCurrency(selectedTransaction.amount)}</span>
            </div>
            <div className={styles.detailItem}>
              <span>Trạng thái hiện tại:</span>
              <span>{renderStatusBadge(selectedTransaction.status)}</span>
            </div>
            <div className={styles.formGroup}>
              <label>Cập nhật trạng thái:</label>
              <select 
                className={styles.formControl}
                defaultValue={selectedTransaction.status}
                onChange={(e) => setSelectedTransaction({
                  ...selectedTransaction,
                  status: e.target.value
                })}
              >
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="refunded">Hoàn tiền</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Ghi chú:</label>
              <textarea 
                className={styles.formControl}
                rows="3"
                value={selectedTransaction.notes || ''}
                onChange={(e) => setSelectedTransaction({
                  ...selectedTransaction,
                  notes: e.target.value
                })}
              />
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button 
                className={styles.saveButton}
                onClick={() => handleUpdateStatus(selectedTransaction.id, selectedTransaction.status)}
                disabled={loading}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Quản lý giao dịch</h2>
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
          />
          <select 
            className={styles.filterSelect}
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="processing">Đang xử lý</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
            <option value="refunded">Hoàn tiền</option>
          </select>
          <div className={styles.dateFilters}>
            <input
              type="date"
              className={styles.dateInput}
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              placeholder="Từ ngày"
            />
            <input
              type="date"
              className={styles.dateInput}
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              placeholder="Đến ngày"
            />
          </div>
        </div>
      </div>
      
      {renderTransactionTable()}
      {renderPagination()}
      {showDetailModal && renderDetailModal()}
      {showEditModal && renderEditModal()}
    </div>
  );
};

export default TransactionManager; 